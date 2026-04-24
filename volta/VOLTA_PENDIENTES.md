# Volta — Pendientes para completar engines

---

## PENDIENTE 1 — Wise Score: definir sub-índices

El Wise Score (stat estrella 0-99) está estructurado pero le faltan los parámetros de cada sub-índice.

**Fórmula ya definida:**
```
Wise Score = 0.25 × Strength Index
           + 0.25 × Engine Score
           + 0.20 × Gymnastics Index
           + 0.15 × Benchmark Percentile
           + 0.15 × Consistency Score

Normalizado por: edad + peso corporal + sexo
```

---

### 1.1 Strength Index (peso 25%)

**Qué necesitas definir:**
- ¿Qué movimientos forman el índice? Opciones:
  - Solo Back Squat 3RM
  - Combo: Back Squat + Clean + Press overhead (promedio o suma ponderada)
  - Relativo al peso corporal (ej: squat/BW × 100)
- ¿Cómo se normaliza a 0-100?
  - ¿Por nivel de atleta (Scaled/Rx/Competitor)?
  - ¿Por categoría de peso?

**Entrega esperada:** tabla con movimientos, fórmula de cálculo y tabla de normalización por nivel.

---

### 1.2 Engine Score (peso 25%)

**Qué necesitas definir:**
- ¿Cómo se estima la capacidad aeróbica?
  - Opción A: Tiempo en un WOD benchmark aeróbico (ej: 5K row, 2K row)
  - Opción B: Tiempo en Fran como proxy de potencia aeróbica
  - Opción C: Test específico (ej: 12-min AMRAP estándar)
- ¿Se estima VO2max o es una puntuación relativa?
- ¿Cómo varía por nivel de atleta?

**Entrega esperada:** test o WOD de referencia + tabla de tiempos por nivel → puntuación 0-100.

---

### 1.3 Gymnastics Index (peso 20%)

**Qué necesitas definir:**
- ¿Qué movimientos entran al índice? Candidatos:
  - Muscle Up (anillas y/o barra)
  - HSPU (estricto y/o kipping)
  - Pistol Squat
  - Bar Muscle Up
  - Handstand Walk
- ¿Cómo se puntúa cada uno? Opciones:
  - Binario (puede / no puede) con pesos distintos por dificultad
  - Cantidad de reps unbroken
  - Nivel técnico 1-5 por movimiento
- ¿Se suman o se promedian?

**Entrega esperada:** lista de movimientos, sistema de puntuación por movimiento y fórmula de agregación.

---

### 1.4 Benchmark Percentile (peso 15%)

**Qué necesitas definir:**
- ¿Qué benchmarks entran?
  - WODs clásicos: Fran, Murph, Cindy, Grace, Isabel, Helen
  - ¿Cuántos? ¿Todos o solo algunos?
- ¿Percentil contra quién?
  - Opción A: Base interna de atletas Volta (crece con el tiempo)
  - Opción B: Tiempos de referencia fijos por nivel (ej: Rx competidor = top 20%)
  - Opción C: Cruzado con resultados Open Chile (FaceWOD)
- ¿Cómo se actualiza? ¿Cada vez que el atleta hace un benchmark?

**Entrega esperada:** lista de benchmarks + tiempos de referencia por nivel + método de cálculo de percentil.

---

### 1.5 Consistency Score (peso 15%)

**Qué necesitas definir:**
- ¿Qué mide exactamente?
  - % de sesiones completadas vs planificadas
  - Racha de días sin saltar
  - Combinación de ambas
- ¿En qué ventana de tiempo? ¿4 semanas? ¿8 semanas? ¿Ciclo completo?
- ¿Cómo penaliza? ¿Lineal o con umbral?

**Entrega esperada:** fórmula de cálculo + ventana de tiempo + tabla de puntuación 0-100.

---

## PENDIENTE 2 — Wise Score: normalización por perfil

Una vez definidos los sub-índices, necesitas especificar cómo varía el Wise Score según:

| Variable | Pregunta |
|----------|----------|
| **Edad** | ¿Se ajusta como Sinclair o es solo informativo? |
| **Peso corporal** | ¿Strength Index relativo al BW? ¿O score absoluto? |
| **Sexo** | ¿Tablas separadas H/M o mismo score con ajuste? |
| **Nivel** | ¿Score 0-99 es universal o por nivel (Scaled tiene su 0-99)? |

---

## PENDIENTE 3 — V-Stress Engine: adaptar Banister a metcon

El Banister base está en el Stress Engine (halterofilia). Para CrossFit necesita:

- **Session Load en metcon** = ¿Cómo se calcula? Opciones:
  - Tiempo × RPE (simple)
  - Tonelaje + componente cardio (heart rate zone × minutos)
  - TRIMP (Training Impulse) adaptado
- **Componente cardio separado del muscular** — en un Metcon largo (20 min AMRAP) el daño es diferente a una pieza de fuerza
- **Sport bias para CrossFit** — ya existe 1.2x en el Stress Engine pero ¿se mantiene o se diferencia por tipo de WOD?

**Entrega esperada:** fórmula de Session Load para metcon + parámetros específicos CrossFit.

---

## Cómo entregar los pendientes

Trae cualquiera de estas formas:
- Respuestas directas a las preguntas de cada bloque
- Documento libre con la lógica que se te ocurra
- Referencias externas (papers, artículos, protocolos de coaches CrossFit)
- Conversación — el sistema pregunta y construye en vivo

Con cada pendiente resuelto, el sistema genera automáticamente:
- `WISE_SCORE_BRAIN.md`
- `wise_score_config.py`
- `v_stress_engine_config.py`
- `etl_wise_score.py`
