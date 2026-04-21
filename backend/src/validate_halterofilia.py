import os
import sys
from dotenv import load_dotenv

# Load from root .env immediately
load_dotenv(r"C:\Users\Gamer\Desktop\Holy Oly 001\.env")

# Add src to path exactly
sys.path.append(os.path.join(os.path.dirname(__file__)))

from core.rag_retriever import rag_retriever

def test_halterofilia_validation():
    print("--- [HALTEROFILIA TECHNICAL VALIDATION] ---")
    load_dotenv(r"C:\Users\Gamer\Desktop\Holy Oly 001\.env")
    
    # Technical question about weightlifting and recovery
    query = "¿Cómo corregir el fallo por técnica en el Snatch (salto adelante) para un atleta que ya tiene fatiga acumulada según nuestra filosofía?"
    
    print(f"Querying AI with: {query}")
    try:
        response = rag_retriever.query(query)
        print("\n--- AI RESPONSE ---")
        print(response["answer"])
        print("\n--- CONTEXT USED (Snippet) ---")
        if response["context_used"]:
            print(response["context_used"][0][:200] + "...")
    except Exception as e:
        print(f"Error during validation: {e}")

if __name__ == "__main__":
    test_halterofilia_validation()
