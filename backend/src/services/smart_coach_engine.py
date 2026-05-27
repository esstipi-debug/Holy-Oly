"""
Engine 14 · Smart Coach orquestador.

Combina señales de múltiples engines y genera alertas convergentes.
Núcleo de "Smart Training Zero Burnout" · detecta convergencia de factores
antes que cualquier engine individual lo flagee.

Reglas implementadas (5 alertas core de la visión):

A. Riesgo Lesión (CRITICAL)
   - Balance ratio FS/BS fuera de [0.85, 1.15]
   - + Stress.fatigue > baseline + 1.5σ
   - + Sleep < 6h × 3 días
   - Acción: bloquear lift pesado · accessory only

B. Sobreentrenamiento (CRITICAL)
   - Stress.CNS rojo 3+ sesiones consecutivas
   - + HRV ↓20% del baseline
   - + RPE promedio semana > 8
   - Acción: deload obligatorio 5-7 días

C. Bajón Hormonal/Recovery (WARNING)
   - Fase lútea (mujer) o testo proxy bajo (hombre)
   - + Lifestyle.stress > 7
   - + Sleep < 7h
   - Acción: -30% volumen · priorizar técnica

D. Estancamiento Técnico (WARNING)
   - PR no mejora 4+ semanas
   - + risk_zone amarillo/naranja > 50% sesiones
   - Acción: revisar macrocycle · cambiar bloque

E. Inputs Insuficientes (INFO crítica)
   - <3 check-ins/semana O sin RPE 5+ sesiones
   - Día 7 escala a coach
"""

from __future__ import annotations

import json as _json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional, List

from ..db import users_repo


@dataclass
class Factor:
    engine: str        # 'stress' · 'balance' · 'lifestyle' · 'hormonal' · 'macrocycle'
    metric: str        # 'fatigue' · 'cns_zone' · 'sleep_hours' · 'ratio_fsbs'
    value: float | str
    threshold: float | str
    note: Optional[str] = None


@dataclass
class AlertCandidate:
    code: str          # 'injury_risk' · 'overtraining' · 'hormonal_dip' · 'plateau' · 'low_inputs'
    severity: str      # 'critical' · 'warning' · 'info'
    title: str
    description: str
    factors: List[Factor]
    suggested_action: dict


# ============================================================================
# Snapshot · agrega métricas del atleta hoy
# ============================================================================

@dataclass
class AthleteSnapshot:
    user_id: str
    fatigue: Optional[float] = None
    fitness: Optional[float] = None
    cns_zone: Optional[str] = None
    cns_consecutive_red: int = 0
    sleep_hours_avg_3d: Optional[float] = None
    sleep_hours_avg_7d: Optional[float] = None
    life_stress_recent: Optional[float] = None
    rpe_avg_7d: Optional[float] = None
    rpe_high_sessions_7d: int = 0
    hormonal_phase: Optional[str] = None
    hormonal_active: bool = False
    inputs_last_7d: int = 0
    sessions_no_rpe_7d: int = 0
    last_pr_date: Optional[date] = None
    macro_active: bool = False
    macro_id: Optional[str] = None


