# Estado de Sesión — Peak Qual
# Última actualización: 2026-04-26

---

## Dónde estamos

✅ **MIGRATIONS COMPLETADAS** — Todas las tablas RAG + Wise Score creadas en AlloyDB.

**Próximo paso:** Primera ingesta de datos (`etl_universal --force`) desde Cloud Shell o local.

---

## Comando listo para ejecutar (PASO 4)

Primera ingesta de datos — ejecutar en Cloud Shell:

```bash
cd /path/to/backend && python -m ingestion.etl_universal --force
```

O desde Python local si tienes credenciales GCP:

```bash
python backend/src/ingestion/etl_universal.py --force
```

Resultado esperado:
- ✅ Ingestar 32 fuentes declaradas en `rag_sources.yaml`
- ✅ Hash comparison (no duplicados)
- ✅ Embeddings + Vertex AI
- ✅ Seed `knowledge_base` + `rag_file_hashes`

---

## Datos de conexión AlloyDB

| Campo | Valor |
|-------|-------|
| IP pública | 34.176.100.236 |
| Puerto | 5432 |
| Usuario | postgres |
| Base de datos | postgres |
| Región | southamerica-west1 (Santiago) |
| Cluster ID | peakqual |

---

## Resumen de lo que se hizo esta sesión

### Volta — Wise Score (COMPLETADO)
- `volta/WISE_SCORE_BRAIN.md` — diseño completo del Wise Score
- `volta/wise_score_config.py` — fórmulas y lógica de los 5 sub-índices
- `volta/v_stress_engine_config.py` — Banister adaptado a CrossFit
- `volta/etl_wise_score.py` — pipeline ETL completo

### Migration DB (COMPLETADO)
- `backend/migrations/003_wise_score.sql` — tablas Wise Score y V-Stress
- `backend/migrations/004_rag_self_healing.sql` — tablas RAG self-healing

### RAG actualizado (COMPLETADO)
- `backend/src/rag/service.py` — eliminado LangChain/OpenAI → Vertex AI
- `backend/src/rag/chain.py` — eliminado GPT-4o → Gemini 2.5 Flash
- `backend/src/rag/router.py` — filtros brand/sport/topic, endpoints nuevos
- `backend/src/rag/feedback.py` — endpoint feedback loop
- `backend/src/rag/quality_job.py` — job nocturno de calidad
- `backend/src/ingestion/etl_volta.py` — agregados WISE_SCORE_BRAIN y VOLTA_CYCLE_BRAIN
- `backend/src/ingestion/etl_universal.py` — ETL universal con hash comparison
- `backend/src/infrastructure/vector_store.py` — filtro chunks flagged + tracking

### Documentos nuevos (COMPLETADO)
- `RAG_CARTA_MAGNA.md` — constitución del asistente IA
- `RAG_SELF_HEALING_PLAN.md` — plan completo self-healing
- `rag_sources.yaml` — 32 fuentes declaradas
- `backend/CLOUD_SCHEDULER_SETUP.md` — instrucciones Cloud Scheduler

---

## Próximos pasos (en orden)

1. ✅ Autorizar IP en AlloyDB → Conectividad
2. ✅ Ejecutar migration RAG Self-Healing (knowledge_base + rag_feedback + rag_file_hashes)
3. ✅ Ejecutar migration Wise Score (11 tablas CF)
4. ⏳ **Primera ingesta:** `python -m ingestion.etl_universal --force`
5. ⏳ Desplegar API en Cloud Run
6. ⏳ Configurar Cloud Scheduler (quality job 3am + etl 4am)
7. ⏳ Pipeline Smart Coach (RAG + DB query combinados)

## Tablas creadas (verificadas)

| Tabla | Tipo | Status |
|-------|------|--------|
| `knowledge_base` | RAG | ✅ |
| `rag_feedback` | RAG | ✅ |
| `rag_file_hashes` | RAG | ✅ |
| `wise_score_snapshots` | Wise Score | ✅ |
| `cf_strength_lifts` | Wise Score | ✅ |
| `cf_engine_tests` | Wise Score | ✅ |
| `cf_engine_reference_override` | Wise Score | ✅ |
| `cf_gymnastics_evals` | Wise Score | ✅ |
| `cf_benchmark_results` | Wise Score | ✅ |
| `cf_sessions` | Wise Score | ✅ |
| `cf_stress_diario` | Wise Score | ✅ |
| `cf_consistency_config` | Wise Score | ✅ |
