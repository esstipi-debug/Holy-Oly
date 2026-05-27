"""
Belt Engine (Engine 05) — backend real.

Reemplaza el hack del frontend BeltCeremony.tsx donde se calculaba el cinturón con
`Math.floor(prior_fitness / 15)`. Ahora usa criterios reales combinados:

- OLY Index (best Sn + CJ / BW)
- Smart Streak (días consecutivos training)
- Active Days (cumulative · # de días con actividad histórico)

Mapeo belt_idx ↔ BeltCeremony.tsx:
  0=Blanco · 1=Amarillo · 2=Naranja · 3=Azul · 4=Púrpura · 5=Marrón · 6=Negro · 7=Maestro

Criterios MVP simplificados (vs spec original que pide Shields/Club/Pulse/Ratios
que aún no tenemos motor para):

| Belt | Min OLY Index | Min Active Days | Min Streak Actual o Best |
|------|---------------|-----------------|--------------------------|
| 0 Blanco   | 0   | 0   | 0   |
| 1 Amarillo | 60  | 7   | 3   |
| 2 Naranja  | 100 | 30  | 7   |
| 3 Azul     | 150 | 90  | 14  |
| 4 Púrpura  | 200 | 180 | 21  |
| 5 Marrón   | 250 | 270 | 30  |
| 6 Negro    | 300 | 365 | 50  |
| 7 Maestro  | 350 | 500 | 75  |

Belt es PERMANENTE: una vez ganado, nunca demota. Si los criterios actuales
no califican para current_belt, retornamos current_belt (frozen). Solo subimos.

Persistencia: tabla `athlete_belts` (migration 015) con snapshot JSON.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional

from ..db import users_repo
from .streak_service import calc_streak
from .oly_index_service import calc_oly_index


@dataclass
class BeltCriteria:
    belt_idx: int
    min_oly_index: float
    min_active_days: int
    min_streak: int


# belt_idx → criterios para alcanzarlo
CRITERIA: list[BeltCriteria] = [
    BeltCriteria(0, 0,   0,   0),
    BeltCriteria(1, 60,  7,   3),
    BeltCriteria(2, 100, 30,  7),
    BeltCriteria(3, 150, 90,  14),
    BeltCriteria(4, 200, 180, 21),
    BeltCriteria(5, 250, 270, 30),
    BeltCriteria(6, 300, 365, 50),
    BeltCriteria(7, 350, 500, 75),
]


@dataclass
class BeltStatus:
    belt_idx: int
    earned_at: Optional[datetime]
    # Métricas actuales · usadas para progress al siguiente belt
    current_oly_index: float
    current_active_days: int
    current_best_streak: int
    # Siguiente belt + progress 0-100%
    next_belt_idx: Optional[int]
    next_criteria: Optional[BeltCriteria]
    progress_pct: float
    progress_breakdown: dict  # {oly: 0.6, active_days: 0.8, streak: 0.4}


def _meets_criteria(c: BeltCriteria, oly: float, active_days: int, best_streak: int) -> bool:
    return (
        oly >= c.min_oly_index
        and active_days >= c.min_active_days
        and best_streak >= c.min_streak
    )


def _progress_pct(c: BeltCriteria, oly: float, active_days: int, best_streak: int) -> tuple[float, dict]:
    """Promedio de % avance hacia el siguiente belt · cada criterio cuenta igual."""
    pieces = {}
    if c.min_oly_index > 0:
        pieces["oly"] = min(1.0, oly / c.min_oly_index)
    else:
        pieces["oly"] = 1.0
    if c.min_active_days > 0:
        pieces["active_days"] = min(1.0, active_days / c.min_active_days)
    else:
        pieces["active_days"] = 1.0
    if c.min_streak > 0:
        pieces["streak"] = min(1.0, best_streak / c.min_streak)
    else:
        pieces["streak"] = 1.0
    pct = sum(pieces.values()) / len(pieces) * 100.0
    return round(pct, 1), {k: round(v * 100, 1) for k, v in pieces.items()}


async def evaluate_belt(user_id: str, persist: bool = True) -> BeltStatus:
    """
    Calcula el belt actual del atleta · idempotente.

    Si `persist=True` y se promovió, hace UPSERT en `athlete_belts` con snapshot.
    Si el atleta ya tiene un belt persistido más alto que los criterios actuales,
    respeta el persistido (belt permanente · no demota).
    """
    # ── Métricas actuales ──
    streak = await calc_streak(user_id)
    oly = await calc_oly_index(user_id)

    current_oly = oly.oly_index
    active_days = streak.total_active_days
    best_streak = streak.best

    # Encontrar el belt_idx MAS alto cuyos criterios se cumplen
    eligible_idx = 0
    for c in CRITERIA:
        if _meets_criteria(c, current_oly, active_days, best_streak):
            eligible_idx = c.belt_idx

    # ── Leer belt persistido (si existe) ──
    pool = await users_repo.get_pool()
    persisted_idx: Optional[int] = None
    earned_at: Optional[datetime] = None

    if pool is not None:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT belt_idx, earned_at FROM athlete_belts WHERE user_id = $1::uuid",
                user_id,
            )
            if row:
                persisted_idx = row["belt_idx"]
                earned_at = row["earned_at"]

    # ── Determinar belt final · NUNCA DEMOTAR ──
    final_idx = max(eligible_idx, persisted_idx or 0)

    # Si subió de belt y persist=True → UPSERT
    if persist and pool is not None and final_idx > (persisted_idx or 0):
        snapshot = {
            "oly_index": current_oly,
            "active_days": active_days,
            "best_streak": best_streak,
            "current_streak": streak.current,
            "best_snatch_kg": oly.best_snatch_kg,
            "best_clean_kg": oly.best_clean_kg,
        }
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO athlete_belts (user_id, belt_idx, earned_at, last_eval_at, snapshot)
                VALUES ($1::uuid, $2, NOW(), NOW(), $3::jsonb)
                ON CONFLICT (user_id) DO UPDATE
                  SET belt_idx     = EXCLUDED.belt_idx,
                      earned_at    = EXCLUDED.earned_at,
                      last_eval_at = NOW(),
                      snapshot     = EXCLUDED.snapshot
                """,
                user_id, final_idx, json.dumps(snapshot),
            )
        earned_at = datetime.utcnow()

    # ── Calcular progress hacia el siguiente belt ──
    next_idx = final_idx + 1 if final_idx < 7 else None
    next_criteria = CRITERIA[next_idx] if next_idx is not None else None
    progress_pct = 0.0
    progress_breakdown: dict = {}
    if next_criteria:
        progress_pct, progress_breakdown = _progress_pct(
            next_criteria, current_oly, active_days, best_streak
        )

    return BeltStatus(
        belt_idx=final_idx,
        earned_at=earned_at,
        current_oly_index=current_oly,
        current_active_days=active_days,
        current_best_streak=best_streak,
        next_belt_idx=next_idx,
        next_criteria=next_criteria,
        progress_pct=progress_pct,
        progress_breakdown=progress_breakdown,
    )
