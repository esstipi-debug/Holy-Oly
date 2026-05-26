"""
Banco de templates de WODs para el Volta WOD Recommender Engine.

Cada template describe un esqueleto re-usable: type + movimientos + duración
+ intensidad target. El engine selecciona el template que mejor matchea el
estado del atleta (readiness, cns_zone, historial) y opcionalmente adapta
los movimientos según los skill focuses activos del coach.

Cada movimiento incluye scaling 3-tier (rx / scaled / beginner) tal como
es convención CrossFit · el atleta elige su escala default y la persistimos
en localStorage del lado del frontend.

Type espacio:
- AMRAP            → as many rounds as possible (medio-alto · metcon)
- EMOM             → every minute on the minute (controlado · skills)
- For Time         → completar lo antes posible (variado)
- Strength         → 5x3, 5x5, 3RM, etc.
- Active Recovery  → mobility + zone 2 cardio
"""
from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Helpers de escalado
# ---------------------------------------------------------------------------

def _mv(name: str, rx: str, scaled: str, beginner: str, *, tag: str | None = None) -> dict[str, Any]:
    """Construye un movimiento con scaling 3-tier."""
    return {
        "name": name,
        "scaling": {"rx": rx, "scaled": scaled, "beginner": beginner},
        # tag = movement_id estilo skill_focus (para matchear focuses del coach)
        "tag": tag or name.lower().replace(" ", "_"),
    }


# ---------------------------------------------------------------------------
# Banco · 16 templates
# ---------------------------------------------------------------------------

