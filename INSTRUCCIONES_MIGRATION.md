# Instrucciones — Migration AlloyDB desde AlloyDB Studio
# Fecha: 2026-04-26

---

## Problema actual

psql desde Cloud Shell falla con "Connection timed out" porque la IP de Cloud Shell
cambia en cada sesión y hay que re-autorizarla manualmente.

## Solución: usar AlloyDB Studio (no necesita IP)

AlloyDB Studio es el editor SQL integrado en GCP — no requiere IP autorizada.

---

## Pasos

### 1. Abrir AlloyDB Studio

1. Ir a: https://console.cloud.google.com/alloydb
2. Clic en el cluster **peakqual**
3. Menú izquierdo → **AlloyDB Studio**
4. Conectarse con:
   - Usuario: `postgres`
   - Contraseña: `Mateo2032.17`
   - Base de datos: `postgres`

---

### 2. Ejecutar Migration 004 — RAG Self-Healing

Pegar en el editor y ejecutar:

```sql
ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS file_hash       VARCHAR(64),
  ADD COLUMN IF NOT EXISTS quality_score   DECIMAL(4,3) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS retrieval_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_score_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS rag_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id      VARCHAR(255),
  user_id       UUID,
  query         TEXT NOT NULL,
  response      TEXT,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('wrong','incomplete','outdated','good')),
  note          TEXT,
  processed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_file_hashes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path     VARCHAR(500) UNIQUE NOT NULL,
  file_hash     VARCHAR(64) NOT NULL,
  last_ingested TIMESTAMPTZ DEFAULT NOW(),
  chunk_count   INTEGER DEFAULT 0
);
```

Resultado esperado: `ALTER TABLE` + 2x `CREATE TABLE`

---

### 3. Verificar tablas creadas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deben aparecer: `knowledge_base`, `rag_feedback`, `rag_file_hashes`

---

### 4. Ejecutar Migration 003 — Wise Score

Archivo local: `backend/migrations/003_wise_score.sql`

Abrir ese archivo, copiar contenido completo y pegar en AlloyDB Studio.

---

## Próximos pasos después de las migrations

| # | Paso | Comando |
|---|------|---------|
| 5 | Primera ingesta | `python -m ingestion.etl_universal --force` |
| 6 | Desplegar API | Cloud Run deploy |
| 7 | Cloud Scheduler | quality job 3am + etl 4am |
| 8 | Pipeline Smart Coach | RAG + DB query combinados |

---

## Datos de conexión AlloyDB

| Campo | Valor |
|-------|-------|
| IP pública | 34.176.100.236 |
| Puerto | 5432 |
| Usuario | postgres |
| Base de datos | postgres |
| Cluster | peakqual |
| Región | southamerica-west1 (Santiago) |
