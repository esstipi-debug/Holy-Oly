import os
import sys
import re
from typing import List
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from infrastructure.vector_store import VectorStore, KnowledgeBase

def chunk_text(text: str, chunk_size: int = 1500) -> List[str]:
    """Splits text into chunks of approx chunk_size characters."""
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def ingest_document(file_path: str, source_label: str):
    print(f"--- Ingesting {source_label} ---")
    load_dotenv(r"C:\Users\Gamer\Desktop\Holy Oly 001\.env")
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by headers or size
    sections = re.split(r'##\s+', content)
    vs = VectorStore()
    
    total = 0
    for i, section in enumerate(sections):
        if not section.strip():
            continue
            
        chunks = chunk_text(section)
        for j, chunk in enumerate(chunks):
            import uuid
            # Generating a deterministic UUID from the chunk_id string
            namespace = uuid.NAMESPACE_DNS
            deterministic_uuid = str(uuid.uuid5(namespace, f"{source_label}_{i}_{j}"))
            
            metadata = {
                "source": source_label,
                "section_index": i,
                "chunk_index": j,
                "type": "technical_philosophy"
            }
            # Upsert into vector store (this generates embeddings via Vertex AI)
            vs.upsert(deterministic_uuid, chunk, metadata, source=source_label)
            total += 1
            if total % 10 == 0:
                print(f"Ingested {total} chunks...")

    print(f"Total {source_label} chunks ingested: {total}")

if __name__ == "__main__":
    # 1. Ingest Main Philosophy
    ingest_document(
        r"C:\Users\Gamer\Desktop\Holy Oly 001\volta\source\COMPTRAIN_MASTER.md", 
        "CompTrain Philosophy"
    )
    # 2. Ingest Brand/Architecture context
    ingest_document(
        r"C:\Users\Gamer\Desktop\Holy Oly 001\PEAK_QUAL.md", 
        "Peak Qual Architecture"
    )
    print("Core Knowledge Base Ingestion Finished.")
