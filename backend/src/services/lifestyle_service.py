"""
Engine 12 Lifestyle · service layer.

Inputs holísticos + cálculo de derived metrics:
- Sleep avg 3d/7d
- Cafeína residual (decay exponencial t1/2=5h)
- Recovery debt score (combina sleep + stress + alcohol + smoking)
- Pain risk index (zonas críticas)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional, List

from ..db import users_repo


CAFFEINE_HALF_LIFE_HOURS = 5.0


@dataclass
class LifestyleSnapshot:
    user_id: str
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    life_stress: Optional[int] = None
    energy_level: Optional[int] = None
    caffeine_mg: int = 0
    caffeine_residual_mg: Optional[int] = None
    alcohol_units: int = 0
    smoking_today: bool = False
    cigarettes_count: int = 0
    sleep_avg_3d: Optional[float] = None
    sleep_avg_7d: Optional[float] = None
    stress_avg_7d: Optional[float] = None
    recovery_debt: Optional[float] = None
    pain_zones_active: int = 0
    pain_max_level: int = 0


def caffeine_residual(intake_mg: int, taken_at: datetime, now: Optional[datetime] = None) -> int:
    """Calcula cafeína residual con decay exponencial · t1/2=5h."""
    if intake_mg <= 0 or taken_at is None:
        return 0
    now = now or datetime.utcnow()
    if taken_at.tzinfo is not None:
        taken_at = taken_at.replace(tzinfo=None)
    hours_elapsed = max(0, (now - taken_at).total_seconds() / 3600.0)
    residual = intake_mg * math.pow(0.5, hours_elapsed / CAFFEINE_HALF_LIFE_HOURS)
    return int(round(residual))


def calc_recovery_debt(sleep: Optional[float], stress: Optional[int],
                       alcohol: int, smoking: bool, cigarettes: int) -> float:
    """
    Recovery debt score 0-100 · cuánta deuda de recuperación tiene el atleta.

    Componentes:
    - Sleep deficit: (7.5 - sleep) × 8 (capped 0-40)
    - Life stress: stress × 4 (0-40)
    - Alcohol: 12 si units >= 2 · 6 si 1 · 0 si 0
    - Smoking: cigarettes × 1.5 (capped 15)

    Total cap 100. Mayor = peor recovery.
    """
    debt = 0.0
    if sleep is not None:
        debt += max(0, min(40, (7.5 - sleep) * 8))
    if stress is not None:
        debt += min(40, stress * 4)
    if alcohol >= 2:
        debt += 12
    elif alcohol == 1:
        debt += 6
    if smoking:
        debt += min(15, cigarettes * 1.5)
    return round(min(100, debt), 1)


async def upsert_checkin(
    user_id: str,
    checkin_date: date,
    payload: dict,
) -> dict:
    """Crea o actualiza checkin del día. Idempotente."""
    pool = await users_repo.get_pool()
    if pool is None:
        raise RuntimeError("DB no disponible")

    import json as _json
    caffeine_sources = _json.dumps(payload.get("caffeine_sources", []))

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO lifestyle_checkins
                (user_id, checkin_date, sleep_hours, sleep_quality,
                 life_stress, mood, energy_level, motivation,
                 caffeine_mg, caffeine_last_time, caffeine_sources,
                 alcohol_units, alcohol_type,
                 smoking_today, cigarettes_count,
                 water_liters, meals_today, last_meal_time, notes)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8,
                    $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (user_id, checkin_date) DO UPDATE
              SET sleep_hours = EXCLUDED.sleep_hours,
                  sleep_quality = EXCLUDED.sleep_quality,
                  life_stress = EXCLUDED.life_stress,
                  mood = EXCLUDED.mood,
                  energy_level = EXCLUDED.energy_level,
                  motivation = EXCLUDED.motivation,
                  caffeine_mg = EXCLUDED.caffeine_mg,
                  caffeine_last_time = EXCLUDED.caffeine_last_time,
                  caffeine_sources = EXCLUDED.caffeine_sources,
                  alcohol_units = EXCLUDED.alcohol_units,
                  alcohol_type = EXCLUDED.alcohol_type,
                  smoking_today = EXCLUDED.smoking_today,
                  cigarettes_count = EXCLUDED.cigarettes_count,
                  water_liters = EXCLUDED.water_liters,
                  meals_today = EXCLUDED.meals_today,
                  last_meal_time = EXCLUDED.last_meal_time,
                  notes = EXCLUDED.notes,
                  updated_at = NOW()
            RETURNING *
            """,
            user_id, checkin_date,
            payload.get("sleep_hours"), payload.get("sleep_quality"),
            payload.get("life_stress"), payload.get("mood"),
            payload.get("energy_level"), payload.get("motivation"),
            payload.get("caffeine_mg", 0), payload.get("caffeine_last_time"),
            caffeine_sources,
            payload.get("alcohol_units", 0), payload.get("alcohol_type"),
            payload.get("smoking_today", False), payload.get("cigarettes_count", 0),
            payload.get("water_liters", 0), payload.get("meals_today", 0),
            payload.get("last_meal_time"), payload.get("notes"),
        )

    return dict(row)


