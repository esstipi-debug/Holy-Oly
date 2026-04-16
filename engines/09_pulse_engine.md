# 09. Pulse Engine — Acondicionamiento Anaeróbico para Levantadores Olímpicos

**Propósito:** Generar, programar y monitorear sesiones de acondicionamiento anaeróbico en máquinas ergométricas, diseñadas específicamente como soporte de recuperación y potencia sistémica para pesistas olímpicos.

**Status:** Core engine, integrado con Stress Engine, Macrocycle Engine, Gamification  
**Frecuencia de generación:** Semanal (Lunes 00:00 UTC)  
**Rendimiento:** O(1) por atleta

---

## 1. Fundamento Científico

El levantamiento olímpico depende casi exclusivamente del sistema de fosfágenos (esfuerzos <5 segundos). Sin embargo, mejorar el sistema anaeróbico láctico y aláctico mediante otros medios optimiza el rendimiento específico de la barra.

### 1.1 Beneficios para el Pesista

| # | Beneficio | Mecanismo | Impacto en Plataforma |
|---|-----------|-----------|----------------------|
| 1 | **Resíntesis de ATP/PC** | Intervalos anaeróbicos mejoran la eficiencia en la resíntesis de energía rápida | Recuperación más rápida entre intentos pesados en sesión y competencia |
| 2 | **Reclutamiento de Fibras Tipo IIx** | Sprints en máquinas reclutan fibras rápidas sin impacto articular | Entrenar explosividad cuando rodillas o espalda baja necesitan descanso de la barra |
| 3 | **Capacidad de Buffering** | Mejora la amortiguación de iones de hidrógeno (acidez) | La técnica no se desmorona en la 4ta-5ta repetición de series complejas; menor riesgo de lesión por fatiga técnica |
| 4 | **Salud del SNC** | Estímulo de alta intensidad con patrón de movimiento diferente | Mantiene el SNC alerta sin sobreentrenamiento específico del gesto técnico |
| 5 | **Capacidad de Carga Semanal** | Mayor tolerancia al volumen total de entrenamiento | El cuerpo tolera más trabajo sin colapsar |
| 6 | **Composición Corporal** | Optimiza metabolismo de glucosa | Mantener peso de competencia (categoría) |

### 1.2 Regla de Seguridad Fundamental

> **Un levantador olímpico debe evitar el entrenamiento anaeróbico de muy larga duración (>60-90 segundos de esfuerzo continuo intenso) de forma recurrente.** Esto podría inducir una conversión de fibras rápidas a lentas, lo cual es contraproducente para la velocidad de la barra.

---

## 2. Equipamiento Permitido (Solo Máquinas)

Solo se permiten máquinas ergométricas porque:
- Mantienen técnica controlada bajo fatiga
- Reducen drásticamente el porcentaje de lesión
- Permiten alcanzar alta intensidad para activar el motor anaeróbico
- Eliminan el componente de coordinación compleja que interferiría con el gesto técnico del levantamiento

| Máquina | Énfasis | Transferencia al Levantamiento |
|---------|---------|-------------------------------|
| **Airbike** (Assault / Echo Bike) | Potencia sistémica total (tren superior + inferior) | Máxima descarga de potencia, torso erguido |
| **RowErg** (Remo Concept2) | Extensión de cadera + core | Mayor transferencia biomecánica al "pull" del levantamiento |
| **SkiErg** | Tren superior + core + extensión de cadera | Potencia de empuje, trabajo de core bajo fatiga |
| **BikeErg** (Concept2) | Cadencia alta, control de vatios | Cero impacto, menor carga de flexión profunda |
| **Trotadora** | Cadena posterior (solo sprints en colina) | Reclutamiento cadena posterior; mayor impacto articular |

### 2.1 Selección de Máquina según Estado del Atleta

| Situación del Levantador | Máquina Recomendada | Razón |
|--------------------------|---------------------|-------|
| Dolor de rodillas | BikeErg o SkiErg | Cero impacto y menor carga de flexión profunda |
| Espalda baja cargada | Airbike | Permite mantener torso erguido. **Evitar Remo.** |
| Falta de "punch" en el tirón | Remo o SkiErg | Fortalece apertura de cadera y core bajo fatiga |
| Día de recuperación total | Trotadora (caminata) | Promueve drenaje linfático sin fatiga neuromuscular |
| Sin restricciones | Cualquiera (rotar) | Variedad de estímulos |

