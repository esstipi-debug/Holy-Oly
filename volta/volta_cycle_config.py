"""
Volta Cycle Engine Config — CrossFit Periodización Chile
Fuente computacional de VOLTA_CYCLE_BRAIN.md
"""

SOURCE_DOC = "volta/VOLTA_CYCLE_BRAIN.md"
APPLIES_TO = ["volta"]

from enum import Enum

class VoltaBlock(Enum):
    BASE = "base"
    OPEN_PREP = "open_prep"
    RECOVERY = "recovery"
    STRENGTH = "strength"
    PEAK = "peak"
    OFF_SEASON = "off_season"

class AthleteLevel(Enum):
    SCALED = 1
    RX = 2
    LOCAL_COMPETITOR = 3
    NATIONAL_COMPETITOR = 4

# Annual calendar Chile 2026
CALENDAR_2026 = {
    "open":           {"start": "2026-02-26", "end": "2026-03-16", "type": "peak"},
    "awkan":          {"start": "2026-03-15", "end": "2026-04-15", "type": "competition"},
    "gaman_battle":   {"start": "2026-05-16", "end": "2026-05-16", "type": "competition"},
    "liga_patagonica":{"start": "2026-04-25", "end": "2026-04-25", "type": "competition"},
    "gaman_league":   {"start": "2026-03-26", "end": "2026-07-31", "type": "league"},
    "wodstock_winter":{"start": "2026-07-01", "end": "2026-07-31", "type": "peak"},
}

MIN_WEEKS_BETWEEN_PEAKS = 3

# Block structure
BLOCKS = {
    VoltaBlock.BASE: {
        "months": ["oct", "nov", "dic", "ene"],
        "weeks": 16,
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 4,
            AthleteLevel.LOCAL_COMPETITOR: 5,
            AthleteLevel.NATIONAL_COMPETITOR: 5,
        },
        "metcon_rpe": (6, 7),
        "intensity_strength": (0.65, 0.80),
        "volume": "high",
        "wise_score_driver": ["consistency", "engine_score"],
        "deficit_allowed": False,
        "domains_primary": [1, 2, 6],   # endurance, stamina, gymnastics
    },
    VoltaBlock.OPEN_PREP: {
        "weeks": 4,
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 4,
            AthleteLevel.LOCAL_COMPETITOR: 4,
            AthleteLevel.NATIONAL_COMPETITOR: 4,
        },
        "metcon_rpe": (8, 9),
        "intensity_strength": (0.80, 0.95),
        "volume": "medium_low",
        "wise_score_driver": ["benchmark_percentile"],
        "acwr_target": (0.8, 1.0),
        "no_heavy_singles_days_before": 21,
        "domains_primary": [2, 4, 6],   # stamina, power, gymnastics
    },
    VoltaBlock.RECOVERY: {
        "weeks": (3, 4),
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 3,
            AthleteLevel.LOCAL_COMPETITOR: 4,
            AthleteLevel.NATIONAL_COMPETITOR: 4,
        },
        "metcon_rpe": (5, 6),
        "volume": "low",
        "wise_score_driver": [],
        "domains_primary": [1, 7],      # endurance, mobility
    },
    VoltaBlock.STRENGTH: {
        "weeks": (6, 8),
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 4,
            AthleteLevel.LOCAL_COMPETITOR: 5,
            AthleteLevel.NATIONAL_COMPETITOR: 5,
        },
        "metcon_rpe": (7, 8),
        "intensity_strength": (0.80, 0.90),
        "metcon_time_domain_min": (8, 15),
        "volume": "medium",
        "wise_score_driver": ["strength_index"],
        "domains_primary": [3, 4],      # strength, power
    },
    VoltaBlock.PEAK: {
        "weeks": (3, 4),
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 3,
            AthleteLevel.LOCAL_COMPETITOR: 4,
            AthleteLevel.NATIONAL_COMPETITOR: 4,
        },
        "metcon_rpe": (8, 9),
        "volume": "low",
        "wise_score_driver": ["benchmark_percentile", "strength_index"],
        "acwr_target": (0.8, 1.0),
        "domains_primary": [2, 4, 6],
    },
    VoltaBlock.OFF_SEASON: {
        "weeks": 8,
        "sessions_per_week": {
            AthleteLevel.SCALED: 3,
            AthleteLevel.RX: 3,
            AthleteLevel.LOCAL_COMPETITOR: 3,
            AthleteLevel.NATIONAL_COMPETITOR: 4,
        },
        "metcon_rpe": (5, 6),
        "volume": "low",
        "wise_score_driver": [],
        "domains_primary": [1, 6, 7],
    },
}

# CompTrain domains (7)
DOMAINS = {
    1: {"name": "Cardio Endurance", "time_min": 15, "rpe": (6, 7)},
    2: {"name": "Stamina",          "time_min": (8, 15), "rpe": (7, 8)},
    3: {"name": "Strength",         "reps": (1, 5), "pct_1rm": (0.80, 1.0)},
    4: {"name": "Power",            "time_min": (1, 7), "rpe": (8, 10)},
    5: {"name": "Speed & Agility",  "type": "sprint"},
    6: {"name": "Gymnastics",       "skills": ["muscle_up", "hspu", "pistol", "bar_mu"]},
    7: {"name": "Mobility",         "rpe": (3, 5)},
}

# CompTrain RPE zones
RPE_ZONES = {
    "sweet_spot": (6, 8),     # CompTrain orange zone
    "base": (5, 7),
    "peak": (8, 9),
    "recovery": (3, 5),
}

# Alerts
ALERTS = {
    "peak_overlap": "Solo {days} días entre {e1} y {e2}. Riesgo sobreentrenamiento. Considera priorizar uno.",
    "block_transition": "Transición a bloque {block}. Ajustando volumen e intensidad.",
    "open_window": "Open CrossFit en {days} días. Iniciando Open Prep. Sin tests pesados hasta el evento.",
    "deload_required": "Post-Open obligatorio: 1 semana deload antes de Liga prep.",
    "domain_imbalance": "Dominio {domain} no trabajado en {days} días. Revisar balance semanal.",
}
