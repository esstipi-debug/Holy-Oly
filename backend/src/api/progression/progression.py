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

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...services.belt_engine import evaluate_belt
from ...services.streak_service import calc_streak
from ...services.oly_index_service import calc_oly_index


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
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/belt", response_model=BeltResponse)
async def get_belt(user: User = Depends(verify_token)) -> BeltResponse:
    """Belt actual + progress hacia el siguiente · idempotente · persiste promoción."""
    bs = await evaluate_belt(user.id)
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


@router.get("/streak", response_model=StreakResponse)
async def get_streak(user: User = Depends(verify_token)) -> StreakResponse:
    """Smart streak con grace day · cuenta wod_results + cf_sessions completadas."""
    s = await calc_streak(user.id)
    return StreakResponse(
        current=s.current,
        best=s.best,
        grace_used=s.grace_used,
        last_active_date=s.last_active_date.isoformat() if s.last_active_date else None,
        total_active_days=s.total_active_days,
    )


@router.get("/oly-index", response_model=OlyIndexResponse)
async def get_oly_index(user: User = Depends(verify_token)) -> OlyIndexResponse:
    """OLY Index = (best_sn + best_cj) / bw × 100 · categoría según valor."""
    o = await calc_oly_index(user.id)
    return OlyIndexResponse(
        oly_index=o.oly_index,
        best_snatch_kg=o.best_snatch_kg,
        best_clean_kg=o.best_clean_kg,
        body_weight_kg=o.body_weight_kg,
        bw_estimated=o.bw_estimated,
        category=o.category,
    )


@router.get("/me", response_model=ProgressionBundle)
async def get_progression_bundle(user: User = Depends(verify_token)) -> ProgressionBundle:
    """Bundle completo · 1 round-trip · evaluate_belt ya calcula streak + oly internamente."""
    bs = await evaluate_belt(user.id)
    s = await calc_streak(user.id)
    o = await calc_oly_index(user.id)
    return ProgressionBundle(
        belt=BeltResponse(
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
        ),
        streak=StreakResponse(
            current=s.current,
            best=s.best,
            grace_used=s.grace_used,
            last_active_date=s.last_active_date.isoformat() if s.last_active_date else None,
            total_active_days=s.total_active_days,
        ),
        oly_index=OlyIndexResponse(
            oly_index=o.oly_index,
            best_snatch_kg=o.best_snatch_kg,
            best_clean_kg=o.best_clean_kg,
            body_weight_kg=o.body_weight_kg,
            bw_estimated=o.bw_estimated,
            category=o.category,
        ),
    )