---

## 3. Los Tres Vectores de Entrenamiento

### Escala de Intensidad (RPE)

| Vector | Zona | RPE | Descripción |
|--------|------|-----|-------------|
| **Vector 1** | Zona 2 (Aeróbico) | 4-5 | Conversacional, respiración nasal |
| **Vector 2** | VO2 Max | 8-9 | Duro, respiración pesada, no puedes hablar |
| **Vector 3** | Anaeróbico (Sprints) | 10 | Esfuerzo máximo absoluto, "All-out" |

---

### 3.1 Vector 1 — Zona 2 (Base Aeróbica)

**Propósito:** Recuperación activa, flujo sanguíneo, tolerancia al volumen de pesas.

| Máquina | Protocolo | Duración | Detalle |
|---------|-----------|----------|---------|
| Airbike | **Steady 30** | 30 min | RPM constantes en zona 2 |
| BikeErg | **Cadencia Progresiva** | 40 min | Aumentar 5 RPM cada 10 min, siempre en Zona 2 |
| SkiErg | **Resistencia de Empuje** | 30 min | Constante, foco en técnica de core |
| RowErg | **Baja Cadencia / Alta Potencia** | 20 min | 18-20 SPM (paladas/min), tirando fuerte en cada una |
| Trotadora | **Recuperación en Colina** | 30 min | Ritmo suave, inclinación 3-5% |

---

### 3.2 Vector 2 — VO2 Max (Capacidad Aeróbica Máxima)

**Propósito:** Mejorar capacidad cardiovascular y buffering de acidez.

| Máquina | Protocolo | Estructura | Detalle |
|---------|-----------|------------|---------|
| Airbike | **4×4 Clásico** | 4 min fuertes / 3 min descanso activo | Pedaleo muy suave en descanso |
| BikeErg | **Intervalos de Umbral** | 5 × 5 min fuertes / 2 min suaves | Control de vatios constante |
| BikeErg | **30/30 Micro-Intervalos** | 20 min: 30 seg fuerte / 30 seg suave | Alternancia rápida |
| SkiErg | **Intervalos de 500m** | 6-8 × 500m fuertes / 2 min descanso activo | Mantener split constante |
| SkiErg | **Pirámide de Metros** | 250m → 500m → 750m → 500m → 250m | Descanso 1:1 (mismo tiempo de trabajo) |
| RowErg | **Intervalos de 1000m** | 4 × 1000m / 3 min descanso | Mantener split (ritmo/500m) constante |
| Trotadora | **Intervalos de 800m** | 5 × 800m fuertes / 3 min caminando | Control de ritmo |
| Trotadora | **Tempo Run** | 20 min continuos | Ritmo más rápido sostenible de forma constante |

---

### 3.3 Vector 3 — Anaeróbico (Sprints Máximos)

**Propósito:** Potencia neuromuscular pura, reclutamiento de fibras tipo IIx, resíntesis de ATP/PC.

| Máquina | Protocolo | Estructura | Detalle |
|---------|-----------|------------|---------|
| Airbike | **Wingate 6×30** | 30 seg sprint máximo / 3:30 min descanso total | Protocolo estándar de potencia |
| Airbike | **Tabata** | 8 × (20 seg On / 10 seg Off) | 4 min total, máxima intensidad |
| Airbike | **EMOM de Calorías** | Empezar 5-8 cal, +1-2 cal/min hasta fallar | Progresivo hasta el fallo |
| BikeErg | **Sprints de 1km** | 4 × 1000m máxima velocidad / 3 min descanso | Vatios máximos sostenidos |
| SkiErg | **Sprints Explosivos** | 10 × 20 seg potencia máxima / 1:40 min descanso | Total: ~20 min con descansos |
| RowErg | **Sprints de 250m** | 8 × 250m al 100% / 2 min descanso total | Máxima extensión de cadera |
| RowErg | **Muerte por Metros** | EMOM: Min 1 = 100m, Min 2 = 110m... hasta fallar | Progresivo, cada minuto sube 10m |
| Trotadora | **Sprints en Colina** | 10 × 15 seg sprint en inclinación máxima / 2 min caminata | Menos impacto que plano |

---

## 4. Reglas de Elegibilidad (Freshness Gate)

El atleta **DEBE estar fresco** para realizar Vectores 2 y 3. Estas reglas son obligatorias y no negociables.

