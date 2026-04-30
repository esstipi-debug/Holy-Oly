# ingestion/etl_volta.py
# Holy Oly — ETL Volta CrossFit
# Ingesta: VOLTA_BRAIN, VOLTA_CYCLE_BRAIN, WISE_SCORE_BRAIN, COMPTRAIN_MASTER

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore


# ---------------------------------------------------------------------------
# Fuentes Volta
# ---------------------------------------------------------------------------

VOLTA_SOURCES = [
    {
        "path": ROOT_DIR / "volta" / "VOLTA_BRAIN.md",
        "topic": "philosophy",
        "chunk_size": 256,
        "overlap": 40,
    },
    {
        "path": ROOT_DIR / "volta" / "VOLTA_CYCLE_BRAIN.md",
        "topic": "programming",
        "chunk_size": 300,
        "overlap": 50,
    },
    {
        "path": ROOT_DIR / "volta" / "WISE_SCORE_BRAIN.md",
        "topic": "wise_score",
        "chunk_size": 256,
        "overlap": 40,
    },
    {
        "path": ROOT_DIR / "volta" / "source" / "COMPTRAIN_MASTER.md",
        "topic": "programming",
        "chunk_size": 384,
        "overlap": 50,
    },
]


# ---------------------------------------------------------------------------
# ETL
# ---------------------------------------------------------------------------

def ingest_volta(verbose: bool = True) -> int:
    vs = VectorStore()
    chunker = Chunker()
    total_chunks = 0

    for source in VOLTA_SOURCES:
        src_path: Path = source["path"]

        if not src_path.exists():
            if verbose:
                print(f"  [SKIP] No encontrado: {src_path.name}")
            continue

        if verbose:
            print(f"  [OK]   Procesando: {src_path.name}")

        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = chunker.split_by_markdown_headers(
            content,
            source["chunk_size"],
            source["overlap"],
        )

        ingested = 0
        for i, chunk_text in enumerate(chunks):
            # Descartar chunks muy cortos
            if len(chunk_text.split()) < 25:
                continue

            chunk_uuid = chunker.generate_deterministic_id("volta", src_path.name, i)
            metadata = chunker.generate_metadata(
                brand="volta",
                sport="crossfit",
                topic=source["topic"],
                source=src_path.name,
                section="header",
                text=chunk_text,
            )

            vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
            ingested += 1

        if verbose:
            print(f"         → {ingested} chunks")
        total_chunks += ingested

    if verbose:
        print(f"\n  Total Volta: {total_chunks} chunks ingresados.")

    return total_chunks


if __name__ == "__main__":
    print("=== ETL Volta ===")
    ingest_volta(verbose=True)
