"""
Engine 13 · Hormonal Periodization · phase logic.

Implementa engines/13_hormonal_engine.md:
- determine_phase(today, cycle_start, length) → phase + day_of_cycle
- phase_recommendation(phase) → load/intensity/volume mods + focus
- next_period_estimate(cycle_start, length, today)

Stateless · puede ser llamado desde session_adaptation_engine.py.
"""
from datetime import date, timedelta
from typing import Literal, Optional, TypedDict

Phase = Literal["menstruation", "follicular", "ovulation", "luteal"]


class PhaseInfo(TypedDict):
    phase: Phase
    day_of_cycle: int
    days_until_next_period: int
    next_period_estimated: str  # ISO date


class PhaseRecommendation(TypedDict):
    phase: Phase
    intensity_adjustment_pct: int   # -10 = recortar 10%
    volume_adjustment_pct: int
    load_multiplier: float          # ej. 0.85 (multiplica cargas)
    xp_multiplier: float
    focus: str
    rest_recommendation: str
    coach_note: str


def determine_phase(
    today: date,
    cycle_start: date,
    cycle_length: int = 28,
) -> PhaseInfo:
    """
    Calcula la fase actual del ciclo dado el último start documentado.

    Si today está después del ciclo proyectado (>length días), proyectamos
    cuántos ciclos pasaron y devolvemos la fase del ciclo actual.
    """
    days_since_start = (today - cycle_start).days
    if days_since_start < 0:
        # Cycle start está en el futuro · fallback a folicular conservador
        return {
            "phase": "follicular",
            "day_of_cycle": 1,
            "days_until_next_period": cycle_length,
            "next_period_estimated": cycle_start.isoformat(),
        }

    day_of_cycle = (days_since_start % cycle_length) + 1
    cycles_passed = days_since_start // cycle_length
    next_period = cycle_start + timedelta(days=(cycles_passed + 1) * cycle_length)
    days_until_next = (next_period - today).days

    # Ranges desde spec (cycle de 28 días estándar · escalable):
    # Días 1-5: menstruación
    # Días 6-14: folicular
    # Días 15-17: ovulación
    # Días 18-28: lútea
    # Adaptamos a otros largos manteniendo proporciones similares.
    if cycle_length == 28:
        if day_of_cycle <= 5:
            phase: Phase = "menstruation"
        elif day_of_cycle <= 14:
            phase = "follicular"
        elif day_of_cycle <= 17:
            phase = "ovulation"
        else:
            phase = "luteal"
    else:
        # Proporción · adapta a ciclos 21-45
        frac = day_of_cycle / cycle_length
        if frac <= 5 / 28:
            phase = "menstruation"
        elif frac <= 14 / 28:
            phase = "follicular"
        elif frac <= 17 / 28:
            phase = "ovulation"
        else:
            phase = "luteal"

    return {
        "phase": phase,
        "day_of_cycle": day_of_cycle,
        "days_until_next_period": days_until_next,
        "next_period_estimated": next_period.isoformat(),
    }


# Tabla derivada del spec engines/13_hormonal_engine.md
_RECOMMENDATIONS: dict[Phase, PhaseRecommendation] = {
    "menstruation": {
        "phase": "menstruation",
        "intensity_adjustment_pct": -10,
        "volume_adjustment_pct": -15,
        "load_multiplier": 0.85,
        "xp_multiplier": 0.9,
        "focus": "recovery_and_technique",
        "rest_recommendation": "1-2 días extra de descanso recomendados",
        "coach_note": "Recovery week activa, no deload total. Entrená más liviano.",
    },
    "follicular": {
        "phase": "follicular",
        "intensity_adjustment_pct": 5,
        "volume_adjustment_pct": 0,
        "load_multiplier": 1.05,
        "xp_multiplier": 1.0,
        "focus": "strength_and_power",
        "rest_recommendation": "Descansos estándar (6 sesiones/sem posible)",
        "coach_note": "Mejor momento para testear máximos o subir cargas.",
    },
    "ovulation": {
        "phase": "ovulation",
        "intensity_adjustment_pct": 10,
        "volume_adjustment_pct": 5,
        "load_multiplier": 1.10,
        "xp_multiplier": 1.1,
        "focus": "peak_performance",
        "rest_recommendation": "Soporta alta frecuencia e intensidad",
        "coach_note": "Ventana para PRs, 1RM, competencia. Planeá las sesiones clave acá.",
    },
    "luteal": {
        "phase": "luteal",
        "intensity_adjustment_pct": -5,
        "volume_adjustment_pct": -10,
        "load_multiplier": 0.90,
        "xp_multiplier": 1.0,
        "focus": "maintenance_and_stability",
        "rest_recommendation": "Al menos 1-2 días de descanso · priorizá sueño",
        "coach_note": "Foco en mantenimiento y técnica. Atención a sueño y nutrición.",
    },
}


def phase_recommendation(phase: Phase) -> PhaseRecommendation:
    """Recomendación de carga/intensidad/volumen según fase."""
    return _RECOMMENDATIONS[phase]


def hormonal_modifier_factor(phase: Optional[Phase]) -> float:
    """
    Factor multiplicativo para aplicar a la carga base de una sesión.
    Devuelve 1.0 si no hay fase (caso atleta sin tracking habilitado).
    """
    if phase is None:
        return 1.0
    return _RECOMMENDATIONS[phase]["load_multiplier"]
