"""
Weekly Analytics · análisis semanal del atleta para el coach.

Endpoint:
    GET /v1/analytics/athlete/{athlete_id}/weekly?weeks=8

Computa 6 métricas por semana sobre athlete_sessions + macrocycle_session_exercises:
    1. tonelaje_kg            · sum(sets * reps * actual_weight) por sesión completa
    2. avg_intensity_pct      · avg(intensity_pct) ponderado por sets·reps
    3. adherence_pct          · completed_sessions / planned_sessions * 100
    4. avg_rpe                · avg(rpe_reported) entre sesiones completadas con RPE
    5. zone_distribution      · count de sesiones por zona (liviano <60, técnico 60-75,
                                 fuerza 75-90, máximo >90) en base a avg intensity_pct
    6. focus_distribution     · count de sesiones por foco (olympic | strength |
                                 accessory | metcon | rest) inferido de session_theme

Trends (sobre la lista entera):
    - up    · last_2_avg > first_2_avg * 1.10
    - down  · last_2_avg < first_2_avg * 0.90
    - flat  · entre medio

Alert (string opcional · solo si hay drop relevante):
    - adherence cayó >25% entre primera y última mitad → alerta priorizada
    - tonelaje cayó >30% → alerta secundaria
    - intensity cayó >15% → alerta secundaria
    - sino: None

Auth:
    - athlete · solo sus propios analytics (athlete_id debe matchear)
    - coach   · requiere coach_owns_athlete(coach, athlete)
    - admin   · bypass
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/analytics", tags=["analytics"])


# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

TREND_UP_THRESHOLD = 1.10        # last_avg > first_avg * 1.10 → up
TREND_DOWN_THRESHOLD = 0.90      # last_avg < first_avg * 0.90 → down
ADHERENCE_ALERT_DROP = 0.25      # drop >25 puntos % → alerta
TONELAJE_ALERT_DROP = 0.30       # drop >30% → alerta
INTENSITY_ALERT_DROP = 0.15      # drop >15% → alerta

DEFAULT_INTENSITY_PCT = 70.0     # default intensity si la sesión no tiene exercises template

Trend = Literal["up", "down", "flat"]
FocusKind = Literal["olympic", "strength", "accessory", "metcon", "rest"]
ZoneKind = Literal["liviano", "tecnico", "fuerza", "maximo"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class WeekAnalytics(BaseModel):
    week_start: str
    tonelaje_kg: float
    avg_intensity_pct: float
    adherence_pct: float
    avg_rpe: float
    zone_distribution: Dict[str, int]
    focus_distribution: Dict[str, int]
    sessions_completed: int
    sessions_planned: int


class TrendsBlock(BaseModel):
    tonelaje_trend: Trend
    intensity_trend: Trend
    adherence_trend: Trend
    rpe_trend: Trend
    alert: Optional[str] = None


class WeeklyAnalyticsResponse(BaseModel):
    athlete_id: str
    weeks_analyzed: int
    weeks: List[WeekAnalytics]
    trends: TrendsBlock
    data_source: Literal["db", "empty"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_focus(theme: Optional[str]) -> FocusKind:
    """
    Clasifica el session_theme en un foco. Heurística simple por keywords
    en español/inglés · si nada matchea → 'accessory'.
    """
    if not theme:
        return "accessory"
    t = theme.lower()
    if any(k in t for k in ("rest", "descanso", "off", "deload")):
        return "rest"
    if any(k in t for k in (
        "snatch", "clean", "jerk", "arrancada", "cargada", "envión", "envion",
        "olympic", "olímpic", "olimpic",
    )):
        return "olympic"
    if any(k in t for k in (
        "squat", "sentadilla", "deadlift", "peso muerto", "press", "fuerza",
        "strength", "back squat", "front squat",
    )):
        return "strength"
    if any(k in t for k in ("metcon", "wod", "conditioning", "cardio", "metabólic", "metabolic")):
        return "metcon"
    return "accessory"


def _classify_zone(intensity_pct: float) -> ZoneKind:
    """Zonas de intensidad sobre el % 1RM promedio de la sesión."""
    if intensity_pct < 60:
        return "liviano"
    if intensity_pct < 75:
        return "tecnico"
    if intensity_pct < 90:
        return "fuerza"
    return "maximo"


def _trend(values: List[float]) -> Trend:
    """
    Tendencia comparando promedio de la primera mitad vs la segunda mitad.
    Si la serie es <2, retorna 'flat'.
    Ignora ceros consecutivos en los bordes (semanas sin datos) para no sesgar.
    """
    series = [v for v in values if v > 0]
    if len(series) < 2:
        return "flat"
    mid = max(1, len(series) // 2)
    first_avg = sum(series[:mid]) / mid
    last_avg = sum(series[mid:]) / (len(series) - mid)
    if first_avg <= 0:
        return "flat"
    ratio = last_avg / first_avg
    if ratio >= TREND_UP_THRESHOLD:
        return "up"
    if ratio <= TREND_DOWN_THRESHOLD:
        return "down"
    return "flat"


def _build_alert(weeks: List[WeekAnalytics]) -> Optional[str]:
    """Genera alerta priorizada · adherence > tonelaje > intensity."""
    if len(weeks) < 4:
        return None
    half = len(weeks) // 2
    first_half = weeks[:half]
    last_half = weeks[half:]

    def _avg(rows: List[WeekAnalytics], attr: str) -> float:
        vals = [getattr(r, attr) for r in rows if getattr(r, attr) > 0]
        return sum(vals) / len(vals) if vals else 0.0

    # Adherence: drop en puntos porcentuales
    adh_first = _avg(first_half, "adherence_pct")
    adh_last = _avg(last_half, "adherence_pct")
    if adh_first > 0 and (adh_first - adh_last) / 100.0 >= ADHERENCE_ALERT_DROP:
        drop = int(round(adh_first - adh_last))
        return f"Adherencia bajó {drop}% en las últimas {len(last_half)} semanas"

    # Tonelaje: drop ratio
    ton_first = _avg(first_half, "tonelaje_kg")
    ton_last = _avg(last_half, "tonelaje_kg")
    if ton_first > 0 and (ton_first - ton_last) / ton_first >= TONELAJE_ALERT_DROP:
        drop = int(round((ton_first - ton_last) / ton_first * 100))
        return f"Tonelaje cayó {drop}% en las últimas {len(last_half)} semanas"

    # Intensity: drop ratio
    int_first = _avg(first_half, "avg_intensity_pct")
    int_last = _avg(last_half, "avg_intensity_pct")
    if int_first > 0 and (int_first - int_last) / int_first >= INTENSITY_ALERT_DROP:
        drop = int(round((int_first - int_last) / int_first * 100))
        return f"Intensidad cayó {drop}% en las últimas {len(last_half)} semanas"

    return None


# ---------------------------------------------------------------------------
# DB fetch
# ---------------------------------------------------------------------------

async def _fetch_sessions(
    pool, athlete_id: UUID, since: date
) -> List[Dict[str, Any]]:
    """
    Lee athlete_sessions + agrega métricas computadas desde
    macrocycle_session_exercises (template). Degradación elegante a [] si falla.
    """
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    s.scheduled_date,
                    s.status,
                    s.rpe_reported,
                    s.completed_at,
                    s.actual_weight,
                    ms.session_theme,
                    -- promedio % 1RM ponderado por sets·reps del template
                    COALESCE((
                      SELECT SUM(e.sets * e.reps * COALESCE(e.intensity_pct, 0))
                             / NULLIF(SUM(e.sets * e.reps), 0)
                      FROM macrocycle_session_exercises e
                      WHERE e.session_id = s.macrocycle_session_id
                    ), 0)::float AS avg_intensity_pct,
                    -- volumen "esperado" en kg si tuvieramos pesos (no lo tenemos
                    -- desde template) · usamos sets*reps total para fallback
                    COALESCE((
                      SELECT SUM(e.sets * e.reps)
                      FROM macrocycle_session_exercises e
                      WHERE e.session_id = s.macrocycle_session_id
                    ), 0)::int AS total_reps_planned
                FROM athlete_sessions s
                LEFT JOIN macrocycle_sessions ms ON ms.id = s.macrocycle_session_id
                WHERE s.athlete_id = $1
                  AND s.scheduled_date >= $2
                ORDER BY s.scheduled_date ASC
                """,
                athlete_id, since,
            )
    except Exception as e:
        print(f"[analytics] _fetch_sessions error (degradación a vacío): {e}")
        return []

    out: List[Dict[str, Any]] = []
    for r in rows:
        completed = (r["status"] == "completed") or (r["completed_at"] is not None)
        actual_weight = r["actual_weight"] or {}
        # tonelaje real = sum(actual_weight.values()) · cada valor representa kg
        # de un ejercicio (el frontend del atleta guarda set·reps·kg agregado por ejercicio)
        tonelaje = 0.0
        if completed and actual_weight:
            try:
                tonelaje = float(sum(float(v) for v in actual_weight.values()))
            except Exception:
                tonelaje = 0.0
        # Si no hay tonelaje pero la sesión está completa, estimamos:
        # total_reps_planned * intensity * 100kg ref · proxy razonable para que
        # se vea algo cuando la DB no traquea pesos por set.
        if completed and tonelaje == 0 and r["total_reps_planned"]:
            est_intensity = float(r["avg_intensity_pct"]) or DEFAULT_INTENSITY_PCT
            tonelaje = float(r["total_reps_planned"]) * (est_intensity / 100.0) * 100.0

        intensity = float(r["avg_intensity_pct"]) if r["avg_intensity_pct"] else 0.0
        if completed and intensity == 0:
            intensity = DEFAULT_INTENSITY_PCT

        out.append({
            "date": r["scheduled_date"],
            "completed": completed,
            "rpe": float(r["rpe_reported"]) if r["rpe_reported"] is not None else None,
            "tonelaje_kg": tonelaje,
            "intensity_pct": intensity,
            "theme": r["session_theme"],
        })
    return out


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def _empty_week(week_start: date) -> WeekAnalytics:
    return WeekAnalytics(
        week_start=week_start.isoformat(),
        tonelaje_kg=0.0,
        avg_intensity_pct=0.0,
        adherence_pct=0.0,
        avg_rpe=0.0,
        zone_distribution={"liviano": 0, "tecnico": 0, "fuerza": 0, "maximo": 0},
        focus_distribution={"olympic": 0, "strength": 0, "accessory": 0, "metcon": 0, "rest": 0},
        sessions_completed=0,
        sessions_planned=0,
    )


