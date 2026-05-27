"""
Engine 13 · Hormonal Periodization · API endpoints.

OWN-ONLY: atleta lee/escribe su propio tracking. Data sensible · opt-in puro.
Cumple GDPR: DELETE /v1/auth/me ya hace cascade delete (FK ON DELETE CASCADE).

Endpoints:
- POST   /v1/hormonal/setup         → habilita tracking · setea cycle_start + length
- DELETE /v1/hormonal/setup         → deshabilita y borra config (logs quedan)
- GET    /v1/hormonal/current       → fase actual + recomendaciones
- POST   /v1/hormonal/log           → log diario (síntomas, flujo, notas)
- GET    /v1/hormonal/history       → últimas N entries

Privacy: NO se expone cross-user. Coach view sería un endpoint separado
con consentimiento explícito del atleta (no se implementa en este MVP).
"""
from datetime import date, datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo
from ...services.hormonal_phase import (
    determine_phase, phase_recommendation, Phase,
)


router = APIRouter(prefix="/v1/hormonal", tags=["hormonal"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SetupPayload(BaseModel):
    cycle_start_date: date  # último primer día de menstruación conocido
    cycle_length_days: int = Field(default=28, ge=21, le=45)
    source: str = Field(default="manual", max_length=32)
    notes: Optional[str] = Field(default=None, max_length=500)


class LogEntryPayload(BaseModel):
    log_date: Optional[date] = None  # default today
    symptoms: Optional[List[str]] = Field(default=None, max_length=20)
    flow_intensity: Optional[str] = Field(default=None, pattern="^(light|moderate|heavy)$")
    notes: Optional[str] = Field(default=None, max_length=500)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_pool():
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no configurada (dev mode)",
        )
    return pool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/setup")
async def setup_tracking(
    payload: SetupPayload,
    current_user: User = Depends(verify_token),
):
    """Habilita o actualiza tracking del ciclo."""
    pool = await _get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO cycle_tracking (user_id, cycle_start_date, cycle_length_days, source, notes, is_enabled)
            VALUES ($1::uuid, $2, $3, $4, $5, true)
            ON CONFLICT (user_id) DO UPDATE
              SET cycle_start_date = EXCLUDED.cycle_start_date,
                  cycle_length_days = EXCLUDED.cycle_length_days,
                  source = EXCLUDED.source,
                  notes = EXCLUDED.notes,
                  is_enabled = true,
                  updated_at = now()
            RETURNING id, cycle_start_date, cycle_length_days, source, is_enabled, created_at, updated_at
            """,
            current_user.id, payload.cycle_start_date, payload.cycle_length_days,
            payload.source, payload.notes,
        )
        return {
            "id": str(row["id"]),
            "cycle_start_date": row["cycle_start_date"].isoformat(),
            "cycle_length_days": row["cycle_length_days"],
            "source": row["source"],
            "is_enabled": row["is_enabled"],
        }


@router.delete("/setup")
async def disable_tracking(current_user: User = Depends(verify_token)):
    """Deshabilita tracking · NO borra logs históricos (puede reactivar)."""
    pool = await _get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE cycle_tracking SET is_enabled = false, updated_at = now() WHERE user_id = $1::uuid",
            current_user.id,
        )
        return {"disabled": result != "UPDATE 0"}


@router.get("/current")
async def get_current_phase(current_user: User = Depends(verify_token)):
    """Devuelve fase actual + recomendaciones · 404 si no hay tracking habilitado."""
    pool = await _get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT cycle_start_date, cycle_length_days, is_enabled
            FROM cycle_tracking
            WHERE user_id = $1::uuid AND is_enabled = true
            """,
            current_user.id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Hormonal tracking no habilitado")

        info = determine_phase(date.today(), row["cycle_start_date"], row["cycle_length_days"])
        rec = phase_recommendation(info["phase"])
        return {
            **info,
            "cycle_start_date": row["cycle_start_date"].isoformat(),
            "cycle_length_days": row["cycle_length_days"],
            "recommendation": rec,
        }


@router.post("/log")
async def log_entry(
    payload: LogEntryPayload,
    current_user: User = Depends(verify_token),
):
    """Registra una entrada diaria de síntomas/flujo/notas."""
    pool = await _get_pool()
    log_date = payload.log_date or date.today()
    async with pool.acquire() as conn:
        # Necesitamos calcular phase + day_of_cycle desde el setup actual
        setup = await conn.fetchrow(
            "SELECT cycle_start_date, cycle_length_days FROM cycle_tracking WHERE user_id = $1::uuid",
            current_user.id,
        )
        if not setup:
            raise HTTPException(status_code=400, detail="Configurá tracking primero (POST /setup)")

        info = determine_phase(log_date, setup["cycle_start_date"], setup["cycle_length_days"])

        row = await conn.fetchrow(
            """
            INSERT INTO cycle_log_entries (user_id, log_date, day_of_cycle, phase, symptoms, flow_intensity, notes)
            VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, $7)
            ON CONFLICT (user_id, log_date) DO UPDATE
              SET day_of_cycle = EXCLUDED.day_of_cycle,
                  phase = EXCLUDED.phase,
                  symptoms = EXCLUDED.symptoms,
                  flow_intensity = EXCLUDED.flow_intensity,
                  notes = EXCLUDED.notes,
                  logged_at = now()
            RETURNING id, log_date, day_of_cycle, phase, symptoms, flow_intensity, notes, logged_at
            """,
            current_user.id, log_date, info["day_of_cycle"], info["phase"],
            __import__("json").dumps(payload.symptoms) if payload.symptoms else None,
            payload.flow_intensity, payload.notes,
        )
        return {
            "id": str(row["id"]),
            "log_date": row["log_date"].isoformat(),
            "day_of_cycle": row["day_of_cycle"],
            "phase": row["phase"],
            "symptoms": row["symptoms"],
            "flow_intensity": row["flow_intensity"],
            "notes": row["notes"],
        }


@router.get("/history")
async def get_history(
    days: int = Query(default=30, ge=1, le=180),
    current_user: User = Depends(verify_token),
):
    """Últimos N días de logs · default 30."""
    pool = await _get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT log_date, day_of_cycle, phase, symptoms, flow_intensity, notes
            FROM cycle_log_entries
            WHERE user_id = $1::uuid
              AND log_date >= CURRENT_DATE - $2::int
            ORDER BY log_date DESC
            """,
            current_user.id, days,
        )
        return {
            "entries": [
                {
                    "log_date": r["log_date"].isoformat(),
                    "day_of_cycle": r["day_of_cycle"],
                    "phase": r["phase"],
                    "symptoms": r["symptoms"],
                    "flow_intensity": r["flow_intensity"],
                    "notes": r["notes"],
                }
                for r in rows
            ],
        }