### 4.1 Reglas de Readiness

| Regla | Condición | Acción |
|-------|-----------|--------|
| **Regla de Readiness General** | `readiness < 60` | Solo Vector 1 permitido. Vectores 2 y 3 **BLOQUEADOS** |
| **Regla de Sueño** | `sleep_hours < 7` O `sleep_quality === 'poor'` | Solo Vector 1. Vectores 2 y 3 **CANCELADOS** |
| **Regla de HRV** | HRV cae >15% por debajo de línea base de 7 días | Solo Vector 1. SNC está fatigado |
| **Regla de Fatiga del SNC** | Levantamientos fallan por "falta de chispa" (falla técnica sin cansancio muscular) | Eliminar Vector 3, luego Vector 2. Solo Vector 1 |
| **Regla de Estrés Lifestyle** | `lifestyle_load_factor > 70` (Engine 12) | Solo Vector 1 |
| **Regla de Sobreentrenamiento** | `stress_engine.fatigue > 75` (Engine 01) | Vectores 2 y 3 **BLOQUEADOS** hasta que fatigue < 60 |

### 4.2 Regla del 15% (Drop-off) — Aborto de Sesión

Durante intervalos de alta intensidad (Vector 2 y 3):

```
MONITOREAR: Watts promedio o máximos por ronda

SI ronda_actual.watts < ronda_1.watts × 0.85:
    → ABORTAR SESIÓN INMEDIATAMENTE
    → Registrar como "aborted_dropoff"
    → Razón: Continuar solo genera fatiga sistémica sin beneficio adaptativo
```

**Ejemplo:**
- Ronda 1: 450 watts
- Umbral de aborto: 450 × 0.85 = 382 watts
- Ronda 4: 370 watts → **ABORTAR** (cayó por debajo del 85%)

### 4.3 Regla de Frecuencia Máxima

| Restricción | Límite |
|-------------|--------|
| Sesiones Vector 3 por semana | **Máximo 2** (sumando todas las máquinas) |
| Sesiones Vector 2 por semana | **Máximo 2** |
| Misma máquina + mismo vector en la semana | **No repetir** |
| Duración total semanal de acondicionamiento | Varía por fase del macrociclo (ver sección 5) |

### 4.4 Regla de No-Interferencia con Fuerza

| Restricción | Razón |
|-------------|-------|
| **NUNCA** hacer Vector 3 el día anterior a Sentadilla Pesada | Fibras rápidas dañadas + fosfocreatina agotada |
| **NUNCA** hacer Vector 3 el día siguiente a Fuerza Máxima de tren inferior | Daño muscular residual impide alcanzar potencia necesaria = "esfuerzo basura" |
| **NUNCA** hacer sprints ANTES de Snatch o Clean & Jerk | Agotan fosfocreatina y fatigan unidades motoras; la barra se sentirá "lenta" o "pesada" |
| Acondicionamiento siempre DESPUÉS de pesas | O en sesión separada por mínimo 6 horas |
| Evitar resistencia de larga duración (>40 min) de forma recurrente | Podría interferir con señalización de mTOR necesaria para hipertrofia y fuerza explosiva |

---

## 5. Integración con el Macrociclo (Engine 03)

El volumen de acondicionamiento es **inversamente proporcional** a la especificidad del levantamiento.

### 5.1 Fase de Preparación General (Hipertrofia / Base)

**Objetivo:** Construir el "tanque de combustible". Las cargas de levantamiento no son máximas → el cuerpo tolera más fatiga sistémica.

| Parámetro | Valor |
|-----------|-------|
| **Frecuencia** | 3-4 sesiones/semana |
| **Vector 1 (Zona 2)** | 2 veces/semana (30-40 min) |
| **Vector 2 (VO2 Max)** | 1-2 veces/semana |
| **Vector 3 (Sprints)** | 0-1 vez/semana |
| **Ubicación** | Final de sesión de pesas o días de descanso activo |
| **Beneficio** | Tolerar el alto volumen de repeticiones con barra |

### 5.2 Fase de Preparación Específica (Fuerza Base)

**Objetivo:** Intensidades de Snatch/Clean suben al 80-90%. El acondicionamiento se vuelve más explosivo y menos agotador.

