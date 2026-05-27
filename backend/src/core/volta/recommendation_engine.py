"""
Recommendation Engine · orquesta analyzer + pattern_detector y persiste recos.

Loop completo:
1. analyze(athlete) → AnalysisReport
2. build SkillTreeSnapshot
3. detect_all → lista priorizada de candidates
4. persist en volta_recommendations (skip dups activas)
5. snapshot semanal en volta_weekly_snapshots
"""

from __future__ import annotations

import json as _json
from datetime import date, timedelta
from typing import List, Optional

from ...db import users_repo
from .analyzer import analyze
from .pattern_detector import detect_all, RecommendationCandidate
from .skill_tree_engine import build_snapshot as build_skill_snapshot


async def evaluate_athlete(athlete_id: str, persist: bool = True) -> List[RecommendationCandidate]:
    """Corre análisis completo + detección + persistencia."""
    # 1. Analyzer
    report = await analyze(athlete_id, weeks=4)

    # 2. SkillTree snapshot
    skill_snap = await build_skill_snapshot(athlete_id)

    # 3. Detection
    candidates = detect_all(report, skill_snapshot=skill_snap)

    if not persist:
        return candidates

    pool = await users_repo.get_pool()
    if pool is None:
        return candidates

    async with pool.acquire() as conn:
        # Coach id del atleta
        coach_row = await conn.fetchrow(
            "SELECT coach_id FROM users WHERE id = $1::uuid",
            athlete_id,
        )
        coach_id = coach_row["coach_id"] if coach_row else None

        # Persist recos (skip si ya activa con misma code)
        for c in candidates:
            existing = await conn.fetchrow(
                """
                SELECT id FROM volta_recommendations
                 WHERE athlete_id = $1::uuid AND code = $2 AND status = 'active'
                 LIMIT 1
                """,
                athlete_id, c.code,
            )
            if existing:
                continue

            await conn.execute(
                """
                INSERT INTO volta_recommendations
                    (athlete_id, coach_id, code, severity, priority,
                     title, description, factors, suggested_action, status,
                     expires_at)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7,
                        $8::jsonb, $9::jsonb, 'active',
                        NOW() + INTERVAL '14 days')
                """,
                athlete_id, coach_id, c.code, c.severity, c.priority,
                c.title, c.description,
                _json.dumps([f.__dict__ for f in c.factors]),
                _json.dumps(c.suggested_action),
            )

        # Snapshot semanal
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        last_week = report.weeks[-1] if report.weeks else None

        if last_week:
            await conn.execute(
                """
                INSERT INTO volta_weekly_snapshots
                    (athlete_id, week_start, acwr, total_volume_kg,
                     sessions_completed, sessions_planned, rpe_avg, rpe_high_count,
                     domain_coverage, domain_missing,
                     skills_practiced, skills_total_mastered, keystones_unlocked,
                     prs_this_week, days_since_last_pr,
                     sleep_avg_hours, life_stress_avg, pain_zones_count,
                     block_type, athlete_level)
                VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8,
                        $9::jsonb, $10::jsonb,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                ON CONFLICT (athlete_id, week_start) DO UPDATE
                  SET acwr = EXCLUDED.acwr,
                      total_volume_kg = EXCLUDED.total_volume_kg,
                      sessions_completed = EXCLUDED.sessions_completed,
                      rpe_avg = EXCLUDED.rpe_avg,
                      skills_practiced = EXCLUDED.skills_practiced,
                      keystones_unlocked = EXCLUDED.keystones_unlocked,
                      prs_this_week = EXCLUDED.prs_this_week,
                      days_since_last_pr = EXCLUDED.days_since_last_pr,
                      sleep_avg_hours = EXCLUDED.sleep_avg_hours,
                      life_stress_avg = EXCLUDED.life_stress_avg,
                      pain_zones_count = EXCLUDED.pain_zones_count
                """,
                athlete_id, monday, report.acwr,
                last_week.total_volume_kg,
                last_week.sessions_completed,
                last_week.sessions_planned,
                last_week.rpe_avg, last_week.rpe_high_count,
                _json.dumps(last_week.domain_coverage),
                _json.dumps(report.domain_gaps),
                skill_snap.skills_total_tracked,
                skill_snap.skills_mastered,
                skill_snap.keystones_unlocked,
                last_week.prs_count,
                report.days_since_last_pr,
                last_week.sleep_avg, last_week.stress_avg,
                report.pain_zones_active,
                report.macros_block, report.athlete_level,
            )

    return candidates


async def evaluate_box(coach_id: str) -> dict:
    """Corre evaluate_athlete sobre todo el roster del coach."""
    pool = await users_repo.get_pool()
    if pool is None:
        return {"athletes_evaluated": 0, "recommendations_generated": 0}

    async with pool.acquire() as conn:
        athletes = await conn.fetch(
            "SELECT id FROM users WHERE coach_id = $1::uuid AND is_active = TRUE AND product = 'volta'",
            coach_id,
        )

    total_recs = 0
    for ath in athletes:
        recs = await evaluate_athlete(str(ath["id"]), persist=True)
        total_recs += len(recs)

    return {
        "athletes_evaluated": len(athletes),
        "recommendations_generated": total_recs,
    }
