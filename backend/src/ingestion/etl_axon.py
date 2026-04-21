import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore

def ingest_axon():
    print("Starting Axon Ingestion...")
    vs = VectorStore()
    chunker = Chunker()
    
    sources = [
        ROOT_DIR / "axon" / "AXON_BRAIN.md",
        ROOT_DIR / "axon" / "source" / "HYROX_ARCHITECTURE.md",
    ]
    
    total_chunks = 0
    for src_path in sources:
        if not src_path.exists():
            print(f"Skipping missing file: {src_path}")
            continue
            
        print(f"Processing: {src_path.name}")
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        is_brain = "BRAIN" in src_path.name
        size = 256 if is_brain else 512
        overlap = 40 if is_brain else 80
        
        chunks = chunker.split_by_markdown_headers(content, size, overlap)
        
        for i, chunk_text in enumerate(chunks):
            if len(chunk_text.split()) < 30:
                continue
                
            chunk_uuid = chunker.generate_deterministic_id("axon", src_path.name, i)
            metadata = chunker.generate_metadata(
                brand="axon",
                sport="hyrox",
                topic="technique",
                source=src_path.name,
                section="header",
                text=chunk_text
            )
            
            vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
            total_chunks += 1
            
    print(f"Ingested {total_chunks} chunks for Axon.")
    return total_chunks

if __name__ == "__main__":
    ingest_axon()