| Parámetro | Valor |
|-----------|-------|
| **Frecuencia** | 2 sesiones/semana |
| **Vector 1 (Zona 2)** | 1 vez/semana (mantenimiento cardiovascular) |
| **Vector 2 (VO2 Max)** | 0-1 vez/semana |
| **Vector 3 (Sprints cortos)** | 1 vez/semana (sprints de 10-15 seg) |
| **Ubicación** | Lejos de días de Sentadilla Pesada |
| **Beneficio** | Mantener potencia neuromuscular sin interferir con fuerza |

**Ejemplo:** Si Sentadillas son Lunes y Jueves → Sprints el Martes o Miércoles.

### 5.3 Fase de Pre-Competición (Peaking / Realización)

**Objetivo:** Prioridad absoluta = velocidad de la barra y SNC. Cualquier fatiga extra es contraproducente.

| Parámetro | Valor |
|-----------|-------|
| **Frecuencia** | 0-1 sesión/semana |
| **Vector 1 (Zona 2)** | Solo si el atleta se siente "pesado" o congestionado (20 min suaves) |
| **Vector 2 (VO2 Max)** | **ELIMINADO** |
| **Vector 3 (Sprints)** | **ELIMINADO** |
| **Ubicación** | Día de descanso activo intermedio |
| **Beneficio** | Solo flujo sanguíneo para recuperación |

### 5.4 Resumen Visual por Fase

```
                    V1(Zona2)    V2(VO2Max)    V3(Sprints)
                    ─────────    ──────────    ───────────
Preparación General   ██████       ████           ██
Fuerza Base           ████         ██             ██
Peaking               ██           ░░             ░░

██ = Activo    ░░ = Eliminado
```

---

## 6. Gestión del "Día Después"

La planificación semanal se adapta al estímulo del día anterior para optimizar la supercompensación.

| Entrenamiento Realizado | Estado Fisiológico Esperado | Protocolo del Día Siguiente |
|------------------------|----------------------------|----------------------------|
| **Vector 1 (Zona 2)** | Sistema parasimpático activo. Músculos oxigenados. | **Vía libre.** Fuerza Máxima o sesión de alta intensidad permitida. |
| **Vector 2 (VO2 Max)** | Fatiga cardiovascular y depleción parcial de glucógeno. | **Evitar cardio intenso.** Priorizar levantamientos de fuerza estricta o técnica. |
| **Vector 3 (Sprints)** | Fatiga profunda del SNC. Fibras rápidas dañadas. | **OBLIGATORIO:** Solo Vector 1 (recuperación activa) o descanso total. |
| **Fuerza Máxima (tren inferior)** | Daño muscular residual severo. | **PROHIBIDO:** No hacer Vector 3 al día siguiente. |

---

## 7. Reglas de Nutrición y Combustible

| Regla | Detalle |
|-------|---------|
| **Ventana Peri-Entrenamiento** | Si la dieta general es baja en carbohidratos, ubicar estratégicamente la ingesta de carbohidratos exclusivamente antes y después de sesiones Vector 2 y Vector 3 |
| **Razón** | El trabajo anaeróbico depende enteramente del glucógeno; intentarlo sin combustible reduce la potencia de salida |
| **Vector 1** | No requiere carga de carbohidratos especial (usa grasa como combustible) |
| **Hidratación** | Obligatoria antes de cualquier vector. Deshidratación >2% del BW = cancelar Vector 3 |

---

## 8. Programación Semanal Típica (Fase de Fuerza)

Para un levantador que entrena pesas 5 días/semana:

| Día | Entrenamiento de Pesas | Acondicionamiento (Pulse) | Notas |
|-----|----------------------|--------------------------|-------|
| **Lunes** | Snatch + Sentadilla Trasera | ❌ No | Foco en fuerza pura |
| **Martes** | Clean & Jerk + Accesorios | **Vector 2** (VO2 Max) al final | Ej: 4×4 en Airbike |
| **Miércoles** | Técnica Ligera / Pulls | **Vector 1** (Zona 2) | 30 min constantes en Remo |
| **Jueves** | Sentadilla Pesada + Push Press | ❌ No | Prioridad recuperación SNC |
| **Viernes** | Máximos / Snatch + CJ | ❌ No | Simulación de competencia |
| **Sábado** | Accesorios / Bodybuilding | **Vector 3** (Sprints) | Ej: 6×30 Wingate en Airbike |
| **Domingo** | Descanso Total | ❌ No | Recuperación completa |

---

## 9. Algoritmo de Generación