def _aggregate_weeks(
    sessions: List[Dict[str, Any]], weeks: int, today: date
) -> List[WeekAnalytics]:
    """
    Agrupa sesiones en N semanas (más vieja → más reciente).
    Bucket 0 = oldest (today - weeks*7), bucket N-1 = current week.
    """
    # week_starts[i] = lunes de la semana correspondiente al bucket i
    week_starts: List[date] = []
    monday_current = today - timedelta(days=today.weekday())
    for i in range(weeks):
        # i=0 → más vieja, i=weeks-1 → current
        week_starts.append(monday_current - timedelta(days=(weeks - 1 - i) * 7))

    buckets: List[List[Dict[str, Any]]] = [[] for _ in range(weeks)]
    for s in sessions:
        sdate: date = s["date"]
        if isinstance(sdate, str):
            try:
                sdate = datetime.strptime(sdate, "%Y-%m-%d").date()
            except ValueError:
                continue
        days_back = (today - sdate).days
        if days_back < 0:
            continue
        wk_index = (weeks - 1) - (days_back // 7)
        if 0 <= wk_index < weeks:
            buckets[wk_index].append(s)

    result: List[WeekAnalytics] = []
    for i, bucket in enumerate(buckets):
        if not bucket:
            result.append(_empty_week(week_starts[i]))
            continue

        completed = [s for s in bucket if s["completed"]]
        planned = len(bucket)
        completed_n = len(completed)

        tonelaje = sum(s["tonelaje_kg"] for s in completed)
        intensities = [s["intensity_pct"] for s in completed if s["intensity_pct"] > 0]
        avg_intensity = sum(intensities) / len(intensities) if intensities else 0.0
        rpes = [s["rpe"] for s in completed if s["rpe"] is not None]
        avg_rpe = sum(rpes) / len(rpes) if rpes else 0.0
        adherence = (completed_n / planned * 100.0) if planned else 0.0

        zones = {"liviano": 0, "tecnico": 0, "fuerza": 0, "maximo": 0}
        focuses = {"olympic": 0, "strength": 0, "accessory": 0, "metcon": 0, "rest": 0}
        for s in completed:
            zones[_classify_zone(s["intensity_pct"])] += 1
            focuses[_classify_focus(s["theme"])] += 1
        # incluye también rest planeados aunque no estén "completados"
        for s in bucket:
            if not s["completed"] and _classify_focus(s["theme"]) == "rest":
                focuses["rest"] += 1

        result.append(WeekAnalytics(
            week_start=week_starts[i].isoformat(),
            tonelaje_kg=round(tonelaje, 1),
            avg_intensity_pct=round(avg_intensity, 1),
            adherence_pct=round(adherence, 1),
            avg_rpe=round(avg_rpe, 2),
            zone_distribution=zones,
            focus_distribution=focuses,
            sessions_completed=completed_n,
            sessions_planned=planned,
        ))

    return result


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/athlete/{athlete_id}/weekly",
    response_model=WeeklyAnalyticsResponse,
)
async def get_weekly_analytics(
    athlete_id: str,
    weeks: int = Query(8, ge=2, le=24, description="Cuántas semanas hacia atrás"),
    user: User = Depends(verify_token),
) -> WeeklyAnalyticsResponse:
    """
    Análisis semanal del atleta · 6 métricas + trends + alerta opcional.

    Auth:
      - athlete · athlete_id debe ser el suyo
      - coach   · coach_owns_athlete(user, athlete_id)
      - admin   · bypass
    """
    # --- Validar UUID ---
    try:
        athlete_uuid = UUID(athlete_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="athlete_id debe ser un UUID válido.",
        )

    # --- Auth ---
    if user.role == "athlete" and str(user.id) != str(athlete_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No podés ver analytics de otros atletas.",
        )
    if user.role == "coach":
        if not await coach_owns_athlete(user.id, athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este atleta no está asignado a tu coaching.",
            )

    # --- Fetch + aggregate ---
    today = date.today()
    since = today - timedelta(days=weeks * 7 + today.weekday())  # incluye semana actual

    pool = await users_repo.get_pool()
    if pool is None:
        # Sin DB · shape vacío con N buckets en cero (entornos dev sin Postgres).
        empty_weeks = _aggregate_weeks([], weeks, today)
        return WeeklyAnalyticsResponse(
            athlete_id=str(athlete_id),
            weeks_analyzed=weeks,
            weeks=empty_weeks,
            trends=TrendsBlock(
                tonelaje_trend="flat",
                intensity_trend="flat",
                adherence_trend="flat",
                rpe_trend="flat",
                alert=None,
            ),
            data_source="empty",
        )

    sessions = await _fetch_sessions(pool, athlete_uuid, since)
    week_rows = _aggregate_weeks(sessions, weeks, today)

    trends = TrendsBlock(
        tonelaje_trend=_trend([w.tonelaje_kg for w in week_rows]),
        intensity_trend=_trend([w.avg_intensity_pct for w in week_rows]),
        adherence_trend=_trend([w.adherence_pct for w in week_rows]),
        rpe_trend=_trend([w.avg_rpe for w in week_rows]),
        alert=_build_alert(week_rows),
    )

    return WeeklyAnalyticsResponse(
        athlete_id=str(athlete_id),
        weeks_analyzed=weeks,
        weeks=week_rows,
        trends=trends,
        data_source="db" if sessions else "empty",
    )