async def build_snapshot(user_id: str) -> LifestyleSnapshot:
    """Agrega lifestyle del atleta hoy + derivados."""
    snap = LifestyleSnapshot(user_id=user_id)
    pool = await users_repo.get_pool()
    if pool is None:
        return snap

    async with pool.acquire() as conn:
        today_row = await conn.fetchrow(
            """
            SELECT sleep_hours, sleep_quality, life_stress, energy_level,
                   caffeine_mg, caffeine_last_time,
                   alcohol_units, smoking_today, cigarettes_count
              FROM lifestyle_checkins
             WHERE user_id = $1::uuid
               AND checkin_date = CURRENT_DATE
            """,
            user_id,
        )

        if today_row:
            snap.sleep_hours = float(today_row["sleep_hours"]) if today_row["sleep_hours"] else None
            snap.sleep_quality = today_row["sleep_quality"]
            snap.life_stress = today_row["life_stress"]
            snap.energy_level = today_row["energy_level"]
            snap.caffeine_mg = today_row["caffeine_mg"] or 0
            snap.alcohol_units = today_row["alcohol_units"] or 0
            snap.smoking_today = today_row["smoking_today"]
            snap.cigarettes_count = today_row["cigarettes_count"] or 0

            if snap.caffeine_mg > 0 and today_row["caffeine_last_time"]:
                snap.caffeine_residual_mg = caffeine_residual(
                    snap.caffeine_mg, today_row["caffeine_last_time"],
                )

        # Averages 3d/7d
        avgs = await conn.fetchrow(
            """
            SELECT
              AVG(sleep_hours) FILTER (WHERE checkin_date >= CURRENT_DATE - INTERVAL '3 days') AS sleep_3d,
              AVG(sleep_hours) FILTER (WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days') AS sleep_7d,
              AVG(life_stress::FLOAT) FILTER (WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days') AS stress_7d
              FROM lifestyle_checkins
             WHERE user_id = $1::uuid
            """,
            user_id,
        )
        if avgs:
            snap.sleep_avg_3d = float(avgs["sleep_3d"]) if avgs["sleep_3d"] else None
            snap.sleep_avg_7d = float(avgs["sleep_7d"]) if avgs["sleep_7d"] else None
            snap.stress_avg_7d = float(avgs["stress_7d"]) if avgs["stress_7d"] else None

        # Pain zones actuales
        pain_rows = await conn.fetch(
            """
            SELECT zone, MAX(pain_level) AS max_level
              FROM pain_reports
             WHERE user_id = $1::uuid
               AND reported_at >= NOW() - INTERVAL '3 days'
             GROUP BY zone
            """,
            user_id,
        )
        snap.pain_zones_active = len(pain_rows)
        snap.pain_max_level = max((r["max_level"] for r in pain_rows), default=0)

    snap.recovery_debt = calc_recovery_debt(
        snap.sleep_hours, snap.life_stress,
        snap.alcohol_units, snap.smoking_today, snap.cigarettes_count,
    )

    return snap


async def list_pills_for_context(
    context: str,
    user_id: Optional[str] = None,
    limit: int = 5,
) -> List[dict]:
    """
    Píldoras relevantes para un contexto · pre_wod · check_in · damage_control.
    Filtro simple por category + severity · futuro: regla-engine completo.
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return []

    context_map = {
        "pre_wod":         ["sleep", "caffeine", "nutrition", "stress"],
        "check_in":        ["sleep", "stress", "recovery", "alcohol", "smoking"],
        "damage_control":  ["recovery", "training", "injury_prevention"],
        "hormonal":        ["hormonal", "recovery", "training"],
    }
    categories = context_map.get(context, ["sleep", "recovery"])

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, slug, category, title, short_text, long_text,
                   citation, severity, trigger_rules, related_engines
              FROM knowledge_pills
             WHERE category = ANY($1::text[])
               AND is_active = TRUE
             ORDER BY
               CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
               sort_order ASC
             LIMIT $2
            """,
            categories, limit,
        )

    return [dict(r) for r in rows]