### 9.1 Selección del Vector

```javascript
function selectVector(readiness, sleep, hrv, fatigue, phase) {
  // FRESHNESS GATE — Obligatorio
  if (readiness < 60) return 'vector_1';
  if (sleep.hours < 7 || sleep.quality === 'poor') return 'vector_1';
  if (hrv.percentChange < -15) return 'vector_1';  // vs línea base 7 días
  if (fatigue > 75) return 'vector_1';

  // FASE DEL MACROCICLO
  if (phase === 'peaking') return 'vector_1';  // Solo zona 2 en peaking

  // SELECCIÓN POR READINESS + FASE
  if (readiness >= 80 && phase !== 'peaking') {
    return 'vector_3';  // Fresco → Sprints
  }
  if (readiness >= 60) {
    return 'vector_2';  // Moderado → VO2 Max
  }
  return 'vector_1';
}
```

### 9.2 Selección de Máquina

```javascript
function selectMachine(athleteCondition, usedThisWeek) {
  const machines = ['airbike', 'rower', 'skierg', 'bikeerg', 'treadmill'];

  // RESTRICCIONES POR CONDICIÓN
  if (athleteCondition.knee_pain) exclude('treadmill', 'rower');
  if (athleteCondition.lower_back_loaded) exclude('rower');
  if (athleteCondition.lacks_pull_power) prefer('rower', 'skierg');
  if (athleteCondition.recovery_day) return 'treadmill';  // Caminata

  // NO REPETIR MISMA MÁQUINA + MISMO VECTOR ESTA SEMANA
  const available = machines.filter(m => !usedThisWeek[m]?.includes(selectedVector));

  // ROTAR ESTÍMULO
  return selectLeastUsed(available);
}
```

### 9.3 Selección de Protocolo

```javascript
function selectProtocol(vector, machine, athleteLevel) {
  // Buscar en tabla de protocolos (sección 3)
  const protocols = PROTOCOL_TABLE[machine][vector];

  // Escalar dificultad según OLY Index
  const difficulty = getDifficulty(athleteLevel.olyIndex);
  //   < 250 → beginner
  //   250-350 → intermediate
  //   350-450 → advanced
  //   450+ → elite

  return scaleProtocol(protocols, difficulty);
}
```

### 9.4 Monitoreo en Tiempo Real (Drop-off)

```javascript
function monitorDropoff(rounds) {
  const baseline = rounds[0].watts;
  const threshold = baseline * 0.85;

  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i].watts < threshold) {
      return {
        action: 'ABORT',
        reason: 'dropoff_15_percent',
        abortedAtRound: i + 1,
        baselineWatts: baseline,
        currentWatts: rounds[i].watts,
        dropPercent: ((baseline - rounds[i].watts) / baseline * 100).toFixed(1)
      };
    }
  }
  return { action: 'CONTINUE' };
}
```

---

## 10. Inputs y Outputs

### 10.1 Inputs

```json
{
  "athlete_id": "uuid",
  "oly_index": 385,
  "readiness": 78,
  "fatigue": 42,
  "sleep": {
    "hours": 7.5,
    "quality": "good",
    "efficiency": 0.88
  },
  "hrv": {
    "current": 62,
    "baseline_7d": 68,
    "percentChange": -8.8
  },
  "macrocycle_phase": "strength",
  "athlete_condition": {
    "knee_pain": false,
    "lower_back_loaded": true,
    "lacks_pull_power": false
  },
  "week_history": {
    "airbike": ["vector_2"],
    "rower": [],
    "skierg": [],
    "bikeerg": [],
    "treadmill": ["vector_1"]
  },
  "training_schedule": {
    "heavy_squat_days": ["monday", "thursday"],
    "olympic_max_days": ["friday"]
  }
}
```

### 10.2 Output

```json
{
  "pulse_session": {
    "id": "pulse_2026_04_14_v2_airbike",
    "vector": 2,
    "vector_name": "VO2 Max",
    "machine": "airbike",
    "protocol": "4x4 Clásico",
    "structure": {
      "rounds": 4,
      "work_seconds": 240,
      "rest_seconds": 180,
      "total_minutes": 28,
      "rpe_target": "8-9"
    },
    "difficulty": "intermediate",
    "placement": "post_weights",
    "day": "tuesday",
    "freshness_check": {
      "readiness": "PASS (78 >= 60)",
      "sleep": "PASS (7.5h >= 7h)",
      "hrv": "PASS (-8.8% > -15%)",
      "fatigue": "PASS (42 < 75)",
      "day_before": "PASS (no V3 yesterday)",
      "day_after": "OK (no heavy squat tomorrow)"
    },
    "abort_rules": {
      "dropoff_threshold": 0.85,
      "monitor": "watts_per_round"
    },
    "nutrition_note": "Ingerir carbohidratos en ventana peri-entrenamiento",
    "xp_reward": 300
  }
}
```

