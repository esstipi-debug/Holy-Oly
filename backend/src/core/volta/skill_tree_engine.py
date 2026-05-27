"""
Volta SkillTree Engine · core gamification.

Bilateral:
- INPUT: WOD results + coach evals → actualiza athlete_skill_tiers
- OUTPUT: skill levels → alimenta Mayhem scaling + Belt criteria + session generator

Diferencia vs Holy Oly:
- HO: 4 skills core fijas (Sn/CJ/SQ/Press) · progresión = %1RM
- Volta: ~80 skills variadas · progresión = tier 0-4 + keystones

Keystones (movimientos clave para Belt):
- ring_muscle_up
- bar_muscle_up
- handstand_pushup
- pistol_squat
- handstand_walk
- legless_rope_climb
- pegboard
- snatch_bodyweight  (snatch = bodyweight)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional, List

from ...db import users_repo


KEYSTONES = [
    "ring_muscle_up", "bar_muscle_up", "handstand_pushup",
    "pistol_squat", "handstand_walk", "legless_rope_climb",
    "pegboard", "snatch_bodyweight",
]


@dataclass
class SkillStatus:
    movement_slug: str
    tier: int
    last_practiced: Optional[date]
    practice_count: int
    pr_value: Optional[float]
    is_keystone: bool
    days_since_practice: Optional[int]


@dataclass
class SkillTreeSnapshot:
    athlete_id: str
    skills_total_tracked: int        # cuántos movements tiene registrado
    skills_mastered: int             # tier >= 2 (Rx beginner)
    skills_solid: int                # tier >= 3 (Rx solid)
    skills_unbroken: int             # tier == 4 (Rx+ unbroken)
    keystones_unlocked: int          # keystones con tier >= 2
    keystones: List[str]             # which keystones unlocked
    skills_stale: int                # tier > 0 pero >21 días sin practicar
    skill_gaps: List[str]            # keystones aún tier 0


# ============================================================================
# Update tiers desde events
# ============================================================================

async def upsert_skill_practice(
    athlete_id: str,
    movement_slug: str,
    practice_date: date,
    inc_count: int = 1,
    pr_value: Optional[float] = None,
):
    """Llamado tras cada WOD que incluyó este movimiento."""
    pool = await users_repo.get_pool()
    if pool is None:
        return

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO athlete_skill_tiers
                (athlete_id, movement_slug, last_practiced, practice_count, pr_value, pr_at)
            VALUES ($1::uuid, $2, $3, $4, $5,
                    CASE WHEN $5::DECIMAL IS NOT NULL THEN NOW() ELSE NULL END)
            ON CONFLICT (athlete_id, movement_slug) DO UPDATE
              SET last_practiced = EXCLUDED.last_practiced,
                  practice_count = athlete_skill_tiers.practice_count + EXCLUDED.practice_count,
                  pr_value = CASE
                    WHEN EXCLUDED.pr_value IS NOT NULL
                         AND (athlete_skill_tiers.pr_value IS NULL
                              OR EXCLUDED.pr_value > athlete_skill_tiers.pr_value)
                    THEN EXCLUDED.pr_value
                    ELSE athlete_skill_tiers.pr_value
                  END,
                  pr_at = CASE
                    WHEN EXCLUDED.pr_value IS NOT NULL
                         AND (athlete_skill_tiers.pr_value IS NULL
                              OR EXCLUDED.pr_value > athlete_skill_tiers.pr_value)
                    THEN NOW()
                    ELSE athlete_skill_tiers.pr_at
                  END,
                  updated_at = NOW()
            """,
            athlete_id, movement_slug, practice_date, inc_count, pr_value,
        )


