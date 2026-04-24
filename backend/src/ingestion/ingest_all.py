import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Roots
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.append(str(ROOT_DIR / "backend" / "src"))

# Load ENV before imports
load_dotenv(ROOT_DIR / ".env")

from ingestion.etl_huberman import ingest_huberman
from ingestion.etl_holy_oly import ingest_holy_oly
from ingestion.etl_volta import ingest_volta
from ingestion.etl_axon import ingest_axon
from ingestion.etl_caffeine import ingest_caffeine
from ingestion.etl_sleep import ingest_sleep
from ingestion.etl_hormonal import ingest_hormonal
from ingestion.etl_alcohol import ingest_alcohol
from ingestion.etl_movement_volume import ingest_movement_volume
from ingestion.etl_nutrition import ingest_nutrition
from ingestion.etl_competition import ingest_competition

def run_full_ingestion():
    start_time = time.time()
    print("==========================================")
    print("--- PEAK QUAL RAG ORCHESTRATOR ---")
    print("==========================================")

    stats = {
        "huberman": ingest_huberman(),
        "holy_oly": ingest_holy_oly(),
        "volta": ingest_volta(),
        "axon": ingest_axon(),
        "caffeine": ingest_caffeine(),
        "sleep": ingest_sleep(),
        "hormonal": ingest_hormonal(),
        "alcohol": ingest_alcohol(),
        "movement_volume": ingest_movement_volume(),
        "nutrition": ingest_nutrition(),
        "competition": ingest_competition(),
    }
    
    duration = time.time() - start_time
    total_chunks = sum(stats.values())
    
    print("\n==========================================")
    print("INGESTION REPORT")
    print("==========================================")
    for brand, count in stats.items():
        print(f"{brand.upper():<10}: {count:>5} chunks")
    print("------------------------------------------")
    print(f"Total Chunks: {total_chunks}")
    print(f"Duration:     {duration:.2f}s")
    print(f"Estimate:     ${(total_chunks * 0.0001):.4f} (Embeddings cost)")
    print("==========================================\n")
    
    return stats

if __name__ == "__main__":
    run_full_ingestion()