async def build_snapshot(user_id: str) -> AthleteSnapshot:
    """Agrega todas las métricas del atleta · 1 query por engine."""
    snap = AthleteSnapshot(user_id=user_id)
    pool = await users_repo.get_pool()
    if pool is None:
        return snap

    async with pool.acquire() as conn:
        # Stress más reciente
        stress = await conn.fetchrow(
            """
            SELECT fitness, fatiga, semaforo
              FROM cf_stress_diario
             WHERE athlete_id = $1::uuid
             ORDER BY fecha DESC LIMIT 1
            """,
            user_id,
        )
        if stress:
            snap.fatigue = float(stress["fatiga"]) if stress["fatiga"] is not None else None
            snap.fitness = float(stress["fitness"]) if stress["fitness"] is not None else None
            snap.cns_zone = stress["semaforo"]

        # CNS rojo consecutivos
        red_seq = await conn.fetch(
            """
            SELECT semaforo
              FROM cf_stress_diario
             WHERE athlete_id = $1::uuid
             ORDER BY fecha DESC LIMIT 7
            """,
            user_id,
        )
        consec = 0
        for r in red_seq:
            if r["semaforo"] == "rojo":
                consec += 1
            else:
                break
        snap.cns_consecutive_red = consec

        # Wellness recent (sleep + life stress)
        wellness = await conn.fetch(
            """
            SELECT sleep_hours, life_stress
              FROM wellness_checkins
             WHERE user_id = $1::uuid
               AND checkin_date >= CURRENT_DATE - INTERVAL '7 days'
             ORDER BY checkin_date DESC
            """,
            user_id,
        )
        snap.inputs_last_7d = len(wellness)
        sleeps_3d = [float(w["sleep_hours"]) for w in wellness[:3] if w["sleep_hours"]]
        sleeps_7d = [float(w["sleep_hours"]) for w in wellness if w["sleep_hours"]]
        if sleeps_3d:
            snap.sleep_hours_avg_3d = sum(sleeps_3d) / len(sleeps_3d)
        if sleeps_7d:
            snap.sleep_hours_avg_7d = sum(sleeps_7d) / len(sleeps_7d)
        stresses = [float(w["life_stress"]) for w in wellness if w["life_stress"]]
        if stresses:
            snap.life_stress_recent = stresses[0]

        # RPE últimos 7d desde cf_sessions
        rpe_rows = await conn.fetch(
            """
            SELECT rpe
              FROM cf_sessions
             WHERE athlete_id = $1::uuid
               AND fecha >= CURRENT_DATE - INTERVAL '7 days'
               AND completada = TRUE
               AND rpe IS NOT NULL
            """,
            user_id,
        )
        if rpe_rows:
            rpes = [float(r["rpe"]) for r in rpe_rows]
            snap.rpe_avg_7d = sum(rpes) / len(rpes)
            snap.rpe_high_sessions_7d = sum(1 for r in rpes if r > 8)

        # Hormonal
        hormonal = await conn.fetchrow(
            "SELECT cycle_start_date, cycle_length_days FROM cycle_tracking WHERE user_id = $1::uuid",
            user_id,
        )
        if hormonal:
            snap.hormonal_active = True
            log = await conn.fetchrow(
                """
                SELECT phase
                  FROM cycle_log_entries
                 WHERE user_id = $1::uuid
                 ORDER BY log_date DESC LIMIT 1
                """,
                user_id,
            )
            if log:
                snap.hormonal_phase = log["phase"]

        # Macrocycle activo
        macro = await conn.fetchrow(
            "SELECT program_id FROM athlete_macro_assignments WHERE athlete_id = $1::uuid AND is_active = TRUE",
            user_id,
        )
        if macro:
            snap.macro_active = True
            snap.macro_id = macro["program_id"]

        # Last PR
        pr = await conn.fetchrow(
            """
            SELECT MAX(completed_at)::DATE AS d
              FROM wod_results
             WHERE user_id = $1::uuid AND is_pr = TRUE
            """,
            user_id,
        )
        if pr and pr["d"]:
            snap.last_pr_date = pr["d"]

    return snap


# ============================================================================
# Reglas de detección · 5 alertas core
# ============================================================================

