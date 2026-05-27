"""
Volta engine API · Sprint C1+C2 endpoints.

- POST /v1/volta/analyzer/run/me               → corre análisis del atleta autenticado
- POST /v1/volta/analyzer/run/athlete/{id}     → coach corre análisis sobre atleta
- POST /v1/volta/analyzer/run/box              → coach corre sobre todo el roster
- GET  /v1/volta/recommendations/me            → lista recomendaciones activas
- GET  /v1/volta/recommendations/box           → coach inbox recomendaciones del box
- PATCH /v1/volta/recommendations/{id}/accept  → coach acepta
- PATCH /v1/volta/recommendations/{id}/reject  → coach rechaza
- GET  /v1/volta/skill-tree/me                 → lista skills + tiers del atleta
- GET  /v1/volta/skill-tree/snapshot/me        → snapshot agregado (mastered/keystones/gaps)
- POST /v1/volta/skill-tree/practice           → atleta registra práctica de skill
- POST /v1/volta/skill-tree/eval               → coach evalúa skill
- GET  /v1/volta/mayhem/scale                  → scale un movimiento para el atleta
- GET  /v1/volta/weekly-snapshot/me            → snapshot semanal histórico
"""

from __future__ import annotations

from datetime import date
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...db import users_repo
from ...core.volta import (
    recommendation_engine, skill_tree_engine, mayhem_scaling,
)


router = APIRouter(prefix="/v1/volta", tags=["volta"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RecommendationResponse(BaseModel):
    id: str
    athlete_id: str
    code: str
    severity: str
    priority: int
    title: str
    description: Optional[str] = None
    factors: list
    suggested_action: dict
    status: str
    created_at: str


class SkillTier(BaseModel):
    movement_slug: str
    tier: int
    last_practiced: Optional[str] = None
    practice_count: int
    pr_value: Optional[float] = None
    is_keystone: bool
    days_since_practice: Optional[int] = None


class SkillSnapshotResponse(BaseModel):
    skills_total_tracked: int
    skills_mastered: int
    skills_solid: int
    skills_unbroken: int
    keystones_unlocked: int
    keystones: List[str]
    skills_stale: int
    skill_gaps: List[str]


class PracticePayload(BaseModel):
    movement_slug: str = Field(..., min_length=1, max_length=64)
    pr_value: Optional[float] = None
    practice_date: Optional[date] = None


class EvalPayload(BaseModel):
    athlete_id: str
    movement_slug: str
    coach_score: int = Field(..., ge=1, le=5)
    new_tier: Optional[int] = Field(default=None, ge=0, le=4)


class ScaledMovementResponse(BaseModel):
    original_slug: str
    original_rx: str
    needs_scaling: bool
    selected_sub: Optional[dict] = None
    athlete_tier: int
    reason: str


def _parse_json(v):
    if v is None: return []
    if isinstance(v, (list, dict)): return v
    import json as _json
    try: return _json.loads(v)
    except Exception: return []


# ---------------------------------------------------------------------------
# Analyzer / Recommendations
# ---------------------------------------------------------------------------

@router.post("/analyzer/run/me")
async def run_analyzer_self(user: User = Depends(verify_token)):
    """Atleta corre análisis sobre sí mismo."""
    recs = await recommendation_engine.evaluate_athlete(user.id, persist=True)
    return {"recommendations_generated": len(recs), "recommendations": [r.__dict__ for r in recs]}


@router.post("/analyzer/run/athlete/{athlete_id}")
async def run_analyzer_athlete(athlete_id: str, user: User = Depends(verify_token)):
    """Coach corre análisis sobre atleta específico."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")
    if user.role != "admin" and not await coach_owns_athlete(user.id, athlete_id):
        raise HTTPException(403, "Atleta no asignado")
    recs = await recommendation_engine.evaluate_athlete(athlete_id, persist=True)
    return {"recommendations_generated": len(recs), "recommendations": [r.__dict__ for r in recs]}


@router.post("/analyzer/run/box")
async def run_analyzer_box(user: User = Depends(verify_token)):
    """Coach corre análisis sobre todo el roster Volta · cron-friendly."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")
    return await recommendation_engine.evaluate_box(user.id)


@router.get("/recommendations/me", response_model=List[RecommendationResponse])
async def list_my_recommendations(
    user: User = Depends(verify_token),
    status: str = Query(default="active"),
):
    """Atleta lista sus recomendaciones."""
    pool = await users_repo.get_pool()
    if pool is None: return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, athlete_id, code, severity, priority, title, description,
                   factors, suggested_action, status, created_at
              FROM volta_recommendations
             WHERE athlete_id = $1::uuid AND status = $2
             ORDER BY priority DESC, created_at DESC
            """,
            user.id, status,
        )
    return [
        RecommendationResponse(
            id=str(r["id"]), athlete_id=str(r["athlete_id"]),
            code=r["code"], severity=r["severity"], priority=r["priority"],
            title=r["title"], description=r["description"],
            factors=_parse_json(r["factors"]),
            suggested_action=_parse_json(r["suggested_action"]) or {},
            status=r["status"], created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]


@router.get("/recommendations/box", response_model=List[RecommendationResponse])
async def list_box_recommendations(
    user: User = Depends(verify_token),
    severity: Optional[str] = None,
):
    """Coach ve recomendaciones de su roster."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")

    pool = await users_repo.get_pool()
    if pool is None: return []

    conditions = ["coach_id = $1::uuid", "status = 'active'"]
    params: list = [user.id]
    idx = 2
    if severity:
        conditions.append(f"severity = ${idx}")
        params.append(severity)
        idx += 1

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, athlete_id, code, severity, priority, title, description,
                   factors, suggested_action, status, created_at
              FROM volta_recommendations
             WHERE {' AND '.join(conditions)}
             ORDER BY priority DESC, created_at DESC
             LIMIT 100
            """,
            *params,
        )

    return [
        RecommendationResponse(
            id=str(r["id"]), athlete_id=str(r["athlete_id"]),
            code=r["code"], severity=r["severity"], priority=r["priority"],
            title=r["title"], description=r["description"],
            factors=_parse_json(r["factors"]),
            suggested_action=_parse_json(r["suggested_action"]) or {},
            status=r["status"], created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]


@router.patch("/recommendations/{rec_id}/accept")
async def accept_recommendation(rec_id: UUID, user: User = Depends(verify_token)):
    """Coach o atleta acepta · queda marcada para aplicar."""
    pool = await users_repo.get_pool()
    if pool is None: raise HTTPException(503)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE volta_recommendations
               SET status = 'accepted', accepted_at = NOW(), accepted_by = $1::uuid
             WHERE id = $2
            """,
            user.id, rec_id,
        )
    return {"ok": True}


