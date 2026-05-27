"""
Mayhem Scaling System · Volta engine.

Fuente: COMPTRAIN_MASTER.md líneas 2136-2528 (Mayhem-Athlete-Scaling-Doc.pdf).

3 preguntas antes de escalar:
  1. ¿Puedo el RX weight + RX reps?
  2. ¿Tengo la skill?
  3. ¿Puedo terminar en el time domain?

Si cualquier respuesta = NO → engine sustituye automáticamente con sub_options
para preservar el estímulo + time domain del WOD.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List

from ...db import users_repo


# ============================================================================
# Catálogo Mayhem completo · 25+ movimientos con sustituciones
# ============================================================================

MAYHEM_SCALING_CATALOG: list[dict] = [
    {
        "movement_slug": "handstand_walk",
        "rx_qty": "100ft",
        "sub_options": [
            {"label": "20/16 Calorie Ski", "tier_min": 1},
            {"label": "15 HSPU", "tier_min": 2},
            {"label": "100ft Bear Crawl", "tier_min": 1},
            {"label": "6 Wall Walks", "tier_min": 1},
            {"label": "40 HS Shoulder Taps", "tier_min": 1},
            {"label": "1:00 Handstand Hold", "tier_min": 1},
            {"label": "20 DB Strict Shoulder Press", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "rope_climb",
        "rx_qty": "1 (15ft)",
        "sub_options": [
            {"label": "3-4 Toes-to-Bar", "tier_min": 1},
            {"label": "3 Strict Pull-Ups", "tier_min": 1},
            {"label": "25ft Hand-over-Hand Sled Pull (1x45/25)", "tier_min": 0},
            {"label": "4-5 Strict Knees-to-Elbows", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "legless_rope_climb",
        "rx_qty": "1 (15ft)",
        "sub_options": [
            {"label": "4 Strict Pull-Ups", "tier_min": 1},
            {"label": "25ft Sled Pull", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "squat_snatch",
        "rx_qty": "135/95",
        "sub_options": [
            {"label": "1 Power Snatch (135/95)", "tier_min": 1},
            {"label": "1 Overhead Squat (135/95)", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "pegboard",
        "rx_qty": "1",
        "sub_options": [
            {"label": "1 Legless Rope Climb", "tier_min": 3},
            {"label": "2 Rope Climbs", "tier_min": 2},
            {"label": "5 Strict Pull-Ups", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "toes_to_bar",
        "rx_qty": "10",
        "sub_options": [
            {"label": "12 GHD Sit-Ups", "tier_min": 1},
            {"label": "14 V-Ups", "tier_min": 0},
            {"label": "16 Alternating V-Ups", "tier_min": 0},
            {"label": "20 Abmat Sit-Ups", "tier_min": 0},
            {"label": "10 Weighted Abmat Sit-Ups (light)", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "ghd_situp",
        "rx_qty": "10",
        "sub_options": [
            {"label": "8 Toes-to-Bar", "tier_min": 1},
            {"label": "12 V-Ups", "tier_min": 0},
            {"label": "14 Alternating V-Ups", "tier_min": 0},
            {"label": "16 Abmat Sit-Ups", "tier_min": 0},
            {"label": "8 Weighted Abmat Sit-Ups (light)", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "heavy_double_unders",
        "rx_qty": "50",
        "sub_options": [
            {"label": "75 Double-Unders", "tier_min": 1},
            {"label": "150 Single-Unders", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "sled_push",
        "rx_qty": "100ft @ 190/145",
        "sub_options": [
            {"label": "50ft Front Rack Lunge (95/65)", "tier_min": 1},
            {"label": "50ft Back Rack Lunge (135/95)", "tier_min": 1},
            {"label": "100ft Front Rack Walking Carry (155/105)", "tier_min": 1},
            {"label": "100ft Sandbag Carry on Shoulder (100/70)", "tier_min": 1},
            {"label": "15/12 Cal Assault OR 12/9 Cal Echo", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "sled_pull",
        "rx_qty": "190/145 hand-over-hand",
        "sub_options": [
            {"label": "5 Strict Pull-Ups", "tier_min": 1},
            {"label": "1 Legless Rope Climb", "tier_min": 3},
            {"label": "2 Rope Climbs", "tier_min": 2},
            {"label": "100ft Farmers Carry (2 KB/DB moderate)", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "ring_muscle_up",
        "rx_qty": "1",
        "sub_options": [
            {"label": "1 Bar Muscle-Up", "tier_min": 3},
            {"label": "2 Burpee Pull-Ups (equipment)", "tier_min": 1},
            {"label": "1 Burpee Pull-Up (cant do MU)", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "pull_up",
        "rx_qty": "10",
        "sub_options": [
            {"label": "10-15 Banded Pull-Ups", "tier_min": 0},
            {"label": "10-15 Jumping Pull-Ups", "tier_min": 0},
            {"label": "5 Strict Pull-Ups", "tier_min": 1},
            {"label": "15 Ring Rows", "tier_min": 0},
            {"label": "15 Body Rows", "tier_min": 0},
        ],
    },
    {
        "movement_slug": "parallette_hspu",
        "rx_qty": "1",
        "sub_options": [
            {"label": "1 Deficit HSPU (6/4)", "tier_min": 3},
            {"label": "1 Strict HSPU", "tier_min": 2},
            {"label": "2 HSPU (equipment)", "tier_min": 1},
            {"label": "1 HSPU (cant do parallette)", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "sandbag_clean",
        "rx_qty": "150/100",
        "sub_options": [
            {"label": "Power Clean 185/115 (replaces 150/100 SB)", "tier_min": 2},
            {"label": "Power Clean 115/80 (replaces 100/70 SB)", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "sandbag_squat",
        "rx_qty": "150/100",
        "sub_options": [
            {"label": "Front Squat 185/115 (replaces 150/100 SB)", "tier_min": 2},
            {"label": "Front Squat 115/80 (replaces 100/70 SB)", "tier_min": 1},
        ],
    },
    {
        "movement_slug": "shuttle_run",
        "rx_qty": "10 (50ft each)",
        "sub_options": [
            {"label": "500m Bike Erg", "tier_min": 0},
            {"label": "250m/200m Row or Ski", "tier_min": 0},
            {"label": "15/12 Assault Bike Cal", "tier_min": 0},
            {"label": "10/12 Echo Bike Cal", "tier_min": 0},
        ],
    },
]


# ============================================================================
# Cardio Conversion · run ↔ row ↔ erg ↔ assault ↔ echo
# ============================================================================
# Fuente: Mayhem cardio conversion charts COMPTRAIN_MASTER.md líneas 2346-2528

CARDIO_CONVERSIONS = [
    # 100m base (any → any)
    {"from": "run", "to": "row",         "from_m": 100, "to_m": 125},
    {"from": "run", "to": "bike_erg",    "from_m": 100, "to_m": 200},
    {"from": "run", "to": "ski_erg",     "from_m": 100, "to_m": 100},
    {"from": "run", "to": "assault_cal", "from_m": 100, "to_m": 8},   # cal
    {"from": "run", "to": "echo_cal",    "from_m": 100, "to_m": 6},
    {"from": "row", "to": "run",         "from_m": 125, "to_m": 100},
    {"from": "row", "to": "bike_erg",    "from_m": 125, "to_m": 250},
    # 500m base
    {"from": "run", "to": "row",         "from_m": 500, "to_m": 625},
    {"from": "run", "to": "bike_erg",    "from_m": 500, "to_m": 1000},
    {"from": "row", "to": "assault_cal", "from_m": 500, "to_m": 30},
    # 1km base
    {"from": "run", "to": "row",         "from_m": 1000, "to_m": 1250},
    {"from": "run", "to": "bike_erg",    "from_m": 1000, "to_m": 2000},
    {"from": "run", "to": "ski_erg",     "from_m": 1000, "to_m": 1000},
    {"from": "run", "to": "assault_cal", "from_m": 1000, "to_m": 75},
    {"from": "run", "to": "echo_cal",    "from_m": 1000, "to_m": 60},
]


# ============================================================================
# Service functions
# ============================================================================

@dataclass
class ScaledMovement:
    original_slug: str
    original_rx: str
    needs_scaling: bool
    selected_sub: Optional[dict]
    athlete_tier: int
    reason: str  # 'rx' | 'load' | 'skill' | 'time_domain' | 'equipment'


async def get_athlete_tier(athlete_id: str, movement_slug: str) -> int:
    """Tier del atleta en un movimiento · default 0 si nunca evaluado."""
    pool = await users_repo.get_pool()
    if pool is None:
        return 0
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT tier FROM athlete_skill_tiers
             WHERE athlete_id = $1::uuid AND movement_slug = $2
            """,
            athlete_id, movement_slug,
        )
    return row["tier"] if row else 0


