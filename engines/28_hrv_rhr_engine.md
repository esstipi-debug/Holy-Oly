# 28. HRV/RHR Engine — Autonomic Nervous System Tracker

**Propósito:** Calcular baseline personal de HRV y RHR, detectar desviaciones estadísticamente significativas (Zscore), y generar el HRV Zscore que alimenta CNS Score, Caffeine Engine y Session Adaptation. Personalizado por atleta — no usa tablas poblacionales.

**Status:** Spec completa — pendiente integración frontend  
**Frecuencia:** Una vez por mañana al registrar/sincronizar datos  
**Fuente de datos:** Engine 27 (Wearable Sync) + formulario manual  
**Outputs hacia:** Engine 01 CNS Score, Engine 25 Caffeine, Engine 02 Session Adaptation

---

## Por qué baseline personal (no tablas poblacionales)

Un HRV de 45ms puede ser excelente para un atleta de 45 años o señal de fatiga para un joven de 22. Lo que importa es la **desviación respecto al propio baseline**.

El engine trabaja con Zscore personal:
```
Z = (HRV_hoy - μ_14d) / σ_14d
```

Un Z > +1.5 = por encima de la norma propia → bien recuperado  
Un Z < -1.5 = por debajo → SNC comprometido

---

## Construcción del baseline

### Ventana principal: 14 días

```javascript
function buildBaseline(snapshots, window = 14) {
  // Solo usar días sin sesión de alta intensidad (evita outliers post-entrenamiento)
  const rest_or_low = snapshots
    .slice(0, window)
    .filter(s => s.session_intensity < 0.70); // < 70% 1RM promedio

  if (rest_or_low.length < 5) {
    // Sin suficientes datos limpios → usar todos los días disponibles
    return computeStats(snapshots.slice(0, window));
  }
  return computeStats(rest_or_low);
}

function computeStats(values) {
  const hrv = values.map(v => v.hrv_rmssd).filter(Boolean);
  const rhr = values.map(v => v.rhr_bpm).filter(Boolean);
  return {
    hrv_mean: mean(hrv),
    hrv_std:  stddev(hrv),
    rhr_mean: mean(rhr),
    rhr_std:  stddev(rhr),
    n:        hrv.length,
  };
}
```

### Primer uso — periodo de calibración

| Días con datos | Estado |
|---------------|--------|
| < 5 | Baseline insuficiente — usar defaults poblacionales |
| 5-13 | Baseline parcial — Zscore menos confiable, indicar al usuario |
| ≥ 14 | Baseline estable |

---

## Cálculo del HRV Zscore

```javascript
function calculateHRVZscore(hrv_today, baseline) {
  if (!baseline.hrv_std || baseline.hrv_std < 0.5) {
    // Desviación estándar muy baja = datos muy estables = usar mínimo 2ms
    baseline.hrv_std = Math.max(baseline.hrv_std, 2.0);
  }
  return (hrv_today - baseline.hrv_mean) / baseline.hrv_std;
}

function calculateRHRZscore(rhr_today, baseline) {
  // RHR: más alto es peor (inverso a HRV)
  if (!baseline.rhr_std || baseline.rhr_std < 0.5) {
    baseline.rhr_std = Math.max(baseline.rhr_std, 1.0);
  }
  return -1 * (rhr_today - baseline.rhr_mean) / baseline.rhr_std;
  // Negativo porque RHR alto = estado malo = Zscore negativo
}
```

---

## Zonas de interpretación

### HRV Zscore

| Zscore | Zona | Significado | Acción |
|--------|------|-------------|--------|
| > +2.0 | Supercompensación | Excelente adaptación. Sesión de alto volumen habilitada | INFO positivo |
| +1.0 a +2.0 | Por encima del promedio | Bien recuperado | Sin acción |
| -1.0 a +1.0 | Normal | Zona verde | Sin acción |
| -1.5 a -1.0 | Por debajo del promedio | Inicio de fatiga autonómica | INFO atleta |
| < -1.5 | Bajo — SNC comprometido | Fatiga neural activa | WARNING → cap intensidad |
| < -2.0 | Crítico | Sobreentrenamiento potencial | CRITICAL → bloquear sesión intensa |

### RHR Zscore (misma escala)

| Zscore | Zona | Nota |
|--------|------|------|
| > +1.0 | RHR bajo (bien) | Recuperación autonómica completa |
| -1.5 a 0 | RHR normal-alto | Vigilancia |
| < -1.5 | RHR elevado (mal) | Señal de sobreestimulación simpática |

---

## HRV Score compuesto (0-100)

Además del Zscore (relativo), el engine produce un score absoluto 0-100 para uso en UI:

```javascript
function calculateHRVScore(hrv_zscore, rhr_zscore) {
  // Combina HRV (70%) y RHR (30%)
  const hrv_component = clamp(50 + hrv_zscore * 15, 0, 100);
  const rhr_component = clamp(50 + rhr_zscore * 15, 0, 100);
  return Math.round(0.70 * hrv_component + 0.30 * rhr_component);
}
```

---

## Alertas

