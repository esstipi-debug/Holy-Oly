# wise_score_config.py
# Volta — Configuración del Wise Score

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Nivel(str, Enum):
    SCALED = "scaled"
    RX = "rx"
    COMPETITOR = "competitor"


class Sexo(str, Enum):
    H = "H"
    M = "M"


# ---------------------------------------------------------------------------
# Wise Score weights
# ---------------------------------------------------------------------------

WISE_SCORE_WEIGHTS = {
    "strength_index":      0.25,
    "engine_score":        0.25,
    "gymnastics_index":    0.20,
    "benchmark_percentile": 0.15,
    "consistency_score":   0.15,
}


# ---------------------------------------------------------------------------
# 1. Strength Index
# ---------------------------------------------------------------------------

STRENGTH_TRACKS = {
    "oly":       ["back_squat_3rm", "clean_1rm", "press_overhead_1rm"],
    "crossfit":  ["back_squat_3rm", "deadlift_1rm", "shoulder_press_1rm"],
}

STRENGTH_NIVEL_FACTOR = {
    Nivel.SCALED:     1.0,
    Nivel.RX:         1.3,
    Nivel.COMPETITOR: 1.6,
}

def strength_score_movimiento(lift_kg: float, bw_kg: float, nivel: Nivel) -> float:
    """Score 0-100 para un movimiento de fuerza."""
    ratio = lift_kg / bw_kg
    factor = STRENGTH_NIVEL_FACTOR[nivel]
    raw = ratio * factor * 20          # escala aproximada → ajustar con datos reales
    return min(max(raw, 0), 100)

def strength_index(scores: list[float]) -> float:
    """Promedio de scores de movimientos → 0-100."""
    if not scores:
        return 0.0
    return min(max(sum(scores) / len(scores), 0), 100)


# ---------------------------------------------------------------------------
# 2. Engine Score
# ---------------------------------------------------------------------------

# Pesos de componentes — configurables por coach/atleta (deben sumar 1.0)
ENGINE_DEFAULT_WEIGHTS = {
    "potencia_corta": 0.33,   # Fran
    "capacidad_media": 0.33,  # 2K row
    "capacidad_larga": 0.34,  # 12-min AMRAP / 5K row
}

# Tablas de referencia por nivel (segundos para tiempos, reps para AMRAPs)
ENGINE_REFERENCE_TABLES = {
    "fran": {
        Nivel.SCALED:     {"min": 600, "max": 9999, "score_range": (0, 40)},
        Nivel.RX:         {"min": 300, "max": 600,  "score_range": (40, 75)},
        Nivel.COMPETITOR: {"min": 0,   "max": 300,  "score_range": (75, 100)},
    },
    "row_2k": {
        Nivel.SCALED:     {"min": 540, "max": 9999, "score_range": (0, 40)},
        Nivel.RX:         {"min": 420, "max": 540,  "score_range": (40, 75)},
        Nivel.COMPETITOR: {"min": 0,   "max": 420,  "score_range": (75, 100)},
    },
    "amrap_12": {
        # Para AMRAPs: valor más alto = mejor → invertir lógica
        Nivel.SCALED:     {"min": 0,  "max": 8,   "score_range": (0, 40)},
        Nivel.RX:         {"min": 8,  "max": 14,  "score_range": (40, 75)},
        Nivel.COMPETITOR: {"min": 14, "max": 9999, "score_range": (75, 100)},
    },
}

def engine_score_componente(
    valor: float,
    test: str,
    nivel: Nivel,
    invert: bool = False,
    tabla_override: Optional[dict] = None,
) -> float:
    """
    Convierte un resultado de test a score 0-100.
    invert=True para tests donde menor es mejor (tiempos).
    tabla_override: dict con estructura igual a ENGINE_REFERENCE_TABLES[test] por nivel.
    """
    tabla = tabla_override or ENGINE_REFERENCE_TABLES.get(test, {})
    ref = tabla.get(nivel)
    if not ref:
        return 0.0

    lo, hi = ref["score_range"]
    if invert:
        # menor tiempo → mayor score
        if valor <= ref["min"]:
            return float(hi)
        if valor >= ref["max"]:
            return float(lo)
        ratio = 1 - (valor - ref["min"]) / (ref["max"] - ref["min"])
    else:
        if valor >= ref["max"]:
            return float(hi)
        if valor <= ref["min"]:
            return float(lo)
        ratio = (valor - ref["min"]) / (ref["max"] - ref["min"])

    return lo + ratio * (hi - lo)

def engine_score(
    score_corto: float,
    score_medio: float,
    score_largo: float,
    weights: Optional[dict] = None,
) -> float:
    w = weights or ENGINE_DEFAULT_WEIGHTS
    return (
        w["potencia_corta"] * score_corto
        + w["capacidad_media"] * score_medio
        + w["capacidad_larga"] * score_largo
    )


# ---------------------------------------------------------------------------
# 3. Gymnastics Index
# ---------------------------------------------------------------------------

