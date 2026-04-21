# 🟦 Google Stack Update — Override para Antigravity

**Fecha:** 2026-04-20
**Prioridad:** MÁXIMA — sobrescribe cualquier mención de Anthropic/Voyage/Cohere/Supabase/Prisma en los docs anteriores.
**Destinatario:** Antigravity + cualquier agent que tome el proyecto.

---

## 📌 Decisión única

**Stack 100% Google.** Un solo proveedor, un solo bill, auth centralizada.

---

## 🔧 Mapa de servicios (obligatorio)

| Capa | Servicio Google | Detalle |
|---|---|---|
| **LLM crítico** | Gemini 2.5 Pro | Diagnóstico lesión, Q&A técnico con RAG |
| **LLM volumen** | Gemini 2.5 Flash | Router, motivation, quality gate, classify, polish |
| **Embeddings** | `text-embedding-005` | 768 dim, batch |
| **Vector DB** | Cloud SQL Postgres + `pgvector` | MVP |
| **Vector DB V2** | AlloyDB AI | si hay cuello de performance |
| **Reranker** | Vertex AI Ranking API | top-50 → top-5 |
| **Orquestación** | Vertex AI + Vercel AI SDK | agentes + streaming |
| **Deploy API** | Cloud Run | serverless, scale-to-zero |
| **Scheduler** | Cloud Scheduler | cron nightly re-index, auto-eval |
| **Secrets** | Secret Manager | API key, service account |
| **Observabilidad** | Cloud Logging + Monitoring + Trace | reemplaza dashboard custom |
| **Alertas** | Cloud Monitoring Alerts | reemplaza webhook Slack manual |
| **Auth usuarios** | Firebase Auth (opcional) | login atletas/coaches |
| **Storage archivos** | Cloud Storage | PDFs, videos técnica V2 |

---

## 🚫 Prohibido (override)

- Anthropic / Claude (Sonnet, Haiku, Opus)
- Voyage embeddings
- Cohere Rerank
- Supabase (cualquier servicio)
- Prisma ORM
- OpenAI (salvo decisión explícita de Stipi)

## ✅ Obligatorio

- Drizzle ORM sobre Cloud SQL Postgres.
- Gemini SDK oficial (`@google/generative-ai`) + Vertex AI SDK (`@google-cloud/aiplatform`).
- Interfaces de abstracción (`LLMProvider`, `Embedder`, `Reranker`) para evitar lock-in en lógica de negocio.

---

## 🔐 Credenciales requeridas (3 items)

1. **GOOGLE_API_KEY** — Gemini + embeddings vía AI Studio.
   Fuente: https://aistudio.google.com/app/apikey

2. **GOOGLE_APPLICATION_CREDENTIALS** — service account JSON para Vertex AI + Cloud SQL.
   Fuente: GCP Console → IAM → Service Accounts → crear con roles:
   - Vertex AI User
   - Cloud SQL Client
   - Secret Manager Secret Accessor
   - Storage Object Admin

3. **DATABASE_URL** — Cloud SQL Postgres connection string.
   Formato: `postgres://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE`

---

## 🎯 Reemplazos específicos en código

### Antes (spec original)
```ts
import Anthropic from '@anthropic-ai/sdk';
import { VoyageAIClient } from 'voyageai';
import { CohereClient } from 'cohere-ai';
```

### Ahora (obligatorio)
```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import { DiscoveryEngineServiceClient } from '@google-cloud/discoveryengine'; // ranking
```

### Ejemplo router
```ts
const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const flash = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
const pro   = genai.getGenerativeModel({ model: 'gemini-2.5-pro' });
```

### Ejemplo embeddings
```ts
const embedModel = genai.getGenerativeModel({ model: 'text-embedding-005' });
const res = await embedModel.embedContent(text);
```

### Context caching Gemini (reemplaza prompt caching Claude)
```ts
// Gemini tiene Context Caching API nativo
const cache = await vertexai.cacheContent({
  model: 'gemini-2.5-pro',
  contents: [systemPrompt, brandBrain],
  ttl: '3600s',
});
// Reutilizas cache.name en cada call
```

---

## 📊 Impacto métricas

| Métrica | Target original | Target Google-stack |
|---|---|---|
| Costo/query promedio | < $0.005 | **< $0.003** (Gemini Flash más barato) |
| Latencia p95 | < 1500ms | **< 1200ms** (Cloud Run warm) |
| Cache hit | ≥ 85% | ≥ 85% (Context Caching) |
| Recall top-5 | ≥ 85% | ≥ 85% |

