# 27. Wearable Sync Engine — Biometric Data Pipeline

**Propósito:** Normalizar y sincronizar datos biométricos de Apple Health, Google Fit, Garmin, Oura y Whoop hacia el esquema interno de Peak Qual. Resolver conflictos entre fuentes y proveer datos limpios a HRV Engine, Sleep Engine y Stress Engine.

**Status:** Spec completa — pendiente integración frontend  
**Frecuencia:** Sincronización activa cada 15min (wearable polling) + trigger manual  
**Outputs hacia:** Engine 28 (HRV/RHR), Engine 26 (Sleep), Engine 01 CNS Score

---

## Plataformas soportadas

| Plataforma | Datos disponibles | Auth |
|------------|-------------------|------|
| **Apple Health** | HRV, RHR, sleep stages, steps, VO2max | HealthKit (iOS nativo) |
| **Google Fit** | RHR, steps, active minutes, sleep básico | OAuth2 REST API |
| **Garmin Connect** | HRV, RHR, sleep stages, Body Battery, stress score | OAuth1 REST API |
| **Oura Ring** | HRV, RHR, sleep stages (N1/N2/N3/REM), temp desviación | OAuth2 REST API |
| **Whoop** | HRV, RHR, sleep stages, strain, recovery score | OAuth2 REST API |
| **Manual** | Cualquier campo | Formulario atleta |

---

## Modelo de datos unificado

Cada plataforma reporta métricas con distintos nombres y unidades. El engine normaliza todo a este esquema:

```typescript
interface WearableSnapshot {
  athlete_id:    string;
  date:          Date;          // Fecha UTC del día medido
  source:        WearableSource; // 'apple_health' | 'garmin' | 'oura' | 'whoop' | 'google_fit' | 'manual'
  
  // Biométricos cardíacos
  hrv_rmssd:     number | null; // ms — Heart Rate Variability (rMSSD)
  rhr_bpm:       number | null; // bpm — Resting Heart Rate (mínimo del día o matutino)
  
  // Sueño (si la plataforma lo reporta)
  sleep_total_h: number | null;
  sleep_deep_pct: number | null; // % N3
  sleep_rem_pct:  number | null; // % REM
  sleep_efficiency_pct: number | null;
  sleep_latency_mins:   number | null;
  
  // Extras por plataforma
  body_battery:  number | null; // Garmin 0-100
  skin_temp_delta: number | null; // Oura: desviación vs baseline en °C
  strain_score:  number | null; // Whoop 0-21
  recovery_score: number | null; // Whoop 0-100
  
  raw_payload:   Record<string, unknown>; // JSON original sin parsear
  synced_at:     Date;
  is_estimated:  boolean; // true si el valor fue interpolado
}

type WearableSource = 'apple_health' | 'garmin' | 'oura' | 'whoop' | 'google_fit' | 'manual';
```

---

## Mapeo de campos por plataforma

### Apple Health (HealthKit)

```javascript
const APPLE_HEALTH_MAP = {
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': 'hrv_rmssd',  // HealthKit usa SDNN, convertir: rMSSD ≈ SDNN * 0.85
  'HKQuantityTypeIdentifierRestingHeartRate':         'rhr_bpm',
  'HKCategoryTypeIdentifierSleepAnalysis':            'sleep_*',   // Parsear fases desde eventos
};

function convertSDNNtoRMSSD(sdnn_ms) {
  return sdnn_ms * 0.85; // Aproximación clínica aceptable
}
```

### Garmin Connect

```javascript
const GARMIN_MAP = {
  'averageStressLevel':     null,          // Ignorar — métrica propietaria no estándar
  'bodyBatteryChargedValue': 'body_battery',
  'avgWakingHeartRate':     'rhr_bpm',
  'averageHRV':             'hrv_rmssd',  // Garmin ya reporta rMSSD
  'deepSleepSeconds':       'sleep_deep_pct',  // Convertir a % de total
  'remSleepSeconds':        'sleep_rem_pct',
};
```

### Oura Ring

```javascript
const OURA_MAP = {
  'average_hrv':        'hrv_rmssd',   // Oura reporta rMSSD directamente
  'lowest_resting_heart_rate': 'rhr_bpm',
  'temperature_deviation':     'skin_temp_delta',
  'deep':               'sleep_deep_pct',
  'rem':                'sleep_rem_pct',
  'efficiency':         'sleep_efficiency_pct',
  'latency':            'sleep_latency_mins',
};
```

### Whoop

```javascript
const WHOOP_MAP = {
  'heart_rate_variability_rmssd': 'hrv_rmssd',
  'resting_heart_rate':           'rhr_bpm',
  'strain.score':                 'strain_score',
  'recovery.score':               'recovery_score',
  'sleep.stage_summary.slow_wave_sleep_duration': 'sleep_deep_pct',
  'sleep.stage_summary.rem_sleep_duration':       'sleep_rem_pct',
};
```

---

## Resolución de conflictos (multi-source)

Cuando un atleta tiene más de un wearable activo para el mismo día:

```javascript
const SOURCE_PRIORITY = {
  oura:         1,   // Máxima precisión HRV + sueño (ring = nocturno puro)
  whoop:        2,
  garmin:       3,
  apple_health: 4,
  google_fit:   5,
  manual:       0,   // Manual siempre gana si fue editado el mismo día
};

function resolveConflict(snapshots: WearableSnapshot[], field: string): number | null {
  // Filtrar los que tienen el campo
  const candidates = snapshots
    .filter(s => s[field] !== null)
    .sort((a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]);

  if (candidates.length === 0) return null;

  // Manual override si existe y fue el último editado
  const manual = snapshots.find(s => s.source === 'manual' && s[field] !== null);
  if (manual && isEditedToday(manual)) return manual[field];

  return candidates[0][field]; // Fuente de mayor prioridad
}
```

