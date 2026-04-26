-- Migration 004 — RAG Self-Healing
-- Peak Qual — Cloud SQL Postgres
-- 2026-04-25

-- ── 1. Columnas de calidad en knowledge_base ─────────────────────────────

ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS file_hash       VARCHAR(64),
  ADD COLUMN IF NOT EXISTS quality_score   DECIMAL(4,3) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS retrieval_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_score_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_kb_flagged  ON knowledge_base(flagged);
CREATE INDEX IF NOT EXISTS idx_kb_quality  ON knowledge_base(quality_score);
CREATE INDEX IF NOT EXISTS idx_kb_source   ON knowledge_base(source);

-- ── 2. Tabla de feedback del usuario ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS rag_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id      VARCHAR(255),   -- ID del chunk que generó la respuesta mala
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  query         TEXT NOT NULL,
  response      TEXT,
  feedback_type VARCHAR(20) NOT NULL
                CHECK (feedback_type IN ('wrong', 'incomplete', 'outdated', 'good')),
  note          TEXT,
  processed     BOOLEAN DEFAULT FALSE,  -- TRUE cuando el job nocturno lo procesó
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_chunk     ON rag_feedback(chunk_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type      ON rag_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON rag_feedback(processed);

-- ── 3. Tabla de hashes de archivos ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS rag_file_hashes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path     VARCHAR(500) UNIQUE NOT NULL,
  file_hash     VARCHAR(64) NOT NULL,
  last_ingested TIMESTAMPTZ DEFAULT NOW(),
  chunk_count   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_file_hashes_path ON rag_file_hashes(file_path);
