import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore

def ingest_huberman():
    print("Starting Huberman Ingestion...")
    vs = VectorStore()
    chunker = Chunker()
    
    source_path = ROOT_DIR / "huberman_topics.md"
    
    if not source_path.exists():
        print("Huberman file not found.")
        return 0
        
    with open(source_path, "r", encoding="utf-8") as f:
        content = f.read()
            
    chunks = chunker.split_by_markdown_headers(content, 768, 120)
    
    total_chunks = 0
    for i, chunk_text in enumerate(chunks):
        if len(chunk_text.split()) < 30:
            continue
            
        chunk_uuid = chunker.generate_deterministic_id("huberman", "huberman_topics.md", i)
        metadata = chunker.generate_metadata(
            brand="huberman",
            sport="lifestyle",
            topic="recovery",
            source="huberman_topics.md",
            section="topic",
            text=chunk_text
        )
        
        vs.upsert(chunk_uuid, chunk_text, metadata, source="huberman_topics.md")
        total_chunks += 1
            
    print(f"Ingested {total_chunks} chunks for Huberman.")
    return total_chunks

if __name__ == "__main__":
    ingest_huberman()
