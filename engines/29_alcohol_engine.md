# 29. Alcohol Engine — Damage Control Intelligence

**Propósito:** Cuantificar el impacto real del alcohol en HRV, síntesis proteica y calidad de sueño. Clasificar el nivel de daño, sugerir acciones de mitigación, y ajustar automáticamente Readiness y Risk Score al día siguiente.

**Filosofía:** Este engine no juzga. El atleta tiene una vida real. El objetivo es minimizar el daño cuando ocurre — no eliminarlo.

**Status:** Spec completa — pendiente integración frontend  
**Frecuencia:** Al registrar consumo + recálculo matutino (con Sleep Score del día siguiente)  
**Spec fuente:** `alcohol/ALCOHOL_BRAIN.md`

---

## Módulo 1 — Calculadora de carga real

### Alcohol puro en gramos

```javascript
// Fórmula universal: volumen (ml) × graduación (decimal) × 0.789 (densidad alcohol)
function calcAlcoholGrams(volumeMl, abvPct) {
  return volumeMl * (abvPct / 100) * 0.789;
}

// Ejemplos:
// 330ml cerveza 5%: 330 × 0.05 × 0.789 = 13.0g
// 45ml vodka 40%:   45  × 0.40 × 0.789 = 14.2g
// 150ml vino 13%:   150 × 0.13 × 0.789 = 15.4g
```

### Catálogo de bebidas predefinidas

```javascript
const DRINKS_CATALOG = {
  // Destilados puros
  'vodka_shot':      { volume: 45,  abv: 40, carbs_g: 0,    name: 'Vodka (shot)' },
  'gin_shot':        { volume: 45,  abv: 42, carbs_g: 0,    name: 'Gin (shot)' },
  'whisky_shot':     { volume: 45,  abv: 43, carbs_g: 0,    name: 'Whisky (shot)' },
  'tequila_shot':    { volume: 45,  abv: 38, carbs_g: 0,    name: 'Tequila (shot)' },
  'ron_blanco_shot': { volume: 45,  abv: 40, carbs_g: 0,    name: 'Ron blanco (shot)' },

  // Fermentados
  'cerveza_lager':   { volume: 330, abv: 5,  carbs_g: 13,   name: 'Cerveza lager (330ml)' },
  'cerveza_light':   { volume: 330, abv: 4,  carbs_g: 4,    name: 'Cerveza light (330ml)' },
  'stout':           { volume: 330, abv: 5,  carbs_g: 18,   name: 'Stout/Porter (330ml)' },
  'vino_tinto_seco': { volume: 150, abv: 13, carbs_g: 3.8,  name: 'Vino tinto seco (copa)' },
  'vino_blanco_seco':{ volume: 150, abv: 12, carbs_g: 2.9,  name: 'Vino blanco seco (copa)' },
  'champagne_brut':  { volume: 150, abv: 12, carbs_g: 2.5,  name: 'Champagne Brut (copa)' },

  // Combinados Latam/España
  'caipirinha':      { volume: 200, abv: 14, carbs_g: 20,   name: 'Caipirinha' },
  'pisco_sour':      { volume: 165, abv: 15, carbs_g: 24,   name: 'Pisco Sour' },
  'mojito':          { volume: 180, abv: 10, carbs_g: 24,   name: 'Mojito' },
  'cuba_libre':      { volume: 250, abv: 10, carbs_g: 28,   name: 'Cuba Libre' },
  'gin_tonic':       { volume: 225, abv: 10, carbs_g: 16,   name: 'Gin Tonic (tónica regular)' },
  'gin_tonic_diet':  { volume: 225, abv: 10, carbs_g: 0,    name: 'Gin Tonic (tónica diet)' },
  'cuba_libre_light':{ volume: 250, abv: 10, carbs_g: 1,    name: 'Cuba Libre light' },
  'vodka_soda':      { volume: 225, abv: 8,  carbs_g: 0,    name: 'Vodka con soda/agua' },
  'pina_colada':     { volume: 200, abv: 11, carbs_g: 38,   name: 'Piña Colada' },
};
```

---

## Módulo 2 — Clasificación de daño

```javascript
function classifyDamage(drinks, athlete, bedtime_mins) {
  const total_alcohol_g = drinks.reduce((sum, d) => {
    const catalog = DRINKS_CATALOG[d.type] || d;
    return sum + calcAlcoholGrams(catalog.volume, catalog.abv);
  }, 0);

  const total_carbs_g = drinks.reduce((sum, d) => {
    return sum + (DRINKS_CATALOG[d.type]?.carbs_g || 0);
  }, 0);

  const grams_per_kg = total_alcohol_g / athlete.weight_kg;

  // Tiempo entre último trago y hora de dormir
  const last_drink_mins = Math.min(...drinks.map(d => d.logged_at_mins));
  const mins_to_bed     = bedtime_mins - last_drink_mins;
  const hours_to_bed    = mins_to_bed / 60;

  // Clasificación
  let level;
  if (
    grams_per_kg <= 0.5 &&
    hours_to_bed >= 3 &&
    total_carbs_g < 20
  ) {
    level = 'MINIMO';
  } else if (
    grams_per_kg <= 0.9 ||
    hours_to_bed < 3 ||
    total_carbs_g >= 20
  ) {
    level = 'MODERADO';
  } else {
    level = 'ALTO';
  }

  return {
    level,
    total_alcohol_g,
    grams_per_kg,
    total_carbs_g,
    hours_to_bed,
  };
}
```