def detect_overtraining(s: AthleteSnapshot) -> Optional[AlertCandidate]:
    """Regla B · CRITICAL · CNS rojo 3+ · RPE >8 promedio · fatigue alto."""
    factors: List[Factor] = []

    if s.cns_consecutive_red >= 3:
        factors.append(Factor("stress", "cns_consecutive_red", s.cns_consecutive_red, 3, "CNS en rojo 3+ sesiones consecutivas"))
    if s.rpe_avg_7d is not None and s.rpe_avg_7d > 8:
        factors.append(Factor("stress", "rpe_avg_7d", s.rpe_avg_7d, 8.0, "RPE promedio semanal supera 8"))
    if s.fatigue is not None and s.fatigue > 70:
        factors.append(Factor("stress", "fatigue", s.fatigue, 70, "Fatiga acumulada alta"))

    if len(factors) >= 2:
        return AlertCandidate(
            code="overtraining",
            severity="critical",
            title="Sobreentrenamiento detectado",
            description="Múltiples señales convergen indicando que tu sistema nervioso no está recuperando. Necesitás un deload.",
            factors=factors,
            suggested_action={
                "type": "deload",
                "duration_days": 5,
                "intensity_pct": 0.5,
                "focus": "recovery",
                "message": "Sesiones próximas a 50% intensidad o reemplazadas por movilidad",
            },
        )
    return None


def detect_injury_risk(s: AthleteSnapshot) -> Optional[AlertCandidate]:
    """Regla A · CRITICAL · ratios + fatigue + sleep."""
    factors: List[Factor] = []

    # Sin Balance engine real aún · usamos fatigue + sleep como proxy
    if s.fatigue is not None and s.fatigue > 65:
        factors.append(Factor("stress", "fatigue", s.fatigue, 65, "Fatiga elevada"))
    if s.sleep_hours_avg_3d is not None and s.sleep_hours_avg_3d < 6:
        factors.append(Factor("lifestyle", "sleep_hours_avg_3d", s.sleep_hours_avg_3d, 6.0, "Sueño promedio <6h últimos 3 días"))
    if s.life_stress_recent is not None and s.life_stress_recent > 7:
        factors.append(Factor("lifestyle", "life_stress", s.life_stress_recent, 7.0, "Stress vida alto"))

    if len(factors) >= 3:
        return AlertCandidate(
            code="injury_risk",
            severity="critical",
            title="Riesgo de lesión elevado",
            description="3 factores convergen: fatiga + falta de sueño + stress. Tu cuerpo está en zona vulnerable.",
            factors=factors,
            suggested_action={
                "type": "block_heavy",
                "duration_days": 3,
                "intensity_pct": 0.6,
                "focus": "technique",
                "message": "Sin cargas pesadas · técnica y movilidad por 3 días",
            },
        )
    return None


def detect_hormonal_dip(s: AthleteSnapshot) -> Optional[AlertCandidate]:
    """Regla C · WARNING · fase lútea + stress + poco sueño."""
    if not s.hormonal_active or s.hormonal_phase != "luteal":
        return None

    factors: List[Factor] = [Factor("hormonal", "phase", "luteal", "luteal", "Fase lútea (premenstrual)")]

    if s.life_stress_recent and s.life_stress_recent > 7:
        factors.append(Factor("lifestyle", "life_stress", s.life_stress_recent, 7.0))
    if s.sleep_hours_avg_7d and s.sleep_hours_avg_7d < 7:
        factors.append(Factor("lifestyle", "sleep_hours_avg_7d", s.sleep_hours_avg_7d, 7.0))

    if len(factors) >= 3:
        return AlertCandidate(
            code="hormonal_dip",
            severity="warning",
            title="Recuperación comprometida · fase lútea",
            description="La combinación de fase lútea + stress + poco sueño reduce capacidad recuperación. Bajemos volumen.",
            factors=factors,
            suggested_action={
                "type": "reduce_volume",
                "volume_pct": 0.7,
                "focus": "technique",
                "message": "-30% volumen · priorizar técnica esta semana",
            },
        )
    return None


