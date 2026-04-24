"""
Competition Engine Config — Holy Oly + Axon (Hyrox)
Fuente computacional de COMPETITION_BRAIN.md
"""

SOURCE_DOC = "competition/COMPETITION_BRAIN.md"
APPLIES_TO = ["holy_oly", "axon"]

import math

# Sinclair Coefficients 2021-2024
SINCLAIR = {
    "M": {"A": 0.722762521, "b": 193.609},
    "F": {"A": 0.787004341, "b": 153.757},
    "valid_until": "2024-12",
}

def sinclair_coefficient(body_weight_kg: float, gender: str) -> float:
    params = SINCLAIR[gender]
    if body_weight_kg >= params["b"]:
        return 1.0
    x = math.log10(body_weight_kg / params["b"])
    return 10 ** (params["A"] * x ** 2)

def sinclair_total(total_kg: float, body_weight_kg: float, gender: str) -> float:
    return round(total_kg * sinclair_coefficient(body_weight_kg, gender), 2)

# Taper duration by sport and volume level
TAPER_DURATION = {
    "holy_oly": {
        "total_weeks": (2, 4),
        "aggressive_weeks": 2,
    },
    "axon": {
        "high_volume": {"days": (10, 14)},
        "moderate_volume": {"days": (7, 10)},
    },
}

# Volume reduction by taper week
TAPER_VOLUME_REDUCTION = {
    "week_minus_2": (0.30, 0.40),     # 30-40% reduction
    "week_minus_1": (0.40, 0.70),     # 40-70% reduction
    "intensity": "maintain_or_increase",  # NEVER reduce intensity
}

# Last heavy session timing (days before competition)
LAST_HEAVY_SESSION = {
    "holy_oly": {
        "clean_jerk": (10, 14),
        "back_squat": (10, 14),
        "snatch": (7, 10),
        "semana_final": {"intensity_pct": (0.80, 0.85), "max_singles": 2},
    },
    "axon": {
        "race_simulation": (7, 14),
        "heavy_strength": (5, 7),
        "activation_48h": {"duration_min": 30, "max_rpe": 6},
    },
}

# ACWR targets for competition week
ACWR_COMPETITION = {
    "ideal": (0.8, 1.0),
    "acceptable": (0.7, 1.3),
    "detraining_risk": 0.7,
    "detraining_days_threshold": 7,
    "warning": 1.3,
    "danger": 2.0,
    "danger_injury_multiplier": 3.7,
    "workload_reduction_pct": (0.30, 0.50),    # vs 4-week average
}

# Readiness metrics — Green signals
READINESS_GREEN = {
    "holy_oly": {
        "vbt_drop_max_pct": 0.05,      # <5% drop from baseline = green, >10% = red
        "rpe_post_warmup_max": 6,
        "doms_max": 1,
        "singles_feel": "light",
    },
    "axon": {
        "rhr_stability_bpm": 5,         # ±3-5 bpm from baseline
        "rpe_racepace_max": 6,
        "sleep_quality_min": 7,
        "stress_max": 4,
        "doms_max": 2,
    },
    "shared": {
        "hrv_zone": "within_or_above_3month_range",
        "sleep_score_min_3d": 85,
        "consecutive_green_days": 3,
    },
}

# Hyrox taper structure (days before race)
HYROX_TAPER = {
    "week_minus_2": {
        "running_volume_reduction": 0.30,
        "station_sets_reduction": (0.30, 0.40),
        "intensity": "maintain",
        "sessions": "same_count_shorter_duration",
    },
    "days_7_to_5": {
        "total_volume_pct": (0.50, 0.60),
        "running": "2-3 miles intervals",
        "stations": "EMOM 30s on/30s off",
    },
    "days_4_to_2": {
        "session_duration_min": (20, 30),
        "session_type": "activation",
        "running": "4x400m",
        "stations": "technical, no fatigue",
    },
    "day_minus_1": {
        "session_type": "rest_or_very_light",
        "duration_min": (15, 20),
        "content": "mobility + 2-3 strides",
    },
}

# Activation session if detraining detected
ACTIVATION_SESSION = {
    "trigger_acwr": 0.7,
    "trigger_days": 3,
    "holy_oly": {"singles": (3, 5), "intensity_pct": 0.80, "no_fatigue": True},
    "axon": {"duration_min": 20, "race_pace_efforts": 3, "no_fatigue": True},
}

# Alerts
ALERTS = {
    "acwr_danger": "ACWR {value:.2f} — riesgo de lesión {mult}× mayor. Reducir carga inmediatamente.",
    "acwr_detraining": "ACWR < 0.7 por {days} días. Insertar sesión de activación para mantener fitness.",
    "last_heavy_warning": "Última sesión pesada fue hace {days} días. Asegurar recuperación completa antes de competición.",
    "readiness_green": "Readiness VERDE. HRV en rango, VBT en baseline, RPE bajo. Listo para competir.",
    "readiness_yellow": "Readiness AMARILLO. Monitorear el día de competición. Calentamiento extendido.",
    "readiness_red": "Readiness ROJO. {metric} fuera de rango. Evaluar si competir o ajustar openers.",
    "sinclair_calculated": "Total Sinclair: {total} kg (Total real: {real} kg × SC: {sc:.4f})",
}
