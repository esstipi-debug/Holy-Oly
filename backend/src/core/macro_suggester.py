"""
Macro Suggester Engine.

Dado el perfil del atleta (baseline, skill level, fitness, último macro),
ranquea los 23 macrociclos del catálogo y devuelve top-N recomendados.

Score per macro (0..1):
  base ............ 0.50  (todo arrancan acá)
  goal_match ...... +0.20 (focus del macro alinea con el goal del atleta)
  level_fit ....... +0.20 (difficulty del macro casa con el nivel del atleta)
  weeks_fit ....... +0.10 (duración acorde al `weeks_training` y fitness)
  diversity ....... +0.10 (no repetir la misma school que el último macro)
  recency_pen ..... -0.15 (si el último macro fue hace <4 semanas, penalizar)
  fitness_pen ..... -0.10 (si fitness <30 y macro es de high difficulty)
  product_filter .. hard filter por product='holy-oly'|'volta' (volta sin catálogo aún → fallback)

`level_index` se calcula sobre ratios a peso corporal:
  snatch/bw, clean+jerk/bw, back_squat/bw
  promedio normalizado → 'beginner' (<0.8) / 'intermediate' (0.8..1.3) / 'advanced' (>1.3)
  Difficulty target:
    beginner    → 1..2
    intermediate→ 2..4
    advanced    → 3..5

Fallback "atleta sin sessions":
  - weeks_training=0  → forzar nivel beginner sin importar 1RM (no hay base aerobica)
  - fitness_score<=0  → fitness=50 (neutro)
  - body_weight<=0    → asumir 75kg (no rompe el ratio)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .macrocycle_engine import MacrocycleEngine, MacrocycleDefinition


# ---------------------------------------------------------------------------
# Tipos públicos
# ---------------------------------------------------------------------------

VALID_GOALS = {
    "general_strength",
    "snatch_focus",
    "clean_jerk_focus",
    "volume_block",
    "pre_competition",
}


@dataclass
class SuggesterInput:
    athlete_id: str
    snatch_kg: float
    clean_jerk_kg: float
    back_squat_kg: float
    body_weight_kg: float
    weeks_training: int  # estimado del histórico de sesiones
    fitness_score: float  # 0-100 desde stress engine
    last_macro_id: Optional[str] = None
    last_macro_completed_weeks_ago: Optional[int] = None
    goal: str = "general_strength"
    product: str = "holy-oly"


@dataclass
class MacroSuggestion:
    macro_id: str
    macro_name: str
    school: str
    focus: str
    duration_weeks: int
    sessions_per_week: int
    difficulty: int
    score: float  # 0..1
    reasoning: str
    estimated_difficulty: str  # 'beginner' | 'intermediate' | 'advanced'
    estimated_weeks: int


# ---------------------------------------------------------------------------
# Mapeo goal → focus apropiado
# ---------------------------------------------------------------------------

GOAL_FOCUS_MAP: dict[str, set[str]] = {
    "general_strength": {"Strength", "Hypertrophy"},
    "snatch_focus": {"Technical", "Power"},
    "clean_jerk_focus": {"Power", "Strength"},
    "volume_block": {"Hypertrophy"},
    "pre_competition": {"Peaking", "Power"},
}

# Schools que tienen carga técnica fuerte por arquetipo
TECHNICAL_SCHOOLS = {"Chinese", "European", "Japanese"}


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


class MacroSuggester:
    """Suggester engine · ranquea macros del catálogo MacrocycleEngine.PROGRAMS."""

    def __init__(self, engine_cls=MacrocycleEngine):
        self._engine_cls = engine_cls

    # ── Helpers de perfil ────────────────────────────────────────────────

    @staticmethod
    def compute_level_index(
        snatch_kg: float,
        clean_jerk_kg: float,
        back_squat_kg: float,
        body_weight_kg: float,
        weeks_training: int,
    ) -> tuple[str, float]:
        """
        Retorna (level_label, raw_ratio) donde raw_ratio es el promedio
        de los 3 ratios al peso corporal.
        Thresholds (basados en standards de halterofilia para adultos):
          <0.80  → beginner
          0.80..1.30 → intermediate
          >1.30  → advanced
        Fallback: weeks_training==0 fuerza beginner (sin base aerobica).
        """
        bw = body_weight_kg if body_weight_kg and body_weight_kg > 0 else 75.0
        # ratios normalizados (snatch tipicamente ~70% de C&J · escalamos)
        snatch_ratio = snatch_kg / bw if snatch_kg > 0 else 0.0
        cj_ratio = (clean_jerk_kg / bw) * 0.85 if clean_jerk_kg > 0 else 0.0  # escala a equivalente snatch
        sq_ratio = (back_squat_kg / bw) * 0.70 if back_squat_kg > 0 else 0.0  # escala a snatch equiv

        non_zero = [r for r in (snatch_ratio, cj_ratio, sq_ratio) if r > 0]
        if not non_zero:
            return "beginner", 0.0
        avg = sum(non_zero) / len(non_zero)

        if weeks_training <= 0:
            # Atleta nuevo en la plataforma: sin tracking previo, conservador.
            return "beginner", avg
        if avg < 0.80:
            return "beginner", avg
        if avg <= 1.30:
            return "intermediate", avg
        return "advanced", avg

    @staticmethod
    def _difficulty_band(level: str) -> tuple[int, int]:
        """Difficulty range (1..5) acorde al nivel."""
        if level == "beginner":
            return (1, 2)
        if level == "intermediate":
            return (2, 4)
        return (3, 5)  # advanced

    # ── Scoring ──────────────────────────────────────────────────────────

    def _score_macro(
        self,
        macro: MacrocycleDefinition,
        inp: SuggesterInput,
        level: str,
        last_school: Optional[str],
    ) -> tuple[float, list[str]]:
        """Retorna (score 0..1, list of reasoning fragments)."""
        score = 0.50
        reasons: list[str] = []

        # ── Hard filter: nivel del atleta vs difficulty del macro ──
        d_min, d_max = self._difficulty_band(level)
        if macro.difficulty_level < d_min - 1 or macro.difficulty_level > d_max + 1:
            # Demasiado fuera de banda · descartar agresivamente
            return 0.0, [f"difficulty {macro.difficulty_level} fuera de banda para {level}"]

        # ── Goal match ──
        target_focuses = GOAL_FOCUS_MAP.get(inp.goal, {"Strength"})
        if macro.focus_type in target_focuses:
            score += 0.20
            reasons.append(f"foco {macro.focus_type} alinea con {inp.goal}")
        # bonus técnico extra si el goal es snatch_focus y la school es técnica
        if inp.goal == "snatch_focus" and macro.school in TECHNICAL_SCHOOLS:
            score += 0.05
            reasons.append(f"school {macro.school} con fuerte componente técnico")

        # ── Level fit (difficulty dentro de la banda óptima) ──
        if d_min <= macro.difficulty_level <= d_max:
            score += 0.20
            reasons.append(f"difficulty {macro.difficulty_level} ideal para {level}")
        else:
            # Edge band (±1): tolerable pero sin bonus
            reasons.append(f"difficulty {macro.difficulty_level} aceptable")

        # ── Weeks fit ──
        # Atletas nuevos: macros largos (>12 wks) son contraproducentes.
        # Avanzados con buen fitness: pueden con largos.
        weeks = macro.duration_weeks
        if inp.weeks_training < 12 and weeks > 12:
            score -= 0.10
            reasons.append(f"{weeks}wk muy largo para atleta con {inp.weeks_training}wk de tracking")
        elif inp.weeks_training >= 24 and 8 <= weeks <= 14:
            score += 0.10
            reasons.append(f"{weeks}wk en rango óptimo de tracking")
        else:
            score += 0.05

        # ── Diversity (no repetir school del último macro) ──
        if last_school and macro.school == last_school:
            score -= 0.10
            reasons.append(f"repite school {last_school} del último macro")
        elif last_school:
            score += 0.10
            reasons.append(f"varía de {last_school} a {macro.school}")

        # ── Recency penalty (no encadenar dos macros sin descanso) ──
        if inp.last_macro_completed_weeks_ago is not None:
            if inp.last_macro_completed_weeks_ago < 1:
                score -= 0.15
                reasons.append("último macro terminó hace <1 semana")
            elif inp.last_macro_completed_weeks_ago < 4:
                score -= 0.05
                reasons.append(f"último macro terminó hace {inp.last_macro_completed_weeks_ago}wk")

        # ── Fitness penalty (low fitness + high difficulty) ──
        fit = inp.fitness_score if inp.fitness_score > 0 else 50.0
        if fit < 30 and macro.difficulty_level >= 4:
            score -= 0.10
            reasons.append(f"fitness bajo ({fit:.0f}) para difficulty {macro.difficulty_level}")

        # Clamp 0..1
        score = max(0.0, min(1.0, score))
        return score, reasons

    # ── API pública ──────────────────────────────────────────────────────

    def suggest(self, inp: SuggesterInput, top_n: int = 3) -> list[MacroSuggestion]:
        """Retorna top-N macros ranqueados desc por score."""
        if inp.goal not in VALID_GOALS:
            inp.goal = "general_strength"

        # Product 'volta' por ahora no tiene catálogo backend de macros.
        # Devolvemos vacío · el frontend hace fallback al listado local.
        if inp.product != "holy-oly":
            return []

        level, _avg_ratio = self.compute_level_index(
            inp.snatch_kg, inp.clean_jerk_kg, inp.back_squat_kg,
            inp.body_weight_kg, inp.weeks_training,
        )

        last_macro = (
            self._engine_cls.get_program(inp.last_macro_id)
            if inp.last_macro_id else None
        )
        last_school = last_macro.school if last_macro else None

        scored: list[tuple[float, MacrocycleDefinition, list[str]]] = []
        for macro in self._engine_cls.PROGRAMS.values():
            score, reasons = self._score_macro(macro, inp, level, last_school)
            if score <= 0:
                continue
            scored.append((score, macro, reasons))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_n]

        return [
            MacroSuggestion(
                macro_id=macro.id,
                macro_name=macro.name,
                school=macro.school,
                focus=macro.focus_type,
                duration_weeks=macro.duration_weeks,
                sessions_per_week=macro.sessions_per_week,
                difficulty=macro.difficulty_level,
                score=round(score, 2),
                reasoning=" · ".join(reasons[:3]) if reasons else "match general",
                estimated_difficulty=level,
                estimated_weeks=macro.duration_weeks,
            )
            for score, macro, reasons in top
        ]

    def build_rationale(self, inp: SuggesterInput) -> str:
        """Frase humana resumiendo el perfil que motivó las sugerencias."""
        level, ratio = self.compute_level_index(
            inp.snatch_kg, inp.clean_jerk_kg, inp.back_squat_kg,
            inp.body_weight_kg, inp.weeks_training,
        )
        bw = inp.body_weight_kg if inp.body_weight_kg > 0 else 75.0
        sn_bw = (inp.snatch_kg / bw) if bw > 0 else 0.0

        bits: list[str] = []
        bits.append(f"nivel {level}")
        if inp.snatch_kg > 0:
            bits.append(f"snatch {sn_bw:.2f}×bw")
        if inp.weeks_training > 0:
            bits.append(f"{inp.weeks_training}wk de tracking")
        if inp.last_macro_completed_weeks_ago is not None:
            bits.append(f"último macro hace {inp.last_macro_completed_weeks_ago}wk")
        if inp.fitness_score > 0:
            bits.append(f"fitness {inp.fitness_score:.0f}")

        return (
            f"Considerando que el atleta tiene {' · '.join(bits)}, "
            f"sugerimos macros con goal '{inp.goal}'."
        )


# Singleton
macro_suggester = MacroSuggester()
