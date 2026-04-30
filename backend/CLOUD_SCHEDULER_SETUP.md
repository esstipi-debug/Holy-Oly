# Cloud Scheduler — Setup
# Peak Qual — Jobs nocturnos RAG

---

## Prerequisitos

- Google Cloud project: `liftai-evolved-strength`
- Cloud Run ya desplegado con la API
- gcloud CLI instalado y autenticado

```bash
gcloud auth login
gcloud config set project liftai-evolved-strength
```

---

## Jobs a configurar

| Job | Qué hace | Schedule |
|-----|----------|----------|
| `rag-quality-job` | Procesa feedback negativo, flaggea chunks malos | 3am diario |
| `rag-etl-universal` | Re-ingesta archivos modificados | 4am diario |

---

## Job 1 — RAG Quality Job

### Opción A: Cloud Run Job (recomendado)

**Paso 1 — Crear el job en Cloud Run:**
```bash
gcloud run jobs create rag-quality-job \
  --image gcr.io/liftai-evolved-strength/holy-oly-api:latest \
  --region us-central1 \
  --command python \
  --args "-m,rag.quality_job,--quiet" \
  --set-env-vars DATABASE_URL=<tu_database_url> \
  --set-env-vars GOOGLE_PROJECT_ID=liftai-evolved-strength \
  --set-env-vars GOOGLE_LOCATION=us-central1 \
  --service-account <tu_service_account>@liftai-evolved-strength.iam.gserviceaccount.com \
  --max-retries 2 \
  --task-timeout 300
```

**Paso 2 — Crear el trigger en Cloud Scheduler:**
```bash
gcloud scheduler jobs create http rag-quality-job-trigger \
  --location us-central1 \
  --schedule "0 3 * * *" \
  --time-zone "America/Santiago" \
  --uri "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/liftai-evolved-strength/jobs/rag-quality-job:run" \
  --message-body "{}" \
  --oauth-service-account-email <tu_service_account>@liftai-evolved-strength.iam.gserviceaccount.com \
  --description "Procesa feedback RAG y flaggea chunks malos"
```

---

## Job 2 — ETL Universal

**Paso 1 — Crear el job en Cloud Run:**
```bash
gcloud run jobs create rag-etl-universal \
  --image gcr.io/liftai-evolved-strength/holy-oly-api:latest \
  --region us-central1 \
  --command python \
  --args "-m,ingestion.etl_universal,--quiet" \
  --set-env-vars DATABASE_URL=<tu_database_url> \
  --set-env-vars GOOGLE_PROJECT_ID=liftai-evolved-strength \
  --set-env-vars GOOGLE_LOCATION=us-central1 \
  --service-account <tu_service_account>@liftai-evolved-strength.iam.gserviceaccount.com \
  --max-retries 2 \
  --task-timeout 600
```

**Paso 2 — Crear el trigger en Cloud Scheduler:**
```bash
gcloud scheduler jobs create http rag-etl-universal-trigger \
  --location us-central1 \
  --schedule "0 4 * * *" \
  --time-zone "America/Santiago" \
  --uri "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/liftai-evolved-strength/jobs/rag-etl-universal:run" \
  --message-body "{}" \
  --oauth-service-account-email <tu_service_account>@liftai-evolved-strength.iam.gserviceaccount.com \
  --description "Re-ingesta archivos RAG modificados"
```

---

## Permisos del Service Account

El service account necesita estos roles:

```bash
# Cloud SQL
gcloud projects add-iam-policy-binding liftai-evolved-strength \
  --member="serviceAccount:<tu_sa>@liftai-evolved-strength.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Vertex AI (embeddings)
gcloud projects add-iam-policy-binding liftai-evolved-strength \
  --member="serviceAccount:<tu_sa>@liftai-evolved-strength.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Cloud Run (ejecutar jobs)
gcloud projects add-iam-policy-binding liftai-evolved-strength \
  --member="serviceAccount:<tu_sa>@liftai-evolved-strength.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

---

## Verificar que funcionan

```bash
# Ver jobs creados
gcloud scheduler jobs list --location us-central1

# Ejecutar manualmente (sin esperar el schedule)
gcloud scheduler jobs run rag-quality-job-trigger --location us-central1
gcloud scheduler jobs run rag-etl-universal-trigger --location us-central1

# Ver logs del último run
gcloud run jobs executions list --job rag-quality-job --region us-central1
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=rag-quality-job" \
  --limit 50 \
  --format "table(timestamp, textPayload)"
```

---

## Orden de ejecución (primera vez)

```
1. Ejecutar migration en Cloud SQL:
   psql $DATABASE_URL -f backend/migrations/004_rag_self_healing.sql

2. Hacer primera ingesta completa:
   python -m ingestion.etl_universal --force

3. Crear jobs en Cloud Run (pasos arriba)

4. Crear triggers en Cloud Scheduler (pasos arriba)

5. Ejecutar manualmente para verificar:
   gcloud scheduler jobs run rag-quality-job-trigger --location us-central1
```

---

## Reemplazar en los comandos

| Placeholder | Valor real |
|-------------|------------|
| `<tu_database_url>` | Connection string Cloud SQL |
| `<tu_service_account>` | Nombre del SA sin @dominio |

---

## Zona horaria

Los jobs están configurados en `America/Santiago` (Chile, UTC-4).
Para cambiar: reemplaza `America/Santiago` por tu zona en los comandos de Scheduler.
Lista de zonas válidas: https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules
