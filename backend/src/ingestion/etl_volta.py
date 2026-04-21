import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore

def ingest_volta():
    print("Starting Volta Ingestion...")
    vs = VectorStore()
    chunker = Chunker()
    
    sources = [
        ROOT_DIR / "volta" / "VOLTA_BRAIN.md",
        ROOT_DIR / "volta" / "source" / "COMPTRAIN_MASTER.md",
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
        size = 256 if is_brain else 384
        overlap = 40 if is_brain else 50
        
        chunks = chunker.split_by_markdown_headers(content, size, overlap)
        
        for i, chunk_text in enumerate(chunks):
            if len(chunk_text.split()) < 30:
                continue
                
            chunk_uuid = chunker.generate_deterministic_id("volta", src_path.name, i)
            metadata = chunker.generate_metadata(
                brand="volta",
                sport="crossfit",
                topic="programming" if "COMPTRAIN" in src_path.name else "philosophy",
                source=src_path.name,
                section="header",
                text=chunk_text
            )
            
            vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
            total_chunks += 1
            
    print(f"Ingested {total_chunks} chunks for Volta.")
    return total_chunks

if __name__ == "__main__":
    ingest_volta()