---

## 🗂️ Cambios en estructura repo

```
apps/api/
  src/
    providers/
      gemini.ts          # wrapper Gemini Flash + Pro
      embeddings.ts      # text-embedding-005
      reranker.ts        # Vertex AI Ranking
    agent/
      router.ts          # usa Gemini Flash
    rag/
      hybrid-search.ts   # pgvector + FTS
infra/
  terraform/             # IaC GCP
    cloud-sql.tf
    cloud-run.tf
    vertex-ai.tf
    secret-manager.tf
packages/
  db/
    schema/              # Drizzle schemas
```

---

## 🚀 Pasos adicionales para Antigravity

Ejecutar al inicio (antes de F0):

1. **GCP Project setup:**
   ```bash
   gcloud projects create peak-qual-prod --name="Peak Qual"
   gcloud config set project peak-qual-prod
   gcloud services enable \
     aiplatform.googleapis.com \
     sqladmin.googleapis.com \
     run.googleapis.com \
     secretmanager.googleapis.com \
     cloudscheduler.googleapis.com \
     discoveryengine.googleapis.com
   ```

2. **Cloud SQL instance:**
   ```bash
   gcloud sql instances create peak-qual-db \
     --database-version=POSTGRES_15 \
     --region=us-central1 \
     --tier=db-f1-micro  # MVP, escalar después
   gcloud sql databases create peakqual --instance=peak-qual-db
   # Habilitar pgvector:
   gcloud sql connect peak-qual-db --user=postgres
   > CREATE EXTENSION vector;
   ```

3. **Service account:**
   ```bash
   gcloud iam service-accounts create peak-qual-agent \
     --display-name="Peak Qual Agent"
   gcloud projects add-iam-policy-binding peak-qual-prod \
     --member="serviceAccount:peak-qual-agent@peak-qual-prod.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   gcloud iam service-accounts keys create ./sa-key.json \
     --iam-account=peak-qual-agent@peak-qual-prod.iam.gserviceaccount.com
   ```

4. **Secrets en Secret Manager** (no en .env local).

5. **Cloud Run deploy** al final de F6 para testing público.

---

## 📡 Telemetry adaptado

Reemplazar dashboard custom por:

- **Cloud Logging** — captura cada llamada LLM con structured logs.
- **Cloud Trace** — distributed tracing automático.
- **Cloud Monitoring dashboard** — métricas built-in + custom metrics.
- **Cloud Monitoring Alerts** — umbrales costo + latencia + errores.

Antigravity emite logs estructurados en stdout; Cloud Logging los captura auto. Stipi ve progreso en Google Cloud Console desde móvil sin necesidad de dashboard custom.

**URL directa:**
```
https://console.cloud.google.com/monitoring/dashboards?project=peak-qual-prod
```

---

## ✅ Acción inmediata Antigravity

1. **Lee este doc PRIMERO** (override de los anteriores).
2. **Pide a Stipi** las 3 credenciales listadas arriba.
3. **Ejecuta setup GCP** (sección 🚀 arriba).
4. **Reinicia plan F0-F7** con stack Google aplicado.
5. **Actualiza** `AGENT_PROJECT_SPEC.md`, `ANTIGRAVITY_VOLUME_STEPS.md`, `ANTIGRAVITY_HANDOFF.md`, `ANTIGRAVITY_TELEMETRY.md` con referencias Google.
6. **Commit:** `chore: migrate stack to Google (Gemini + Cloud SQL + Vertex AI)`.

---

## 🧱 Abstracción anti-lock-in

Crear interfaces en `packages/core/src/providers/`:

```ts
export interface LLMProvider {
  generate(opts: GenerateOpts): Promise<string>;
  stream(opts: GenerateOpts): AsyncIterable<string>;
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface Reranker {
  rerank(query: string, docs: string[], topK: number): Promise<RankedDoc[]>;
}
```

Implementación concreta: `GeminiLLM`, `GoogleEmbedder`, `VertexReranker`.

Si mañana migramos: sustituimos implementación, lógica de negocio intacta.

---

**Ruta:** `C:\Users\Gamer\Desktop\Holy Oly 001\GOOGLE_STACK_UPDATE.md`
