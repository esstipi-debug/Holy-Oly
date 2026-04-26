# v_stress_engine_config.py
# Volta — V-Stress Engine: Banister adaptado a CrossFit

import math
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TipoSesion(str, Enum):
    TECNICA   = "tecnica"
    SKILL     = "skill"
    WOD       = "wod"
    COMPETENCIA = "competencia"


class ZonaHR(int, Enum):
    Z1 = 1
    Z2 = 2
    Z3 = 3
    Z4 = 4
    Z5 = 5


# ---------------------------------------------------------------------------
# Parámetros del modelo Banister (valores base literatura)
# ---------------------------------------------------------------------------

@dataclass
class BanisterParams:
    # Constantes de tiempo (días)
    t_fitness: float = 49.0     # decay de fitness (largo)
    t_fatiga:  float = 10.0     # decay de fatiga (corto)

    # Coeficientes de ganancia
    k_fitness: float = 1.0
    k_fatiga:  float = 1.5      # CrossFit: más fatiga por intensidad alta

    # Sport bias CrossFit
    sport_bias: float = 1.2


BANISTER_DEFAULT = BanisterParams()

# ---------------------------------------------------------------------------
# Pesos de zonas HR para TRIMP modificado
# ---------------------------------------------------------------------------

HR_ZONE_WEIGHTS = {
    ZonaHR.Z1: 1.0,
    ZonaHR.Z2: 1.6,
    ZonaHR.Z3: 2.2,
    ZonaHR.Z4: 3.0,
    ZonaHR.Z5: 3.8,
}

# Cap de carga semanal (1.5× media del último mes → alerta sobrecarga)
SOBRECARGA_FACTOR = 1.5

# ---------------------------------------------------------------------------
# Cálculo de impulso (carga de sesión)
# ---------------------------------------------------------------------------

def impulso_rpe(rpe: float, duracion_min: float) -> float:
    """
    Carga de sesión básica: RPE × duración.
    rpe: 1-10 (auto-percibido)
    duracion_min: minutos totales del componente
    """
    return rpe * duracion_min


def impulso_trimp(minutos_por_zona: dict) -> float:
    """
    TRIMP modificado si hay datos de HR.
    minutos_por_zona: {ZonaHR.Z1: min, ZonaHR.Z2: min, ...}
    """
    return sum(
        mins * HR_ZONE_WEIGHTS[zona]
        for zona, mins in minutos_por_zona.items()
    )


def impulso_sesion(
    componentes: list[dict],
    sport_bias: float = 1.2,
) -> float:
    """
    Impulso total de la sesión = suma de impulsos por componente × sport_bias.

    componente: {
        "tipo": TipoSesion,
        "rpe": float,           # 1-10
        "duracion_min": float,
        "minutos_por_zona": Optional[dict]  # si hay HR
    }
    """
    total = 0.0
    for comp in componentes:
        if comp.get("minutos_por_zona"):
            imp = impulso_trimp(comp["minutos_por_zona"])
        else:
            imp = impulso_rpe(comp["rpe"], comp["duracion_min"])
        total += imp

    return total * sport_bias


# ---------------------------------------------------------------------------
# Modelo Banister: actualización diaria
# ---------------------------------------------------------------------------

def decay(valor_previo: float, tau: float) -> float:
    """Factor de decaimiento exponencial para un día."""
    return valor_previo * math.exp(-1.0 / tau)


def actualizar_fitness(
    fitness_prev: float,
    impulso: float,
    params: BanisterParams = BANISTER_DEFAULT,
) -> float:
    return decay(fitness_prev, params.t_fitness) + params.k_fitness * impulso


def actualizar_fatiga(
    fatiga_prev: float,
    impulso: float,
    params: BanisterParams = BANISTER_DEFAULT,
) -> float:
    return decay(fatiga_prev, params.t_fatiga) + params.k_fatiga * impulso


def forma(fitness: float, fatiga: float) -> float:
    """Forma = Fitness - Fatiga."""
    return fitness - fatiga


# ---------------------------------------------------------------------------
# Estado del atleta (un día)
# ---------------------------------------------------------------------------

@dataclass
class EstadoDiario:
    dia: int
    impulso: float
    fitness: float
    fatiga: float
    forma: float
    alerta_sobrecarga: bool = False


