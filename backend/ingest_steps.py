import requests

#Chunks específicos para cada paso
docs = [
    {
        "content": "PASO 1: Schema SQL para Self-Healing RAG. Columnas nuevas en knowledge_base: file_hash VARCHAR(64), quality_score DECIMAL(4,3), retrieval_count INTEGER, low_score_count INTEGER, flagged BOOLEAN, updated_at TIMESTAMPTZ. Tabla rag_feedback: id UUID PRIMARY KEY, chunk_id VARCHAR(255), user_id UUID, query TEXT, response TEXT, feedback_type VARCHAR(20) puede ser wrong incomplete outdated good, note TEXT, created_at TIMESTAMPTZ. Tabla rag_file_hashes para detectar cambios en archivos: id UUID PRIMARY KEY, file_path VARCHAR(500) UNIQUE, file_hash VARCHAR(64), last_ingested TIMESTAMPTZ, chunk_count INTEGER.",
        "metadata": {"source": "RAG_SELF_HEALING_PLAN.md", "topic": "sql", "brand": "peak_qual"}
    },
    {
        "content": "PASO 2: rag_sources.yaml - Archivo central que define todas las fuentes del RAG. Agregar fuente nueva = una linea en YAML sin tocar codigo. Estructura: sources con path, brand, sport, topic, chunk_size, overlap. Permite agregar CARTA MAGNA (priority 99), HOLY OLY, VOLTA CrossFit, ENGINES, CIENCIA TRANSVERSAL.",
        "metadata": {"source": "RAG_SELF_HEALING_PLAN.md", "topic": "configuration", "brand": "peak_qual"}
    },
    {
        "content": "PASO 3: etl_universal.py - Script de ingestion inteligente. Lee rag_sources.yaml, calcula hash MD5 de cada archivo, compara con rag_file_hashes en base de datos. Si hash cambio = re-ingesta. Si hash igual = skip para no gastar embeddings. Registra nuevo hash en DB.",
        "metadata": {"source": "RAG_SELF_HEALING_PLAN.md", "topic": "ingestion", "brand": "peak_qual"}
    },
    {
        "content": "PASO 4: Feedback loop - Self-Healing. Cuando usuario marca respuesta como mala: se registra en rag_feedback. Job nocturno revisa chunks con feedback negativo. Sube low_score_count. Si low_score_count >= 3 se marca flagged = TRUE. Chunks flagged se excluyen de busquedas hasta ser corregidos. Admin corrige archivo fuente, corre etl_universal.py, chunk se reemplaza y flag se resetea.",
        "metadata": {"source": "RAG_SELF_HEALING_PLAN.md", "topic": "feedback", "brand": "peak_qual"}
    },
    {
        "content": "PASO 5: Automatizacion nightly con Cloud Scheduler. Job corre cada noche a las 3am (schedule 0 3 * * *). Ejecuta python -m ingestion.etl_universal --quiet. Target: Cloud Run job etl-universal. Region: us-central1. Service account con acceso a Cloud SQL y Vertex AI.",
        "metadata": {"source": "RAG_SELF_HEALING_PLAN.md", "topic": "automation", "brand": "peak_qual"}
    }
]

print("Ingestando chunks especificos...")
for i, doc in enumerate(docs, 1):
    r = requests.post("http://localhost:8000/v1/rag/ingest", json=doc)
    print(f"  [{i}] " + str(r.status_code))