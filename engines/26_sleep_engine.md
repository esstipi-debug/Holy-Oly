# 26. Sleep Engine — Recovery Quality Cascade

**Propósito:** Calcular Sleep Score diferenciando horas totales, N3 (recuperación muscular) y REM (consolidación motora). Aplicar cascada de 3 niveles (agudo → crónico → tolerancia) con intervenciones automáticas sobre Readiness y Macrociclo.

**Status:** Spec completa — pendiente integración frontend  
**Frecuencia:** Una vez por noche (al registrar sueño) + recálculo media móvil 7d  
**Spec fuente:** `sleep/SLEEP_BRAIN.md`

---

## Sleep Score — Fórmula base

```javascript
function calculateSleepScore(sleep) {
  const { total_hours, deep_pct, rem_pct, efficiency_pct, latency_mins } = sleep;

  // Componente 1: Horas totales (peso 40%)
  const horasNorm = Math.min(total_hours / 8.5, 1.0) * 100;

  // Componente 2: N3 + REM combinados (peso 30%)
  // Atleta fuerza: N3 óptimo 15-25%, REM óptimo 20-25%
  const deepNorm  = Math.min(deep_pct / 20.0, 1.0);
  const remNorm   = Math.min(rem_pct  / 22.5, 1.0);
  const deepRemNorm = ((deepNorm * 0.5) + (remNorm * 0.5)) * 100;

  // Componente 3: Eficiencia (peso 20%)
  const efficiencyScore = efficiency_pct; // Ya es 0-100

  // Componente 4: Latencia (peso 10%)
  let latencyScore;
  if (latency_mins >= 10 && latency_mins <= 20) latencyScore = 100; // Óptimo
  else if (latency_mins < 10) latencyScore = 70;                    // Demasiado rápido → deuda acumulada
  else latencyScore = Math.max(0, 100 - (latency_mins - 20) * 3);  // Penaliza progresivo

  return Math.round(
    (0.4 * horasNorm) +
    (0.3 * deepRemNorm) +
    (0.2 * efficiencyScore) +
    (0.1 * latencyScore)
  );
}
```

### Zonas Sleep Score

| Zona | Rango | Habilitaciones |
|------|-------|----------------|
| **OPTIMAL** | > 85 | Alta intensidad + técnica compleja habilitadas |
| **WARNING** | 70 – 85 | -10% series accesorias. RPE puede estar elevado |
| **CRITICAL** | < 70 | -10-15% 1RM + -20% volumen. Intervención automática |

---

## Cascada de 3 Niveles

```javascript
function evaluateSleepCascade(athlete) {
  const {
    last_night,          // Sleep Score última noche
    avg_7d,              // Media móvil 7 días
    caffeineStreakDays,   // Del Caffeine Engine
    caffeineDebt7d,      // Consumo acumulado > umbral
    consecutive_critical // Días consecutivos con score < 70
  } = athlete.sleepMetrics;

  const alerts    = [];
  const actions   = [];

  // ─── NIVEL 1: AGUDO ─────────────────────────────────────────────────────
  // Sueño < 6h (o score < 70) en 1-2 noches aisladas
  if (last_night.total_hours < 6 || last_night.score < 70) {
    alerts.push({
      level: 'AGUDO',
      severity: 'WARNING',
      athlete_msg: 'Sueño corto anoche. Rendimiento afectado hoy — escucha a tu cuerpo.',
      coach_msg: `Atleta con Sleep Score ${last_night.score} (anoche). RPE puede estar elevado hoy.`,
    });
    actions.push({ type: 'LOAD_REDUCE', pct: 0.15, target: 'hoy' });
  }

  // ─── NIVEL 2: CRÓNICO ───────────────────────────────────────────────────
  // Deuda de sueño acumulada > 6h en los últimos 7 días
  // ó score medio < 70 por 3+ días consecutivos
  const sleep_debt_7d = Math.max(0, (8.5 * 7) - athlete.sleepMetrics.total_hours_7d);
  if (sleep_debt_7d > 6 || consecutive_critical >= 3) {
    alerts.push({
      level: 'CRONICO',
      severity: 'CRITICAL',
      athlete_msg: 'Déficit acumulado grave. Hoy priorizamos calidad sobre cantidad. Intensidad reducida.',
      coach_msg: `Sleep Score < 70 por ${consecutive_critical} días consecutivos. Revisar carga del macrociclo.`,
    });
    actions.push({
      type: 'DELOAD_FORCED',
      pct: 0.20,
      target: 'semana',
      exit_condition: 'avg_7d > 75 por 3 días',
    });
  }

  // ─── NIVEL 3: TOLERANCIA / CNS ──────────────────────────────────────────
  // Cafeína sostenida + deuda de sueño crónica = riesgo SNC
  if (caffeineStreakDays > 5 && sleep_debt_7d > 4) {
    alerts.push({
      level: 'TOLERANCIA',
      severity: 'CRITICAL',
      athlete_msg: 'Tu sistema nervioso está en estrés combinado (sueño + cafeína). Necesitas un washout.',
      coach_msg: 'CNS en riesgo: cafeína crónica + deuda de sueño. Caffeine taper + deload simultáneos.',
    });
    actions.push({
      type: 'CAFFEINE_TAPER',
      duration_days: 7,
      max_mgkg: 1.0,
    });
    actions.push({
      type: 'DELOAD_FORCED',
      pct: 0.25,
      target: 'semana',
    });
  }

  return { alerts, actions };
}
```