### Tabla de clasificación

| Nivel | g/kg | Timing | Carbos | HRV supresión esperada |
|-------|------|--------|--------|----------------------|
| **MÍNIMO** | ≤ 0.5 | ≥ 3h antes de dormir | < 20g | < 5% — sin ajuste |
| **MODERADO** | 0.5–0.9 | < 3h | 20-40g | 10–20% — ajuste parcial |
| **ALTO** | > 1.0 | < 2h o inmediato | > 40g | 20–30% — bloqueo sesión intensa |

---

## Módulo 3 — Predicción de supresión HRV

```javascript
function predictHRVSuppression(grams_per_kg, hours_to_bed) {
  // Curva empírica basada en literatura (Burke et al., PLoS Digital Health 2024)
  let base_suppression_pct;
  if (grams_per_kg <= 0.5) base_suppression_pct = 3;
  else if (grams_per_kg <= 1.0) base_suppression_pct = 15;
  else base_suppression_pct = 25;

  // Efecto circadiano: alcohol cerca del sueño amplifica supresión
  const timing_multiplier = hours_to_bed < 2 ? 1.4 : hours_to_bed < 3 ? 1.2 : 1.0;

  const suppression_pct = Math.min(base_suppression_pct * timing_multiplier, 35);

  // Duración del impacto
  let duration_h;
  if (grams_per_kg <= 0.5) duration_h = 24;
  else if (grams_per_kg <= 1.0) duration_h = 48;
  else duration_h = 72;

  return { suppression_pct, duration_h };
}
```

---

## Módulo 4 — Acciones de mitigación

```javascript
function getMitigationActions(damage) {
  const actions = [];
  const { level, total_alcohol_g, grams_per_kg, hours_to_bed } = damage;

  // Hidratación (siempre)
  const water_ml = level === 'MINIMO' ? 300 : level === 'MODERADO' ? 500 : 750;
  actions.push({
    timing: 'ANTES_DE_DORMIR',
    action: `Hidrata ${water_ml}ml de agua antes de acostarte`,
    priority: 'HIGH',
  });

  if (level !== 'MINIMO') {
    // Electrolitos en daño moderado/alto
    actions.push({
      timing: 'ANTES_DE_DORMIR',
      action: level === 'ALTO' ? 'Agua con electrolitos (sodio + potasio)' : 'Opcional: electrolitos',
      priority: level === 'ALTO' ? 'HIGH' : 'MEDIUM',
    });

    // Esperar antes de acostarse
    const wait_mins = level === 'ALTO' ? 60 : 30;
    actions.push({
      timing: 'ANTES_DE_DORMIR',
      action: `Espera ${wait_mins} minutos antes de acostarte (baja el alcohol circulante)`,
      priority: 'MEDIUM',
    });

    // Desayuno proteico
    const protein_g = level === 'ALTO' ? 35 : 30;
    actions.push({
      timing: 'MANANA',
      action: `Desayuno proteico mañana: ${protein_g}g+ proteína (MPS inhibida)`,
      priority: 'HIGH',
    });
  }

  if (level === 'ALTO') {
    actions.push({
      timing: 'MANANA',
      action: 'Reprograma sesión intensa → técnica ligera o REST. HRV bajo 48–72h.',
      priority: 'HIGH',
      engine_action: 'DEGRADE_SESSION',
    });
    actions.push({
      timing: 'MANANA',
      action: 'Monitorea HRV las próximas 48h',
      priority: 'MEDIUM',
    });
  }

  return actions;
}
```

---

## Módulo 5 — Ajuste automático al día siguiente

```javascript
function applyNextDayAdjustments(athlete, damage, hrv_actual_tomorrow) {
  const { level } = damage;
  const { suppression_pct } = predictHRVSuppression(
    damage.grams_per_kg,
    damage.hours_to_bed
  );

  const adjustments = {
    readiness_modifier: 0,
    risk_score_delta: 0,
    session_action: null,
    sleep_score_override: null,
  };

  if (level === 'MINIMO') {
    // Sin ajustes en el engine — solo info al atleta
    return adjustments;
  }

  if (level === 'MODERADO') {
    adjustments.readiness_modifier = -10;
    adjustments.risk_score_delta   = +15;
    adjustments.session_action     = 'DEGRADE_ACCESSORIES'; // -15% accesorios
  }

  if (level === 'ALTO') {
    adjustments.readiness_modifier = -20;
    adjustments.risk_score_delta   = +30;
    adjustments.session_action     = 'BLOCK_HIGH_INTENSITY'; // Cap 70% 1RM
    adjustments.sleep_score_override = 'PENDING'; // Sleep Engine recalcula con fragmentación
  }

  // Si el HRV real de mañana confirma la supresión, refuerza el ajuste
  if (hrv_actual_tomorrow) {
    const confirmed = hrv_actual_tomorrow.hrv_zscore < -1.5;
    if (confirmed && level === 'MODERADO') {
      adjustments.session_action = 'BLOCK_HIGH_INTENSITY'; // Upgrade severidad
    }
  }

  return adjustments;
}
```

