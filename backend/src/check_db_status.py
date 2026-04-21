import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://")
engine = create_engine(db_url)

with engine.connect() as conn:
    query = text("SELECT metadata->>'brand' as brand, COUNT(*) as count FROM knowledge_base GROUP BY metadata->>'brand'")
    results = conn.execute(query).fetchall()
    
    print("\n CURRENT DATABASE CHUNKS:")
    print("-" * 30)
    for r in results:
        print(f" {str(r[0]).upper():<10}: {r[1]:>5} chunks")
    print("-" * 30)
    print(f"Total: {sum(r[1] for r in results)}\n")
