# RAG Self-Healing — Plan de Implementación
# Peak Qual — Holy Oly / Volta / Axon

---

## Qué es un Self-Healing RAG

Un RAG que detecta sus propias fallas y se corrige automáticamente sin intervención manual.

El sistema actual tiene la base (IDs determinísticos + upsert). Lo que falta es el loop
de autocorrección: detectar cambios, medir calidad, recibir feedback y re-ingestar.

---

## Lo que ya tienes (no tocar)

| Componente | Archivo | Por qué funciona |
|---|---|---|
| IDs determinísticos | `ingestion/chunker.py` → `generate_deterministic_id()` | Re-ingestar el mismo chunk no duplica — hace upsert |
| Upsert inteligente | `infrastructure/vector_store.py` → `upsert()` | Si el chunk ya existe con mismo ID, lo reemplaza |
| Embeddings Vertex AI | `infrastructure/vector_store.py` → `_get_embedding()` | text-embedding-004, 768 dims, Cloud SQL pgvector |
| ETLs por fuente | `ingestion/etl_*.py` | Cada marca tiene su ETL |

---

## Lo que debes construir

### PASO 1 — Columnas nuevas en knowledge_base

Ejecutar en Cloud SQL Postgres:

```sql
-- Agrega columnas de calidad y tracking al vector store existente
ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS file_hash       VARCHAR(64),
  ADD COLUMN IF NOT EXISTS quality_score   DECIMAL(4,3) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS retrieval_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_score_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- Tabla de feedback del usuario (atleta o coach corrige al asistente)
CREATE TABLE IF NOT EXISTS rag_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id      VARCHAR(255) REFERENCES knowledge_base(id),
  user_id       UUID REFERENCES users(id),
  query         TEXT NOT NULL,          -- pregunta que generó la respuesta mala
  response      TEXT,                   -- respuesta que dio el sistema
  feedback_type VARCHAR(20) NOT NULL,   -- 'wrong', 'incomplete', 'outdated', 'good'
  note          TEXT,                   -- nota libre del usuario
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de hashes de archivos (para detectar cambios)
CREATE TABLE IF NOT EXISTS rag_file_hashes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path     VARCHAR(500) UNIQUE NOT NULL,
  file_hash     VARCHAR(64) NOT NULL,
  last_ingested TIMESTAMPTZ DEFAULT NOW(),
  chunk_count   INTEGER DEFAULT 0
);
```

---

### PASO 2 — rag_sources.yaml

Crear este archivo en la raíz del proyecto: `rag_sources.yaml`

Define TODAS las fuentes del sistema. Agregar fuente nueva = una línea aquí, sin tocar código.

