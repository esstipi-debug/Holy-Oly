# etl_wise_score.py
# Volta — ETL: extrae datos del atleta y calcula Wise Score completo

from wise_score_config import (
    Nivel, Sexo,
    strength_score_movimiento, strength_index,
    engine_score_componente, engine_score,
    gymnastics_index,
    benchmark_score, benchmark_percentile,
    consistency_score,
    wise_score,
)


# ---------------------------------------------------------------------------
# Tipos de datos de entrada (simulan lo que vendría de Supabase)
# ---------------------------------------------------------------------------

AtletaData = dict       # perfil del atleta
SesionesData = list     # lista de sesiones del período
BenchmarksData = list   # lista de resultados de benchmarks
GymnasticsData = dict   # evaluaciones del coach por movimiento


# ---------------------------------------------------------------------------
# ETL: extracción y normalización
# ---------------------------------------------------------------------------

def extraer_perfil(atleta: AtletaData) -> dict:
    return {
        "id":     atleta["id"],
        "nombre": atleta["nombre"],
        "edad":   atleta["edad"],
        "sexo":   Sexo(atleta["sexo"]),
        "nivel":  Nivel(atleta["nivel"]),
        "bw_kg":  atleta["bw_kg"],
    }


def calcular_strength(atleta: AtletaData, lifts: dict) -> float:
    """
    lifts: {"back_squat": kg, "deadlift": kg, "shoulder_press": kg, ...}
    """
    nivel = Nivel(atleta["nivel"])
    bw = atleta["bw_kg"]

    scores = []
    for movimiento, kg in lifts.items():
        if kg and kg > 0:
            scores.append(strength_score_movimiento(kg, bw, nivel))

    return strength_index(scores)


def calcular_engine(
    atleta: AtletaData,
    resultados_tests: dict,
    weights: dict = None,
    tabla_override: dict = None,
) -> float:
    """
    resultados_tests: {
        "fran":    segundos,
        "row_2k":  segundos,
        "amrap_12": rounds
    }
    """
    nivel = Nivel(atleta["nivel"])

    fran_score  = engine_score_componente(
        resultados_tests.get("fran", 0),
        "fran", nivel, invert=True,
        tabla_override=tabla_override.get("fran") if tabla_override else None,
    )
    row_score   = engine_score_componente(
        resultados_tests.get("row_2k", 0),
        "row_2k", nivel, invert=True,
        tabla_override=tabla_override.get("row_2k") if tabla_override else None,
    )
    amrap_score = engine_score_componente(
        resultados_tests.get("amrap_12", 0),
        "amrap_12", nivel,
        tabla_override=tabla_override.get("amrap_12") if tabla_override else None,
    )

    return engine_score(fran_score, row_score, amrap_score, weights)


def calcular_gymnastics(evaluaciones: GymnasticsData) -> float:
    """
    evaluaciones: {
        "mu_anillas": {"ejecuta_bien": 4, "reps": 5, "usa_en_wods": 3},
        ...
    }
    """
    return gymnastics_index(evaluaciones)


def calcular_benchmark(atleta: AtletaData, resultados: BenchmarksData) -> float:
    """
    resultados: [{"benchmark": "fran", "resultado": 330, "ref_override": None}, ...]
    """
    nivel = Nivel(atleta["nivel"])
    scores = []

    for r in resultados:
        s = benchmark_score(
            r["benchmark"],
            r["resultado"],
            nivel,
            ref_override=r.get("ref_override"),
        )
        scores.append(s)

    return benchmark_percentile(scores)


def calcular_consistency(
    sesiones: SesionesData,
    ventana_dias: int = 28,
) -> float:
    """
    sesiones: [{"fecha": "2026-04-01", "completada": True, "planificada": True}, ...]
    Filtra por ventana_dias más recientes.
    """
    from datetime import datetime, timedelta

    hoy = datetime.today()
    desde = hoy - timedelta(days=ventana_dias)

    recientes = [
        s for s in sesiones
        if datetime.strptime(s["fecha"], "%Y-%m-%d") >= desde
    ]

    planificadas  = sum(1 for s in recientes if s.get("planificada"))
    completadas   = sum(1 for s in recientes if s.get("completada"))

    # Racha actual: días consecutivos con sesión completada hasta hoy
    completadas_fechas = sorted(
        [datetime.strptime(s["fecha"], "%Y-%m-%d") for s in recientes if s.get("completada")],
        reverse=True,
    )
    racha = 0
    fecha_check = hoy
    for f in completadas_fechas:
        diff = (fecha_check - f).days
        if diff <= 1:
            racha += 1
            fecha_check = f
        else:
            break

    racha_objetivo = ventana_dias // 2   # 50% de los días como objetivo razonable

    return consistency_score(completadas, planificadas, racha, racha_objetivo)


# ---------------------------------------------------------------------------
# Pipeline completo
# ---------------------------------------------------------------------------