def detect_plateau(s: AthleteSnapshot) -> Optional[AlertCandidate]:
    """Regla D · WARNING · sin PR 4+ semanas + zona amarilla recurrente."""
    if s.last_pr_date is None:
        return None
    days_since_pr = (date.today() - s.last_pr_date).days
    if days_since_pr < 28:
        return None

    factors = [Factor("performance", "days_since_pr", days_since_pr, 28, f"Sin PR hace {days_since_pr} días")]
    if s.rpe_avg_7d and 6 < s.rpe_avg_7d <= 8:
        factors.append(Factor("stress", "rpe_avg_7d", s.rpe_avg_7d, 7.0, "RPE promedio amarillo/naranja"))

    if len(factors) >= 2:
        return AlertCandidate(
            code="plateau",
            severity="warning",
            title="Estancamiento técnico",
            description=f"Sin PR en {days_since_pr} días con sesiones en zona amarilla recurrente. Es momento de revisar macrociclo.",
            factors=factors,
            suggested_action={
                "type": "review_macro",
                "message": "Hablá con tu coach · considerar cambiar bloque o variante",
            },
        )
    return None


def detect_low_inputs(s: AthleteSnapshot) -> Optional[AlertCandidate]:
    """Regla E · INFO crítica · sin check-ins."""
    if s.inputs_last_7d >= 3:
        return None

    factors = [Factor("inputs", "checkins_last_7d", s.inputs_last_7d, 3, f"Solo {s.inputs_last_7d} check-ins esta semana")]

    severity = "warning" if s.inputs_last_7d == 0 else "info"
    return AlertCandidate(
        code="low_inputs",
        severity=severity,
        title="Necesitamos más datos tuyos",
        description="Sin tus inputs no podemos cuidarte. Cargá tu check-in diario · te toma 15 segundos.",
        factors=factors,
        suggested_action={
            "type": "request_input",
            "message": "Completá el check-in de hoy para que el sistema funcione bien",
        },
    )


# ============================================================================
# Orquestador principal
# ============================================================================

async def evaluate_athlete(user_id: str, persist: bool = True) -> List[AlertCandidate]:
    """
    Corre las 5 reglas sobre el atleta · retorna alertas detectadas.
    Si persist=True · upsert en smart_alerts (no duplica si ya hay activa misma code).
    """
    snap = await build_snapshot(user_id)
    candidates: List[AlertCandidate] = []

    for detector in (detect_overtraining, detect_injury_risk, detect_hormonal_dip, detect_plateau, detect_low_inputs):
        alert = detector(snap)
        if alert is not None:
            candidates.append(alert)

    if not persist or not candidates:
        return candidates

    pool = await users_repo.get_pool()
    if pool is None:
        return candidates

    # Obtener coach_id del atleta
    async with pool.acquire() as conn:
        coach_row = await conn.fetchrow(
            "SELECT coach_id FROM users WHERE id = $1::uuid",
            user_id,
        )
        coach_id = coach_row["coach_id"] if coach_row else None

        for c in candidates:
            # Skip si ya existe alerta activa misma code (no duplicar)
            existing = await conn.fetchrow(
                """
                SELECT id FROM smart_alerts
                 WHERE athlete_id = $1::uuid AND code = $2 AND status = 'active'
                 LIMIT 1
                """,
                user_id, c.code,
            )
            if existing:
                continue

            await conn.execute(
                """
                INSERT INTO smart_alerts
                    (athlete_id, coach_id, code, severity, title, description,
                     factors, suggested_action, status)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 'active')
                """,
                user_id, coach_id, c.code, c.severity, c.title, c.description,
                _json.dumps([f.__dict__ for f in c.factors]),
                _json.dumps(c.suggested_action),
            )

    return candidates


async def evaluate_box(coach_id: str) -> dict:
    """Corre evaluate_athlete sobre todos los atletas del coach. Retorna resumen."""
    pool = await users_repo.get_pool()
    if pool is None:
        return {"athletes_evaluated": 0, "alerts_generated": 0}

    async with pool.acquire() as conn:
        athletes = await conn.fetch(
            "SELECT id FROM users WHERE coach_id = $1::uuid AND is_active = TRUE",
            coach_id,
        )

    total_alerts = 0
    for ath in athletes:
        alerts = await evaluate_athlete(str(ath["id"]), persist=True)
        total_alerts += len(alerts)

    return {
        "athletes_evaluated": len(athletes),
        "alerts_generated": total_alerts,
    }
