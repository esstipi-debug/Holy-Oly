"""
Sleep Quality Engine Config — Peak Qual Shared
Fuente computacional de SLEEP_BRAIN.md
"""

SOURCE_DOC = "sleep/SLEEP_BRAIN.md"
APPLIES_TO = ["holy_oly", "volta", "axon"]

# Sleep Score weights
SCORE_WEIGHTS = {
    "hours": 0.40,
    "deep_rem": 0.30,
    "efficiency": 0.20,
    "latency": 0.10,
}

# Normalization targets (athlete-specific)
NORMALIZATION = {
    "target_hours": 8.5,
    "target_deep_pct": 20.0,
    "target_rem_pct": 22.5,
    "optimal_latency_min": (10, 20),   # minutes
    "latency_score_optimal": 100,
    "latency_score_too_fast": 70,      # < 10 min (possibly exhausted)
}

# Normal ranges
NORMAL_RANGES = {
    "hours": (7.5, 9.5),
    "deep_pct": (15.0, 25.0),
    "rem_pct": (20.0, 25.0),
    "efficiency_pct": 85.0,
    "latency_min": (10, 20),
}

# Zones
ZONES = {
    "optimal": 85,    # > 85
    "warning": 70,    # 70 - 85
    "critical": 0,    # < 70
}

# Interventions
INTERVENTIONS = {
    "warning": {
        "accessory_volume_reduction_pct": 0.10,
    },
    "critical": {
        "one_rm_reduction_pct": 0.125,     # midpoint 10-15%
        "volume_reduction_pct": 0.20,
        "focus": "mobility",
    },
    "recovery_target_score": 80,
    "recovery_window_days": 7,
}

# Chronic analysis window
CHRONIC_WINDOW_DAYS = 7

# Alerts
ALERTS = {
    "info_rem_optimal": "Sueño REM óptimo. Tu cerebro está listo para el trabajo técnico de hoy.",
    "warning_low_deep": "Sueño profundo bajo (<15%). La recuperación muscular es incompleta. Escucha a tu cuerpo.",
    "critical_deficit": "Déficit acumulado grave. Hoy priorizamos la calidad sobre la cantidad. Intensidad reducida.",
    "coach_warning": "Atleta con Sleep Score {score} (7d avg). RPE puede estar elevado hoy.",
    "coach_critical": "Sleep Score < 70 por {days} días consecutivos. Revisar carga del macrociclo.",
}

# Interactions
INTERACTIONS = {
    "caffeine_curfew_advance_hours": 1,    # advance curfew if chronic sleep score low
    "fatigue_multiplier_critical": 1.20,   # multiplies Stress Engine fatigue
    "fatigue_multiplier_warning": 1.10,
}
