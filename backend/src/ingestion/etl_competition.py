"""
ETL Competition — Ingesta COMPETITION_BRAIN.md al RAG
Holy Oly (Weightlifting) + Axon (Hyrox)
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore


def ingest_competition():
    print("Starting Competition Brain Ingestion...")
    vs = VectorStore()
    chunker = Chunker()

    source = ROOT_DIR / "competition" / "COMPETITION_BRAIN.md"

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

        chunk_uuid = chunker.generate_deterministic_id("competition", source.name, i)
        metadata = chunker.generate_metadata(
            brand="peak_qual",
            sport="competition",
            topic="competition_protocol",
            source=source.name,
            section="header",
            text=chunk_text
        )

        vs.upsert_chunk(chunk_uuid, chunk_text, metadata)
        total += 1

    print(f"Competition Brain: {total} chunks ingested")
    return total


if __name__ == "__main__":
    ingest_competition()
