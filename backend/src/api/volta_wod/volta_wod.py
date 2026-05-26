"""
Volta WOD Recommender · endpoint del atleta.

GET /v1/volta/wod/today  → RecommendedWod personalizado + meta

El engine es determinístico: por mismo input → mismo output. Cacheamos en
memoria por user_id hasta medianoche local del proceso, porque el WOD del
día no debe cambiar si el atleta refresca durante el día (a menos que haga
un check-in wellness nuevo, ver invalidación abajo).

Inputs derivados acá:
- readiness/cns: del último cálculo del Stress Engine (si DB no responde,
  defaults razonables).
- yesterday_load_intensity: bucket sobre wod_results de ayer (best-effort,
  None si no hay sesión).
- wellness_today: último wellness_checkin de hoy si existe.
- active_skill_focuses: coach_skill_focus con status='active'.
- days_since_metcon / days_since_strength: scan corto sobre wod_results.

Si la DB no está disponible, devolvemos un WOD genérico con readiness=70
y warning en `meta.fallback`. Mejor que romper la pantalla principal.
"""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, time, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...core.volta_wod_engine import (
    VoltaWodEngine,
    WodRecommendationInput,
    RecommendedWod,
    ENGINE_VERSION,
)
from ...db import users_repo


router = APIRouter(prefix="/v1/volta/wod", tags=["volta-wod"])

_engine = VoltaWodEngine()


# ---------------------------------------------------------------------------
# Cache en memoria por user_id · TTL hasta medianoche
# ---------------------------------------------------------------------------
# Estructura: { user_id: (expires_at_dt, RecommendedWod) }
# TTL hasta medianoche del proceso (no del cliente · suficiente para el caso
# normal donde server y atleta están en la misma timezone-ish · el cliente
# puede forzar refresh si necesita).
_cache: dict[str, tuple[datetime, RecommendedWod, datetime]] = {}


def _midnight_after(now: datetime) -> datetime:
    return datetime.combine((now + timedelta(days=1)).date(), time.min)


def _cache_get(user_id: str) -> Optional[tuple[RecommendedWod, datetime, datetime]]:
    entry = _cache.get(user_id)
    if entry is None:
        return None
    expires_at, wod, generated_at = entry
    if datetime.utcnow() >= expires_at:
        _cache.pop(user_id, None)
        return None
    return wod, expires_at, generated_at


def _cache_put(user_id: str, wod: RecommendedWod) -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    expires_at = _midnight_after(now)
    _cache[user_id] = (expires_at, wod, now)
    return expires_at, now


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class WodMovementOut(BaseModel):
    name: str
    scaling: dict[str, str]
    tag: Optional[str] = None


class WodMeta(BaseModel):
    engine_version: str
    generated_at: datetime
    expires_at: datetime
    fallback: bool = False
    reason: Optional[str] = None


class RecommendedWodResponse(BaseModel):
    title: str
    type: str
    duration_sec: int
    movements: list[WodMovementOut]
    intensity_target: str
    reasoning: str
    risk_score: int
    alternatives: list[str]
    template_id: Optional[str] = None
    meta: WodMeta


def _to_response(wod: RecommendedWod, meta: WodMeta) -> RecommendedWodResponse:
    return RecommendedWodResponse(
        title=wod.title,
        type=wod.type,
        duration_sec=wod.duration_sec,
        movements=[WodMovementOut(**m) for m in wod.movements],
        intensity_target=wod.intensity_target,
        reasoning=wod.reasoning,
        risk_score=wod.risk_score,
        alternatives=wod.alternatives,
        template_id=wod.template_id,
        meta=meta,
    )


# ---------------------------------------------------------------------------
# DB-derived inputs (best-effort)
# ---------------------------------------------------------------------------

