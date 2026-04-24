"""
Movement Volume Engine Config — Holy Oly (Weightlifting only)
Fuente computacional de MOVEMENT_VOLUME_BRAIN.md
"""

SOURCE_DOC = "holy_oly/MOVEMENT_VOLUME_BRAIN.md"
APPLIES_TO = ["holy_oly"]

# Annual volume by level (reps >= 60% 1RM, 45 training weeks)
ANNUAL_VOLUME = {
    "beginner":     {"reps_year": (0, 9000),       "reps_week": (0, 200)},
    "intermediate": {"reps_year": (9000, 11000),    "reps_week": (200, 244)},
    "advanced":     {"reps_year": (11000, 13000),   "reps_week": (244, 289)},
    "elite":        {"reps_year": (18000, 22000),   "reps_week": (380, 420)},
}

# Movement distribution (% of total volume)
MOVEMENT_DISTRIBUTION = {
    "roman": {
        "snatch":   0.27,
        "clean_jerk": 0.26,
        "squat":    0.20,
        "pulls":    0.15,
        "press":    0.10,
        "other":    0.02,
    },
    "takano_class2": {
        "snatch":   0.16,
        "clean_jerk": 0.22,
    },
    "takano_class1": {
        "snatch":   0.18,
        "clean_jerk": 0.22,
    },
}

# Weekly reps by movement and level (operative ranges)
WEEKLY_REPS = {
    "intermediate": {
        "snatch":     (30, 40),
        "clean_jerk": (45, 55),
        "squat":      (40, 50),
    },
    "advanced_prep": {       # preparation mesocycle
        "total":      (300, 360),
        "snatch":     (54, 65),
        "clean_jerk": (66, 80),
    },
    "advanced_peak": {       # pre-competition mesocycle
        "total":      (200, 245),
        "snatch":     (36, 44),
        "clean_jerk": (44, 55),
    },
    "elite_hard": {
        "snatch":     (40, 65),
        "clean_jerk": (50, 80),
        "squat":      (50, 80),
    },
}

# Macrocycle phase parameters
PHASE_PARAMETERS = {
    "hypertrophy": {
        "volume": "high",
        "intensity_range": (0.60, 0.75),
        "sessions_per_week": (6, 15),
        "reps_per_set": (4, 6),
        "volume_multiplier": 1.0,
    },
    "strength": {
        "volume": "medium_high",
        "intensity_range": (0.70, 0.85),
        "sessions_per_week": (5, 10),
        "reps_per_set": (3, 5),
        "volume_multiplier": 0.85,
    },
    "power": {
        "volume": "medium",
        "intensity_range": (0.75, 0.90),
        "sessions_per_week": (5, 8),
        "reps_per_set": (2, 4),
        "volume_multiplier": 0.70,
    },
    "peaking": {
        "volume": "low",
        "intensity_range": (0.85, 1.00),
        "sessions_per_week": (5, 8),
        "reps_per_set": (1, 3),
        "volume_multiplier": 0.60,
    },
    "taper": {
        "volume": "very_low",
        "intensity_range": (0.90, 1.00),
        "sessions_per_week": (4, 6),
        "reps_per_set": (1, 2),
        "volume_multiplier": 0.45,
    },
}

# Prilepin table (reps per session by intensity zone)
PRILEPIN = {
    (0.55, 0.65): {"reps_per_set": (3, 6), "total_range": (18, 30), "optimal": 24},
    (0.70, 0.80): {"reps_per_set": (3, 6), "total_range": (12, 24), "optimal": 18},
    (0.80, 0.89): {"reps_per_set": (2, 4), "total_range": (10, 20), "optimal": 15},
    (0.90, 1.00): {"reps_per_set": (1, 2), "total_range": (4, 10),  "optimal": 7},
}

# INOL thresholds (per exercise per week)
INOL = {
    "easy":     (0.0, 2.0),
    "optimal":  (2.0, 3.0),
    "shock":    (3.0, 4.0),
    "danger":   4.0,
}

# K-Value optimal range (Takano)
K_VALUE = {
    "optimal_min": 0.38,
    "optimal_max": 0.42,
}

# ACWR safety zones
ACWR = {
    "safe_min": 0.8,
    "safe_max": 1.3,
    "warning": 1.5,
    "max_weekly_increase_pct": 0.30,
}

# Balance rules
BALANCE_RULES = {
    "classic_min_pct": 0.40,         # Snatch + C&J should be >= 40% of total
    "squat_pulls_max_pct": 0.50,     # Squats + pulls should not exceed 50%
}

# Alerts
ALERTS = {
    "acwr_warning": "ACWR en {value:.2f} — cerca del umbral de riesgo. Monitorea fatiga.",
    "acwr_critical": "ACWR {value:.2f} — sobre umbral. Reducir carga esta semana.",
    "inol_high": "INOL semanal de {movement} en {value:.1f} — zona de choque. No sostener más de 1 semana.",
    "balance_warning": "Clásicos ({pct}% del volumen) por debajo del mínimo recomendado (40%). Riesgo de estancamiento técnico.",
    "volume_spike": "Pico de volumen del {pct}% respecto semana anterior. Máximo recomendado: 30%.",
    "k_value_low": "K-value en {value:.2f} — ciclo demasiado ligero. Revisar intensidades.",
    "k_value_high": "K-value en {value:.2f} — ciclo potencialmente excesivo. Revisar volumen.",
}