@router.patch("/recommendations/{rec_id}/reject")
async def reject_recommendation(rec_id: UUID, user: User = Depends(verify_token)):
    """Coach descarta recomendación."""
    pool = await users_repo.get_pool()
    if pool is None: raise HTTPException(503)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE volta_recommendations SET status = 'rejected' WHERE id = $1",
            rec_id,
        )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Skill Tree
# ---------------------------------------------------------------------------

@router.get("/skill-tree/me", response_model=List[SkillTier])
async def list_my_skills(user: User = Depends(verify_token)):
    """Lista skills + tiers del atleta."""
    skills = await skill_tree_engine.get_all_skills(user.id)
    return [
        SkillTier(
            movement_slug=s.movement_slug,
            tier=s.tier,
            last_practiced=s.last_practiced.isoformat() if s.last_practiced else None,
            practice_count=s.practice_count,
            pr_value=s.pr_value,
            is_keystone=s.is_keystone,
            days_since_practice=s.days_since_practice,
        )
        for s in skills
    ]


@router.get("/skill-tree/snapshot/me", response_model=SkillSnapshotResponse)
async def my_skill_snapshot(user: User = Depends(verify_token)) -> SkillSnapshotResponse:
    """Snapshot agregado · usado por Belt criteria + UI summary."""
    snap = await skill_tree_engine.build_snapshot(user.id)
    return SkillSnapshotResponse(
        skills_total_tracked=snap.skills_total_tracked,
        skills_mastered=snap.skills_mastered,
        skills_solid=snap.skills_solid,
        skills_unbroken=snap.skills_unbroken,
        keystones_unlocked=snap.keystones_unlocked,
        keystones=snap.keystones,
        skills_stale=snap.skills_stale,
        skill_gaps=snap.skill_gaps,
    )


@router.post("/skill-tree/practice", status_code=201)
async def log_practice(payload: PracticePayload, user: User = Depends(verify_token)):
    """Atleta registra que practicó un skill · usado tras WOD."""
    await skill_tree_engine.upsert_skill_practice(
        athlete_id=user.id,
        movement_slug=payload.movement_slug,
        practice_date=payload.practice_date or date.today(),
        pr_value=payload.pr_value,
    )
    return {"ok": True}


@router.post("/skill-tree/eval", status_code=201)
async def coach_eval(payload: EvalPayload, user: User = Depends(verify_token)):
    """Coach evalúa skill del atleta · puede setear tier directo."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")
    if user.role != "admin" and not await coach_owns_athlete(user.id, payload.athlete_id):
        raise HTTPException(403, "Atleta no asignado")
    await skill_tree_engine.coach_eval_skill(
        athlete_id=payload.athlete_id,
        movement_slug=payload.movement_slug,
        coach_score=payload.coach_score,
        new_tier=payload.new_tier,
    )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Mayhem Scaling
# ---------------------------------------------------------------------------

@router.get("/mayhem/scale", response_model=ScaledMovementResponse)
async def scale_movement(
    movement_slug: str = Query(...),
    athlete_id: Optional[str] = Query(default=None),
    user: User = Depends(verify_token),
):
    """Scaling Mayhem para un movimiento · si no especificás athlete_id, usa self."""
    target_id = athlete_id or user.id
    if target_id != user.id:
        if user.role not in ("coach", "admin"):
            raise HTTPException(403)
        if user.role != "admin" and not await coach_owns_athlete(user.id, target_id):
            raise HTTPException(403, "Atleta no asignado")
    scaled = await mayhem_scaling.scale_for_athlete(movement_slug, target_id)
    return ScaledMovementResponse(**scaled.__dict__)


# ---------------------------------------------------------------------------
# Weekly snapshot histórico
# ---------------------------------------------------------------------------

@router.get("/weekly-snapshot/me")
async def my_weekly_snapshots(
    user: User = Depends(verify_token),
    weeks: int = Query(default=12, ge=1, le=52),
):
    """Snapshots semanales históricos · usado para sparklines progresión."""
    pool = await users_repo.get_pool()
    if pool is None: return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT week_start, acwr, total_volume_kg, sessions_completed, sessions_planned,
                   rpe_avg, rpe_high_count, skills_practiced, skills_total_mastered,
                   keystones_unlocked, prs_this_week, days_since_last_pr,
                   sleep_avg_hours, life_stress_avg, pain_zones_count,
                   block_type, athlete_level
              FROM volta_weekly_snapshots
             WHERE athlete_id = $1::uuid
             ORDER BY week_start DESC
             LIMIT $2
            """,
            user.id, weeks,
        )
    return [dict(r) for r in rows]