async def _build_input(user_id: str) -> tuple[WodRecommendationInput, bool, Optional[str]]:
    """
    Construye el input. Devuelve (input, fallback?, reason?).
    Si la DB no responde, devolvemos input con defaults razonables y
    fallback=True para que el frontend pueda señalarlo.
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return (
            WodRecommendationInput(athlete_id=user_id),
            True,
            "DB no disponible · recomendación genérica",
        )

    # Defaults
    readiness: float = 70.0
    cns_zone: Optional[str] = None
    wellness_today: Optional[dict[str, Any]] = None
    active_focuses: list[str] = []
    yesterday_intensity: Optional[str] = None
    days_since_metcon: int = 1
    days_since_strength: int = 1

    try:
        async with pool.acquire() as conn:
            # 1) Wellness hoy · best-effort
            try:
                row = await conn.fetchrow(
                    """
                    SELECT sleep_hours, soreness, motivation
                    FROM wellness_checkins
                    WHERE user_id = $1::uuid
                      AND created_at >= CURRENT_DATE
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    user_id,
                )
                if row is not None:
                    wellness_today = {
                        "sleep_hours": float(row["sleep_hours"] or 7),
                        "soreness": int(row["soreness"] or 4),
                        "motivation": int(row["motivation"] or 6),
                    }
            except Exception:
                pass

            # 2) Skill focuses activos
            try:
                rows = await conn.fetch(
                    """
                    SELECT movement_id
                    FROM coach_skill_focus
                    WHERE athlete_id = $1::uuid AND status = 'active'
                    ORDER BY assigned_at DESC
                    """,
                    user_id,
                )
                active_focuses = [r["movement_id"] for r in rows]
            except Exception:
                pass

            # 3) Yesterday intensity y days_since_* desde wod_results
            #    Usamos score_value > 0 como proxy "did session" y mapeamos
            #    score_type para inferir si fue strength vs metcon.
            try:
                rows = await conn.fetch(
                    """
                    SELECT score_type, score_value, completed_at::date AS day,
                           wod_name
                    FROM wod_results
                    WHERE user_id = $1::uuid
                      AND completed_at >= NOW() - INTERVAL '14 days'
                    ORDER BY completed_at DESC
                    LIMIT 50
                    """,
                    user_id,
                )
                today = datetime.utcnow().date()
                yesterday = today - timedelta(days=1)
                last_metcon_date = None
                last_strength_date = None
                yesterday_rows = []
                for r in rows:
                    day = r["day"]
                    is_strength = r["score_type"] == "weight"
                    if is_strength and last_strength_date is None:
                        last_strength_date = day
                    if not is_strength and last_metcon_date is None:
                        last_metcon_date = day
                    if day == yesterday:
                        yesterday_rows.append(r)

                if yesterday_rows:
                    # Si hubo strength heavy ayer → high. Si solo metcon → medium.
                    has_strength = any(r["score_type"] == "weight" for r in yesterday_rows)
                    yesterday_intensity = "high" if has_strength else "medium"

                if last_metcon_date:
                    days_since_metcon = max(1, (today - last_metcon_date).days)
                else:
                    days_since_metcon = 7  # asume sin metcon reciente
                if last_strength_date:
                    days_since_strength = max(1, (today - last_strength_date).days)
                else:
                    days_since_strength = 7
            except Exception:
                pass

            # 4) Readiness · best-effort. La tabla persistida puede no existir
            #    en todos los environments → ignoramos errores y caemos al
            #    default 70. La fuente "real-time" del stress engine la
            #    recalcula el frontend / scheduler.
            try:
                row = await conn.fetchrow(
                    """
                    SELECT readiness, cns_zone
                    FROM stress_engine_outputs
                    WHERE athlete_id = $1::uuid
                    ORDER BY calculated_at DESC
                    LIMIT 1
                    """,
                    user_id,
                )
                if row is not None:
                    if row.get("readiness") is not None:
                        readiness = float(row["readiness"])
                    if row.get("cns_zone"):
                        cns_zone = str(row["cns_zone"])
            except Exception:
                pass

        return (
            WodRecommendationInput(
                athlete_id=user_id,
                readiness=readiness,
                cns_zone=cns_zone,
                yesterday_load_intensity=yesterday_intensity,
                wellness_today=wellness_today,
                active_skill_focuses=active_focuses,
                days_since_metcon=days_since_metcon,
                days_since_strength=days_since_strength,
            ),
            False,
            None,
        )
    except Exception as e:
        # DB acquire o fetch raro: degradado a defaults
        return (
            WodRecommendationInput(athlete_id=user_id),
            True,
            f"DB error · recomendación genérica ({str(e)[:120]})",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/today", response_model=RecommendedWodResponse)
async def get_today_wod(
    refresh: bool = False,
    user: User = Depends(verify_token),
) -> RecommendedWodResponse:
    """
    Devuelve el WOD recomendado para hoy. Cache TTL hasta medianoche por user.
    Pasa `?refresh=true` para invalidar (ej. después de un wellness check-in).
    """
    user_id = str(user.id)
    if refresh:
        _cache.pop(user_id, None)

    cached = _cache_get(user_id) if not refresh else None
    if cached is not None:
        wod, expires_at, generated_at = cached
        return _to_response(
            wod,
            WodMeta(
                engine_version=ENGINE_VERSION,
                generated_at=generated_at,
                expires_at=expires_at,
                fallback=False,
            ),
        )

    inp, fallback, reason = await _build_input(user_id)
    try:
        wod = _engine.recommend(inp)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Engine error: {str(e)[:200]}",
        )
    expires_at, generated_at = _cache_put(user_id, wod)
    return _to_response(
        wod,
        WodMeta(
            engine_version=ENGINE_VERSION,
            generated_at=generated_at,
            expires_at=expires_at,
            fallback=fallback,
            reason=reason,
        ),
    )


@router.delete("/today/cache", status_code=status.HTTP_204_NO_CONTENT)
async def invalidate_cache(user: User = Depends(verify_token)):
    """
    Invalida el cache del WOD del día para este user. Útil después de
    cargar un wellness check-in nuevo o cambiar de coach.
    """
    _cache.pop(str(user.id), None)
    return None