GYMNASTICS_MOVIMIENTOS = {
    "mu_anillas":   {"peso": 5},
    "mu_barra":     {"peso": 4},
    "hspu_estricto":{"peso": 3},
    "pistol_squat": {"peso": 2},
    "hs_walk":      {"peso": 3},
}

GYMNASTICS_SCALED_MAP = {
    "mu_anillas":    ["ring_row", "jumping_mu"],
    "mu_barra":      ["chest_to_bar", "kipping_pullup"],
    "hspu_estricto": ["pike_pushup", "box_hspu"],
    "pistol_squat":  ["squat_asistido", "pistol_soporte"],
    "hs_walk":       ["hs_hold", "hs_pared"],
}

REPS_TO_SCORE = {
    # reps unbroken → score 1-5
    0:  1,
    1:  1,
    3:  2,
    5:  3,
    10: 4,
    15: 5,
}

def reps_a_score(reps: int) -> int:
    """Convierte reps unbroken a score 1-5."""
    niveles = sorted(REPS_TO_SCORE.keys())
    score = 1
    for umbral in niveles:
        if reps >= umbral:
            score = REPS_TO_SCORE[umbral]
    return score

def gymnastics_score_movimiento(
    ejecuta_bien: int,    # 1-5
    reps_unbroken: int,   # número real
    usa_en_wods: int,     # 3=sí, 2=a veces, 1=no
) -> float:
    """Score de un movimiento: suma de 3 preguntas del coach."""
    return ejecuta_bien + reps_a_score(reps_unbroken) + usa_en_wods

def gymnastics_index(evaluaciones: dict) -> float:
    """
    evaluaciones: {movimiento: {"ejecuta_bien": int, "reps": int, "usa_en_wods": int}}
    Retorna Gymnastics Index 0-100.
    """
    total_score = 0.0
    total_peso = 0.0
    max_score_por_unidad = 5 + 5 + 3  # máximo posible por movimiento

    for mov, eval_data in evaluaciones.items():
        peso = GYMNASTICS_MOVIMIENTOS.get(mov, {}).get("peso", 1)
        score = gymnastics_score_movimiento(
            eval_data["ejecuta_bien"],
            eval_data["reps"],
            eval_data["usa_en_wods"],
        )
        total_score += score * peso
        total_peso += max_score_por_unidad * peso

    if total_peso == 0:
        return 0.0
    return min(max((total_score / total_peso) * 100, 0), 100)


# ---------------------------------------------------------------------------
# 4. Benchmark Percentile
# ---------------------------------------------------------------------------

BENCHMARK_BASE = {
    "fran":   {"tipo": "tiempo", "unidad": "seg"},
    "grace":  {"tipo": "tiempo", "unidad": "seg"},
    "isabel": {"tipo": "tiempo", "unidad": "seg"},
    "helen":  {"tipo": "tiempo", "unidad": "seg"},
    "cindy":  {"tipo": "reps",   "unidad": "rounds"},
    "murph":  {"tipo": "tiempo", "unidad": "seg"},
}

BENCHMARK_REFERENCIA = {
    "fran":   {Nivel.SCALED: 600, Nivel.RX: 420,  Nivel.COMPETITOR: 240},
    "grace":  {Nivel.SCALED: 480, Nivel.RX: 300,  Nivel.COMPETITOR: 180},
    "isabel": {Nivel.SCALED: 600, Nivel.RX: 420,  Nivel.COMPETITOR: 240},
    "helen":  {Nivel.SCALED: 1200,Nivel.RX: 900,  Nivel.COMPETITOR: 720},
    "cindy":  {Nivel.SCALED: 8,   Nivel.RX: 13,   Nivel.COMPETITOR: 17},
    "murph":  {Nivel.SCALED: 4500,Nivel.RX: 3300, Nivel.COMPETITOR: 2400},
}

def benchmark_score(
    benchmark: str,
    resultado: float,
    nivel: Nivel,
    ref_override: Optional[float] = None,
) -> float:
    """
    Calcula score 0-100 para un benchmark.
    Para tiempos: menor = mejor.
    Para reps: mayor = mejor.
    ref_override: referencia personalizada del coach.
    """
    ref = ref_override or BENCHMARK_REFERENCIA.get(benchmark, {}).get(nivel)
    if not ref:
        return 0.0

    tipo = BENCHMARK_BASE.get(benchmark, {}).get("tipo", "tiempo")

    if tipo == "tiempo":
        # resultado <= ref*0.7 → 100, resultado >= ref*1.5 → 0
        lo, hi = ref * 0.7, ref * 1.5
        if resultado <= lo:
            return 100.0
        if resultado >= hi:
            return 0.0
        return (1 - (resultado - lo) / (hi - lo)) * 100
    else:
        # reps: resultado >= ref*1.3 → 100, resultado <= ref*0.5 → 0
        lo, hi = ref * 0.5, ref * 1.3
        if resultado >= hi:
            return 100.0
        if resultado <= lo:
            return 0.0
        return ((resultado - lo) / (hi - lo)) * 100

