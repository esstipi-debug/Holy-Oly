"""
Nutrition Engine Config — Peak Qual Shared
Fuente computacional de NUTRITION_BRAIN.md
"""

SOURCE_DOC = "nutrition/NUTRITION_BRAIN.md"
APPLIES_TO = ["holy_oly", "volta", "axon"]

# Protein targets (g/kg/day)
PROTEIN = {
    "holy_oly":  {"normal": (1.8, 2.0), "deficit": (2.3, 3.1), "peaking": (2.0, 2.2)},
    "volta":     {"normal": (2.0, 2.2), "deficit": (2.3, 3.1), "peaking": (2.0, 2.2)},
    "axon":      {"normal": (2.0, 2.2), "deficit": (2.3, 3.1), "peaking": (2.0, 2.2)},
    "minimum":   1.6,     # below this MPS is compromised
    "post_session_g": (20, 40),       # grams within 2h post-session
    "post_session_window_hours": 2,
}

# Carbohydrate targets (g/kg/day)
CARBS = {
    "holy_oly_session":    (3, 5),
    "volta_session":       (5, 8),
    "axon_session":        (5, 8),
    "rest_active":         (2, 4),
    "rest_total":          (2, 3),
    "pre_session_rule":    1.0,        # g/kg per hour before session
    "glycogen_fast_resynthesis": {     # if next session < 8h
        "g_per_kg_per_hour": (1.0, 1.2),
        "duration_hours": (3, 4),
        "trigger_hours": 8,
    },
}

# Caloric adjustment by macrocycle phase
CALORIC_PHASE = {
    "hypertrophy": {"surplus_kcal": (200, 400), "deficit_allowed": False},
    "strength":    {"surplus_kcal": 0,           "deficit_allowed": False},
    "power":       {"surplus_kcal": 0,           "deficit_allowed": False},
    "peaking":     {"surplus_kcal": (0, 100),    "deficit_allowed": False},
    "taper":       {"surplus_kcal": 0,           "deficit_allowed": False},
}

# Safe deficit in season
SAFE_DEFICIT = {
    "max_kcal_day": 500,
    "min_kcal_day": 300,
    "max_weight_loss_pct_week": 0.005,    # 0.5% of body weight
}

# Hydration
HYDRATION = {
    "base_ml_per_kg": (35, 40),
    "per_hour_training_ml": (500, 1000),
    "dehydration_performance_drop_pct": 2.0,   # body weight % that impairs performance
}

# Electrolytes (per hour of exercise)
ELECTROLYTES = {
    "sodium_mg_per_hour": (300, 600),
    "trigger_duration_min": 60,
    "mandatory_sports": ["volta", "axon"],
    "optional_sports": ["holy_oly"],
}

# Hormonal Engine integration (luteal phase caloric adjustment)
LUTEAL_ADJUSTMENT = {
    "extra_kcal_min": 150,
    "extra_kcal_max": 300,
    "extra_kcal_avg": 200,
    "applies_to_phase": ["luteal_early", "luteal_late"],
}

# Alerts
ALERTS = {
    "high_demand_day": "Día de alta demanda. Apunta a {carbs}g/kg de carbohidratos hoy.",
    "double_session": "Doble sesión en menos de 8h. Carga 1–1.2g/kg de carbos en las próximas {hours}h.",
    "luteal_adjustment": "Fase lútea activa. Tu gasto metabólico basal es mayor. Añade ~200 kcal hoy.",
    "peaking_deficit": "Déficit en semana de peaking detectado. Ajusta ingesta — necesitas glucógeno pleno.",
    "protein_low": "Ingesta proteica estimada por debajo de {min}g/kg. Recuperación comprometida.",
    "dehydration_risk": "Sesión de {duration}h programada. Prepara {ml}ml de hidratación total.",
}