WOD_TEMPLATES: list[dict[str, Any]] = [
    # ---------- AMRAP · metcon medio ----------
    {
        "id": "amrap_18_classic_triplet",
        "type": "AMRAP",
        "title": "AMRAP 18",
        "duration_sec": 18 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Power Clean", "12 reps @ 60/40kg", "12 reps @ 50/35kg", "12 reps @ 35/25kg",
                tag="power_clean"),
            _mv("Pull-ups", "15 reps", "15 banded", "15 ring rows", tag="pull_up"),
            _mv("Box Jumps", "18 reps @ 24\"/20\"", "18 step-ups @ 20\"/16\"", "18 step-ups @ 12\"",
                tag="box_jump"),
        ],
        "skill_tags": ["power_clean", "pull_up", "box_jump"],
        "good_for_cns_zones": ["green", "yellow"],
    },
    {
        "id": "amrap_20_chipper_light",
        "type": "AMRAP",
        "title": "AMRAP 20",
        "duration_sec": 20 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Wall Balls", "20 reps @ 9/6kg", "20 reps @ 6/4kg", "20 air squats"),
            _mv("Toes to Bar", "15 reps", "15 knee raises", "15 sit-ups", tag="toes_to_bar"),
            _mv("Row", "200m", "200m", "150m"),
        ],
        "skill_tags": ["toes_to_bar", "wall_ball"],
        "good_for_cns_zones": ["green", "yellow"],
    },
    {
        "id": "amrap_15_short_burn",
        "type": "AMRAP",
        "title": "AMRAP 15",
        "duration_sec": 15 * 60,
        "intensity": "high",
        "movements": [
            _mv("Thrusters", "10 reps @ 42/30kg", "10 reps @ 30/20kg", "10 air squats + DB press"),
            _mv("Burpees over bar", "10 reps", "10 burpees + step over", "10 squat thrusts"),
        ],
        "skill_tags": ["thruster", "burpee"],
        "good_for_cns_zones": ["green"],
    },

    # ---------- EMOM · control + skill work ----------
    {
        "id": "emom_20_skill_light",
        "type": "EMOM",
        "title": "EMOM 20",
        "duration_sec": 20 * 60,
        "intensity": "low",
        "movements": [
            _mv("Min 1 · Row", "12 cals", "10 cals", "8 cals"),
            _mv("Min 2 · KB Swings", "15 @ 24/16kg", "15 @ 16/12kg", "15 @ 12/8kg",
                tag="kb_swing"),
            _mv("Min 3 · Push-ups", "12 strict", "12 from knees", "12 hand release incline",
                tag="push_up"),
            _mv("Min 4 · Rest", "—", "—", "—"),
        ],
        "skill_tags": ["kb_swing", "push_up"],
        "good_for_cns_zones": ["yellow", "orange"],
    },
    {
        "id": "emom_12_skill_focus",
        "type": "EMOM",
        "title": "EMOM 12 · Skill",
        "duration_sec": 12 * 60,
        "intensity": "low",
        "movements": [
            _mv("Min impar · Skill drill", "5 unbroken reps de movimiento foco",
                "3 reps con progresión", "Drill de técnica 30s"),
            _mv("Min par · Cardio", "10 cal bike", "8 cal bike", "20s easy"),
        ],
        "skill_tags": [],  # adaptable al focus del coach
        "good_for_cns_zones": ["yellow", "orange"],
    },
    {
        "id": "emom_24_alt_strength",
        "type": "EMOM",
        "title": "EMOM 24 · Alt strength",
        "duration_sec": 24 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Min 1 · Front Squat", "5 reps @ 70%", "5 reps @ 60%", "5 reps @ 50%",
                tag="front_squat"),
            _mv("Min 2 · Strict Pull-ups", "5 reps", "5 banded", "5 ring rows", tag="pull_up"),
            _mv("Min 3 · DB Push Press", "8 reps @ 22.5/15kg", "8 reps @ 15/10kg", "8 reps @ 10/7kg"),
            _mv("Min 4 · Rest", "—", "—", "—"),
        ],
        "skill_tags": ["front_squat", "pull_up"],
        "good_for_cns_zones": ["green", "yellow"],
    },

    # ---------- For Time · metcon corto-medio ----------
    {
        "id": "for_time_21_15_9",
        "type": "For Time",
        "title": "21-15-9",
        "duration_sec": 12 * 60,  # estimación cap
        "intensity": "high",
        "movements": [
            _mv("Thrusters", "@ 42/30kg", "@ 30/20kg", "@ 20/15kg", tag="thruster"),
            _mv("Pull-ups", "kipping", "banded", "ring rows", tag="pull_up"),
        ],
        "skill_tags": ["thruster", "pull_up"],
        "good_for_cns_zones": ["green"],
    },
    {
        "id": "for_time_chipper_descending",
        "type": "For Time",
        "title": "Chipper 50-40-30-20-10",
        "duration_sec": 15 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Double Unders", "reps", "single unders x2", "30s skip practice",
                tag="double_under"),
            _mv("Sit-ups", "reps", "reps", "reps"),
        ],
        "skill_tags": ["double_under"],
        "good_for_cns_zones": ["green", "yellow"],
    },
    {
        "id": "for_time_clean_ladder",
        "type": "For Time",
        "title": "10-9-8...1 Clean & Burpee",
        "duration_sec": 10 * 60,
        "intensity": "high",
        "movements": [
            _mv("Power Clean", "@ 50/35kg", "@ 40/27kg", "@ 27/20kg", tag="power_clean"),
            _mv("Burpees", "reps", "reps", "reps", tag="burpee"),
        ],
        "skill_tags": ["power_clean", "burpee"],
        "good_for_cns_zones": ["green"],
    },
    {
        "id": "for_time_run_row",
        "type": "For Time",
        "title": "Run + Row sprint",
        "duration_sec": 14 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Run", "800m", "600m", "400m"),
            _mv("Row", "1000m", "750m", "500m"),
            _mv("Run", "800m", "600m", "400m"),
        ],
        "skill_tags": [],
        "good_for_cns_zones": ["green", "yellow"],
    },

    # ---------- Strength · fuerza pura ----------
    {
        "id": "strength_back_squat_5x3",
        "type": "Strength",
        "title": "Back Squat · 5x3 @ 80%",
        "duration_sec": 45 * 60,
        "intensity": "high",
        "movements": [
            _mv("Back Squat", "5x3 @ 80% 1RM", "5x3 @ 70% 1RM", "5x5 @ 50% 1RM",
                tag="back_squat"),
            _mv("Accessory · Walking Lunge", "3x20 steps con KB", "3x20 BW", "3x10 BW"),
        ],
        "skill_tags": ["back_squat"],
        "good_for_cns_zones": ["green"],
    },
    {
        "id": "strength_deadlift_5x3",
        "type": "Strength",
        "title": "Deadlift · 5x3 @ 80%",
        "duration_sec": 45 * 60,
        "intensity": "high",
        "movements": [
            _mv("Deadlift", "5x3 @ 80% 1RM", "5x3 @ 70% 1RM", "5x5 @ 50% 1RM",
                tag="deadlift"),
            _mv("Accessory · Hollow hold", "3x40s", "3x30s", "3x20s"),
        ],
        "skill_tags": ["deadlift"],
        "good_for_cns_zones": ["green"],
    },
    {
        "id": "strength_press_complex",
        "type": "Strength",
        "title": "Press · 5x5 + Push Press 3x3",
        "duration_sec": 40 * 60,
        "intensity": "medium",
        "movements": [
            _mv("Strict Press", "5x5 @ 75%", "5x5 @ 65%", "5x5 con DB",
                tag="strict_press"),
            _mv("Push Press", "3x3 @ 85%", "3x3 @ 75%", "3x5 @ 60%", tag="push_press"),
        ],
        "skill_tags": ["strict_press", "push_press"],
        "good_for_cns_zones": ["green", "yellow"],
    },
    {
        "id": "strength_olympic_complex",
        "type": "Strength",
        "title": "Snatch complex · build to heavy",
        "duration_sec": 50 * 60,
        "intensity": "high",
        "movements": [
            _mv("Snatch + OHS", "Build to heavy single", "Build to heavy técnico",
                "Tech drills + barra ligera", tag="snatch"),
            _mv("Accessory · Snatch Pull", "3x3 @ 90% snatch", "3x3 @ 70% snatch",
                "3x5 deadlift agarre ancho"),
        ],
        "skill_tags": ["snatch", "overhead_squat"],
        "good_for_cns_zones": ["green"],
    },

    # ---------- Active recovery ----------
    {
        "id": "recovery_mobility_z2",
        "type": "Active Recovery",
        "title": "Recovery · 30 min",
        "duration_sec": 30 * 60,
        "intensity": "low",
        "movements": [
            _mv("Zone 2 cardio", "20 min row/bike easy", "15 min easy", "10 min walk"),
            _mv("Hip mobility flow", "10 min couch + pigeon + 90/90",
                "10 min couch + pigeon", "5 min básico"),
            _mv("T-spine + shoulders", "thread the needle + cat-cow 5 min",
                "cat-cow 3 min", "cat-cow 2 min"),
        ],
        "skill_tags": [],
        "good_for_cns_zones": ["red", "orange"],
    },
    {
        "id": "recovery_breath_walk",
        "type": "Active Recovery",
        "title": "Recovery · Breath + walk",
        "duration_sec": 25 * 60,
        "intensity": "low",
        "movements": [
            _mv("Caminata zona 1", "20 min outdoor", "15 min outdoor", "10 min outdoor"),
            _mv("Box breathing", "5 min 4-4-4-4", "5 min 4-4-4-4", "5 min 4-4-4-4"),
        ],
        "skill_tags": [],
        "good_for_cns_zones": ["red"],
    },
]


def get_templates_by_type(wod_type: str) -> list[dict[str, Any]]:
    return [t for t in WOD_TEMPLATES if t["type"] == wod_type]


def get_template_by_id(template_id: str) -> dict[str, Any] | None:
    return next((t for t in WOD_TEMPLATES if t["id"] == template_id), None)