def procesar_dia(
    dia: int,
    impulso_hoy: float,
    fitness_prev: float,
    fatiga_prev: float,
    media_semanal_prev: Optional[float],
    params: BanisterParams = BANISTER_DEFAULT,
) -> EstadoDiario:
    f = actualizar_fitness(fitness_prev, impulso_hoy, params)
    d = actualizar_fatiga(fatiga_prev, impulso_hoy, params)
    s = forma(f, d)

    alerta = False
    if media_semanal_prev and impulso_hoy > media_semanal_prev * SOBRECARGA_FACTOR:
        alerta = True

    return EstadoDiario(
        dia=dia,
        impulso=impulso_hoy,
        fitness=f,
        fatiga=d,
        forma=s,
        alerta_sobrecarga=alerta,
    )


# ---------------------------------------------------------------------------
# Semáforo de forma
# ---------------------------------------------------------------------------

def semaforo_forma(forma_valor: float) -> str:
    """
    Verde: forma alta, bueno para cargas de competencia.
    Amarillo: zona media, entrenar con criterio.
    Rojo: fatiga alta, deload o técnica.
    """
    if forma_valor >= 10:
        return "🟢 VERDE — Cargas de competencia"
    elif forma_valor >= 0:
        return "🟡 AMARILLO — Entrenar con criterio"
    else:
        return "🔴 ROJO — Deload / técnica"


# ---------------------------------------------------------------------------
# Recomendación automática
# ---------------------------------------------------------------------------

def recomendacion(estado: EstadoDiario) -> str:
    if estado.alerta_sobrecarga:
        return "⚠️  Alerta sobrecarga — Reducir carga esta semana"
    if estado.forma >= 10:
        return "✅ Óptimo para WOD de alta intensidad o competencia"
    elif estado.forma >= 0:
        return "📊 Mantener carga planificada"
    else:
        return "😴 Priorizar técnica, skill o descanso activo"


# ---------------------------------------------------------------------------
# Simulación de ciclo (lista de días)
# ---------------------------------------------------------------------------

def simular_ciclo(
    impulsos: list[float],
    params: BanisterParams = BANISTER_DEFAULT,
    fitness_inicial: float = 0.0,
    fatiga_inicial: float = 0.0,
) -> list[EstadoDiario]:
    """
    Simula un ciclo completo dado una lista de impulsos diarios.
    Días sin entrenamiento = impulso 0.
    """
    estados = []
    fitness = fitness_inicial
    fatiga = fatiga_inicial
    media_semanal = None

    for i, imp in enumerate(impulsos):
        # Calcular media semanal rolling (últimos 7 días)
        if i >= 7:
            media_semanal = sum(impulsos[i-7:i]) / 7

        estado = procesar_dia(
            dia=i + 1,
            impulso_hoy=imp,
            fitness_prev=fitness,
            fatiga_prev=fatiga,
            media_semanal_prev=media_semanal,
            params=params,
        )
        estados.append(estado)
        fitness = estado.fitness
        fatiga = estado.fatiga

    return estados


# ---------------------------------------------------------------------------
# Ejemplo de uso
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Semana de un atleta Rx
    sesiones_semana = [
        # Lunes: técnica + WOD
        impulso_sesion([
            {"tipo": TipoSesion.TECNICA, "rpe": 5, "duracion_min": 20},
            {"tipo": TipoSesion.WOD,     "rpe": 8, "duracion_min": 15},
        ]),
        # Martes: descanso
        0,
        # Miércoles: skill + WOD largo
        impulso_sesion([
            {"tipo": TipoSesion.SKILL, "rpe": 6, "duracion_min": 25},
            {"tipo": TipoSesion.WOD,   "rpe": 7, "duracion_min": 20},
        ]),
        # Jueves: descanso
        0,
        # Viernes: WOD competencia
        impulso_sesion([
            {"tipo": TipoSesion.COMPETENCIA, "rpe": 9, "duracion_min": 25},
        ]),
        # Sábado: WOD moderado
        impulso_sesion([
            {"tipo": TipoSesion.WOD, "rpe": 6, "duracion_min": 20},
        ]),
        # Domingo: descanso
        0,
    ]

    estados = simular_ciclo(sesiones_semana)

    print(f"{'Día':<5} {'Impulso':<10} {'Fitness':<10} {'Fatiga':<10} {'Forma':<10} Estado")
    print("─" * 65)
    for e in estados:
        alerta = " ⚠️" if e.alerta_sobrecarga else ""
        print(f"{e.dia:<5} {e.impulso:<10.1f} {e.fitness:<10.1f} {e.fatiga:<10.1f} {e.forma:<10.1f} {semaforo_forma(e.forma)}{alerta}")

    ultimo = estados[-1]
    print(f"\nRecomendación: {recomendacion(ultimo)}")
