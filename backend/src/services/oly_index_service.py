"""
OLY Index service (Engine 11).

Calcula el "OLY Index" — métrica normalizada de fuerza olímpica del atleta.

Fórmula:
    OLY Index = (best_snatch_1rm + best_clean_1rm) / body_weight × 100

Interpretación:
- ~100 → principiante (suma SN+CJ ≈ BW)
- ~200 → atleta intermedio (SN+CJ ≈ 2× BW)
- ~250 → avanzado
- ~300 → élite nivel competición regional
- ~350+ → top mundial

Datos de entrada:
- `cf_strength_lifts.clean_1rm` (Holy Oly)
- `baseline_results` con `test_id IN ('snatch_1rm', 'clean_1rm', 'snatch', 'clean')`
- `wise_score_snapshots.bw_kg` (más reciente · proxy de bodyweight actual)

Fallback bodyweight: si no hay snapshot → asume 75kg adulto.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ..db import users_repo


@dataclass
class OlyIndexInfo:
    oly_index: float           # 0-400+
    best_snatch_kg: float
    best_clean_kg: float
    body_weight_kg: float
    bw_estimated: bool         # True si usamos fallback 75
    category: str              # 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'world_class'


_FALLBACK_BW = 75.0


def _categorize(idx: float) -> str:
    if idx >= 350: return "world_class"
    if idx >= 280: return "elite"
    if idx >= 220: return "advanced"
    if idx >= 150: return "intermediate"
    return "beginner"


async def calc_oly_index(user_id: str) -> OlyIndexInfo:
    pool = await users_repo.get_pool()
    if pool is None:
        return OlyIndexInfo(0.0, 0.0, 0.0, _FALLBACK_BW, True, "beginner")

    async with pool.acquire() as conn:
        # Best snatch desde baseline_results (volta usa este path)
        snatch_row = await conn.fetchrow(
            """
            SELECT MAX(value) AS v
              FROM baseline_results
             WHERE user_id = $1::uuid
               AND test_id IN ('snatch_1rm', 'snatch')
               AND unit = 'kg'
            """,
            user_id,
        )
        # Best clean desde baseline_results
        clean_row = await conn.fetchrow(
            """
            SELECT MAX(value) AS v
              FROM baseline_results
             WHERE user_id = $1::uuid
               AND test_id IN ('clean_1rm', 'clean', 'power_clean_1rm')
               AND unit = 'kg'
            """,
            user_id,
        )
        # Holy Oly path: cf_strength_lifts
        clean_oly = await conn.fetchrow(
            """
            SELECT MAX(clean_1rm) AS v
              FROM cf_strength_lifts
             WHERE athlete_id = $1::uuid
            """,
            user_id,
        )
        # Body weight: snapshot wise_score más reciente
        bw_row = await conn.fetchrow(
            """
            SELECT bw_kg
              FROM wise_score_snapshots
             WHERE athlete_id = $1::uuid AND bw_kg IS NOT NULL
             ORDER BY calculated_at DESC
             LIMIT 1
            """,
            user_id,
        )

    snatch_kg = float(snatch_row["v"] or 0)
    clean_kg = max(
        float(clean_row["v"] or 0),
        float(clean_oly["v"] or 0),
    )

    bw_kg_raw = bw_row["bw_kg"] if bw_row else None
    bw_estimated = bw_kg_raw is None or float(bw_kg_raw) <= 0
    body_weight_kg = _FALLBACK_BW if bw_estimated else float(bw_kg_raw)

    if body_weight_kg <= 0:
        body_weight_kg = _FALLBACK_BW
        bw_estimated = True

    total_lifts = snatch_kg + clean_kg
    oly_index = round((total_lifts / body_weight_kg) * 100.0, 1) if total_lifts > 0 else 0.0

    return OlyIndexInfo(
        oly_index=oly_index,
        best_snatch_kg=snatch_kg,
        best_clean_kg=clean_kg,
        body_weight_kg=body_weight_kg,
        bw_estimated=bw_estimated,
        category=_categorize(oly_index),
    )
