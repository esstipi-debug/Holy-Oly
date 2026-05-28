"""
Lifestyle API · Engine 12 endpoints.

- POST  /v1/lifestyle/checkin         → atleta crea/actualiza checkin del día
- GET   /v1/lifestyle/today           → atleta ve su checkin de hoy + snapshot
- GET   /v1/lifestyle/history?days=N  → últimos N días
- POST  /v1/lifestyle/pain            → reportar dolor por zona
- GET   /v1/lifestyle/pain/active     → zonas con dolor activo
- GET   /v1/lifestyle/pills/{context} → píldoras educacionales contextuales
- POST  /v1/lifestyle/pills/{id}/view → marca píldora como vista (analytics)
"""

from __future__ import annotations

import logging
from datetime import date as date_type, datetime
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...services import lifestyle_service as svc
from ...db import users_repo


logger = logging.getLogger("lifestyle")

router = APIRouter(prefix="/v1/lifestyle", tags=["lifestyle"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CaffeineSource(BaseModel):
    type: str = Field(..., max_length=32)  # 'cafe' · 'mate' · 'energy_drink' · 'tea' · 'pill'
    mg: int = Field(..., ge=0, le=500)
    time: Optional[str] = None  # HH:MM


class CheckinPayload(BaseModel):
    checkin_date: Optional[date_type] = None
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(default=None, ge=1, le=10)
    life_stress: Optional[int] = Field(default=None, ge=1, le=10)
    mood: Optional[int] = Field(default=None, ge=1, le=10)
    energy_level: Optional[int] = Field(default=None, ge=1, le=10)
    motivation: Optional[int] = Field(default=None, ge=1, le=10)
    caffeine_mg: int = Field(default=0, ge=0, le=1000)
    caffeine_last_time: Optional[datetime] = None
    caffeine_sources: List[CaffeineSource] = []
    alcohol_units: int = Field(default=0, ge=0, le=20)
    alcohol_type: Optional[str] = Field(default=None, max_length=32)
    smoking_today: bool = False
    cigarettes_count: int = Field(default=0, ge=0, le=60)
    water_liters: float = Field(default=0, ge=0, le=20)
    meals_today: int = Field(default=0, ge=0, le=10)
    last_meal_time: Optional[datetime] = None
    notes: Optional[str] = None


class PainPayload(BaseModel):
    zone: str
    pain_level: int = Field(..., ge=0, le=10)
    pain_type: Optional[str] = None
    onset: Optional[str] = None
    aggravated_by: Optional[str] = None
    notes: Optional[str] = None


class SnapshotResponse(BaseModel):
    user_id: str
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    life_stress: Optional[int] = None
    energy_level: Optional[int] = None
    caffeine_mg: int
    caffeine_residual_mg: Optional[int] = None
    alcohol_units: int
    smoking_today: bool
    cigarettes_count: int
    sleep_avg_3d: Optional[float] = None
    sleep_avg_7d: Optional[float] = None
    stress_avg_7d: Optional[float] = None
    recovery_debt: Optional[float] = None
    pain_zones_active: int
    pain_max_level: int


class PillResponse(BaseModel):
    id: str
    slug: str
    category: str
    title: str
    short_text: str
    long_text: str
    citation: Optional[str] = None
    severity: str
    related_engines: list


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/checkin")
async def create_checkin(payload: CheckinPayload, user: User = Depends(verify_token)):
    """Crea o actualiza el checkin del día."""
    cdate = payload.checkin_date or date_type.today()
    data = payload.model_dump(exclude={"checkin_date"})
    data["caffeine_sources"] = [s.model_dump() for s in payload.caffeine_sources]

    try:
        row = await svc.upsert_checkin(user.id, cdate, data)
    except Exception as e:
        raise HTTPException(500, f"No se pudo guardar: {str(e)[:200]}")

    # Reevaluar Smart Coach tras nuevo checkin · genera alertas si convergen factores
    try:
        from ..services import smart_coach_engine
        await smart_coach_engine.evaluate_athlete(user.id, persist=True)
    except Exception as e:
        print(f"[lifestyle] smart coach reeval failed: {e}")

    return {"ok": True, "checkin_id": str(row["id"]), "date": cdate.isoformat()}


@router.get("/today", response_model=SnapshotResponse)
async def get_today(user: User = Depends(verify_token)) -> SnapshotResponse:
    """Snapshot lifestyle del atleta hoy + derivados.

    Defensivo: si el cálculo falla (p.ej. tablas no migradas) devuelve un
    snapshot vacío válido en vez de 500 · el HOME del atleta debe renderizar.
    """
    try:
        snap = await svc.build_snapshot(user.id)
        return SnapshotResponse(**snap.__dict__)
    except Exception as e:
        logger.warning("build_snapshot failed for %s, returning empty: %s", user.id, e)
        return SnapshotResponse(user_id=user.id, caffeine_mg=0, alcohol_units=0,
                                smoking_today=False, cigarettes_count=0,
                                pain_zones_active=0, pain_max_level=0)


@router.get("/history")
async def get_history(
    user: User = Depends(verify_token),
    days: int = Query(default=14, ge=1, le=90),
):
    """Últimos N días de checkins · para sparklines + tendencias.

    Defensivo: lista vacía si no hay DB o la query falla (nunca 500).
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return []
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT checkin_date, sleep_hours, life_stress, energy_level,
                       caffeine_mg, alcohol_units, smoking_today
                  FROM lifestyle_checkins
                 WHERE user_id = $1::uuid
                   AND checkin_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
                 ORDER BY checkin_date DESC
                """,
                user.id, days,
            )
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning("lifestyle history query failed for %s: %s", user.id, e)
        return []


@router.post("/pain", status_code=201)
async def report_pain(payload: PainPayload, user: User = Depends(verify_token)):
    """Reporta dolor en zona específica · si >6 dispara alerta."""
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        # Link al checkin de hoy si existe
        checkin = await conn.fetchrow(
            "SELECT id FROM lifestyle_checkins WHERE user_id = $1::uuid AND checkin_date = CURRENT_DATE",
            user.id,
        )
        await conn.execute(
            """
            INSERT INTO pain_reports
                (user_id, checkin_id, zone, pain_level, pain_type, onset, aggravated_by, notes)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
            """,
            user.id, checkin["id"] if checkin else None,
            payload.zone, payload.pain_level, payload.pain_type,
            payload.onset, payload.aggravated_by, payload.notes,
        )

    # Si dolor crítico · evaluación inmediata + notif coach
    if payload.pain_level >= 7:
        try:
            from ..services import smart_coach_engine
            await smart_coach_engine.evaluate_athlete(user.id, persist=True)

            # Notificar al coach
            coach_row = await pool.acquire().__aenter__().fetchrow(
                "SELECT coach_id FROM users WHERE id = $1::uuid", user.id,
            ) if pool else None
        except Exception as e:
            print(f"[lifestyle] pain >=7 reeval failed: {e}")

    return {"ok": True, "alert_triggered": payload.pain_level >= 7}


@router.get("/pain/active")
async def get_active_pain(user: User = Depends(verify_token)):
    """Zonas con dolor activo (reportadas últimos 3 días).

    Defensivo: lista vacía si no hay DB o la query falla (nunca 500).
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return []
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT zone, MAX(pain_level) AS pain_level,
                       MAX(reported_at) AS last_reported,
                       COUNT(*) AS report_count
                  FROM pain_reports
                 WHERE user_id = $1::uuid
                   AND reported_at >= NOW() - INTERVAL '3 days'
                 GROUP BY zone
                 ORDER BY pain_level DESC
                """,
                user.id,
            )
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning("active pain query failed for %s: %s", user.id, e)
        return []