```javascript
function getHRVAlerts(athlete) {
  const { hrv_zscore, rhr_zscore, days_below_threshold, source } = athlete.hrvMetrics;
  const alerts = [];

  // Solo info si el wearable está conectado y hay baseline estable
  if (source === 'manual' && !athlete.hasWearable) {
    alerts.push({
      level: 'INFO',
      msg: 'Conecta un wearable para HRV automático. Ahora usamos tu reporte subjetivo.',
      audience: ['athlete'],
    });
  }

  if (hrv_zscore < -1.5) {
    alerts.push({
      level: 'WARNING',
      msg: `HRV ${Math.round(Math.abs(hrv_zscore * 10)) / 10}σ por debajo de tu baseline. Tu SNC no está recuperado.`,
      audience: ['athlete', 'coach'],
      action: 'CAP_INTENSITY_80PCT',
    });
  }

  if (hrv_zscore < -2.0) {
    alerts.push({
      level: 'CRITICAL',
      msg: 'HRV crítico. Sesiones de alta intensidad bloqueadas hoy. Movilidad o descanso.',
      audience: ['coach'],
      action: 'BLOCK_HIGH_INTENSITY',
    });
  }

  if (days_below_threshold >= 3) {
    alerts.push({
      level: 'CRITICAL',
      msg: `HRV bajo por ${days_below_threshold} días consecutivos. Revisar carga del macrociclo.`,
      audience: ['coach'],
      action: 'MACROCYCLE_REVIEW',
    });
  }

  // Supercompensación
  if (hrv_zscore > 2.0) {
    alerts.push({
      level: 'INFO',
      msg: 'HRV elevado. Ventana de supercompensación activa — sesión de fuerza máxima habilitada.',
      audience: ['athlete'],
    });
  }

  return alerts;
}
```

---

## Tendencia (7 días)

```javascript
function calculateHRVTrend(snapshots_7d) {
  const zscores = snapshots_7d
    .filter(s => s.hrv_rmssd !== null)
    .map(s => calculateHRVZscore(s.hrv_rmssd, s.baseline));

  if (zscores.length < 3) return { trend: 'INSUFFICIENT_DATA', slope: null };

  // Regresión lineal simple sobre los últimos 7 días
  const slope = linearSlope(zscores);

  if (slope > 0.15) return { trend: 'IMPROVING', slope };
  if (slope < -0.15) return { trend: 'DECLINING', slope };
  return { trend: 'STABLE', slope };
}
```

---

## Integración con CNS Score (Engine 01)

El CNS Score del Stress Engine usa HRV Zscore directamente:

```javascript
// Engine 01 — sección CNS Score
function computeCNSScore(signals) {
  const { hrv_today, baseline, rhr_today, sleep, subjective } = signals;

  const hrv_zscore = hrv_engine.calculateHRVZscore(hrv_today, baseline);
  const rhr_zscore = hrv_engine.calculateRHRZscore(rhr_today, baseline);

  // Normalizar HRV a 0-100
  const hrvNorm = clamp(50 + hrv_zscore * 15, 0, 100);
  // Normalizar RHR a 0-100 (ya invertido en calculateRHRZscore)
  const rhrNorm = clamp(50 + rhr_zscore * 15, 0, 100);

  const sleepNorm = sleep_engine.getSleepNorm(sleep);
  const subjectiveNorm = computeSubjectiveNorm(subjective);

  // Pesos estándar (con wearable)
  return Math.round(
    0.30 * hrvNorm +
    0.20 * rhrNorm +
    0.25 * sleepNorm +
    0.25 * subjectiveNorm
  );
}
```

---

## Gráficos (frontend spec)

| # | Gráfico | Vista | Datos |
|---|---------|-------|-------|
| 1 | Línea HRV 30 días con banda baseline±1σ | Atleta + Coach | `hrv_rmssd` + `hrv_mean ± hrv_std` |
| 2 | Barras Zscore diario (verde/amarillo/rojo) | Atleta | Zscore coloreado por zona |
| 3 | Sparkline tendencia 7d | Coach dashboard | Slope + ícono ↑/→/↓ |
| 4 | Scatter HRV vs Readiness | Coach | Correlación biométrico/rendimiento |
| 5 | Indicador "ventana supercompensación" | Atleta | Badge verde cuando Zscore > +2 |

---

## Schema

```sql
CREATE TABLE hrv_baselines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   UUID NOT NULL REFERENCES athletes(id),
  computed_at  DATE NOT NULL,
  window_days  INT DEFAULT 14,
  hrv_mean     DECIMAL(6,2),
  hrv_std      DECIMAL(6,2),
  rhr_mean     DECIMAL(5,2),
  rhr_std      DECIMAL(5,2),
  sample_n     INT,              -- Días usados para el cálculo
  UNIQUE (athlete_id, computed_at)
);

CREATE TABLE hrv_daily (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID NOT NULL REFERENCES athletes(id),
  date          DATE NOT NULL,
  hrv_rmssd     DECIMAL(6,2),
  rhr_bpm       INT,
  hrv_zscore    DECIMAL(5,3),
  rhr_zscore    DECIMAL(5,3),
  hrv_score     INT,             -- 0-100 compuesto
  hrv_trend_7d  VARCHAR(20),     -- 'IMPROVING' | 'STABLE' | 'DECLINING'
  days_below_threshold INT DEFAULT 0,
  source        VARCHAR(20),     -- De wearable_snapshots.source
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (athlete_id, date)
);

CREATE INDEX ON hrv_daily (athlete_id, date DESC);
```

---

## Integración con otros engines

| Engine | Qué recibe de HRV Engine |
|--------|--------------------------|
| **Stress Engine CNS (01)** | `hrv_zscore`, `rhr_zscore` → `hrvNorm`, `rhrNorm` → cnsScore |
| **Caffeine Engine (25)** | `hrv_zscore < -1.5` → activa alertas WARNING/CRITICAL |
| **Session Adaptation (02)** | `hrv_zscore < -2.0` → `BLOCK_HIGH_INTENSITY` |
| **Sleep Engine (26)** | `hrv_zscore` crónico bajo + sleep score bajo → cascada TOLERANCIA |
| **Smart Coach (14)** | Tendencia `DECLINING` 5+ días → alerta proactiva coach |

---

**Generado:** 2026-04-29  
**Integración status:** Spec completa — pendiente UI + wearable OAuth (Engine 27)
