"""
Volta Analyzer · backward look 4 semanas.

Calcula KPIs que alimentan pattern_detector:
- ACWR (acute:chronic workload ratio) últimas 4 sem
- Domain balance (7 CompTrain domains coverage)
- Movement frequency (skills practicados)
- RPE trend (subiendo / bajando / flat)
- PR rate (días desde último PR)
- Sleep + life_stress correlation
- Benchmark drift
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict

from ...db import users_repo


@dataclass
class WeeklyMetrics:
    week_start: date
    total_volume_kg: float
    sessions_completed: int
    sessions_planned: int
    rpe_avg: Optional[float]
    rpe_high_count: int
    domain_coverage: Dict[int, int]  # domain → sessions count
    prs_count: int
    sleep_avg: Optional[float]
    stress_avg: Optional[float]


@dataclass
class AnalysisReport:
    athlete_id: str
    weeks: List[WeeklyMetrics]
    acwr: Optional[float]
    sessions_completed_4w: int
    sessions_planned_4w: int
    adherence_pct: float
    rpe_trend: str  # 'up' | 'down' | 'flat'
    rpe_avg_4w: float
    high_rpe_sessions_pct: float
    domain_gaps: List[int]                # domains sin sesiones en 4 sem
    domain_dominant: Optional[int]
    days_since_last_pr: Optional[int]
    prs_4w: int
    sleep_avg_4w: Optional[float]
    stress_avg_4w: Optional[float]
    pain_zones_active: int
    macros_block: Optional[str]
    athlete_level: Optional[int]


async def calc_weekly_metrics(athlete_id: str, week_start: date) -> WeeklyMetrics:
    """Métricas de una semana específica."""
    pool = await users_repo.get_pool()
    if pool is None:
        return WeeklyMetrics(week_start, 0, 0, 0, None, 0, {}, 0, None, None)

    week_end = week_start + timedelta(days=7)

    async with pool.acquire() as conn:
        # Sessions completed (cf_sessions + wod_results)
        sessions = await conn.fetchrow(
            """
            SELECT
              COUNT(*) FILTER (WHERE completada = TRUE) AS done,
              COUNT(*) FILTER (WHERE planificada = TRUE) AS planned,
              AVG(rpe) FILTER (WHERE completada = TRUE) AS rpe_avg,
              COUNT(*) FILTER (WHERE completada = TRUE AND rpe >= 8) AS rpe_high,
              SUM(impulso) FILTER (WHERE completada = TRUE) AS impulso_total
              FROM cf_sessions
             WHERE athlete_id = $1::uuid
               AND fecha >= $2 AND fecha < $3
            """,
            athlete_id, week_start, week_end,
        )

        # PRs en la semana
        pr_row = await conn.fetchrow(
            """
            SELECT COUNT(*) AS n
              FROM wod_results
             WHERE user_id = $1::uuid
               AND is_pr = TRUE
               AND completed_at >= $2 AND completed_at < $3
            """,
            athlete_id, week_start, week_end,
        )

        # Sleep + stress avg
        lifestyle = await conn.fetchrow(
            """
            SELECT AVG(sleep_hours) AS sleep,
                   AVG(life_stress::FLOAT) AS stress
              FROM lifestyle_checkins
             WHERE user_id = $1::uuid
               AND checkin_date >= $2 AND checkin_date < $3
            """,
            athlete_id, week_start, week_end,
        )

    # Domain coverage · TODO: requiere session_domain table o WOD-domain mapping
    domain_coverage: dict[int, int] = {}

    return WeeklyMetrics(
        week_start=week_start,
        total_volume_kg=float(sessions["impulso_total"] or 0),
        sessions_completed=sessions["done"] or 0,
        sessions_planned=sessions["planned"] or 0,
        rpe_avg=float(sessions["rpe_avg"]) if sessions["rpe_avg"] else None,
        rpe_high_count=sessions["rpe_high"] or 0,
        domain_coverage=domain_coverage,
        prs_count=pr_row["n"] if pr_row else 0,
        sleep_avg=float(lifestyle["sleep"]) if lifestyle and lifestyle["sleep"] else None,
        stress_avg=float(lifestyle["stress"]) if lifestyle and lifestyle["stress"] else None,
    )


async def analyze(athlete_id: str, weeks: int = 4) -> AnalysisReport:
    """Análisis completo · últimas N semanas."""
    today = date.today()
    monday_this_week = today - timedelta(days=today.weekday())

    week_metrics: List[WeeklyMetrics] = []
    for i in range(weeks):
        wstart = monday_this_week - timedelta(weeks=weeks - 1 - i)
        wm = await calc_weekly_metrics(athlete_id, wstart)
        week_metrics.append(wm)

    # ACWR · acute (semana actual) / chronic (avg 4 sem)
    acute = week_metrics[-1].total_volume_kg if week_metrics else 0
    chronic = (sum(w.total_volume_kg for w in week_metrics) / len(week_metrics)) if week_metrics else 0
    acwr = round(acute / chronic, 2) if chronic > 0 else None

    # Aggregations 4w
    total_done = sum(w.sessions_completed for w in week_metrics)
    total_planned = sum(w.sessions_planned for w in week_metrics)
    adherence = round((total_done / total_planned * 100) if total_planned else 0, 1)

    rpe_vals = [w.rpe_avg for w in week_metrics if w.rpe_avg is not None]
    rpe_avg_4w = round(sum(rpe_vals) / len(rpe_vals), 1) if rpe_vals else 0
    rpe_high_total = sum(w.rpe_high_count for w in week_metrics)
    rpe_high_pct = round((rpe_high_total / total_done * 100) if total_done else 0, 1)

    # RPE trend (semana actual vs promedio 3 anteriores)
    if len(rpe_vals) >= 2:
        recent = rpe_vals[-1]
        prev_avg = sum(rpe_vals[:-1]) / len(rpe_vals[:-1])
        diff = recent - prev_avg
        rpe_trend = "up" if diff > 0.5 else "down" if diff < -0.5 else "flat"
    else:
        rpe_trend = "flat"

    # Domain gaps (placeholder · TODO real domain tagging)
    domain_gaps: list[int] = []
    domain_dominant: Optional[int] = None

    # Días desde último PR
    pool = await users_repo.get_pool()
    days_since_pr: Optional[int] = None
    pain_count = 0
    block_type: Optional[str] = None
    level: Optional[int] = None
    if pool is not None:
        async with pool.acquire() as conn:
            pr = await conn.fetchrow(
                """
                SELECT MAX(completed_at)::DATE AS d
                  FROM wod_results
                 WHERE user_id = $1::uuid AND is_pr = TRUE
                """,
                athlete_id,
            )
            if pr and pr["d"]:
                days_since_pr = (today - pr["d"]).days

            pain = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT zone)
                  FROM pain_reports
                 WHERE user_id = $1::uuid
                   AND reported_at >= NOW() - INTERVAL '7 days'
                """,
                athlete_id,
            )
            pain_count = pain or 0

            macro = await conn.fetchrow(
                """
                SELECT t.focus, a.athlete_snapshot
                  FROM athlete_macro_assignments a
                  JOIN macrocycle_templates t ON t.id = a.template_id
                 WHERE a.athlete_id = $1::uuid AND a.is_active = TRUE
                 LIMIT 1
                """,
                athlete_id,
            )
            if macro:
                block_type = macro["focus"]

    sleep_vals = [w.sleep_avg for w in week_metrics if w.sleep_avg]
    stress_vals = [w.stress_avg for w in week_metrics if w.stress_avg]
    sleep_avg_4w = round(sum(sleep_vals) / len(sleep_vals), 1) if sleep_vals else None
    stress_avg_4w = round(sum(stress_vals) / len(stress_vals), 1) if stress_vals else None

    return AnalysisReport(
        athlete_id=athlete_id,
        weeks=week_metrics,
        acwr=acwr,
        sessions_completed_4w=total_done,
        sessions_planned_4w=total_planned,
        adherence_pct=adherence,
        rpe_trend=rpe_trend,
        rpe_avg_4w=rpe_avg_4w,
        high_rpe_sessions_pct=rpe_high_pct,
        domain_gaps=domain_gaps,
        domain_dominant=domain_dominant,
        days_since_last_pr=days_since_pr,
        prs_4w=sum(w.prs_count for w in week_metrics),
        sleep_avg_4w=sleep_avg_4w,
        stress_avg_4w=stress_avg_4w,
        pain_zones_active=pain_count,
        macros_block=block_type,
        athlete_level=level,
    )