---

## 11. Reglas Específicas de Frescura (Freshness Gate Completo)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRESHNESS GATE — PULSE ENGINE                │
│                                                                 │
│  PASO 1: ¿Readiness >= 60?                                     │
│          NO → Solo Vector 1                                     │
│          SÍ → Continuar                                         │
│                                                                 │
│  PASO 2: ¿Durmió >= 7 horas con buena calidad?                │
│          NO → Solo Vector 1                                     │
│          SÍ → Continuar                                         │
│                                                                 │
│  PASO 3: ¿HRV dentro del 15% de línea base?                   │
│          NO → Solo Vector 1 (SNC fatigado)                     │
│          SÍ → Continuar                                         │
│                                                                 │
│  PASO 4: ¿Fatigue del Stress Engine < 75?                      │
│          NO → Solo Vector 1 hasta fatigue < 60                 │
│          SÍ → Continuar                                         │
│                                                                 │
│  PASO 5: ¿Lifestyle Load Factor < 70?                          │
│          NO → Solo Vector 1                                     │
│          SÍ → Continuar                                         │
│                                                                 │
│  PASO 6: ¿Ayer fue Vector 3 o Fuerza Máxima tren inferior?    │
│          SÍ → Solo Vector 1                                     │
│          NO → Continuar                                         │
│                                                                 │
│  PASO 7: ¿Mañana hay Sentadilla Pesada o Máximos?             │
│          SÍ → Solo Vector 1 o Vector 2 (NO Vector 3)          │
│          NO → Continuar                                         │
│                                                                 │
│  PASO 8: ¿Fase del macrociclo = Peaking?                       │
│          SÍ → Solo Vector 1                                     │
│          NO → TODOS LOS VECTORES DISPONIBLES ✅                │
│                                                                 │
│  PASO 9: Seleccionar vector según readiness                    │
│          Readiness 60-79 → Vector 2                            │
│          Readiness >= 80 → Vector 2 o Vector 3                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. XP y Gamificación

### 12.1 XP Base por Vector

| Vector | XP Base | Razón |
|--------|---------|-------|
| Vector 1 (Zona 2) | 150 XP | Menor intensidad, pero valioso para recuperación |
| Vector 2 (VO2 Max) | 300 XP | Intensidad moderada-alta |
| Vector 3 (Sprints) | 400 XP | Máxima intensidad, mayor demanda |

### 12.2 Bonificaciones

| Condición | XP Bonus |
|-----------|----------|
| Completar el mismo día que se asigna | +50 XP |
| Superar tu mejor marca anterior en el mismo protocolo | +75 XP |
| Nuevo récord personal (watts, metros, calorías) | +100 XP |
| Mayor score del club en la semana | +50 XP |
| Completar sin abortar (Vector 3 completo) | +25 XP |

### 12.3 Leaderboard Semanal

```json
{
  "leaderboard_id": "pulse_weekly_2026_w15",
  "entries": [
    {
      "rank": 1,
      "athlete": "María",
      "vector": 3,
      "machine": "airbike",
      "protocol": "Wingate 6×30",
      "score": "485 watts pico",
      "xp_earned": 475
    }
  ]
}
```

---

## 13. Métricas de Tracking

### 13.1 Por Sesión

| Métrica | Unidad | Aplica a |
|---------|--------|----------|
| **Watts pico** | W | Todos los vectores en todas las máquinas |
| **Watts promedio** | W | Todos los vectores |
| **Caída de watts (fatiga)** | % | Vector 2 y 3 (para regla del 15%) |
| **RPE al finalizar** | 1-10 | Todos los vectores |
| **Metros totales** | m | Remo, SkiErg, BikeErg, Trotadora |
| **Calorías** | kcal | Airbike, BikeErg |
| **Recuperación HR 2 min post** | bpm | Vector 2 y 3 |
| **Rondas completadas** | # | Protocolos con intervalos |
| **Ronda de aborto** | # | Si se activó regla del 15% |
| **Duración real** | min | Todos |

