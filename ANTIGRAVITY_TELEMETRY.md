# 📡 Antigravity Telemetry — Sistema de Progreso Online

> ⚠️ **STACK UPDATE 2026-04-20:** Ver `GOOGLE_STACK_UPDATE.md`. Telemetry ahora usa Cloud Logging + Cloud Monitoring + Cloud Trace (nativo GCP). Dashboard custom opcional; Cloud Monitoring dashboard cubre lo esencial.

**Objetivo:** Ver en tiempo real cómo Antigravity avanza el pipeline de volumen, sin hacer check-ins manuales.

---

## 🎯 Arquitectura

```
Antigravity (worker)
       │
       │ emit event
       ▼
  Progress API (HTTP POST)
       │
       │ upsert
       ▼
  Postgres progress_runs + progress_events
       │
       │ realtime
       ▼
  Dashboard web (SSE/WebSocket)
       │
       │ visible
       ▼
     Stipi 👁
```

---

## 1 · Schema mínimo

`packages/db/schema/telemetry.ts`

```ts
export const progressRun = pgTable('progress_run', {
  id: uuid().primaryKey().defaultRandom(),
  projectName: text().notNull(),           // "volume-pipeline-v1"
  startedAt: timestamp().defaultNow(),
  finishedAt: timestamp(),
  currentPhase: text(),                    // F0..F7
  overallProgress: integer(),              // 0-100
  status: text(),                          // running | paused | failed | done
  costTotalUsd: numeric({ precision: 10, scale: 4 }),
  queryCount: integer(),
});

export const progressEvent = pgTable('progress_event', {
  id: uuid().primaryKey().defaultRandom(),
  runId: uuid().references(() => progressRun.id),
  ts: timestamp().defaultNow(),
  phase: text(),                           // F3
  task: text(),                            // "ingest: engines/01_stress_engine.md"
  kind: text(),                            // start | success | fail | metric | log
  payload: jsonb(),                        // { chunks: 42, cost: 0.003, ... }
  durationMs: integer(),
});

export const progressMetric = pgTable('progress_metric', {
  id: uuid().primaryKey().defaultRandom(),
  runId: uuid().references(() => progressRun.id),
  ts: timestamp().defaultNow(),
  name: text(),                            // "rag_recall" | "router_accuracy" | "p95_latency"
  value: numeric({ precision: 12, scale: 4 }),
  phase: text(),
  target: numeric({ precision: 12, scale: 4 }),
  status: text(),                          // green | amber | red
});
```

---

## 2 · Endpoints Progress API

`apps/api/src/telemetry/routes.ts`

```
POST /telemetry/run/start           → crea progressRun
POST /telemetry/run/:id/phase       → actualiza currentPhase + %
POST /telemetry/run/:id/event       → append progressEvent
POST /telemetry/run/:id/metric      → insert progressMetric
POST /telemetry/run/:id/finish      → marca done/failed

GET  /telemetry/run/active          → run en curso
GET  /telemetry/run/:id             → estado completo
GET  /telemetry/run/:id/stream      → Server-Sent Events (SSE) tiempo real
```

Auth: API key en header `X-Agent-Token`.

---

## 3 · SDK cliente para Antigravity

`packages/telemetry-client/src/index.ts`

```ts
export class ProgressReporter {
  constructor(private apiUrl: string, private token: string, private runId: string) {}

  async start(project: string) { ... }

  async phase(phase: string, progress: number) {
    fetch(`${this.apiUrl}/run/${this.runId}/phase`, {
      method: 'POST',
      headers: { 'X-Agent-Token': this.token },
      body: JSON.stringify({ phase, progress })
    });
  }

  async event(task: string, kind: string, payload?: any) { ... }

  async metric(name: string, value: number, target?: number) { ... }

  async finish(status: 'done' | 'failed') { ... }
}
```

**Uso desde Antigravity:**

```ts
const reporter = new ProgressReporter(API_URL, TOKEN, runId);

await reporter.phase('F3', 45);
await reporter.event('ingest:engines/01_stress_engine.md', 'success', { chunks: 42, costUsd: 0.003 });
await reporter.metric('rag_recall', 0.87, 0.85);
```

---

## 4 · Eventos obligatorios que Antigravity debe emitir

### Cada fase
- `phase:start` — al iniciar F1..F7.
- `phase:end` — al completar con resultado validación.

### Cada archivo/chunk procesado
- `ingest:start` — nombre archivo.
- `ingest:success` — con chunks generados, tokens, costo.
- `ingest:fail` — con error stack.

### Cada test suite
- `test:run` — nombre suite.
- `test:result` — passed/failed/skipped counts.

### Cada LLM call agregado (batch cada 60s)
- `llm:batch` — `{ model, calls, totalCost, p95Ms, cacheHits }`.

### Hitos
- `milestone` — ej. "embedding 500 chunks completado", "validate:all GREEN".

---