---

## Pipeline de sincronización

```javascript
async function syncWearableData(athleteId: string, source: WearableSource) {
  // 1. Obtener datos crudos de la API
  const rawData = await fetchFromPlatform(athleteId, source);

  // 2. Normalizar al esquema unificado
  const normalized = normalizePayload(rawData, source);

  // 3. Validar rangos fisiológicos
  const validated = validateBiometrics(normalized);

  // 4. Resolver conflictos con otros snapshots del mismo día
  const existing = await db.wearableSnapshots.findByDate(athleteId, normalized.date);
  const merged = mergeSnapshots(existing, validated);

  // 5. Persistir
  await db.wearableSnapshots.upsert(merged);

  // 6. Disparar recálculo en engines downstream
  await triggerDownstreamEngines(athleteId, normalized.date);
}

async function triggerDownstreamEngines(athleteId: string, date: Date) {
  // Recalcular en orden de dependencia
  await hrv_engine.recalculate(athleteId, date);       // Engine 28
  await sleep_engine.updateFromWearable(athleteId, date); // Engine 26
  await stress_engine.recalcCNSScore(athleteId, date);  // Engine 01
}
```

---

## Validación de rangos fisiológicos

```javascript
const BIOMETRIC_RANGES = {
  hrv_rmssd:    { min: 10,  max: 200, unit: 'ms'  }, // Extremos: 10ms (elite fatiga) — 200ms (joven atleta)
  rhr_bpm:      { min: 28,  max: 100, unit: 'bpm' }, // < 28 = error sensor, > 100 = taquicardia
  sleep_total_h:{ min: 1.0, max: 14,  unit: 'h'   },
  sleep_deep_pct:{ min: 0,  max: 40,  unit: '%'   },
  sleep_rem_pct:{ min: 0,  max: 40,  unit: '%'   },
  skin_temp_delta:{ min: -3, max: 3,  unit: '°C'  },
};

function validateBiometrics(snapshot) {
  const warnings = [];
  for (const [field, range] of Object.entries(BIOMETRIC_RANGES)) {
    const val = snapshot[field];
    if (val === null) continue;
    if (val < range.min || val > range.max) {
      warnings.push(`${field}: ${val} fuera de rango [${range.min}-${range.max}]`);
      snapshot[field] = null; // Descartar valor inválido
      snapshot.is_estimated = true;
    }
  }
  return { ...snapshot, validation_warnings: warnings };
}
```

---

## Fallback manual

Cuando no hay wearable conectado, el atleta puede ingresar HRV y RHR manualmente cada mañana:

```javascript
// Formulario matutino (30 segundos)
interface ManualMorningLog {
  date:         Date;
  hrv_rmssd:    number | null; // ¿Tienes medición? (muchos usan Elite HRV app en iPhone sin Ring)
  rhr_bpm:      number | null;
  soreness:     1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  motivation:   1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  life_stress:  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  notes?:       string;
}
```

Si HRV y RHR son null (sin wearable, sin manual), el CNS Score usa solo los componentes de sueño y subjetivo con pesos ajustados:
- Sleep: 40% (sube de 25%)
- Subjetivo: 60% (sube de 25%)
- HRV + RHR: 0% (excluidos)

---

## Schema

```sql
CREATE TABLE wearable_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   UUID NOT NULL REFERENCES athletes(id),
  source       VARCHAR(20) NOT NULL,   -- 'apple_health' | 'garmin' | 'oura' | 'whoop' | 'google_fit'
  access_token TEXT,                  -- Encriptado en reposo
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope        TEXT,                  -- Permisos otorgados
  is_active    BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (athlete_id, source)
);

CREATE TABLE wearable_snapshots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id           UUID NOT NULL REFERENCES athletes(id),
  date                 DATE NOT NULL,
  source               VARCHAR(20) NOT NULL,
  hrv_rmssd            DECIMAL(6,2),
  rhr_bpm              INT,
  sleep_total_h        DECIMAL(4,2),
  sleep_deep_pct       DECIMAL(5,2),
  sleep_rem_pct        DECIMAL(5,2),
  sleep_efficiency_pct DECIMAL(5,2),
  sleep_latency_mins   INT,
  body_battery         INT,
  skin_temp_delta      DECIMAL(4,2),
  strain_score         DECIMAL(5,2),
  recovery_score       INT,
  is_estimated         BOOLEAN DEFAULT FALSE,
  raw_payload          JSONB,
  synced_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (athlete_id, date, source)
);

CREATE INDEX ON wearable_snapshots (athlete_id, date DESC);
CREATE INDEX ON wearable_snapshots (athlete_id, source, date DESC);
```

---

## Integración con otros engines

| Engine | Datos que recibe |
|--------|-----------------|
| **HRV/RHR Engine (28)** | `hrv_rmssd`, `rhr_bpm` → baseline, Zscore, tendencia |
| **Sleep Engine (26)** | `sleep_*` → Sleep Score con datos reales vs manual |
| **Stress Engine CNS (01)** | `hrv_rmssd`, `rhr_bpm` → `cnsScore` (30% + 20%) |
| **Caffeine Engine (25)** | `hrv_rmssd` Zscore < -1.5 → activa alertas CRITICAL |
| **Session Adaptation (02)** | `recovery_score` Whoop < 33 → riskScore sube |

---

**Generado:** 2026-04-29  
**Integración status:** Spec completa — pendiente OAuth flows + UI de conexión
