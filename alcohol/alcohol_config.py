"""
Alcohol Engine Config — Peak Qual Shared
Control de Daños: nadie es perfecto.
Fuente computacional de ALCOHOL_BRAIN.md
"""

SOURCE_DOC = "alcohol/ALCOHOL_BRAIN.md"
APPLIES_TO = ["holy_oly", "volta", "axon"]

# Grams of alcohol per standard serving (pure alcohol)
# Formula: volume_ml * abv_pct * 0.789 (density)
ALCOHOL_GRAMS = {
    # Fermented
    "cerveza_regular_330": 13.4,     # 330ml * 5% ABV
    "cerveza_light_330": 11.0,
    "stout_330": 14.1,
    "sidra_330": 11.5,
    "vino_tinto_150": 17.4,          # 150ml * 14% ABV
    "vino_blanco_150": 14.5,
    "champagne_150": 13.1,
    "vino_dulce_150": 13.1,
    "oporto_90": 15.6,               # 90ml * 20% ABV
    # Spirits (45ml shot)
    "destilado_shot": 14.2,          # 45ml * 40% ABV
    "ron_especiado_shot": 14.2,
    "brandy_shot": 14.2,
    # Cocktails
    "caipirinha": 22.0,
    "pisco_sour": 18.0,
    "mojito": 14.2,
    "cuba_libre": 14.2,
    "gin_tonic": 14.2,
    "margarita": 17.0,
    "pina_colada": 17.0,
}

# Carbohydrates per serving (grams)
CARBS_PER_DRINK = {
    "cerveza_regular_330": 12.5,
    "cerveza_light_330": 4.0,
    "stout_330": 17.0,
    "sidra_330": 13.0,
    "vino_tinto_150": 3.8,
    "vino_blanco_150": 2.9,
    "champagne_150": 2.5,
    "vino_dulce_150": 10.0,
    "oporto_90": 20.0,
    "destilado_shot": 0.0,
    "ron_especiado_shot": 0.5,
    "brandy_shot": 1.5,
    "caipirinha": 20.0,
    "pisco_sour": 24.0,
    "mojito": 24.0,
    "cuba_libre": 28.0,
    "cuba_libre_light": 0.5,
    "gin_tonic": 16.0,
    "gin_tonic_diet": 0.0,
    "margarita": 22.0,
    "pina_colada": 37.0,
    "vodka_soda": 0.0,
    "whisky_agua": 0.0,
}

# Glycemic index
GI_PER_DRINK = {
    "destilados_puros": 0,
    "vino_seco": 3,
    "cerveza_light": 40,
    "sidra": 40,
    "cerveza_regular": 68,
    "combinados_mixer_dulce": 80,    # average
}

# Damage threshold
DAMAGE_THRESHOLD = {
    "min_damage_g_per_kg": 0.5,      # < 5% impact on recovery
    "moderate_damage_g_per_kg": 0.9,
    "high_damage_g_per_kg": 1.0,
}

# HRV suppression by dose
HRV_SUPPRESSION = {
    "light": {"drinks": 1, "hrv_pct": -0.05, "rhr_bpm": +5, "duration_hours": 24},
    "moderate": {"drinks": (2, 3), "hrv_pct": -0.15, "rhr_bpm": +10, "duration_hours": 48},
    "heavy": {"drinks": 4, "hrv_pct": -0.25, "rhr_bpm": +15, "duration_hours": 72},
}

# MPS inhibition
MPS_INHIBITION = {
    "low_dose_g_per_kg": 0.5,
    "low_dose_impact": "minimal",    # with adequate protein
    "high_dose_g_per_kg": 1.0,
    "high_dose_suppression_pct": (0.15, 0.30),
    "post_workout_window_hours": 4,  # max interference window
}

# Timing rules (hours before sleep)
TIMING_RULES = {
    "min_hours_before_sleep": 3,
    "ideal_hours_before_sleep": 4,
    "metabolism_rate_per_hour": 1,   # standard drinks/hour
    "high_risk_cutoff_hours": 2,     # < 2h before sleep = high impact
}

# Damage levels and interventions
DAMAGE_LEVELS = {
    "minimal": {
        "conditions": "≤ 0.5g/kg + timing ≥ 3h + low carbs",
        "hydration_ml": 300,
        "sleep_adjustment": False,
        "training_adjustment": None,
        "protein_target_g": None,
    },
    "moderate": {
        "conditions": "0.5–0.9g/kg OR timing < 3h OR high carbs",
        "hydration_ml": 500,
        "sleep_extra_minutes": 30,
        "training_adjustment": "light_or_mobility",
        "protein_target_g": 30,
    },
    "high": {
        "conditions": "> 1.0g/kg OR immediate to sleep OR multiple sweet cocktails",
        "hydration_ml": 750,
        "electrolytes": True,
        "sleep_extra_minutes": 60,
        "training_adjustment": "rest_or_technique",
        "protein_target_g": 35,
        "hrv_monitor_hours": 48,
    },
}

# Low-carb upgrades to suggest
MIXER_UPGRADES = {
    "tónica regular → tónica diet": {"carbs_saved": 16, "alcohol_unchanged": True},
    "Coca-Cola → Coca-Cola Zero": {"carbs_saved": 27, "alcohol_unchanged": True},
    "jugo → agua con gas": {"carbs_saved": 20, "alcohol_unchanged": True},
    "caipirinha → vodka soda": {"carbs_saved": 20, "note": "mismo efecto, menos daño"},
}

# Alerts
ALERTS = {
    "minimal_info": "Consumo bajo umbral. Hidrata {ml}ml antes de dormir. Sin ajustes necesarios.",
    "moderate_warning": "Impacto moderado detectado. HRV esperada -{pct}% mañana. Desayuno proteico ({g}g) y sesión ligera recomendada.",
    "high_critical": "Impacto alto. HRV -{pct}% esperada por {hours}h. Reprograma sesión intensa. Hidrata {ml}ml + electrolitos.",
    "mixer_upgrade": "Tip: cambiar a {upgrade} elimina {carbs}g de carbos manteniendo el mismo trago.",
    "timing_warning": "Consumo < 3h antes de dormir. El impacto en sueño será mayor de lo habitual.",
    "post_workout_warning": "Alcohol post-entrenamiento inmediato interfiere con ventana anabólica. Espera 2h o prioriza proteína primero.",
}

# Interactions
INTERACTIONS = {
    "caffeine_same_day": {
        "compound_cns_impact": True,
        "note": "Cafeína + alcohol mismo día = doble impacto SNC. Caffeine Engine ajusta.",
    },
    "hormonal_luteal": {
        "amplify_fatigue": True,
        "note": "Alcohol en fase lútea amplifica fatiga existente.",
    },
    "sleep_engine": {
        "n3_suppression": True,
        "rem_fragmentation": True,
        "note": "Fragmenta N3 y REM → Sleep Score baja → Risk Score sube.",
    },
}
