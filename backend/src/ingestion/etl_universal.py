# ingestion/etl_universal.py
# Peak Qual — ETL Universal
#
# Lee rag_sources.yaml y re-ingesta solo los archivos modificados.
# Usa hash MD5 para detectar cambios — no gasta embeddings si no hubo cambios.
#
# Uso:
#   python -m ingestion.etl_universal              # solo archivos modificados
#   python -m ingestion.etl_universal --force      # re-ingesta todo
#   python -m ingestion.etl_universal --dry-run    # muestra qué haría sin ejecutar
#   python -m ingestion.etl_universal --source volta/WISE_SCORE_BRAIN.md  # un archivo

import argparse
import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml
from sqlalchemy import text

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker

YAML_PATH = ROOT_DIR / "rag_sources.yaml"


# ---------------------------------------------------------------------------
# Hash helpers
# ---------------------------------------------------------------------------

def file_hash(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def get_stored_hash(session, file_path: str) -> str | None:
    row = session.execute(
        text("SELECT file_hash FROM rag_file_hashes WHERE file_path = :p"),
        {"p": file_path},
    ).fetchone()
    return row[0] if row else None


def save_hash(session, file_path: str, hash_val: str, chunk_count: int):
    session.execute(
        text("""
            INSERT INTO rag_file_hashes (file_path, file_hash, last_ingested, chunk_count)
            VALUES (:p, :h, :t, :c)
            ON CONFLICT (file_path) DO UPDATE
              SET file_hash     = :h,
                  last_ingested = :t,
                  chunk_count   = :c
        """),
        {"p": file_path, "h": hash_val, "t": datetime.now(timezone.utc), "c": chunk_count},
    )
    session.commit()


# ---------------------------------------------------------------------------
# Ingestión de una fuente
# ---------------------------------------------------------------------------

def ingest_source(
    vs,
    chunker: Chunker,
    source: dict,
    dry_run: bool = False,
) -> int:
    src_path = ROOT_DIR / source["path"]

    with open(src_path, "r", encoding="utf-8") as f:
        content = f.read()

    chunk_size = source.get("chunk_size", 300)
    overlap    = source.get("overlap", 50)
    chunks     = chunker.split_by_markdown_headers(content, chunk_size, overlap)

    ingested = 0
    for i, chunk_text in enumerate(chunks):
        if len(chunk_text.split()) < 25:
            continue

        if dry_run:
            ingested += 1
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
        if "priority" in source:
            metadata["priority"] = source["priority"]

        vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
        ingested += 1

    return ingested


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------

def run(
    force: bool = False,
    dry_run: bool = False,
    only_source: str | None = None,
    verbose: bool = True,
):
    if not YAML_PATH.exists():
        print(f"ERROR: No se encontró {YAML_PATH}")
        return

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    sources = config.get("sources", [])

    # Filtro por fuente específica
    if only_source:
        sources = [s for s in sources if s["path"] == only_source]
        if not sources:
            print(f"ERROR: No se encontró '{only_source}' en rag_sources.yaml")
            return

    # Filtrar desactivadas
    sources = [s for s in sources if s.get("enabled", True)]

    if not dry_run:
        from infrastructure.vector_store import VectorStore
    vs      = VectorStore() if not dry_run else None
    chunker = Chunker()
    session = vs.Session() if not dry_run else None

    stats = {"ingested": 0, "skipped": 0, "missing": 0, "files": 0}

    if verbose:
        print(f"\n{'='*50}")
        print(f"  ETL Universal — Peak Qual RAG")
        print(f"  Fuentes activas: {len(sources)}")
        mode = "DRY RUN" if dry_run else ("FORCE" if force else "SMART")
        print(f"  Modo: {mode}")
        print(f"{'='*50}\n")

    for source in sources:
        src_path = ROOT_DIR / source["path"]

        # Archivo no existe
        if not src_path.exists():
            stats["missing"] += 1
            if verbose:
                print(f"  [MISS]  {source['path']}")
            continue

        # Check hash (solo en modo smart)
        if not force and not dry_run:
            current_hash = file_hash(src_path)
            stored_hash  = get_stored_hash(session, source["path"])
            if current_hash == stored_hash:
                stats["skipped"] += 1
                if verbose:
                    print(f"  [SKIP]  {source['path']}")
                continue
        else:
            current_hash = file_hash(src_path)

        # Ingestar
        if dry_run:
            label = "[DRY] "
        elif session and not get_stored_hash(session, source["path"]):
            label = "[NEW] "
        else:
            label = "[UPD] "
        count = ingest_source(vs, chunker, source, dry_run=dry_run)

        if not dry_run and session:
            save_hash(session, source["path"], current_hash, count)

        stats["ingested"] += count
        stats["files"]    += 1

        if verbose:
            print(f"  {label} {source['path']}  ->  {count} chunks")

    if session:
        session.close()

    if verbose:
        print(f"\n{'-'*50}")
        print(f"  Archivos procesados: {stats['files']}")
        print(f"  Chunks ingresados:   {stats['ingested']}")
        print(f"  Sin cambios:         {stats['skipped']}")
        print(f"  Archivos faltantes:  {stats['missing']}")
        print(f"{'-'*50}\n")

    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="ETL Universal — Peak Qual RAG",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python -m ingestion.etl_universal
  python -m ingestion.etl_universal --force
  python -m ingestion.etl_universal --dry-run
  python -m ingestion.etl_universal --source volta/WISE_SCORE_BRAIN.md
        """,
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-ingesta todo aunque no haya cambios",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra qué haría sin ejecutar ni gastar embeddings",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Ingestar solo una fuente específica (path relativo como en el YAML)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Sin output",
    )
    args = parser.parse_args()

    run(
        force=args.force,
        dry_run=args.dry_run,
        only_source=args.source,
        verbose=not args.quiet,
    )
