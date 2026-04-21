import os
import sys
from pathlib import Path

# Fix paths
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

from ingestion.chunker import Chunker
from infrastructure.vector_store import VectorStore

def ingest_holy_oly():
    print("Starting Holy Oly Ingestion...")
    vs = VectorStore()
    chunker = Chunker()
    
    # Sources
    sources = [
        ROOT_DIR / "holy_oly" / "HOLY_OLY_BRAIN.md",
        ROOT_DIR / "holy_oly" / "source" / "USA_4PHASE_PERIODIZATION.md",
        ROOT_DIR / "holy_oly" / "source" / "USA_COACHING_CUES.md",
        ROOT_DIR / "holy_oly" / "source" / "USA_SCHOOL_INGESTION.md",
    ]
    
    total_chunks = 0
    for src_path in sources:
        if not src_path.exists():
            print(f"Skipping missing file: {src_path}")
            continue
            
        print(f"Processing: {src_path.name}")
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Determine strategy
        is_brain = "BRAIN" in src_path.name
        size = 256 if is_brain else 512
        overlap = 40 if is_brain else 80
        
        chunks = chunker.split_by_markdown_headers(content, size, overlap)
        
        for i, chunk_text in enumerate(chunks):
            if len(chunk_text.split()) < 30: # Noise filter (~200 chars/40 words)
                continue
                
            chunk_uuid = chunker.generate_deterministic_id("holy_oly", src_path.name, i)
            metadata = chunker.generate_metadata(
                brand="holy_oly",
                sport="weightlifting",
                topic="technique" if "CUES" in src_path.name else "programming",
                source=src_path.name,
                section="header", # Generic for now
                text=chunk_text
            )
            
            vs.upsert(chunk_uuid, chunk_text, metadata, source=src_path.name)
            total_chunks += 1
            
    print(f"Ingested {total_chunks} chunks for Holy Oly.")
    return total_chunks

if __name__ == "__main__":
    ingest_holy_oly()
