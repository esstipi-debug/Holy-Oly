"""
Coach Dashboard KPIs · Sprint A endpoint principal.

Reemplaza mocks del frontend (ROSTER hardcoded, INVENTORY, stats fake) por
agregaciones reales del backend.

Endpoint:
- GET /v1/coach/dashboard-kpis  → triage + alertas + macro health + carga box

KPIs incluidos (los del audit gamification + visión health-centric):
- triage: count atletas por zona (red/amber/green) basado en stress
- alerts_active: lista de alertas convergentes pendientes
- macro_health: % adherence promedio · count atletas con macro activo
- box_load: CTL/ATL promedio del box últimos 7 días
- tier_distribution: cuántos atletas en cada disco
- pr_rate_week: PRs registrados últimos 7 días
- athletes_summary: lista compacta para roster cards
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/coach", tags=["coach-kpis"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TriageCounts(BaseModel):
    red: int
    amber: int
    green: int
    unknown: int


class ActiveAlert(BaseModel):
    athlete_id: str
    athlete_name: str
    severity: str    # 'critical' | 'warning' | 'info'
    code: str        # 'injury_risk' | 'overtraining' | 'low_inputs' | etc
    title: str
    description: str


class MacroHealth(BaseModel):
    athletes_with_active_macro: int
    athletes_total: int
    avg_adherence_pct: float


class BoxLoad(BaseModel):
    avg_fitness: float
    avg_fatigue: float
    avg_form: float
    trend_7d: str    # 'up' | 'down' | 'flat'


class TierDistribution(BaseModel):
    white: int
    green: int
    yellow: int
    blue: int
    red: int


class AthleteSummary(BaseModel):
    athlete_id: str
    name: str
    tier: str          # 'white' | 'green' | 'yellow' | 'blue' | 'red'
    overall: int       # 0-99
    zone: str          # 'red' | 'amber' | 'green' | 'unknown'
    last_active_date: Optional[str] = None
    active_alerts_count: int = 0


class CoachDashboardKPIs(BaseModel):
    triage: TriageCounts
    alerts_active: List[ActiveAlert]
    macro_health: MacroHealth
    box_load: BoxLoad
    tier_distribution: TierDistribution
    athletes_summary: List[AthleteSummary]
    pr_rate_week: int
    generated_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_coach(user: User):
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")


def _belt_idx_to_tier(idx: int) -> str:
    if idx <= 0: return "white"
    if idx <= 2: return "green"
    if idx <= 4: return "yellow"
    if idx <= 6: return "blue"
    return "red"


def _classify_zone(fatigue: Optional[float], cns: Optional[str]) -> str:
    if cns == "red" or (fatigue is not None and fatigue >= 75):
        return "red"
    if cns in ("orange", "yellow") or (fatigue is not None and fatigue >= 55):
        return "amber"
    if fatigue is not None:
        return "green"
    return "unknown"


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/dashboard-kpis", response_model=CoachDashboardKPIs)
async def get_dashboard_kpis(user: User = Depends(verify_token)) -> CoachDashboardKPIs:
    """KPIs agregados del box · usado por VoltaCoachDash + CommandCenter."""
    _require_coach(user)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        # 1. Roster del coach
        athletes = await conn.fetch(
            """
            SELECT id, name, email
              FROM users
             WHERE coach_id = $1::uuid AND is_active = TRUE
             ORDER BY name ASC
            """,
            user.id,
        )

        # 2. Stress reciente de cada atleta
        stress_rows = await conn.fetch(
            """
            SELECT athlete_id, fitness, fatiga AS fatigue, forma AS form, semaforo AS cns_zone,
                   ROW_NUMBER() OVER (PARTITION BY athlete_id ORDER BY fecha DESC) AS rnk
              FROM cf_stress_diario
             WHERE athlete_id = ANY($1::uuid[])
            """,
            [a["id"] for a in athletes],
        )
        stress_by_athlete = {
            str(r["athlete_id"]): r for r in stress_rows if r["rnk"] == 1
        }

        # 3. Belts persistidos
        belts = await conn.fetch(
            """
            SELECT user_id, belt_idx
              FROM athlete_belts
             WHERE user_id = ANY($1::uuid[])
            """,
            [a["id"] for a in athletes],
        )
        belts_by_user = {str(r["user_id"]): r["belt_idx"] for r in belts}

        # 4. Asignaciones macro activas + adherence
        macros = await conn.fetch(
            """
            SELECT a.athlete_id, a.id AS assignment_id,
                   COUNT(*) FILTER (WHERE m.completed = TRUE)::FLOAT
                     / NULLIF(COUNT(*) FILTER (WHERE m.planned = TRUE), 0) AS adherence
              FROM athlete_macro_assignments a
              LEFT JOIN macro_session_adherence m ON m.assignment_id = a.id
             WHERE a.athlete_id = ANY($1::uuid[]) AND a.is_active = TRUE
             GROUP BY a.athlete_id, a.id
            """,
            [a["id"] for a in athletes],
        )
        adherence_by_athlete = {
            str(r["athlete_id"]): float(r["adherence"] or 0) for r in macros
        }

        # 5. PR rate últimos 7 días
        pr_row = await conn.fetchrow(
            """
            SELECT COUNT(*) AS n
              FROM wod_results w
              JOIN users u ON u.id = w.user_id
             WHERE u.coach_id = $1::uuid
               AND w.is_pr = TRUE
               AND w.completed_at >= NOW() - INTERVAL '7 days'
            """,
            user.id,
        )
        pr_rate_week = int(pr_row["n"]) if pr_row else 0

        # 6. Última actividad por atleta
        last_active_rows = await conn.fetch(
            """
            SELECT user_id, MAX(completed_at)::DATE AS last_date
              FROM wod_results
             WHERE user_id = ANY($1::uuid[])
             GROUP BY user_id
            """,
            [a["id"] for a in athletes],
        )
        last_active = {str(r["user_id"]): r["last_date"] for r in last_active_rows}

    # ── Agregaciones ──
    triage = TriageCounts(red=0, amber=0, green=0, unknown=0)
    tier_dist = TierDistribution(white=0, green=0, yellow=0, blue=0, red=0)
    athletes_summary: list[AthleteSummary] = []
    fitness_vals: list[float] = []
    fatigue_vals: list[float] = []
    form_vals: list[float] = []
    alerts: list[ActiveAlert] = []

    for ath in athletes:
        ath_id = str(ath["id"])
        s = stress_by_athlete.get(ath_id)
        fatigue = float(s["fatigue"]) if s and s["fatigue"] is not None else None
        fitness = float(s["fitness"]) if s and s["fitness"] is not None else None
        form = float(s["form"]) if s and s["form"] is not None else None
        cns = s["cns_zone"] if s else None

        zone = _classify_zone(fatigue, cns)
        if zone == "red": triage.red += 1
        elif zone == "amber": triage.amber += 1
        elif zone == "green": triage.green += 1
        else: triage.unknown += 1

        belt_idx = belts_by_user.get(ath_id, 0)
        tier = _belt_idx_to_tier(belt_idx)
        setattr(tier_dist, tier, getattr(tier_dist, tier) + 1)

        if fitness: fitness_vals.append(fitness)
        if fatigue: fatigue_vals.append(fatigue)
        if form: form_vals.append(form)

        # Alertas simplificadas (heurísticas mientras Smart Coach engine se construye)
        athlete_alerts_count = 0
        if zone == "red":
            athlete_alerts_count += 1
            alerts.append(ActiveAlert(
                athlete_id=ath_id, athlete_name=ath["name"],
                severity="critical", code="overtraining",
                title="Sobreentrenamiento detectado",
                description=f"Fatiga {int(fatigue or 0)} · CNS {cns or 'desconocido'}",
            ))
        last_date = last_active.get(ath_id)
        if last_date is None or (date.today() - last_date).days >= 5:
            athlete_alerts_count += 1
            alerts.append(ActiveAlert(
                athlete_id=ath_id, athlete_name=ath["name"],
                severity="warning", code="low_inputs",
                title="Inputs insuficientes",
                description=f"Sin actividad hace {(date.today() - last_date).days if last_date else '∞'} días",
            ))

        # Overall · placeholder simple (TODO: integrar OLY Index + Pulse + etc)
        overall = max(40, min(99, int((fitness or 50) + (10 if zone == "green" else -5))))

        athletes_summary.append(AthleteSummary(
            athlete_id=ath_id,
            name=ath["name"],
            tier=tier,
            overall=overall,
            zone=zone,
            last_active_date=last_date.isoformat() if last_date else None,
            active_alerts_count=athlete_alerts_count,
        ))

    avg_fitness = sum(fitness_vals) / len(fitness_vals) if fitness_vals else 0
    avg_fatigue = sum(fatigue_vals) / len(fatigue_vals) if fatigue_vals else 0
    avg_form = sum(form_vals) / len(form_vals) if form_vals else 0
    trend = "flat"  # TODO: comparar con 7d anteriores

    adh_vals = [v for v in adherence_by_athlete.values() if v > 0]
    avg_adh = (sum(adh_vals) / len(adh_vals) * 100) if adh_vals else 0

    return CoachDashboardKPIs(
        triage=triage,
        alerts_active=alerts[:10],  # Limit top 10
        macro_health=MacroHealth(
            athletes_with_active_macro=len(adherence_by_athlete),
            athletes_total=len(athletes),
            avg_adherence_pct=round(avg_adh, 1),
        ),
        box_load=BoxLoad(
            avg_fitness=round(avg_fitness, 1),
            avg_fatigue=round(avg_fatigue, 1),
            avg_form=round(avg_form, 1),
            trend_7d=trend,
        ),
        tier_distribution=tier_dist,
        athletes_summary=athletes_summary,
        pr_rate_week=pr_rate_week,
        generated_at=datetime.utcnow(),
    )