---

## Intervenciones automáticas

### WARNING (nivel agudo)

```javascript
function applyAcuteIntervention(session) {
  // -10% en series accesorias únicamente
  session.accessory_sets = Math.floor(session.accessory_sets * 0.90);
  session.alert_badge = '⚠️ Sueño bajo';
  return session;
}
```

### CRITICAL (nivel crónico)

```javascript
function applyCriticalIntervention(session, athlete) {
  // -10-15% 1RM + -20% volumen total + foco en movilidad
  session.intensity_pct -= 12;                               // -12% promedio
  session.total_sets = Math.floor(session.total_sets * 0.80); // -20% volumen
  session.add_mobility_block = true;
  session.alert_badge = '🔴 Déficit sueño crónico';

  // Marca en macrociclo para revisión coach
  return {
    modified_session: session,
    macrocycle_flag: {
      type: 'SLEEP_REVIEW',
      athlete_id: athlete.id,
      triggered_at: new Date(),
    },
  };
}
```

### Deuda crónica — ajuste macrociclo

```javascript
function adjustMacrocycleForSleepDebt(macrocycleId, debtDays) {
  // Si el atleta lleva > 5 días con score < 70, descomprime la semana
  if (debtDays >= 5) {
    return {
      action: 'INSERT_DELOAD_WEEK',
      tonnage_factor: 0.60,  // 40% menos carga
      duration_days: 7,
      resume_condition: 'avg_7d_sleep > 75',
    };
  }
}
```

---

## Alertas por rol

### Atleta

| Tipo | Score | Mensaje |
|------|-------|---------|
| INFO | > 85 | "Sueño REM óptimo. Cerebro listo para trabajo técnico de hoy." |
| INFO (N3) | N3 > 20% | "Sueño profundo excelente. Recuperación muscular completa." |
| WARNING | 70-85 | "Sueño profundo bajo (<15%). Recuperación muscular incompleta. Escucha tu cuerpo." |
| CRITICAL | < 70 | "Déficit acumulado grave. Hoy priorizamos calidad sobre cantidad. Intensidad reducida." |

### Coach (adicional)

| Tipo | Trigger | Mensaje |
|------|---------|---------|
| WARNING | avg_7d 70-80 | "Atleta con Sleep Score {score} (7d avg). RPE puede estar elevado hoy." |
| CRITICAL | score < 70 por {n} días | "Sleep Score < 70 por {n} días consecutivos. Revisar carga del macrociclo." |
| CRITICAL | tolerancia | "CNS en riesgo: cafeína crónica + deuda sueño. Taper + deload recomendados." |

---

## Schema

```sql
CREATE TABLE sleep_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID NOT NULL REFERENCES athletes(id),
  date             DATE NOT NULL,
  total_hours      DECIMAL(4,2),
  deep_pct         DECIMAL(5,2),         -- % sueño N3
  rem_pct          DECIMAL(5,2),         -- % sueño REM
  efficiency_pct   DECIMAL(5,2),
  latency_mins     INT,
  sleep_score      INT,                  -- 0-100 calculado
  source           VARCHAR(20) DEFAULT 'manual',  -- 'oura' | 'whoop' | 'garmin' | 'manual'
  cascade_level    VARCHAR(20),          -- NULL | 'AGUDO' | 'CRONICO' | 'TOLERANCIA'
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (athlete_id, date)
);

CREATE INDEX ON sleep_logs (athlete_id, date DESC);

CREATE TABLE sleep_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID NOT NULL REFERENCES athletes(id) UNIQUE,
  target_hours     DECIMAL(3,1) DEFAULT 8.5,
  target_deep_pct  DECIMAL(4,1) DEFAULT 20.0,
  target_rem_pct   DECIMAL(4,1) DEFAULT 22.5,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Visualizaciones (frontend spec)

| # | Gráfico | Vista | Datos |
|---|---------|-------|-------|
| 1 | Barras Sleep Score 7d | Atleta | Score diario con zona coloreada (verde/amarillo/rojo) |
| 2 | Stacked bar N3 + REM + Light | Coach | Composición del sueño por noche |
| 3 | Línea media móvil 7d | Coach | Trend de recuperación |
| 4 | Badge cascada en B10 | Atleta | Ícono nivel activo: ⚠️ / 🔴 / 🚨 |
| 5 | Panel cafeína + sueño combinado | Coach | C_residual vs Sleep Score scatter |

---

## Integración con otros engines

| Engine | Modificación |
|--------|-------------|
| **Stress Engine** | Sleep Score < 70 → Fatigue multiplier × 1.15 |
| **Session Adaptation** | Sleep Score < 70 → `riskScore += 20` |
| **Caffeine Engine (25)** | Sleep Score crónico < 70 → adelanta curfew 2h |
| **Hormonal Engine (13)** | Fase lútea → ajuste esperado de eficiencia y latencia |
| **Macrocycle Engine (03)** | Deuda > 5 días → INSERT_DELOAD_WEEK |

---

**Generado:** 2026-04-29  
**Fuente:** `sleep/SLEEP_BRAIN.md`  
**Integración status:** Spec completa — pendiente UI