```yaml
# rag_sources.yaml
# Peak Qual — Fuentes del RAG
# Para agregar una fuente nueva: agrega un bloque y corre etl_universal.py

sources:

  # ── CARTA MAGNA (siempre se recupera primero) ──────────────────────────────
  - path: RAG_CARTA_MAGNA.md
    brand: peak_qual
    sport: all
    topic: constitution
    priority: 99          # máximo — siempre en contexto
    chunk_size: 300
    overlap: 50

  # ── HOLY OLY ───────────────────────────────────────────────────────────────
  - path: holy_oly/HOLY_OLY_BRAIN.md
    brand: holy_oly
    sport: weightlifting
    topic: philosophy
    chunk_size: 256
    overlap: 40

  - path: holy_oly/MOVEMENT_VOLUME_BRAIN.md
    brand: holy_oly
    sport: weightlifting
    topic: volume
    chunk_size: 256
    overlap: 40

  - path: holy_oly/source/USA_4PHASE_PERIODIZATION.md
    brand: holy_oly
    sport: weightlifting
    topic: programming
    chunk_size: 512
    overlap: 80

  - path: holy_oly/source/USA_COACHING_CUES.md
    brand: holy_oly
    sport: weightlifting
    topic: technique
    chunk_size: 384
    overlap: 60

  - path: holy_oly/source/USA_SCHOOL_INGESTION.md
    brand: holy_oly
    sport: weightlifting
    topic: programming
    chunk_size: 384
    overlap: 60

  # ── VOLTA (CrossFit) ───────────────────────────────────────────────────────
  - path: volta/VOLTA_BRAIN.md
    brand: volta
    sport: crossfit
    topic: philosophy
    chunk_size: 256
    overlap: 40

  - path: volta/VOLTA_CYCLE_BRAIN.md
    brand: volta
    sport: crossfit
    topic: programming
    chunk_size: 300
    overlap: 50

  - path: volta/WISE_SCORE_BRAIN.md
    brand: volta
    sport: crossfit
    topic: wise_score
    chunk_size: 256
    overlap: 40

  - path: volta/source/COMPTRAIN_MASTER.md
    brand: volta
    sport: crossfit
    topic: programming
    chunk_size: 384
    overlap: 50

  # ── ENGINES (explicabilidad del sistema) ───────────────────────────────────
  - path: engines/01_stress_engine.md
    brand: peak_qual
    sport: all
    topic: stress
    chunk_size: 256
    overlap: 40

  - path: engines/03_macrocycle_engine.md
    brand: peak_qual
    sport: all
    topic: programming
    chunk_size: 256
    overlap: 40

  - path: engines/11_oly_index_engine.md
    brand: holy_oly
    sport: weightlifting
    topic: oly_index
    chunk_size: 256
    overlap: 40

  - path: engines/13_hormonal_engine.md
    brand: peak_qual
    sport: all
    topic: hormonal
    chunk_size: 256
    overlap: 40

  - path: engines/14_smart_coach_engine.md
    brand: peak_qual
    sport: all
    topic: smart_coach
    chunk_size: 256
    overlap: 40

  - path: engines/24_ai_brains_rag_engine.md
    brand: peak_qual
    sport: all
    topic: ai_architecture
    chunk_size: 256
    overlap: 40

  # ── CIENCIA TRANSVERSAL (Huberman) ─────────────────────────────────────────
  - path: sleep/sleep_brain.md          # ajustar path real
    brand: peak_qual
    sport: all
    topic: sleep
    chunk_size: 384
    overlap: 60

  - path: nutrition/nutrition_brain.md   # ajustar path real
    brand: peak_qual
    sport: all
    topic: nutrition
    chunk_size: 384
    overlap: 60
```

> Nota: verificar paths reales de sleep y nutrition antes de correr.

---

### PASO 3 — etl_universal.py

Crear en `backend/src/ingestion/etl_universal.py`

Este script:
1. Lee `rag_sources.yaml`
2. Por cada archivo: calcula hash MD5
3. Compara con `rag_file_hashes` en DB
4. Si el hash cambió (o es nuevo) → re-ingesta
5. Si no cambió → skip (no gasta embeddings)
6. Registra el nuevo hash

