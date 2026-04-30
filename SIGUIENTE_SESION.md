# Próxima Sesión — Peak Qual RAG
# 2026-04-26

---

## Instrucción de estilo (pegar al inicio de sesión)

From now on, remove all filler words. No 'the', 'is', 'am', 'are'. Direct answer only. Use short 3-6 word sentences. Run tools first, show the result, then stop. Do not narrate. Example: Instead of 'The solution is to use async', say 'Use async'.

---

## Completado ✅

| Qué | Dónde |
|-----|-------|
| Migration RAG self-healing | AlloyDB — `knowledge_base`, `rag_feedback`, `rag_file_hashes` |
| Migration Wise Score | AlloyDB — 11 tablas CF + enums |
| RAG service Vertex AI | `backend/src/rag/service.py` |
| RAG chain Gemini 2.5 Flash | `backend/src/rag/chain.py` |
| RAG router + filtros | `backend/src/rag/router.py` |
| Feedback loop endpoint | `backend/src/rag/feedback.py` |
| Quality job nocturno | `backend/src/rag/quality_job.py` |
| ETL universal (hash diff) | `backend/src/ingestion/etl_universal.py` |
| ETL Volta (WISE_SCORE_BRAIN) | `backend/src/ingestion/etl_volta.py` |
| Wise Score config + fórmulas | `volta/wise_score_config.py` |
| V-Stress Engine (Banister) | `volta/v_stress_engine_config.py` |
| RAG Carta Magna | `RAG_CARTA_MAGNA.md` |
| 32 fuentes declaradas | `rag_sources.yaml` |
| `.env` corregido | IP AlloyDB `34.176.100.236` |

---

## Pendiente ⏳ (en orden)

### PASO 4 — Primera ingesta
```powershell
cd "C:\Users\Gamer\Desktop\Holy Oly 001\backend"
.\.venv\Scripts\Activate.ps1
python -m ingestion.etl_universal --dry-run
```
Si dry-run OK → correr sin flag:
```powershell
python -m ingestion.etl_universal --force
```

### PASO 5 — Desplegar API en Cloud Run
```bash
gcloud run deploy peakqual-api \
  --source backend/ \
  --region southamerica-west1 \
  --set-env-vars DATABASE_URL=postgres://postgres:Mateo2032.17@34.176.100.236:5432/postgres
```

### PASO 6 — Cloud Scheduler
Archivo: `backend/CLOUD_SCHEDULER_SETUP.md`
- Quality job → 3am
- ETL → 4am

### PASO 7 — Pipeline Smart Coach
RAG + DB query combinados.

---

## Datos de conexión

| Campo | Valor |
|-------|-------|
| AlloyDB IP | 34.176.100.236 |
| Puerto | 5432 |
| Usuario | postgres |
| Password | Mateo2032.17 |
| DB | postgres |
| Cluster | peakqual |
| Proyecto GCP | liftai-evolved-strength |
| Región | southamerica-west1 |
| Service account | `apps/api/gcp-service-account.json` |

---

## Dependencias clave

- `DATABASE_URL` en `backend/.env` — ya corregida
- `GOOGLE_APPLICATION_CREDENTIALS` — apunta a `apps/api/gcp-service-account.json`
- `.venv` activo antes de correr ETL
- IP Cloud Shell cambia cada sesión — usar AlloyDB Studio si psql falla