def calcular_wise_score_completo(
    atleta: AtletaData,
    lifts: dict,
    resultados_engine: dict,
    evaluaciones_gymnastics: GymnasticsData,
    resultados_benchmarks: BenchmarksData,
    sesiones: SesionesData,
    engine_weights: dict = None,
    engine_tabla_override: dict = None,
    ventana_consistency: int = 28,
) -> dict:
    """
    Pipeline ETL completo → retorna dict con Wise Score y breakdown.
    """
    perfil = extraer_perfil(atleta)

    si = calcular_strength(atleta, lifts)
    es = calcular_engine(atleta, resultados_engine, engine_weights, engine_tabla_override)
    gi = calcular_gymnastics(evaluaciones_gymnastics)
    bp = calcular_benchmark(atleta, resultados_benchmarks)
    cs = calcular_consistency(sesiones, ventana_consistency)

    ws = wise_score(
        strength=si,
        engine=es,
        gymnastics=gi,
        benchmark=bp,
        consistency=cs,
        edad=perfil["edad"],
        sexo=perfil["sexo"],
        nivel=perfil["nivel"],
    )

    return {
        "atleta_id":   perfil["id"],
        "nombre":      perfil["nombre"],
        "nivel":       perfil["nivel"].value,
        "wise_score":  ws,
        "breakdown": {
            "strength_index":       round(si, 1),
            "engine_score":         round(es, 1),
            "gymnastics_index":     round(gi, 1),
            "benchmark_percentile": round(bp, 1),
            "consistency_score":    round(cs, 1),
        },
    }


# ---------------------------------------------------------------------------
# Ejemplo de uso
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    atleta = {
        "id":     "atleta_001",
        "nombre": "Rodrigo Pérez",
        "edad":   28,
        "sexo":   "H",
        "nivel":  "rx",
        "bw_kg":  80,
    }

    lifts = {
        "back_squat":      120,
        "deadlift":        150,
        "shoulder_press":  65,
    }

    resultados_engine = {
        "fran":    330,    # segundos
        "row_2k":  460,    # segundos
        "amrap_12": 11,    # rounds
    }

    evaluaciones_gymnastics = {
        "mu_anillas":    {"ejecuta_bien": 4, "reps": 5,  "usa_en_wods": 3},
        "mu_barra":      {"ejecuta_bien": 3, "reps": 8,  "usa_en_wods": 2},
        "hspu_estricto": {"ejecuta_bien": 3, "reps": 10, "usa_en_wods": 3},
        "pistol_squat":  {"ejecuta_bien": 4, "reps": 15, "usa_en_wods": 2},
    }

    resultados_benchmarks = [
        {"benchmark": "fran",  "resultado": 330},
        {"benchmark": "grace", "resultado": 260},
        {"benchmark": "helen", "resultado": 870},
        {"benchmark": "murph", "resultado": 3600},
    ]

    sesiones = [
        {"fecha": "2026-04-01", "planificada": True,  "completada": True},
        {"fecha": "2026-04-02", "planificada": True,  "completada": True},
        {"fecha": "2026-04-03", "planificada": False, "completada": False},
        {"fecha": "2026-04-04", "planificada": True,  "completada": True},
        {"fecha": "2026-04-05", "planificada": True,  "completada": False},
        {"fecha": "2026-04-07", "planificada": True,  "completada": True},
        {"fecha": "2026-04-08", "planificada": True,  "completada": True},
        {"fecha": "2026-04-09", "planificada": True,  "completada": True},
        {"fecha": "2026-04-10", "planificada": True,  "completada": True},
        {"fecha": "2026-04-11", "planificada": False, "completada": False},
        {"fecha": "2026-04-14", "planificada": True,  "completada": True},
        {"fecha": "2026-04-15", "planificada": True,  "completada": True},
        {"fecha": "2026-04-16", "planificada": True,  "completada": True},
        {"fecha": "2026-04-17", "planificada": True,  "completada": True},
        {"fecha": "2026-04-18", "planificada": True,  "completada": True},
        {"fecha": "2026-04-21", "planificada": True,  "completada": True},
        {"fecha": "2026-04-22", "planificada": True,  "completada": True},
        {"fecha": "2026-04-23", "planificada": True,  "completada": True},
        {"fecha": "2026-04-24", "planificada": True,  "completada": True},
    ]

    resultado = calcular_wise_score_completo(
        atleta=atleta,
        lifts=lifts,
        resultados_engine=resultados_engine,
        evaluaciones_gymnastics=evaluaciones_gymnastics,
        resultados_benchmarks=resultados_benchmarks,
        sesiones=sesiones,
    )

    print(f"\n{'='*40}")
    print(f"  {resultado['nombre']} — {resultado['nivel'].upper()}")
    print(f"{'='*40}")
    print(f"  WISE SCORE:  {resultado['wise_score']}")
    print(f"{'─'*40}")
    for k, v in resultado["breakdown"].items():
        print(f"  {k:<26} {v}")
    print(f"{'='*40}\n")