@router.get("/pills/{context}", response_model=List[PillResponse])
async def get_pills(
    context: str,
    user: User = Depends(verify_token),
    limit: int = Query(default=5, ge=1, le=20),
):
    """Píldoras educacionales contextuales · pre_wod · check_in · damage_control · hormonal."""
    pills = await svc.list_pills_for_context(context, user_id=user.id, limit=limit)
    return [
        PillResponse(
            id=str(p["id"]),
            slug=p["slug"],
            category=p["category"],
            title=p["title"],
            short_text=p["short_text"],
            long_text=p["long_text"],
            citation=p["citation"],
            severity=p["severity"],
            related_engines=p["related_engines"] if isinstance(p["related_engines"], list) else [],
        )
        for p in pills
    ]


@router.post("/pills/{pill_id}/view", status_code=201)
async def mark_pill_viewed(
    pill_id: UUID,
    context: str = Query(default="generic"),
    expanded: bool = Query(default=False),
    user: User = Depends(verify_token),
):
    """Tracking de píldoras vistas · analytics + evita repetir."""
    pool = await users_repo.get_pool()
    if pool is None:
        return {"ok": False}
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO pill_views (user_id, pill_id, context, expanded)
            VALUES ($1::uuid, $2::uuid, $3, $4)
            ON CONFLICT DO NOTHING
            """,
            user.id, pill_id, context, expanded,
        )
    return {"ok": True}
