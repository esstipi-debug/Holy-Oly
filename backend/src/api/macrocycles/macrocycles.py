"""
Macrocycles API · Sprint A.

Endpoints públicos para coach + atleta · usa macrocycle_db_service.

- GET    /v1/macrocycles/templates              → lista templates filtrados
- POST   /v1/macrocycles/assign                 → coach asigna a atleta
- GET    /v1/macrocycles/me/active              → atleta ve su asignación activa
- GET    /v1/macrocycles/athlete/{id}/active    → coach ve asignación atleta
- GET    /v1/macrocycles/assignment/{id}/adherence → métricas adherence
- POST   /v1/macrocycles/assignment/{id}/log    → loguear sesión completed/skipped
"""

from __future__ import annotations

from datetime import date as date_type
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...services import macrocycle_db_service as svc
from ...db import users_repo


router = APIRouter(prefix="/v1/macrocycles", tags=["macrocycles"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TemplateResponse(BaseModel):
    id: str
    program_id: str
    name: str
    school: str
    product: str
    description: str
    total_weeks: int
    focus: Optional[str] = None
    level_min: str
    level_max: str
    goal_tags: list
    required_equipment: list
    typical_athletes: int
    is_system: bool
    coach_id: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    athlete_id: str
    coach_id: Optional[str] = None
    template_id: str
    program_id: str
    started_at: date_type
    ends_at: Optional[date_type] = None
    is_active: bool
    athlete_snapshot: dict
    overrides: dict


class AssignPayload(BaseModel):
    athlete_id: str
    template_id: str
    overrides: Optional[dict] = None


class LogSessionPayload(BaseModel):
    session_date: date_type
    week_number: int = Field(..., ge=1)
    day_number: int = Field(..., ge=1, le=7)
    slot: str = Field(default="full", pattern="^(am|pm|full)$")
    completed: bool
    skipped_reason: Optional[str] = None
    actual_rpe: Optional[float] = Field(default=None, ge=0, le=10)
    actual_load: Optional[float] = None
    notes: Optional[str] = None


class AdherenceResponse(BaseModel):
    planned: int
    completed: int
    skipped: int
    adherence_pct: float
    by_reason: dict


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    user: User = Depends(verify_token),
    product: Optional[str] = Query(default=None),
    include_custom: bool = Query(default=True),
) -> List[TemplateResponse]:
    """Lista templates · system + custom del coach."""
    coach_id = user.id if user.role == "coach" and include_custom else None
    rows = await svc.list_templates(product=product, coach_id=coach_id, include_system=True)
    return [TemplateResponse(**r.__dict__) for r in rows]


@router.post("/assign", response_model=AssignmentResponse)
async def assign_template_to_athlete(
    payload: AssignPayload,
    user: User = Depends(verify_token),
) -> AssignmentResponse:
    """Coach asigna template a atleta. Verifica binding coach-atleta."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches asignan")
    if user.role != "admin":
        if not await coach_owns_athlete(user.id, payload.athlete_id):
            raise HTTPException(403, "Atleta no asignado a tu coaching")

    pool = await users_repo.get_pool()
    snapshot: dict = {}
    if pool is not None:
        async with pool.acquire() as conn:
            baselines = await conn.fetch(
                """
                SELECT test_id, MAX(value) AS v
                  FROM baseline_results
                 WHERE user_id = $1::uuid AND unit = 'kg'
                   AND test_id IN ('snatch_1rm','clean_1rm','back_squat_1rm','front_squat_1rm','deadlift_1rm')
                 GROUP BY test_id
                """,
                payload.athlete_id,
            )
            snapshot = {r["test_id"]: float(r["v"]) for r in baselines}

            bw = await conn.fetchrow(
                "SELECT bw_kg FROM wise_score_snapshots WHERE athlete_id = $1::uuid ORDER BY calculated_at DESC LIMIT 1",
                payload.athlete_id,
            )
            if bw and bw["bw_kg"]:
                snapshot["body_weight_kg"] = float(bw["bw_kg"])

    try:
        assignment = await svc.assign_template(
            athlete_id=payload.athlete_id,
            coach_id=user.id,
            template_id=payload.template_id,
            athlete_snapshot=snapshot,
            overrides=payload.overrides,
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"No se pudo asignar: {str(e)[:200]}")

    return AssignmentResponse(**assignment.__dict__)


@router.get("/me/active", response_model=Optional[AssignmentResponse])
async def get_my_active(user: User = Depends(verify_token)):
    """Atleta ve su asignación activa."""
    a = await svc.get_active_assignment(user.id)
    return AssignmentResponse(**a.__dict__) if a else None


@router.get("/athlete/{athlete_id}/active", response_model=Optional[AssignmentResponse])
async def get_athlete_active(
    athlete_id: str,
    user: User = Depends(verify_token),
):
    """Coach ve asignación activa de su atleta."""
    if user.role != "admin":
        if user.role == "athlete" and user.id != athlete_id:
            raise HTTPException(403, "Solo podés ver tu propia asignación")
        if user.role == "coach" and not await coach_owns_athlete(user.id, athlete_id):
            raise HTTPException(403, "Atleta no asignado a tu coaching")

    a = await svc.get_active_assignment(athlete_id)
    return AssignmentResponse(**a.__dict__) if a else None


@router.get("/assignment/{assignment_id}/adherence", response_model=AdherenceResponse)
async def get_adherence(
    assignment_id: UUID,
    user: User = Depends(verify_token),
) -> AdherenceResponse:
    """Métricas de adherencia · coach/atleta vinculado."""
    pool = await users_repo.get_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT athlete_id, coach_id FROM athlete_macro_assignments WHERE id = $1",
                assignment_id,
            )
            if not row:
                raise HTTPException(404, "Assignment no encontrado")
            if user.role == "athlete" and str(row["athlete_id"]) != user.id:
                raise HTTPException(403, "Solo tu propia adherencia")
            if user.role == "coach" and str(row["coach_id"]) != user.id and user.role != "admin":
                raise HTTPException(403, "Atleta no asignado")

    data = await svc.calculate_adherence(str(assignment_id))
    return AdherenceResponse(**data)


@router.post("/assignment/{assignment_id}/log", status_code=201)
async def log_session(
    assignment_id: UUID,
    payload: LogSessionPayload,
    user: User = Depends(verify_token),
):
    """Atleta loguea sesión planificada · completed o skipped."""
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT athlete_id FROM athlete_macro_assignments WHERE id = $1",
            assignment_id,
        )
        if not row:
            raise HTTPException(404, "Assignment no encontrado")
        if str(row["athlete_id"]) != user.id and user.role != "admin":
            raise HTTPException(403, "Solo atleta loguea su sesión")

        await conn.execute(
            """
            INSERT INTO macro_session_adherence
                (assignment_id, session_date, week_number, day_number, slot,
                 planned, completed, skipped_reason, actual_rpe, actual_load, notes)
            VALUES ($1::uuid, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10)
            ON CONFLICT (assignment_id, session_date, slot) DO UPDATE
              SET completed = EXCLUDED.completed,
                  skipped_reason = EXCLUDED.skipped_reason,
                  actual_rpe = EXCLUDED.actual_rpe,
                  actual_load = EXCLUDED.actual_load,
                  notes = EXCLUDED.notes
            """,
            assignment_id, payload.session_date, payload.week_number,
            payload.day_number, payload.slot, payload.completed,
            payload.skipped_reason, payload.actual_rpe, payload.actual_load,
            payload.notes,
        )

    return {"ok": True}