```python
# backend/src/ingestion/etl_universal.py

import hashlib
import sys
import yaml
from pathlib import Path
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore
from sqlalchemy import text


YAML_PATH = ROOT_DIR / "rag_sources.yaml"


def file_hash(path: Path) -> str:
    """MD5 del contenido del archivo."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def get_stored_hash(session, file_path: str) -> str | None:
    row = session.execute(
        text("SELECT file_hash FROM rag_file_hashes WHERE file_path = :p"),
        {"p": file_path}
    ).fetchone()
    return row[0] if row else None


def save_hash(session, file_path: str, hash_val: str, chunk_count: int):
    session.execute(text("""
        INSERT INTO rag_file_hashes (file_path, file_hash, last_ingested, chunk_count)
        VALUES (:p, :h, :t, :c)
        ON CONFLICT (file_path) DO UPDATE
          SET file_hash = :h, last_ingested = :t, chunk_count = :c
    """), {"p": file_path, "h": hash_val, "t": datetime.now(timezone.utc), "c": chunk_count})
    session.commit()


def ingest_source(vs: VectorStore, chunker: Chunker, source: dict, verbose: bool) -> int:
    src_path = ROOT_DIR / source["path"]

    if not src_path.exists():
        if verbose:
            print(f"  [SKIP] No encontrado: {source['path']}")
        return 0

    with open(src_path, "r", encoding="utf-8") as f:
        content = f.read()

    chunk_size = source.get("chunk_size", 300)
    overlap    = source.get("overlap", 50)
    chunks     = chunker.split_by_markdown_headers(content, chunk_size, overlap)

    ingested = 0
    for i, chunk_text in enumerate(chunks):
        if len(chunk_text.split()) < 25:
            continue

        chunk_uuid = chunker.generate_deterministic_id(
            source.get("brand", "peak_qual"),
            src_path.name,
            i,
        )
        metadata = chunker.generate_metadata(
            brand=source.get("brand", "peak_qual"),
            sport=source.get("sport", "all"),
            topic=source.get("topic", "general"),
            source=src_path.name,
            section="header",
            text=chunk_text,
        )
        # Agregar priority a metadata si existe
        if "priority" in source:
            metadata["priority"] = source["priority"]

        vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
        ingested += 1

    return ingested


def run(force: bool = False, verbose: bool = True):
    """
    force=True → re-ingesta todo aunque no haya cambios.
    force=False → solo re-ingesta archivos modificados.
    """
    if not YAML_PATH.exists():
        print(f"ERROR: No se encontró {YAML_PATH}")
        return

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    sources = config.get("sources", [])
    vs      = VectorStore()
    chunker = Chunker()
    session = vs.Session()

    total_ingested = 0
    total_skipped  = 0
    total_missing  = 0

    if verbose:
        print(f"\n=== ETL Universal — Peak Qual RAG ===")
        print(f"Fuentes definidas: {len(sources)}")
        print(f"Modo: {'FORCE (todo)' if force else 'SMART (solo cambios)'}\n")

    for source in sources:
        src_path = ROOT_DIR / source["path"]

        if not src_path.exists():
            total_missing += 1
            if verbose:
                print(f"  [MISS]  {source['path']}")
            continue

        current_hash = file_hash(src_path)
        stored_hash  = get_stored_hash(session, source["path"])

        if not force and current_hash == stored_hash:
            total_skipped += 1
            if verbose:
                print(f"  [SKIP]  {source['path']} (sin cambios)")
            continue

        if verbose:
            status = "[NEW] " if not stored_hash else "[UPD] "
            print(f"  {status} {source['path']}")

        count = ingest_source(vs, chunker, source, verbose=False)
        save_hash(session, source["path"], current_hash, count)
        total_ingested += count

        if verbose:
            print(f"         → {count} chunks ingresados")

    session.close()

    if verbose:
        print(f"\n{'─'*40}")
        print(f"  Ingresados:  {total_ingested} chunks")
        print(f"  Sin cambios: {total_skipped} archivos")
        print(f"  Faltantes:   {total_missing} archivos")
        print(f"{'─'*40}\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="ETL Universal — Peak Qual RAG")
    parser.add_argument("--force", action="store_true", help="Re-ingestar todo aunque no haya cambios")
    parser.add_argument("--quiet", action="store_true", help="Sin output")
    args = parser.parse_args()
    run(force=args.force, verbose=not args.quiet)
```

---

### PASO 4 — Feedback loop (self-healing)

Cuando el atleta o coach marca una respuesta como mala:

1. Se registra en `rag_feedback`
2. Un job nocturno revisa los chunks con más feedback negativo
3. Sube `low_score_count` del chunk
4. Si `low_score_count >= 3` → chunk se marca `flagged = TRUE`
5. Los chunks flagged se excluyen de búsquedas hasta ser corregidos

```python
# Agregar en vector_store.py — método search actualizado
# Filtrar chunks flagged:
q = q.filter(KnowledgeBase.flagged == False)
```

El admin puede revisar chunks flagged y:
- Corregir el archivo fuente `.md`
- Correr `etl_universal.py` → el chunk se reemplaza con el contenido corregido
- El flag se resetea automáticamente al hacer upsert

---

### PASO 5 — Automatización nocturna (Cloud Scheduler)

Crear un Cloud Scheduler job que corra cada noche a las 3am:

```bash
# Comando a ejecutar en Cloud Run
python -m ingestion.etl_universal --quiet
```

Configuración en Google Cloud:
- **Schedule:** `0 3 * * *` (3am diario)
- **Target:** Cloud Run job `etl-universal`
- **Región:** us-central1
- **Service account:** con acceso a Cloud SQL + Vertex AI

---

## Orden de ejecución

```
1. Ejecutar SQL del PASO 1 en Cloud SQL
2. Crear rag_sources.yaml en raíz del proyecto
3. Crear etl_universal.py en backend/src/ingestion/
4. Instalar dependencia: pip install pyyaml
5. Correr primera vez: python etl_universal.py --force
6. Verificar chunks en knowledge_base
7. Agregar filtro flagged en vector_store.py (PASO 4)
8. Configurar Cloud Scheduler (PASO 5)
```

---

## Cómo agregar una fuente nueva (flujo normal)

```
1. Escribir el .md con el contenido
2. Agregar 5 líneas al rag_sources.yaml
3. Correr: python etl_universal.py
   → Solo ingesta el archivo nuevo, skip el resto
```

---

## Dependencias nuevas requeridas

```
pyyaml>=6.0
```

Agregar a `backend/requirements.txt`