---

## Alertas y mensajes

```javascript
function getAlcoholAlerts(damage, athlete) {
  const { level, grams_per_kg, hours_to_bed } = damage;

  // Mensaje empático por nivel
  const messages = {
    MINIMO: {
      athlete: `Impacto mínimo. ${Math.round(grams_per_kg * athlete.weight_kg)}g alcohol — dentro del umbral. Hidrata bien antes de dormir.`,
      coach: null, // No molestar al coach por daño mínimo
    },
    MODERADO: {
      athlete: `Daño moderado. HRV puede bajar 10–20% esta noche. Sigue el protocolo de mitigación.`,
      coach: `Atleta reportó consumo moderado anoche. Readiness -10 hoy. Monitorear RPE en sesión.`,
    },
    ALTO: {
      athlete: `Daño alto. Tres caipirinhas a las 11pm tiene un costo real: HRV suprimido 20–30%, síntesis proteica reducida. Protocolo completo activo. Mañana: movilidad o descanso.`,
      coach: `⚠️ Atleta reportó consumo alto anoche (${Math.round(grams_per_kg * 10) / 10}g/kg). Sesión intensa bloqueada. HRV bajo esperado 48–72h.`,
    },
  };

  // Detección de doble impacto cafeína + alcohol
  if (athlete.caffeineToday && grams_per_kg > 0.3) {
    messages[level].athlete += ' Nota: cafeína + alcohol el mismo día amplifica estrés SNC.';
    messages[level].coach = (messages[level].coach || '') +
      ' Cafeína + alcohol detectados el mismo día — CNS en doble estrés.';
  }

  // Detección fase lútea (amplificación)
  if (athlete.hormonalPhase === 'luteal' && level !== 'MINIMO') {
    messages[level].athlete += ' Fase lútea activa: el impacto en recuperación es mayor esta semana.';
  }

  // Sugerencia de upgrade de mixer
  const hasSweetMixer = damage.total_carbs_g > 15;
  if (hasSweetMixer) {
    messages[level].athlete += ' Tip: cambiar a tónica diet o soda elimina la carga glucémica — mismo alcohol, menos daño metabólico.';
  }

  return messages[level];
}
```

---

## Schema

```sql
CREATE TABLE alcohol_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID NOT NULL REFERENCES athletes(id),
  logged_at        TIMESTAMPTZ NOT NULL,
  drinks           JSONB NOT NULL,           -- [{ type, volume_ml, abv, carbs_g, logged_at_mins }]
  total_alcohol_g  DECIMAL(6,2),
  total_carbs_g    DECIMAL(6,2),
  grams_per_kg     DECIMAL(5,3),
  hours_to_bed     DECIMAL(4,2),
  damage_level     VARCHAR(10),              -- 'MINIMO' | 'MODERADO' | 'ALTO'
  hrv_suppression_pct INT,                  -- Predicción
  hrv_suppression_duration_h INT,
  mitigation_shown BOOLEAN DEFAULT FALSE,   -- ¿El atleta vio las acciones?
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON alcohol_logs (athlete_id, logged_at DESC);
```

---

## Visualizaciones (frontend spec)

| # | Gráfico | Vista | Datos |
|---|---------|-------|-------|
| 1 | Log input rápido | Atleta | Selector bebidas del catálogo + hora |
| 2 | Panel daño en tiempo real | Atleta | Nivel MÍNIMO/MODERADO/ALTO + g/kg + acciones |
| 3 | Scatter HRV vs consumo (histórico) | Coach | Cada punto = noche de consumo + HRV siguiente día |
| 4 | Timeline alcohol + sleep + HRV | Coach | Cascada de daño visible en 72h |
| 5 | Badge "Recuperación activa" en B10 | Atleta | Aparece mientras dura el impacto (24–72h) |

---

## Integración con otros engines

| Engine | Modificación |
|--------|-------------|
| **Sleep Engine (26)** | Daño moderado/alto → fragmentación N3/REM → Sleep Score baja |
| **HRV Engine (28)** | `hrv_suppression_pct` ajusta baseline esperado para no generar falsa alarma |
| **Stress Engine CNS (01)** | Readiness `+= readiness_modifier` según nivel de daño |
| **Session Adaptation (02)** | `riskScore += risk_score_delta` → sesión degradada o bloqueada |
| **Caffeine Engine (25)** | Cafeína + alcohol mismo día → doble CNS flag |
| **Hormonal Engine (13)** | Fase lútea → amplifica daño moderado → trata como ALTO |

---

**Generado:** 2026-04-29  
**Filosofía:** Control de daños empático. Sin juicio.  
**Fuente:** `alcohol/ALCOHOL_BRAIN.md`  
**Integración status:** Spec completa — pendiente UI