## 5 · Métricas rastreadas online

| Métrica | Fase | Target | Actualiza cada |
|---|---|---|---|
| `overall_progress` | all | — | cada event |
| `files_processed` | F3 | all | por archivo |
| `chunks_ingested` | F3 | — | batch 50 |
| `cost_total_usd` | all | < $20 build completo | cada LLM call |
| `router_accuracy` | F1 | >= 0.92 | fin F1 |
| `rag_recall` | F4 | >= 0.85 | fin F4 |
| `p95_latency_ms` | F7 | < 1500 | load test |
| `cost_per_query_usd` | F7 | < 0.005 | load test |
| `cache_hit_rate` | F4-F7 | >= 0.85 | batch 60s |
| `tests_passing` | all | 100% | cada test:run |
| `coverage_pct` | F7 | >= 70 | fin F7 |

---

## 6 · Dashboard web

`apps/admin/src/pages/AntigravityProgress.tsx`

Layout:

```
┌──────────────────────────────────────────────┐
│ 🤖 Volume Pipeline · Run #a7b3...   ● RUNNING│
│ Started 2h 14m ago · Phase F3 · 45%          │
├──────────────────────────────────────────────┤
│ [ barra progreso overall 45%           ]    │
├──────────────────────────────────────────────┤
│ F0 ✅  F1 ✅  F2 ✅  F3 🟡  F4 ⚪  F5 ⚪  F6 ⚪ F7 ⚪│
├──────────────────────────────────────────────┤
│  Cost         $3.42 / $20 budget  🟢        │
│  Files        127 / 289                     │
│  Chunks       2,418 ingested                │
│  Cache hit    87% 🟢                        │
│  p95          892 ms 🟢                     │
├──────────────────────────────────────────────┤
│ Live log:                                    │
│ 14:02:33 ingest:success engines/01_stress... │
│ 14:02:35 llm:batch haiku ×40 cost $0.012    │
│ 14:02:41 metric rag_recall 0.87 🟢          │
│ 14:02:50 ingest:start volta/VOLTA_BRAIN.md   │
├──────────────────────────────────────────────┤
│ [ Pause ]  [ View full log ]  [ Cost report ]│
└──────────────────────────────────────────────┘
```

Tecnología:
- React + SSE (`EventSource`) para live updates.
- Charts: recharts para cost/latency timeline.
- Auto-refresh sin polling (push vía SSE).

---

## 7 · Alertas automáticas

Trigger push/email/Slack si:
- Métrica `cost_per_query` > $0.01 por >10 min → warning.
- Test failing en cualquier fase → inmediato.
- `phase:end` sin GO (validación falla) → bloquea avance.
- Inactividad > 30 min sin events → "¿Antigravity colgado?".

---

## 8 · Acceso remoto (desde cualquier lado)

- Deploy `apps/admin` en Vercel/Railway con DB en Neon.
- URL pública protegida con magic-link auth.
- PWA-enabled → móvil con notificaciones push.

Así Stipi ve progreso desde teléfono **mientras Antigravity trabaja** en background.

---

## 9 · Instrucciones para Antigravity (añadir al volume spec)

Al inicio de cada fase, Antigravity DEBE:

1. Crear/obtener `runId` vía `POST /telemetry/run/start`.
2. Reportar `phase:start` con phase name.
3. Por cada subtask: emitir `event` antes y después.
4. Por cada LLM call: acumular en batch y flush cada 60s.
5. Por cada test: emitir `test:result`.
6. Al terminar fase: `metric` con resultados + `phase:end`.
7. Si falla: `event kind=fail` con stack + `phase:end status=failed`.

**Tolerancia:** si Progress API cae, Antigravity sigue trabajando (fire-and-forget, no bloquea pipeline).

---

## 10 · Entregables

| Componente | Responsable | Status |
|---|---|---|
| Schema telemetry | Antigravity F0 | — |
| Progress API endpoints | Antigravity F0 | — |
| SDK `telemetry-client` | Antigravity F0 | — |
| Dashboard admin | Antigravity F6 | — |
| Deploy público Vercel | Antigravity F7 | — |
| Integración en cada fase F1-F7 | Antigravity continuo | — |

**Validación telemetry:**
```
✓ 100% events emitidos con runId correcto
✓ Dashboard muestra tick < 1s tras evento real
✓ Alertas disparan dentro de 2 min del threshold
✓ Pérdida eventos < 0.5% bajo carga
```

---

## Resumen operativo

1. Antigravity arranca → crea run.
2. Por cada acción emite evento a Progress API.
3. Dashboard web recibe SSE y refresca solo.
4. Stipi abre URL en móvil → ve tiempo real.
5. Alertas llegan si algo falla/sube costo.
6. Al terminar → report final con todas las métricas.

**Ruta:** `C:\Users\Gamer\Desktop\Holy Oly 001\ANTIGRAVITY_TELEMETRY.md`
