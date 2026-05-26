"""
Macrocycle Deviations · explica al coach (y al atleta) la diferencia entre lo
prescrito por el macrociclo y lo que el atleta realmente ejecutó.

Endpoint:
    GET /v1/macrocycles/{macro_id}/deviations?weeks=4&athlete_id={uuid}

5 tipos de desvío:
    - load_deviation    · session.load_real < 70% del prescrito
    - intensity_low     · rpe_reported < rpe_expected − 2
    - intensity_high    · rpe_reported > rpe_expected + 2 (sobrecarga)
    - skip              · planned session no realizada (completed=false)
    - early_termination · sets_completed < sets_planned × 0.7

Severidad agregada por SEMANA:
    - low    · 1 desvío
    - medium · 2-3 desvíos
    - high   · ≥4 desvíos o cualquier 'skip' (alto impacto en compliance)

Severidad GLOBAL del summary: max severity entre las semanas.

Auth:
    - athlete · solo sus propios desvíos (athlete_id default = current_user.id)
    - coach   · puede pasar athlete_id si coach_owns_athlete(coach, athlete)
    - admin   · bypass
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/macrocycles", tags=["deviations"])


# ---------------------------------------------------------------------------
# Thresholds (single source of truth · pueden moverse a config si hace falta)
# ---------------------------------------------------------------------------

LOAD_RATIO_THRESHOLD = 0.70        # < 70% del volumen prescrito → load_deviation
RPE_DELTA_THRESHOLD = 2.0          # |rpe_reported − rpe_expected| > 2 → intensity_*
SETS_RATIO_THRESHOLD = 0.70        # sets_completed < 70% prescrito → early_termination

DEFAULT_RPE_EXPECTED = 7.0         # si la sesión no trae rpe_expected
DEFAULT_LOAD_PLANNED_FACTOR = 1.0  # si no hay load_planned · usamos load_reported como baseline


DeviationType = Literal[
    "load_deviation",
    "intensity_low",
    "intensity_high",
    "skip",
    "early_termination",
]
Severity = Literal["low", "medium", "high"]


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class DeviationItem(BaseModel):
    type: DeviationType
    session_date: str
    expected: str
    actual: str
    delta: str
    severity: Severity
    explanation: str


class WeekDeviations(BaseModel):
    week: int                 # número de semana relativa (1 = más antigua, N = más reciente)
    week_start: str           # YYYY-MM-DD del lunes
    deviations: List[DeviationItem]


class DeviationsSummary(BaseModel):
    total_deviations: int
    severity: Severity
    by_type: Dict[str, int]


class DeviationsResponse(BaseModel):
    macro_id: str
    athlete_id: str
    weeks_analyzed: int
    summary: DeviationsSummary
    weeks: List[WeekDeviations]
    recommendation: str
    data_source: str          # 'db' | 'empty'


# ---------------------------------------------------------------------------
# Helpers de severidad / recommendation
# ---------------------------------------------------------------------------

def _week_severity(deviations: List[DeviationItem]) -> Severity:
    """
    Severidad por semana:
    - cualquier 'skip' → bump a high si hay ≥2 desvíos totales, sino medium
    - ≥4 desvíos → high
    - 2-3 desvíos → medium
    - 1 desvío → low
    """
    n = len(deviations)
    has_skip = any(d.type == "skip" for d in deviations)
    if n == 0:
        return "low"
    if n >= 4:
        return "high"
    if has_skip and n >= 2:
        return "high"
    if n >= 2:
        return "medium"
    return "low"


def _global_severity(weeks: List[WeekDeviations]) -> Severity:
    """Max severity entre semanas."""
    order = {"low": 0, "medium": 1, "high": 2}
    inv = {0: "low", 1: "medium", 2: "high"}
    max_sev = 0
    for w in weeks:
        for d in w.deviations:
            max_sev = max(max_sev, order[d.severity])
    return inv[max_sev]  # type: ignore[return-value]


def _recommendation(summary: DeviationsSummary) -> str:
    n = summary.total_deviations
    sev = summary.severity
    if n == 0:
        return "Sin desvíos · el atleta está cumpliendo el plan al pie de la letra."
    if sev == "high":
        return "Múltiples desvíos · considerá deload o ajuste de macro"
    if sev == "medium":
        return f"{n} desvíos en las últimas semanas · seguimiento cercano"
    return "Desvío puntual · monitoreá la próxima semana"


def _explain(dtype: DeviationType, delta: str) -> str:
    return {
        "load_deviation": (
            "Cargaste menos volumen del prescrito. Puede ser deload no planificado, "
            "lesión, o fatiga acumulada."
        ),
        "intensity_low": (
            "RPE muy por debajo del esperado · el atleta sintió la sesión más fácil. "
            "Posible deload espontáneo o pesos mal ajustados."
        ),
        "intensity_high": (
            "RPE por encima del esperado · sobrecarga real. Riesgo de fatiga "
            "acumulada · revisar próxima sesión."
        ),
        "skip": (
            "Sesión planificada no realizada. Impacto directo en compliance · "
            "si se repite, ajustar frecuencia o reprogramar."
        ),
        "early_termination": (
            "Sesión completada parcialmente · cortó antes de tiempo. "
            "Causa común: fatiga aguda, lesión, o tiempo insuficiente."
        ),
    }[dtype]


# ---------------------------------------------------------------------------
# Cálculo de desvíos por sesión (5 triggers)
# ---------------------------------------------------------------------------

def _detect_deviations(session: Dict[str, Any]) -> List[DeviationItem]:
    """
    Aplica los 5 triggers sobre una sesión normalizada.

    `session` espera estas keys (todas opcionales · defaults razonables):
        - date              · str YYYY-MM-DD (required)
        - completed         · bool
        - load_planned      · float | None
        - load_real         · float | None
        - rpe_expected      · float | None
        - rpe_reported      · float | None
        - sets_planned      · int | None
        - sets_completed    · int | None
        - exercise_summary  · str   (ej. "5x3 @ 85%")
    """
    out: List[DeviationItem] = []
    sdate: str = session["date"]
    completed: bool = bool(session.get("completed", False))

    # Tag base 'expected' label para los items, fallback al exercise_summary si existe
    expected_label = session.get("exercise_summary") or "Plan prescrito"
    actual_label_completed = session.get("actual_summary") or "Sesión ejecutada"

    # ----- 1. SKIP (planeada y no completada) -----
    if not completed:
        out.append(DeviationItem(
            type="skip",
            session_date=sdate,
            expected=expected_label,
            actual="Sin registrar",
            delta="−100% sesión",
            severity="medium",  # por sesión · el agregado decide
            explanation=_explain("skip", "−100% sesión"),
        ))
        # si saltó la sesión, no aplicamos los otros triggers (no hay datos reales)
        return out

    # ----- 2. LOAD DEVIATION (volumen real <70% planeado) -----
    load_p = session.get("load_planned")
    load_r = session.get("load_real")
    if load_p is not None and load_r is not None and load_p > 0:
        ratio = load_r / load_p
        if ratio < LOAD_RATIO_THRESHOLD:
            delta_pct = int(round((ratio - 1) * 100))
            out.append(DeviationItem(
                type="load_deviation",
                session_date=sdate,
                expected=f"{expected_label} ({load_p:.0f} kg total)",
                actual=f"{actual_label_completed} ({load_r:.0f} kg total)",
                delta=f"{delta_pct}% volumen",
                severity="medium",
                explanation=_explain("load_deviation", f"{delta_pct}%"),
            ))

    # ----- 3 & 4. INTENSITY (RPE delta) -----
    rpe_e = session.get("rpe_expected", DEFAULT_RPE_EXPECTED)
    rpe_r = session.get("rpe_reported")
    if rpe_r is not None and rpe_e is not None:
        diff = rpe_r - rpe_e
        if diff < -RPE_DELTA_THRESHOLD:
            out.append(DeviationItem(
                type="intensity_low",
                session_date=sdate,
                expected=f"RPE {rpe_e:.1f}",
                actual=f"RPE {rpe_r:.1f}",
                delta=f"{diff:+.1f} RPE",
                severity="low",
                explanation=_explain("intensity_low", f"{diff:+.1f}"),
            ))
        elif diff > RPE_DELTA_THRESHOLD:
            out.append(DeviationItem(
                type="intensity_high",
                session_date=sdate,
                expected=f"RPE {rpe_e:.1f}",
                actual=f"RPE {rpe_r:.1f}",
                delta=f"{diff:+.1f} RPE",
                severity="medium",  # sobrecarga es peor que sub-carga
                explanation=_explain("intensity_high", f"{diff:+.1f}"),
            ))

    # ----- 5. EARLY TERMINATION (sets completados <70% planeados) -----
    sets_p = session.get("sets_planned")
    sets_c = session.get("sets_completed")
    if sets_p is not None and sets_c is not None and sets_p > 0:
        ratio = sets_c / sets_p
        if ratio < SETS_RATIO_THRESHOLD:
            delta_pct = int(round((ratio - 1) * 100))
            out.append(DeviationItem(
                type="early_termination",
                session_date=sdate,
                expected=f"{sets_p} sets planeados",
                actual=f"{sets_c} sets completados",
                delta=f"{delta_pct}% sets",
                severity="medium",
                explanation=_explain("early_termination", f"{delta_pct}%"),
            ))

    return out


# ---------------------------------------------------------------------------
# DB queries · fetch sessions desde athlete_sessions (schema.sql:158)
# ---------------------------------------------------------------------------

async def _fetch_sessions(
    pool, athlete_id: UUID, since: date
) -> List[Dict[str, Any]]:
    """
    Lee athlete_sessions del atleta desde `since` y normaliza al shape que
    espera `_detect_deviations`. Si no hay tabla o falla la query, retorna [].

    Nota: athlete_sessions no tiene columns explícitas load_planned/sets_planned ·
    las inferimos de macrocycle_session_exercises via JOIN cuando es posible,
    sino quedan en None y los triggers correspondientes no disparan (degradación
    elegante).
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
                    s.notes,
                    ms.session_theme,
                    -- sumamos sets/reps/intensity esperados desde el template
                    COALESCE((
                      SELECT SUM(e.sets * e.reps * COALESCE(e.intensity_pct, 70) / 100.0)
                      FROM macrocycle_session_exercises e
                      WHERE e.session_id = s.macrocycle_session_id
                    ), 0)::float AS sets_x_reps_intensity,
                    COALESCE((
                      SELECT SUM(e.sets)
                      FROM macrocycle_session_exercises e
                      WHERE e.session_id = s.macrocycle_session_id
                    ), 0)::int AS sets_planned_total,
                    COALESCE((
                      SELECT AVG(e.rpe)
                      FROM macrocycle_session_exercises e
                      WHERE e.session_id = s.macrocycle_session_id
                        AND e.rpe IS NOT NULL
                    ), NULL)::float AS rpe_expected_avg
                FROM athlete_sessions s
                LEFT JOIN macrocycle_sessions ms ON ms.id = s.macrocycle_session_id
                WHERE s.athlete_id = $1
                  AND s.scheduled_date >= $2
                ORDER BY s.scheduled_date ASC
                """,
                athlete_id, since,
            )
    except Exception as e:
        # Tabla puede no existir todavía en algunos environments.
        print(f"[deviations] _fetch_sessions error (degradación a vacío): {e}")
        return []

    normalized: List[Dict[str, Any]] = []
    for r in rows:
        completed = (r["status"] == "completed") or (r["completed_at"] is not None)
        # load_real: no tenemos session_load explícito · usamos sets_x_reps_intensity
        # como proxy si hay actual_weight; sino None.
        actual_weight = r["actual_weight"] or {}
        load_real = None
        if completed and actual_weight:
            try:
                load_real = float(sum(float(v) for v in actual_weight.values()))
            except Exception:
                load_real = None

        load_planned = float(r["sets_x_reps_intensity"]) if r["sets_x_reps_intensity"] else None
        sets_planned = int(r["sets_planned_total"]) if r["sets_planned_total"] else None
        # sets_completed: no tracking explícito · si completed=True asumimos 100%, sino 0
        sets_completed = sets_planned if completed else 0

        rpe_expected = (
            float(r["rpe_expected_avg"]) if r["rpe_expected_avg"] is not None
            else DEFAULT_RPE_EXPECTED
        )
        rpe_reported = float(r["rpe_reported"]) if r["rpe_reported"] is not None else None

        normalized.append({
            "date": r["scheduled_date"].isoformat(),
            "completed": completed,
            "load_planned": load_planned,
            "load_real": load_real,
            "rpe_expected": rpe_expected,
            "rpe_reported": rpe_reported,
            "sets_planned": sets_planned,
            "sets_completed": sets_completed,
            "exercise_summary": r["session_theme"] or "Sesión prescrita",
        })

    return normalized


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/{macro_id}/deviations", response_model=DeviationsResponse)
async def get_macrocycle_deviations(
    macro_id: str,
    weeks: int = Query(4, ge=1, le=12, description="Cuántas semanas hacia atrás analizar"),
    athlete_id: Optional[str] = Query(
        default=None,
        description="UUID del atleta · default current_user (solo atleta). Coach DEBE pasarlo.",
    ),
    user: User = Depends(verify_token),
) -> DeviationsResponse:
    """
    Devuelve los desvíos del atleta respecto al macrociclo `macro_id` en las
    últimas `weeks` semanas.

    Auth:
    - athlete: solo sus desvíos · si pasa athlete_id distinto al suyo → 403
    - coach:   requiere athlete_id + coach_owns_athlete(coach, athlete)
    - admin:   bypass

    El cómputo NO toca `macro_id` para filtrar (todavía no hay athlete_macrocycles
    asignado · ver router.py:265). Se incluye en la respuesta por consistencia
    y para uso futuro cuando exista la tabla.
    """
    # --- Resolver athlete_id efectivo ---
    if athlete_id is None:
        if user.role != "athlete":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Como coach/admin debés pasar athlete_id explícito.",
            )
        athlete_id = user.id
    else:
        # Validar shape UUID antes de ir a DB
        try:
            UUID(athlete_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="athlete_id debe ser un UUID válido.",
            )

        if user.role == "athlete" and str(user.id) != str(athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No podés ver desvíos de otros atletas.",
            )
        if user.role == "coach":
            if not await coach_owns_athlete(user.id, athlete_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Este atleta no está asignado a tu coaching.",
                )

    # --- Fetch sessions ---
    since = date.today() - timedelta(days=weeks * 7)
    pool = await users_repo.get_pool()

    if pool is None:
        # Sin DB · respondemos shape vacío (entornos dev sin Postgres).
        empty_summary = DeviationsSummary(total_deviations=0, severity="low", by_type={})
        return DeviationsResponse(
            macro_id=macro_id,
            athlete_id=str(athlete_id),
            weeks_analyzed=weeks,
            summary=empty_summary,
            weeks=[],
            recommendation=_recommendation(empty_summary),
            data_source="empty",
        )

    sessions = await _fetch_sessions(pool, UUID(athlete_id), since)

    # --- Agrupar por semana ISO (lunes inicio) ---
    # Bucket index = floor(days_since_oldest_monday / 7)
    today = date.today()
    week_buckets: Dict[int, List[DeviationItem]] = {i: [] for i in range(weeks)}
    week_starts: Dict[int, date] = {}

    for i in range(weeks):
        # week 1 (oldest) ... week N (current week)
        wk_index = weeks - 1 - i  # 0 = más vieja, weeks-1 = current
        week_starts[wk_index] = today - timedelta(days=(i * 7) + today.weekday())

    by_type: Dict[str, int] = {}
    for s in sessions:
        try:
            sdate = datetime.strptime(s["date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            continue
        days_back = (today - sdate).days
        if days_back < 0:
            continue
        wk_index = (weeks - 1) - (days_back // 7)
        if wk_index < 0 or wk_index >= weeks:
            continue
        devs = _detect_deviations(s)
        week_buckets[wk_index].extend(devs)
        for d in devs:
            by_type[d.type] = by_type.get(d.type, 0) + 1

    week_list: List[WeekDeviations] = []
    for wk_index in sorted(week_buckets.keys()):
        devs = week_buckets[wk_index]
        # Re-asignar severity a cada deviation según la severidad agregada de la semana
        wk_sev = _week_severity(devs)
        # Bumpeamos severity de cada item al min(item, week_sev) → conserva 'high' si lo tenía
        order = {"low": 0, "medium": 1, "high": 2}
        for d in devs:
            if order[wk_sev] > order[d.severity]:
                d.severity = wk_sev

        wk_start = week_starts.get(wk_index, today).isoformat()
        week_list.append(WeekDeviations(
            week=wk_index + 1,
            week_start=wk_start,
            deviations=devs,
        ))

    total = sum(len(w.deviations) for w in week_list)
    summary = DeviationsSummary(
        total_deviations=total,
        severity=_global_severity(week_list),
        by_type=by_type,
    )

    return DeviationsResponse(
        macro_id=macro_id,
        athlete_id=str(athlete_id),
        weeks_analyzed=weeks,
        summary=summary,
        weeks=week_list,
        recommendation=_recommendation(summary),
        data_source="db" if sessions else "empty",
    )
