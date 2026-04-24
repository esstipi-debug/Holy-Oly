"""
Caffeine Engine Config — Peak Qual Shared
Fuente computacional de CAFFEINE_BRAIN.md
"""

SOURCE_DOC = "caffeine/CAFFEINE_BRAIN.md"
APPLIES_TO = ["holy_oly", "volta", "axon"]

# Bateman pharmacokinetics
BATEMAN_PARAMS = {
    "bioavailability": 0.99,
    "ka": 0.023,       # absorption rate /min (Cmax ~45-60 min)
    "ke": 0.0058,      # elimination rate /min (T½ ~5.5h)
    "vd": 0.6,         # volume of distribution L/kg
}

# CYP1A2 genotype ke multipliers
CYP1A2_MULTIPLIERS = {
    "AA": 1.00,   # fast metabolizer
    "AC": 0.75,   # intermediate
    "CC": 0.55,   # slow metabolizer
}

# Ergogenic use (safe zone)
ERGOGENIC_WINDOW = {
    "max_dose_mg": 200,
    "timing_before_session_min": (30, 60),
    "max_daily_mg_per_kg": 2.0,
    "hrv_baseline_tolerance_pct": 10,
    "max_acwr": 1.3,
}

# Risk thresholds
THRESHOLDS = {
    "c_residual_warning_mg": 100,       # C_residual before sleep
    "tolerance_mg_per_kg_day": 2.5,     # sustained daily intake
    "tolerance_days_trigger": 7,        # days above threshold
    "washout_target_mg_per_kg": 1.0,    # washout protocol target
    "washout_duration_days": 7,         # minimum washout
    "acwr_critical": 1.5,
    "hrv_zscore_critical": -1.5,
}

# Caffeine curfew (hours before sleep)
CURFEW_RULES = {
    "standard_hours": 10,
    "post_red_flag_hours": 12,
}

# OTS automatic deload
OTS_DELOAD = {
    "tonnage_reduction_min_pct": 0.20,
    "tonnage_reduction_max_pct": 0.35,
    "recovery_target_readiness": 60,
    "recovery_consecutive_days": 3,
}

# Alert messages
ALERTS = {
    "info_high_active": "Cafeína activa alta. Tu percepción de esfuerzo puede estar subestimada.",
    "info_late_intake": "Tomaste cafeína después de las 14:00. Sueño REM potencialmente afectado.",
    "warning_hrv_drop": "Tu HRV bajó {pct}% esta mañana — coincide con C_residual de ayer noche.",
    "warning_tolerance": "Llevas {days} días con consumo > 2.5 mg/kg. Considera reducir.",
    "warning_masking": "RPE reportado no coincide con tonelaje real. Posible enmascaramiento activo.",
    "critical_tolerance": "Tolerancia metabólica detectada. Washout recomendado: 7-10 días.",
    "critical_red_flag": "Red Flag OTS: ACWR > 1.5 + HRV colapsada + enmascaramiento. Descarga automática aplicada.",
}

# Visualizations available
VISUALIZATIONS = [
    "bateman_curve_daily",
    "multi_dose_overlay",
    "scatter_rpe_vs_tonnage",
    "heatmap_cresidual_hrv",
    "timeline_acwr_readiness_caffeine",
    "heatmap_weekly_hour_day",
    "tolerance_historical",
    "radar_cns",
]