async def scale_for_athlete(
    movement_slug: str,
    athlete_id: str,
    reason: str = "skill",
) -> ScaledMovement:
    """
    Decide si escalar y con qué.

    Lookup en mayhem_scaling_rules · filtra sub_options por athlete_tier >= tier_min.
    Si athlete_tier >= tier_required del movement → returns Rx (no scaling).
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return ScaledMovement(movement_slug, "?", True, None, 0, "no_db")

    async with pool.acquire() as conn:
        rule = await conn.fetchrow(
            """
            SELECT m.tier_required, m.rx_load_male, m.rx_load_female,
                   r.sub_options, r.rx_qty
              FROM volta_movements m
              LEFT JOIN mayhem_scaling_rules r ON r.movement_slug = m.slug
             WHERE m.slug = $1
            """,
            movement_slug,
        )
        if not rule:
            return ScaledMovement(movement_slug, "?", False, None, 0, "unknown_movement")

    athlete_tier = await get_athlete_tier(athlete_id, movement_slug)

    if athlete_tier >= (rule["tier_required"] or 1):
        return ScaledMovement(
            movement_slug, rule["rx_qty"] or "Rx", False, None,
            athlete_tier, "rx_ok",
        )

    # Encontrar primera sub_option que el atleta puede ejecutar
    import json as _json
    subs = rule["sub_options"]
    if isinstance(subs, str):
        subs = _json.loads(subs)
    if not isinstance(subs, list):
        subs = []

    candidate = None
    for s in subs:
        if athlete_tier >= s.get("tier_min", 0):
            candidate = s
            break

    return ScaledMovement(
        original_slug=movement_slug,
        original_rx=rule["rx_qty"] or "Rx",
        needs_scaling=True,
        selected_sub=candidate,
        athlete_tier=athlete_tier,
        reason=reason,
    )


def convert_cardio(from_modality: str, from_qty: float, to_modality: str) -> Optional[float]:
    """Conversión simple usando ratios de la tabla cardio_conversions."""
    for conv in CARDIO_CONVERSIONS:
        if conv["from"] == from_modality and conv["to"] == to_modality:
            return round(from_qty / conv["from_m"] * conv["to_m"], 1)
    return None
