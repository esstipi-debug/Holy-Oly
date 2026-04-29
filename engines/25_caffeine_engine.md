# 25. Caffeine Engine — CNS Masking Detector

**Propósito:** Modelar la farmacocinética de la cafeína (Bateman) y detectar enmascaramiento de fatiga antes de que se convierta en sobreentrenamiento. Aplicar intervenciones automáticas sobre Readiness, Risk Score y Macrociclo.

**Status:** Spec completa — pendiente integración frontend  
**Frecuencia:** Por dosis registrada + recálculo nocturno 00:30 UTC  
**Spec fuente:** `caffeine/CAFFEINE_BRAIN.md`

---

## Módulo 1 — Filtro de Intensidad

Solo activa el engine cuando el estímulo de entrenamiento es suficiente para que la cafeína importe.

```javascript
const THRESHOLD_1RM = 0.55;

function shouldActivateCaffeineEngine(liftedPct, sessionType) {
  // Solo activa si el atleta está trabajando ≥ 55% de su 1RM
  // o si el WOD tiene componente metabólico significativo
  if (liftedPct >= THRESHOLD_1RM) return true;
  if (sessionType === 'metcon' || sessionType === 'benchmark') return true;
  return false;
}
```

**Por qué 55%:** Por debajo de ese umbral la cafeína no modifica apreciablemente el output de fuerza ni enmascara fatiga neuromuscular relevante.

---

## Módulo 2 — Multiplicador de Estrés Oculto

Cuando la cafeína está activa durante la sesión, el RPE reportado está artificialmente bajo. El engine corrige para el Stress Engine.

```javascript
function calculateHiddenStressMultiplier(doseMg, timeSinceConsumeMins, peakCresidual) {
  // Cafeína alta + reciente = enmascaramiento activo
  if (doseMg > 200 && timeSinceConsumeMins < 120) {
    return 1.20; // +20% stress real vs reportado
  }
  // Dosis moderada o ya metabolizando
  if (doseMg > 100 && peakCresidual > 80) {
    return 1.10; // +10% stress
  }
  return 1.0; // Sin corrección
}

// Aplicación en Stress Engine:
// session_load_real = session_load_reported * hiddenStressMultiplier
```

---

## Módulo 3 — Castigo de Readiness (C_residual)

La cafeína circulante en ventana de sueño bloquea adenosina → suprime N3 y REM → degrada recuperación.

### Modelo de Bateman bicompartimental

```javascript
function bateman(D, t, genotipo = 'A/A') {
  const F  = 0.99;   // Biodisponibilidad
  const ka = 0.023;  // Absorción /min (Cmax ~50min)
  const Vd = 0.6;    // L/kg
  
  // Ajuste CYP1A2
  const ke_base = 0.0058; // T½ ~5.5h promedio
  const ke_multiplier = { 'A/A': 1.0, 'A/C': 0.75, 'C/C': 0.55 };
  const ke = ke_base * (ke_multiplier[genotipo] || 1.0);

  return ((D * F * ka) / (Vd * (ka - ke))) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

// Múltiples dosis: superposición lineal
function cResidualTotal(doses, t_now) {
  // doses: [{ mg, t_consumed_mins }]
  return doses.reduce((sum, d) => {
    const elapsed = t_now - d.t_consumed_mins;
    if (elapsed < 0) return sum;
    return sum + bateman(d.mg, elapsed, d.genotipo);
  }, 0);
}
```

### Curfew dinámico

```javascript
function getCaffeineCurfew(bedtime_mins, redFlag = false) {
  // redFlag = ACWR > 1.5 + HRV bajo
  const windowMins = redFlag ? 720 : 600; // 12h vs 10h antes de dormir
  return bedtime_mins - windowMins;
}

function applyReadinessPenalty(readiness, cResidual, bedtime_mins) {
  const t_to_sleep_mins = bedtime_mins - Date.now() / 1000 / 60;

  // C_residual proyectado en ventana de sueño
  const c_at_sleep = cResidualTotal(/* doses */, bedtime_mins);

  if (c_at_sleep > 100) {
    return Math.min(readiness, 65); // Sueño severamente comprometido
  }
  if (c_at_sleep > 50) {
    return Math.min(readiness, 75); // Sueño parcialmente comprometido
  }
  return readiness;
}
```

---

## Módulo 4 — Alertas por Nivel

### Reglas de disparo

