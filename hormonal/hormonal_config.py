"""
Hormonal Engine Config — Peak Qual Shared (atletas mujeres)
Fuente computacional de HORMONAL_BRAIN.md
"""

SOURCE_DOC = "hormonal/HORMONAL_BRAIN.md"
APPLIES_TO = ["holy_oly", "volta", "axon"]
APPLIES_TO_GENDER = "F"

from enum import Enum

class CyclePhase(Enum):
    FOLLICULAR_EARLY = "follicular_early"
    FOLLICULAR_LATE = "follicular_late"
    OVULATORY = "ovulatory"
    LUTEAL_EARLY = "luteal_early"
    LUTEAL_LATE = "luteal_late"

# Cycle day ranges (default 28-day cycle)
PHASE_DAYS = {
    CyclePhase.FOLLICULAR_EARLY: (1, 7),
    CyclePhase.FOLLICULAR_LATE: (8, 13),
    CyclePhase.OVULATORY: (14, 16),
    CyclePhase.LUTEAL_EARLY: (17, 21),
    CyclePhase.LUTEAL_LATE: (22, 28),
}

# Intensity adjustment factors
PHASE_FACTORS = {
    CyclePhase.FOLLICULAR_EARLY: (0.95, 1.00),
    CyclePhase.FOLLICULAR_LATE: (1.00, 1.05),   # PR window
    CyclePhase.OVULATORY: (0.95, 1.00),
    CyclePhase.LUTEAL_EARLY: (0.92, 0.97),
    CyclePhase.LUTEAL_LATE: (0.90, 0.95),        # deload window
}

# Ligament risk phases
HIGH_LIGAMENT_RISK_PHASES = [CyclePhase.OVULATORY]
HIGH_RISK_MOVEMENTS = ["Snatch", "Clean & Jerk", "Clean", "Jerk"]

# Interventions
INTERVENTIONS = {
    CyclePhase.FOLLICULAR_LATE: {
        "intensity_bonus_pct": 0.05,
        "duration_days": (3, 5),
        "notes": "PR window enabled if readiness permits",
    },
    CyclePhase.OVULATORY: {
        "max_load_override": True,
        "extended_warmup": True,
        "duration_days": 3,
        "notes": "No max loads on Snatch/C&J. Technique priority.",
    },
    CyclePhase.LUTEAL_LATE: {
        "intensity_reduction_pct": (0.05, 0.10),
        "volume_reduction_pct": 0.20,
        "duration_days": (3, 5),
        "notes": "Deload. Technique and mobility focus.",
    },
}

# Oral contraceptives
ORAL_CONTRACEPTIVES = {
    "factor_override": 1.0,
    "disable_auto_adjustment": True,
    "notes": "Hormonal fluctuations attenuated. Linear load profile.",
}

# Alerts
ALERTS = {
    "info_follicular": "Fase folicular: Tu cuerpo está en modo construcción. ¡A por ello!",
    "warning_ovulatory": "Fase ovulatoria: Asegura un calentamiento extra para tus articulaciones.",
    "critical_luteal_late": "Fase premenstrual: Es normal sentir más fatiga. Ajustamos pesos para mantener la técnica.",
    "coach_info_follicular": "Atleta en fase folicular tardía. Buena ventana para test de intensidad.",
    "coach_warning_ovulatory": "Atleta en fase ovulatoria. Priorizar técnica sobre carga máxima hoy.",
    "coach_critical_luteal": "Atleta en fase lútea tardía. Aplicando descarga automática.",
}

# Stress Engine interaction
STRESS_INTERACTIONS = {
    "luteal_hrv_correction": True,   # Correct HRV false negatives in luteal phase
    "luteal_hrv_baseline_shift": 3,  # bpm adjustment to baseline
}
