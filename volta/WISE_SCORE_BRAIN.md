# WISE_SCORE_BRAIN.md
# Volta — Wise Score: Diseño Completo

---

## Definición

El Wise Score es la stat estrella de Volta: un número 0–99 que representa el nivel atlético
real de un atleta de CrossFit, normalizado por edad, peso corporal, sexo y nivel.

---

## Fórmula General

```
Wise Score = 0.25 × Strength Index
           + 0.25 × Engine Score
           + 0.20 × Gymnastics Index
           + 0.15 × Benchmark Percentile
           + 0.15 × Consistency Score

Normalizado por: edad (Sinclair) + peso corporal (BW relativo + categoría) + sexo (tablas H/M) + nivel (0-99 por nivel)
```

---

## 1. Strength Index (peso 25%)

### Tracks
El atleta puede tener uno o ambos tracks activos:

| Track | Movimientos |
|-------|-------------|
| **Oly** | Back Squat 3RM + Clean 1RM + Press overhead 1RM |
| **CrossFit** | Back Squat 3RM + Deadlift 1RM + Shoulder Press 1RM |

### Score por movimiento
```
Score_movimiento = (lift_kg / BW_kg) × factor_nivel
```

Factores de normalización por nivel:

| Nivel | Factor |
|-------|--------|
| Scaled | 1.0 |
| Rx | 1.3 |
| Competitor | 1.6 |

### Agregación
```
Strength_Index_track = promedio(score_mov1, score_mov2, score_mov3) → normalizado 0-100
Strength_Index = promedio(track_activos)
```

---

## 2. Engine Score (peso 25%)

### Componentes

| Componente | Test | Qué mide |
|------------|------|----------|
| Potencia corta | Fran (tiempo) | Potencia aeróbica alta intensidad |
| Capacidad media | 2K row (tiempo) | VO2max proxy |
| Capacidad larga | 12-min AMRAP o 5K row | Resistencia aeróbica |

### Pesos
- Default: 33% / 33% / 33%
- Configurable por coach y atleta (sliders, suman 100%)

### Tablas de referencia por nivel

**Fran:**
| Nivel | Tiempo | Score |
|-------|--------|-------|
| Scaled | >10 min | 0–40 |
| Rx | 5–10 min | 40–75 |
| Competitor | <5 min | 75–100 |

**2K Row:**
| Nivel | Tiempo | Score |
|-------|--------|-------|
| Scaled | >9 min | 0–40 |
| Rx | 7–9 min | 40–75 |
| Competitor | <7 min | 75–100 |

**12-min AMRAP / 5K Row:**
| Nivel | Resultado | Score |
|-------|-----------|-------|
| Scaled | Bajo | 0–40 |
| Rx | Medio | 40–75 |
| Competitor | Alto | 75–100 |

### Tablas override
El coach puede definir tiempos de referencia propios por box.
Se almacenan en `engine_score_config` por box_id.

### Fórmula
```
Engine_Score = (w1 × score_corto) + (w2 × score_medio) + (w3 × score_largo)
donde w1 + w2 + w3 = 1.0
```

---

## 3. Gymnastics Index (peso 20%)

### Movimientos base (Rx)

| Movimiento | Peso relativo |
|------------|---------------|
| Muscle Up anillas | 5 |
| Muscle Up barra | 4 |
| HSPU estricto | 3 |
| Pistol Squat | 2 |
| Handstand Walk | 3 |

### Escalamiento Mayhem (si atleta no tiene ningún Rx)

| Movimiento Rx | Versión Scaled |
|---------------|----------------|
| MU anillas | Ring Row → Jumping MU |
| MU barra | Chest-to-bar → Kipping Pull-up |
| HSPU estricto | Pike Push-up → Box HSPU |
| Pistol Squat | Squat asistido → Pistol con soporte |
| Handstand Walk | Handstand hold → HS contra pared |

### Evaluación por coach (3 preguntas — iguales para todos los movimientos)

| Pregunta | Escala |
|----------|--------|
| ¿Lo ejecuta bien? | 1–5 |
| ¿Reps unbroken? | número → 1–5 (tabla por movimiento) |
| ¿Lo usa en WODs? | sí=3 / a veces=2 / no=1 |

```
Score_movimiento = suma(3 preguntas) × peso_movimiento
Gymnastics_Index = suma(score_movimientos) → normalizado 0-100
```

### Progresión
El coach sube de nivel al atleta manualmente cuando mejora.
Cada subida queda registrada con fecha para tracking histórico.

---

## 4. Benchmark Percentile (peso 15%)

### Benchmarks base

| Benchmark | Scaled | Rx | Competitor |
|-----------|--------|-----|------------|
| Fran | >10 min | 5–10 min | <5 min |
| Grace | >8 min | 4–8 min | <4 min |
| Isabel | >10 min | 5–10 min | <5 min |
| Helen | >18 min | 12–18 min | <12 min |
| Cindy | <10 rds | 10–15 rds | >15 rds |
| Murph | >60 min | 40–60 min | <40 min |

### Configuración
- Coach y atleta eligen qué benchmarks mostrar/trackear
- Cada box puede agregar benchmarks propios
- Medición arbitraria: tiempo, reps, carga — lo que aplique

### Percentil
- Referencia: tablas base por nivel (Scaled/Rx/Competitor)
- Score proporcional dentro del rango de su nivel
- Se actualiza cada vez que el atleta registra un benchmark

```
Benchmark_Percentile = promedio(score_benchmarks_activos) → 0-100
```

---

## 5. Consistency Score (peso 15%)

### Qué mide
- % sesiones completadas vs planificadas
- Racha de días sin saltar
- Combo de ambas (50/50 por defecto)

### Ventana de tiempo
- Configurable por coach (default: 4 semanas)

### Penalización
- Lineal: cada sesión perdida resta proporcionalmente

```
Consistency_Score = 0.5 × (sesiones_completadas / sesiones_planificadas × 100)
                  + 0.5 × (racha_actual / racha_objetivo × 100)
→ clamped 0-100
```

---

## Normalización por Perfil

| Variable | Método |
|----------|--------|
| **Edad** | Ajuste tipo Sinclair (coeficiente por edad) |
| **Peso corporal** | Strength relativo a BW + categorías para comparación entre atletas |
| **Sexo** | Tablas separadas H/M (cada una tiene su 0-99) |
| **Nivel** | 0-99 propio por nivel (Scaled tiene su 0-99, Rx el suyo, Competitor el suyo) |

### Fórmula final normalizada
```
Wise_Score_raw = Σ(sub_índices × pesos)
Wise_Score = Wise_Score_raw × sinclair_factor(edad) × ajuste_sexo × ajuste_nivel
→ clamped 0-99
```

---

## Output al usuario

- Número 0–99 con badge de nivel (Scaled/Rx/Competitor)
- Breakdown por sub-índice (radar chart recomendado)
- Histórico de evolución
- Comparación vs atletas del mismo nivel y sexo