```javascript
function getCaffeineAlerts(athlete) {
  const {
    cResidual, doseMgKg, caffeineStreakDays,
    sleepDebt7d, hrv_zscore, acwr, rpe_vs_tonnage_delta
  } = athlete;

  const alerts = [];

  // INFO
  if (cResidual > 80) {
    alerts.push({
      level: 'INFO',
      msg: 'Cafeína activa alta. Tu percepción de esfuerzo puede estar subestimada.',
      audience: ['athlete', 'coach'],
    });
  }

  // INFO curfew
  const curfewViolated = checkCurfewViolation(athlete.lastDoseTime, athlete.bedtime);
  if (curfewViolated) {
    alerts.push({
      level: 'INFO',
      msg: 'Tomaste cafeína después del curfew. Sueño REM potencialmente afectado.',
      audience: ['athlete'],
    });
  }

  // WARNING enmascaramiento
  if (Math.abs(rpe_vs_tonnage_delta) > 15) {
    alerts.push({
      level: 'WARNING',
      msg: 'RPE reportado no coincide con tonelaje real. Posible enmascaramiento activo.',
      audience: ['athlete', 'coach'],
    });
  }

  // WARNING tolerancia
  if (doseMgKg > 2.5 && caffeineStreakDays >= 5) {
    alerts.push({
      level: 'WARNING',
      msg: `Llevas ${caffeineStreakDays} días con consumo > 2.5 mg/kg. Considera reducir.`,
      audience: ['athlete', 'coach'],
    });
  }

  // WARNING HRV correlación
  if (hrv_zscore < -1.0 && cResidual > 60) {
    alerts.push({
      level: 'WARNING',
      msg: 'HRV bajo coincide con C_residual elevado de anoche.',
      audience: ['athlete', 'coach'],
    });
  }

  // CRITICAL — solo coach
  if (doseMgKg > 2.5 && caffeineStreakDays >= 7) {
    alerts.push({
      level: 'CRITICAL',
      msg: 'Tolerancia metabólica detectada. Washout recomendado: 7-10 días.',
      audience: ['coach'],
      action: 'WASHOUT_PROTOCOL',
    });
  }

  if (acwr > 1.5 && hrv_zscore < -1.5 && Math.abs(rpe_vs_tonnage_delta) > 15) {
    alerts.push({
      level: 'CRITICAL',
      msg: 'Red Flag OTS: ACWR crítico + HRV bajo + enmascaramiento. Descarga automática aplicada.',
      audience: ['coach'],
      action: 'AUTO_DELOAD',
    });
  }

  return alerts;
}
```

### Tabla de umbrales

| Condición | Umbral | Alerta | Acción |
|-----------|--------|--------|--------|
| `cResidual` alto | > 100mg en sueño | WARNING | Cap readiness 65 |
| `cResidual` medio | 50-100mg en sueño | INFO | Cap readiness 75 |
| `doseMgKg` sostenido | > 2.5 por ≥ 7d | CRITICAL | Washout 7-10d |
| `acwr` + HRV + masking | > 1.5 + zscore < -1.5 | CRITICAL | -20-35% tonelaje |
| RPE vs tonelaje | delta > 15% | WARNING | Corrección Stress Load |

---

## Intervenciones automáticas

### Washout neuroquímico

```javascript
function triggerWashoutProtocol(macrocycleId) {
  // Reducir a < 1.0 mg/kg/día por 7-10 días
  // Flag atleta con modo "washout" que suprime sugerencias de cafeína
  return {
    protocol: 'CAFFEINE_WASHOUT',
    duration_days: 7,
    target_mgkg: 0.8,
    expected_symptoms: ['headache', 'fatigue_d1-d3'],
    macrocycle_adjustment: null, // No cambiar macrociclo
  };
}
```

### Descarga mecánica OTS

```javascript
function triggerAutoDeload(macrocycleId, readiness) {
  const deload_pct = readiness < 50 ? 0.35 : 0.20;
  return {
    protocol: 'OTS_DELOAD',
    tonnage_reduction: deload_pct,
    exit_condition: 'readiness > 60 por 3 días consecutivos',
    review_after_days: 3,
  };
}
```

---

## Schema — caffeine_settings

```sql
CREATE TABLE caffeine_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID NOT NULL REFERENCES athletes(id),
  genotipo      VARCHAR(3) DEFAULT 'A/A',    -- 'A/A' | 'A/C' | 'C/C'
  weight_kg     DECIMAL(5,1) NOT NULL,
  bedtime_hour  INT DEFAULT 22,              -- 0-23 hora de dormir objetivo
  curfew_strict BOOLEAN DEFAULT FALSE,       -- true en post Red Flag
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE caffeine_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES athletes(id),
  logged_at       TIMESTAMPTZ NOT NULL,
  dose_mg         INT NOT NULL,
  source          VARCHAR(50),               -- 'coffee' | 'pre-workout' | 'tea' | 'other'
  c_residual_calc DECIMAL(6,2),              -- calculado al guardar
  curfew_violated BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON caffeine_logs (athlete_id, logged_at DESC);
```

---

## Visualizaciones (frontend spec)

| # | Gráfico | Vista | Datos |
|---|---------|-------|-------|
| 1 | Curva Bateman diaria (línea) | Atleta + Coach | `C(t)` hora a hora desde primera dosis |
| 2 | Zona curfew sombreada | Atleta | Franja roja = ventana de sueño en riesgo |
| 3 | Scatter RPE vs Tonelaje | Coach | Color = cResidual → detecta enmascaramiento |
| 4 | Heatmap semanal hora×día | Coach | Patrones de consumo recurrente |
| 5 | Timeline ACWR + Readiness + Cafeína | Coach | Cascada hacia OTS |

---

## Integración con otros engines

| Engine | Modificación |
|--------|-------------|
| **Stress Engine** | `session_load *= hiddenStressMultiplier(cResidual)` |
| **Session Adaptation** | `riskScore += caffeineRiskModifier(cResidual, acwr)` |
| **Macrocycle Engine** | `tonnage *= (1 - deload_pct)` si Red Flag |
| **Sleep Engine (26)** | Adelanta curfew si Sleep Score crónico < 70 |

---

**Generado:** 2026-04-29  
**Fuente:** `caffeine/CAFFEINE_BRAIN.md`  
**Integración status:** Spec completa — pendiente UI
