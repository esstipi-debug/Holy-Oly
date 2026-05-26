"""
Wellness daily check-ins · feeds el stress engine y el Wise Score.

POST   /v1/wellness/checkin           → crea check-in del día
GET    /v1/wellness/checkin/today     → último check-in de hoy o 404
GET    /v1/wellness/checkin/history   → array últimos N días (default 14)

El check-in es OWN-ONLY: el atleta crea/lee los suyos (user_id = current_user.id).
No exponemos lectura cross-user acá; el coach usa endpoints agregados separados.

Persistencia: tabla `wellness_checkins` (migration 009_wellness_checkins.sql).
"""
from datetime import datetime, date, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/wellness", tags=["wellness"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class WellnessCheckinCreate(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=12)
    sleep_quality: int = Field(..., ge=1, le=5)
    soreness: int = Field(..., ge=1, le=10)
    motivation: int = Field(..., ge=1, le=10)
    life_stress: int = Field(..., ge=1, le=10)
    caffeine_mg: int = Field(default=0, ge=0, le=1000)
    hydration_liters: float = Field(default=0, ge=0, le=10)
    hrv: Optional[int] = Field(default=None, ge=0, le=200)
    notes: Optional[str] = Field(default=None, max_length=500)


class WellnessCheckinResponse(BaseModel):
    id: str
    user_id: str
    sleep_hours: float
    sleep_quality: int
    soreness: int
    motivation: int
    life_stress: int
    caffeine_mg: int
    hydration_liters: float
    hrv: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_response(row: dict) -> WellnessCheckinResponse:
    return WellnessCheckinResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        sleep_hours=float(row["sleep_hours"]) if row.get("sleep_hours") is not None else 0.0,
        sleep_quality=int(row["sleep_quality"]) if row.get("sleep_quality") is not None else 0,
        soreness=int(row["soreness"]) if row.get("soreness") is not None else 0,
        motivation=int(row["motivation"]) if row.get("motivation") is not None else 0,
        life_stress=int(row["life_stress"]) if row.get("life_stress") is not None else 0,
        caffeine_mg=int(row.get("caffeine_mg") or 0),
        hydration_liters=float(row["hydration_liters"]) if row.get("hydration_liters") is not None else 0.0,
        hrv=int(row["hrv"]) if row.get("hrv") is not None else None,
        notes=row.get("notes"),
        created_at=row["created_at"],
    )


async def _require_pool():
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DB no disponible — configurá DATABASE_URL",
        )
    return pool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/checkin", status_code=status.HTTP_201_CREATED, response_model=WellnessCheckinResponse)
async def create_checkin(
    payload: WellnessCheckinCreate,
    user: User = Depends(verify_token),
) -> WellnessCheckinResponse:
    """
    Atleta crea check-in wellness del día. Permite múltiples check-ins por día
    (último gana en /today). Feeds el stress engine async (sin recalcular acá).
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO wellness_checkins
                    (user_id, sleep_hours, sleep_quality, soreness, motivation,
                     life_stress, caffeine_mg, hydration_liters, hrv, notes)
                VALUES
                    ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, user_id, sleep_hours, sleep_quality, soreness,
                          motivation, life_stress, caffeine_mg, hydration_liters,
                          hrv, notes, created_at
                """,
                user.id,
                payload.sleep_hours,
                payload.sleep_quality,
                payload.soreness,
                payload.motivation,
                payload.life_stress,
                payload.caffeine_mg,
                payload.hydration_liters,
                payload.hrv,
                payload.notes,
            )
            return _row_to_response(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos guardar el check-in: {str(e)[:200]}",
        )


@router.get("/checkin/today", response_model=WellnessCheckinResponse)
async def get_today_checkin(
    user: User = Depends(verify_token),
) -> WellnessCheckinResponse:
    """
    Último check-in con created_at >= hoy 00:00 (server time). 404 si no hay.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, user_id, sleep_hours, sleep_quality, soreness,
                       motivation, life_stress, caffeine_mg, hydration_liters,
                       hrv, notes, created_at
                FROM wellness_checkins
                WHERE user_id = $1::uuid
                  AND created_at >= CURRENT_DATE
                ORDER BY created_at DESC
                LIMIT 1
                """,
                user.id,
            )
            if row is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No hay check-in registrado para hoy",
                )
            return _row_to_response(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos leer el check-in de hoy: {str(e)[:200]}",
        )


@router.get("/checkin/history", response_model=List[WellnessCheckinResponse])
async def get_checkin_history(
    days: int = Query(default=14, ge=1, le=90),
    user: User = Depends(verify_token),
) -> List[WellnessCheckinResponse]:
    """
    Historial últimos N días (default 14, max 90). Orden created_at DESC.
    """
    pool = await _require_pool()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, user_id, sleep_hours, sleep_quality, soreness,
                       motivation, life_stress, caffeine_mg, hydration_liters,
                       hrv, notes, created_at
                FROM wellness_checkins
                WHERE user_id = $1::uuid
                  AND created_at >= $2
                ORDER BY created_at DESC
                """,
                user.id, cutoff,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos leer el historial: {str(e)[:200]}",
        )
