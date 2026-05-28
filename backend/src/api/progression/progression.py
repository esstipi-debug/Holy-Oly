"""
Sprint 1 Engines · Progression API
=====================================
Reemplaza el hack del frontend BeltCeremony que calculaba el cinturón con
`Math.floor(prior_fitness / 15)`. Expone los engines reales:

- GET /v1/progression/me          → bundle completo (belt + streak + oly)
- GET /v1/progression/belt        → estado de belt actual + progress hacia el siguiente
- GET /v1/progression/streak      → streak actual + best + total active days
- GET /v1/progression/oly-index   → OLY Index (Sn+CJ / BW)

OWN-ONLY: cada user lee sus propias métricas.
Las funciones de cálculo son idempotentes · seguro llamar muchas veces.
"""

import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...services.belt_engine import evaluate_belt
from ...services.streak_service import calc_streak
from ...services.oly_index_service import calc_oly_index


logger = logging.getLogger("progression")

router = APIRouter(prefix="/v1/progression", tags=["progression"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class BeltResponse(BaseModel):
    belt_idx: int
    earned_at: Optional[datetime] = None
    next_belt_idx: Optional[int] = None
    progress_pct: float
    progress_breakdown: dict
    next_criteria: Optional[dict] = None
    current_oly_index: float
    current_active_days: int
    current_best_streak: int


class StreakResponse(BaseModel):
    current: int
    best: int
    grace_used: bool
    last_active_date: Optional[str] = None
    total_active_days: int


class OlyIndexResponse(BaseModel):
    oly_index: float
    best_snatch_kg: float
    best_clean_kg: float
    body_weight_kg: float
    bw_estimated: bool
    category: str


class ProgressionBundle(BaseModel):
    belt: BeltResponse
    streak: StreakResponse
    oly_index: OlyIndexResponse


# ---------------------------------------------------------------------------
# Helpers · defaults seguros + conversores dataclass→schema
# ---------------------------------------------------------------------------
# Usados cuando un engine falla (p.ej. tabla no migrada) → devolvemos un shape
# válido en vez de 500, para que el HOME del atleta siempre renderice.

def _default_belt_response() -> "BeltResponse":
    """Belt 0 (Blanco) sin progreso · shape válido para el frontend."""
    return BeltResponse(
        belt_idx=0,
        earned_at=None,
        next_belt_idx=1,
        progress_pct=0.0,
        progress_breakdown={},
        next_criteria=None,
        current_oly_index=0.0,
        current_active_days=0,
        current_best_streak=0,
    )


def _default_streak_response() -> "StreakResponse":
    return StreakResponse(
        current=0, best=0, grace_used=False,
        last_active_date=None, total_active_days=0,
    )


def _default_oly_response() -> "OlyIndexResponse":
    return OlyIndexResponse(
        oly_index=0.0, best_snatch_kg=0.0, best_clean_kg=0.0,
        body_weight_kg=75.0, bw_estimated=True, category="beginner",
    )


def _belt_to_response(bs) -> "BeltResponse":
    return BeltResponse(
        belt_idx=bs.belt_idx,
        earned_at=bs.earned_at,
        next_belt_idx=bs.next_belt_idx,
        progress_pct=bs.progress_pct,
        progress_breakdown=bs.progress_breakdown,
        next_criteria=(
            {
                "belt_idx": bs.next_criteria.belt_idx,
                "min_oly_index": bs.next_criteria.min_oly_index,
                "min_active_days": bs.next_criteria.min_active_days,
                "min_streak": bs.next_criteria.min_streak,
            }
            if bs.next_criteria else None
        ),
        current_oly_index=bs.current_oly_index,
        current_active_days=bs.current_active_days,
        current_best_streak=bs.current_best_streak,
    )


def _streak_to_response(s) -> "StreakResponse":
    return StreakResponse(
        current=s.current,
        best=s.best,
        grace_used=s.grace_used,
        last_active_date=s.last_active_date.isoformat() if s.last_active_date else None,
        total_active_days=s.total_active_days,
    )


def _oly_to_response(o) -> "OlyIndexResponse":
    return OlyIndexResponse(
        oly_index=o.oly_index,
        best_snatch_kg=o.best_snatch_kg,
        best_clean_kg=o.best_clean_kg,
        body_weight_kg=o.body_weight_kg,
        bw_estimated=o.bw_estimated,
        category=o.category,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/belt", response_model=BeltResponse)
async def get_belt(user: User = Depends(verify_token)) -> BeltResponse:
    """Belt actual + progress hacia el siguiente · idempotente · persiste promoción.

    Defensivo: si el engine falla (p.ej. tabla `athlete_belts` no migrada o sin
    datos del atleta) devuelve el belt por defecto (Blanco) en vez de 500.
    """
    try:
        bs = await evaluate_belt(user.id)
        return _belt_to_response(bs)
    except Exception as e:
        logger.warning("evaluate_belt failed for %s, returning default belt: %s", user.id, e)
        return _default_belt_response()


@router.get("/streak", response_model=StreakResponse)
async def get_streak(user: User = Depends(verify_token)) -> StreakResponse:
    """Smart streak con grace day · cuenta wod_results + cf_sessions completadas."""
    try:
        s = await calc_streak(user.id)
        return _streak_to_response(s)
    except Exception as e:
        logger.warning("calc_streak failed for %s, returning default: %s", user.id, e)
        return _default_streak_response()


@router.get("/oly-index", response_model=OlyIndexResponse)
async def get_oly_index(user: User = Depends(verify_token)) -> OlyIndexResponse:
    """OLY Index = (best_sn + best_cj) / bw × 100 · categoría según valor."""
    try:
        o = await calc_oly_index(user.id)
        return _oly_to_response(o)
    except Exception as e:
        logger.warning("calc_oly_index failed for %s, returning default: %s", user.id, e)
        return _default_oly_response()


@router.get("/me", response_model=ProgressionBundle)
async def get_progression_bundle(user: User = Depends(verify_token)) -> ProgressionBundle:
    """Bundle completo · 1 round-trip.

    Defensivo: cada componente (belt/streak/oly) cae a su default si su engine
    falla, de modo que el HOME del atleta nunca recibe 500.
    """
    try:
        bs = await evaluate_belt(user.id)
        belt = _belt_to_response(bs)
    except Exception as e:
        logger.warning("bundle: evaluate_belt failed for %s: %s", user.id, e)
        belt = _default_belt_response()

    try:
        s = await calc_streak(user.id)
        streak = _streak_to_response(s)
    except Exception as e:
        logger.warning("bundle: calc_streak failed for %s: %s", user.id, e)
        streak = _default_streak_response()

    try:
        o = await calc_oly_index(user.id)
        oly = _oly_to_response(o)
    except Exception as e:
        logger.warning("bundle: calc_oly_index failed for %s: %s", user.id, e)
        oly = _default_oly_response()

    return ProgressionBundle(belt=belt, streak=streak, oly_index=oly)