def benchmark_percentile(scores: list[float]) -> float:
    """Promedio de scores de benchmarks activos → 0-100."""
    if not scores:
        return 0.0
    return min(max(sum(scores) / len(scores), 0), 100)


# ---------------------------------------------------------------------------
# 5. Consistency Score
# ---------------------------------------------------------------------------

def consistency_score(
    sesiones_completadas: int,
    sesiones_planificadas: int,
    racha_actual: int,
    racha_objetivo: int,
    peso_completadas: float = 0.5,
    peso_racha: float = 0.5,
) -> float:
    """
    Consistency Score 0-100.
    Penalización lineal: cada sesión perdida resta proporcionalmente.
    """
    if sesiones_planificadas == 0 or racha_objetivo == 0:
        return 0.0

    score_completadas = (sesiones_completadas / sesiones_planificadas) * 100
    score_racha = (racha_actual / racha_objetivo) * 100

    return min(max(
        peso_completadas * score_completadas + peso_racha * score_racha,
        0), 100)


# ---------------------------------------------------------------------------
# Normalización por perfil
# ---------------------------------------------------------------------------

def sinclair_factor(edad: int) -> float:
    """
    Factor de ajuste por edad (simplificado).
    Masters 35+ reciben bonus creciente.
    """
    if edad < 35:
        return 1.0
    elif edad < 40:
        return 1.05
    elif edad < 45:
        return 1.10
    elif edad < 50:
        return 1.15
    elif edad < 55:
        return 1.20
    elif edad < 60:
        return 1.25
    else:
        return 1.30


# ---------------------------------------------------------------------------
# Wise Score final
# ---------------------------------------------------------------------------

def wise_score(
    strength: float,
    engine: float,
    gymnastics: float,
    benchmark: float,
    consistency: float,
    edad: int,
    sexo: Sexo,
    nivel: Nivel,
    weights: Optional[dict] = None,
) -> float:
    """
    Calcula el Wise Score final 0-99.
    - Tablas H/M separadas (ajuste_sexo placeholder — reemplazar con tablas reales)
    - Score 0-99 por nivel (cada nivel tiene su propio techo)
    - Ajuste Sinclair por edad
    """
    w = weights or WISE_SCORE_WEIGHTS

    raw = (
        w["strength_index"]       * strength
        + w["engine_score"]       * engine
        + w["gymnastics_index"]   * gymnastics
        + w["benchmark_percentile"] * benchmark
        + w["consistency_score"]  * consistency
    )

    # Ajuste por edad
    raw *= sinclair_factor(edad)

    # Ajuste por sexo (placeholder — tablas reales a definir con datos)
    ajuste_sexo = {"H": 1.0, "M": 1.05}.get(sexo, 1.0)
    raw *= ajuste_sexo

    # Cada nivel tiene su propio techo (0-99)
    techo_nivel = {
        Nivel.SCALED:     99,
        Nivel.RX:         99,
        Nivel.COMPETITOR: 99,
    }

    return min(max(round(raw * techo_nivel[nivel] / 100, 1), 0), 99)


# ---------------------------------------------------------------------------
# Ejemplo de uso
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Atleta ejemplo: Rx, hombre, 32 años, 80kg

    # Strength
    s_scores = [
        strength_score_movimiento(120, 80, Nivel.RX),  # back squat
        strength_score_movimiento(90, 80, Nivel.RX),   # deadlift
        strength_score_movimiento(65, 80, Nivel.RX),   # shoulder press
    ]
    si = strength_index(s_scores)

    # Engine
    ec = engine_score_componente(330, "fran", Nivel.RX, invert=True)
    em = engine_score_componente(450, "row_2k", Nivel.RX, invert=True)
    el = engine_score_componente(12, "amrap_12", Nivel.RX)
    es = engine_score(ec, em, el)

    # Gymnastics
    evals = {
        "mu_anillas":    {"ejecuta_bien": 4, "reps": 5,  "usa_en_wods": 3},
        "mu_barra":      {"ejecuta_bien": 3, "reps": 8,  "usa_en_wods": 2},
        "hspu_estricto": {"ejecuta_bien": 3, "reps": 10, "usa_en_wods": 3},
    }
    gi = gymnastics_index(evals)

    # Benchmarks
    b_scores = [
        benchmark_score("fran",  330, Nivel.RX),
        benchmark_score("grace", 240, Nivel.RX),
        benchmark_score("helen", 850, Nivel.RX),
    ]
    bp = benchmark_percentile(b_scores)

    # Consistency
    cs = consistency_score(18, 20, 14, 20)

    # Wise Score final
    ws = wise_score(si, es, gi, bp, cs, edad=32, sexo=Sexo.H, nivel=Nivel.RX)

    print(f"Strength Index:        {si:.1f}")
    print(f"Engine Score:          {es:.1f}")
    print(f"Gymnastics Index:      {gi:.1f}")
    print(f"Benchmark Percentile:  {bp:.1f}")
    print(f"Consistency Score:     {cs:.1f}")
    print(f"─────────────────────────────")
    print(f"Wise Score:            {ws}")