### 13.2 Por Semana (Tendencias)

| Métrica | Cálculo |
|---------|---------|
| Sesiones completadas por vector | Conteo V1, V2, V3 |
| Watts promedio semanal | Media de watts de todas las sesiones |
| Tasa de aborto | Sesiones abortadas / sesiones totales |
| Variedad de máquinas | Máquinas diferentes usadas |
| Cumplimiento de frecuencia | Sesiones realizadas vs planificadas |

---

## 14. Data Storage

```sql
CREATE TABLE "PulseSession" (
  "id"                    UUID PRIMARY KEY,
  "athleteId"             UUID NOT NULL,
  "weekNumber"            INT NOT NULL,
  "vector"                INT NOT NULL,        -- 1, 2, 3
  "vectorName"            VARCHAR NOT NULL,     -- "zona_2", "vo2_max", "anaerobic"
  "machine"               VARCHAR NOT NULL,     -- "airbike", "rower", "skierg", "bikeerg", "treadmill"
  "protocol"              VARCHAR NOT NULL,     -- "wingate_6x30", "4x4_clasico", "steady_30"...
  "difficulty"            VARCHAR NOT NULL,     -- "beginner", "intermediate", "advanced", "elite"
  "macrocyclePhase"       VARCHAR NOT NULL,     -- "preparation", "strength", "peaking"
  "placement"             VARCHAR NOT NULL,     -- "post_weights", "separate_session", "rest_day"

  -- Freshness Gate (snapshot al momento de asignar)
  "readinessAtAssign"     INT,
  "fatigueAtAssign"       INT,
  "sleepHours"            DECIMAL,
  "hrvPercentChange"      DECIMAL,

  -- Estructura del protocolo
  "rounds"                INT,
  "workSeconds"           INT,
  "restSeconds"           INT,
  "totalMinutes"          INT,
  "rpeTarget"             VARCHAR,              -- "8-9", "10", "4-5"

  -- Resultados
  "status"                VARCHAR NOT NULL,     -- "assigned", "in_progress", "completed", "aborted", "skipped"
  "wattsPeak"             INT,
  "wattsAverage"          INT,
  "wattsDropPercent"      DECIMAL,              -- Caída entre ronda 1 y última
  "metersTotal"           INT,
  "caloriesTotal"         INT,
  "roundsCompleted"       INT,
  "abortedAtRound"        INT,                  -- NULL si completado
  "abortReason"           VARCHAR,              -- "dropoff_15", "athlete_choice", "coach_override"
  "rpeFinal"              INT,                  -- 1-10
  "hrRecovery2min"        INT,                  -- HR 2 min post

  -- Gamificación
  "xpBase"                INT NOT NULL,
  "xpBonus"               INT DEFAULT 0,
  "xpTotal"               INT NOT NULL,
  "isPersonalRecord"      BOOLEAN DEFAULT FALSE,

  -- Timestamps
  "assignedAt"            TIMESTAMP NOT NULL,
  "startedAt"             TIMESTAMP,
  "completedAt"           TIMESTAMP,
  "createdAt"             TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pulse_athlete ON "PulseSession"("athleteId");
CREATE INDEX idx_pulse_week ON "PulseSession"("weekNumber");
CREATE INDEX idx_pulse_status ON "PulseSession"("status");
CREATE INDEX idx_pulse_vector ON "PulseSession"("vector");
```

---

## 15. Integration Points

### 15.1 Recibe de (Inputs)

| Engine | Dato | Uso |
|--------|------|-----|
| **01 Stress Engine** | readiness, fatigue | Freshness Gate (pasos 1, 4) |
| **03 Macrocycle Engine** | phase, heavy_squat_days | Frecuencia por fase + regla de no-interferencia |
| **12 Lifestyle Engine** | lifestyle_load_factor | Freshness Gate (paso 5) |
| **Dispositivo HRV** | hrv, sleep | Freshness Gate (pasos 2, 3) |
| **Perfil del Atleta** | oly_index, conditions | Escalado de dificultad + selección de máquina |

### 15.2 Alimenta a (Outputs)