async def coach_eval_skill(
    athlete_id: str,
    movement_slug: str,
    coach_score: int,  # 1-5
    new_tier: Optional[int] = None,
):
    """Coach evalúa skill · puede ajustar tier directamente."""
    pool = await users_repo.get_pool()
    if pool is None:
        return

    async with pool.acquire() as conn:
        if new_tier is not None:
            await conn.execute(
                """
                INSERT INTO athlete_skill_tiers
                    (athlete_id, movement_slug, tier, coach_eval_score, coach_eval_at)
                VALUES ($1::uuid, $2, $3, $4, NOW())
                ON CONFLICT (athlete_id, movement_slug) DO UPDATE
                  SET tier = EXCLUDED.tier,
                      coach_eval_score = EXCLUDED.coach_eval_score,
                      coach_eval_at = NOW(),
                      updated_at = NOW()
                """,
                athlete_id, movement_slug, new_tier, coach_score,
            )
        else:
            await conn.execute(
                """
                UPDATE athlete_skill_tiers
                   SET coach_eval_score = $1, coach_eval_at = NOW()
                 WHERE athlete_id = $2::uuid AND movement_slug = $3
                """,
                coach_score, athlete_id, movement_slug,
            )


# ============================================================================
# Snapshot · lo que consume Belt + Analyzer
# ============================================================================

async def build_snapshot(athlete_id: str) -> SkillTreeSnapshot:
    """Estado completo SkillTree del atleta."""
    pool = await users_repo.get_pool()
    if pool is None:
        return SkillTreeSnapshot(athlete_id, 0, 0, 0, 0, 0, [], 0, KEYSTONES)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT movement_slug, tier, last_practiced, practice_count, pr_value
              FROM athlete_skill_tiers
             WHERE athlete_id = $1::uuid
            """,
            athlete_id,
        )

    today = date.today()
    mastered = solid = unbroken = stale = 0
    keystones_unlocked: list[str] = []
    skill_gaps: list[str] = []
    practiced_slugs: set = set()

    for r in rows:
        practiced_slugs.add(r["movement_slug"])
        tier = r["tier"] or 0
        if tier >= 2: mastered += 1
        if tier >= 3: solid += 1
        if tier >= 4: unbroken += 1
        if r["last_practiced"]:
            days = (today - r["last_practiced"]).days
            if tier > 0 and days > 21:
                stale += 1
        if r["movement_slug"] in KEYSTONES and tier >= 2:
            keystones_unlocked.append(r["movement_slug"])

    # Keystones sin tracking o tier 0 = gaps
    for k in KEYSTONES:
        if k not in practiced_slugs or k not in keystones_unlocked:
            skill_gaps.append(k)

    return SkillTreeSnapshot(
        athlete_id=athlete_id,
        skills_total_tracked=len(rows),
        skills_mastered=mastered,
        skills_solid=solid,
        skills_unbroken=unbroken,
        keystones_unlocked=len(keystones_unlocked),
        keystones=keystones_unlocked,
        skills_stale=stale,
        skill_gaps=skill_gaps,
    )


async def get_all_skills(athlete_id: str) -> List[SkillStatus]:
    """Lista completa skills del atleta · usado por SkillTree UI."""
    pool = await users_repo.get_pool()
    if pool is None:
        return []
    today = date.today()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT movement_slug, tier, last_practiced, practice_count, pr_value
              FROM athlete_skill_tiers
             WHERE athlete_id = $1::uuid
             ORDER BY tier DESC, practice_count DESC
            """,
            athlete_id,
        )
    return [
        SkillStatus(
            movement_slug=r["movement_slug"],
            tier=r["tier"],
            last_practiced=r["last_practiced"],
            practice_count=r["practice_count"] or 0,
            pr_value=float(r["pr_value"]) if r["pr_value"] else None,
            is_keystone=r["movement_slug"] in KEYSTONES,
            days_since_practice=(today - r["last_practiced"]).days if r["last_practiced"] else None,
        )
        for r in rows
    ]


def calc_volta_belt_tier(snapshot: SkillTreeSnapshot, oly_index: float) -> int:
    """
    Belt criteria Volta-specific:
    T0 Blanco · default
    T1 Verde     · 10-24 skills mastered + 1+ practiced 21d
    T2 Amarillo  · 25-49 skills + 1 keystone + OLY 150+
    T3 Azul      · 50-79 skills + 3 keystones + OLY 200+
    T4 Rojo      · 80+ skills + 5 keystones + OLY 250+
    """
    m = snapshot.skills_mastered
    k = snapshot.keystones_unlocked

    if m >= 80 and k >= 5 and oly_index >= 250:
        return 4
    if m >= 50 and k >= 3 and oly_index >= 200:
        return 3
    if m >= 25 and k >= 1 and oly_index >= 150:
        return 2
    if m >= 10:
        return 1
    return 0
