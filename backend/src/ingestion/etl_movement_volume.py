"""
ETL Movement Volume — Ingesta MOVEMENT_VOLUME_BRAIN.md al RAG
Holy Oly exclusivo (Weightlifting)
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore


def ingest_movement_volume():
    print("Starting Movement Volume Brain Ingestion...")
    vs = VectorStore()
    chunker = Chunker()

    source = ROOT_DIR / "holy_oly" / "MOVEMENT_VOLUME_BRAIN.md"

    if not source.exists():
        print(f"Missing: {source}")
        return 0

    with open(source, "r", encoding="utf-8") as f:
        content = f.read()

    chunks = chunker.split_by_markdown_headers(content, chunk_size=384, overlap=60)

    total = 0
    for i, chunk_text in enumerate(chunks):
        if len(chunk_text.split()) < 30:
            continue

        chunk_uuid = chunker.generate_deterministic_id("movement_volume", source.name, i)
        metadata = chunker.generate_metadata(
            brand="holy_oly",
            sport="weightlifting",
            topic="movement_volume",
            source=source.name,
            section="header",
            text=chunk_text
        )

        vs.upsert_chunk(chunk_uuid, chunk_text, metadata)
        total += 1

    print(f"Movement Volume Brain: {total} chunks ingested")
    return total


if __name__ == "__main__":
    ingest_movement_volume()