| Engine | Dato | Uso |
|--------|------|-----|
| **01 Stress Engine** | training_load (watts × tiempo) | Contribuye al cálculo de fatiga/fitness |
| **04 Gamification Engine** | xp_earned | XP por completar sesiones |
| **14 Smart Coach Engine** | completion_rate, abort_rate | Alertas si atleta aborta mucho o salta sesiones |
| **16 Social Engine** | PR de watts, completar desafío | Tarjetas compartibles |
| **21 Leaderboard Cache** | weekly_score | Rankings semanales de Pulse |

---

## 16. Coach Dashboard — Pulse Analytics

```json
{
  "pulse_team_insights": {
    "completion_rate": 0.87,
    "abort_rate": 0.08,
    "average_watts_trend": "+3.2% vs last 4 weeks",
    "most_used_machine": "airbike",
    "vector_distribution": {
      "vector_1": 45,
      "vector_2": 35,
      "vector_3": 20
    },
    "freshness_gate_blocks": {
      "total_blocks": 12,
      "by_reason": {
        "low_readiness": 5,
        "poor_sleep": 4,
        "hrv_drop": 2,
        "high_fatigue": 1
      }
    },
    "at_risk_athletes": [
      {
        "athlete": "João",
        "concern": "3 sesiones V3 abortadas por dropoff en 2 semanas",
        "recommendation": "Reducir a V2 por 2 semanas, revisar recuperación"
      }
    ]
  }
}
```

---

## 17. Testing Checklist

- [ ] Freshness Gate bloquea Vector 2 y 3 cuando readiness < 60
- [ ] Freshness Gate bloquea cuando sleep < 7 horas
- [ ] Freshness Gate bloquea cuando HRV cae >15%
- [ ] Freshness Gate bloquea cuando fatigue > 75
- [ ] Freshness Gate bloquea V3 si ayer fue Fuerza Máxima tren inferior
- [ ] Freshness Gate bloquea V3 si mañana hay Sentadilla Pesada
- [ ] Solo Vector 1 en fase Peaking
- [ ] Regla del 15% aborta sesión cuando watts caen
- [ ] No se repite misma máquina + mismo vector en la semana
- [ ] Máximo 2 sesiones V3 por semana
- [ ] Selección de máquina respeta condición del atleta (rodilla, espalda)
- [ ] XP se calcula correctamente (base + bonificaciones)
- [ ] Leaderboard semanal se actualiza tras completar sesión
- [ ] Coach dashboard muestra abort_rate y freshness_gate_blocks
- [ ] Protocolo correcto se asigna según vector + máquina + dificultad
- [ ] Integración con Stress Engine (training_load contribuye a fatiga)
- [ ] Nutrición: nota de carbohidratos peri-entrenamiento en V2 y V3

---

## 18. Parámetros Críticos de Configuración

| Parámetro | Valor Default | Configurable | Notas |
|-----------|---------------|--------------|-------|
| `READINESS_MIN_V2` | 60 | Sí | Umbral mínimo para Vector 2 |
| `READINESS_MIN_V3` | 80 | Sí | Umbral mínimo para Vector 3 |
| `SLEEP_MIN_HOURS` | 7 | Sí | Mínimo para V2/V3 |
| `HRV_DROP_THRESHOLD` | -15% | Sí | vs línea base 7 días |
| `FATIGUE_MAX_V2V3` | 75 | Sí | Stress Engine fatigue |
| `FATIGUE_UNLOCK_V2V3` | 60 | Sí | Umbral para re-habilitar V2/V3 |
| `LIFESTYLE_MAX_V2V3` | 70 | Sí | Lifestyle Engine load factor |
| `DROPOFF_THRESHOLD` | 0.85 | Sí | 15% caída = abortar |
| `MAX_V3_PER_WEEK` | 2 | Sí | Límite semanal de sprints |
| `MAX_V2_PER_WEEK` | 2 | Sí | Límite semanal de VO2 Max |
| `MIN_HOURS_AFTER_WEIGHTS` | 6 | Sí | Separación mínima en sesión aparte |
| `MAX_CONTINUOUS_EFFORT_SEC` | 90 | No | Regla de seguridad: >90s puede convertir fibras rápidas→lentas |

---

**Generado:** 2026-04-11  
**Fuente:** Investigación de periodización anaeróbica para levantadores olímpicos  
**Integración:** Stress Engine, Macrocycle Engine, Lifestyle Engine, Gamification, Smart Coach, Social, Leaderboard  
**Status:** ✅ Completo — Listo para implementación
