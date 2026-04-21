import os
import markdown
from typing import List
from ..infrastructure.vector_store import VectorStoreManager

class HubermanETL:
    def __init__(self):
        self.vector_store = VectorStoreManager()
    
    def parse_markdown(self, filepath: str) -> List[dict]:
        """
        Lee el archivo de Huberman y lo separa por topics (H2).
        Retorna una lista de payloads con Metadata limpia.
        """
        if not os.path.exists(filepath):
            return []
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # División rudimentaria base por Headers ##
        topics = content.split('## ')
        processed_chunks = []
        
        for topic in topics[1:]: # El primer bloque suele ser el título del documento o vacío
            lines = topic.strip().split('\n')
            title = lines[0].strip()
            body = '\n'.join(lines[1:]).strip()
            
            # Aquí iría el Chunking interno y el embedding mock
            # Por seguridad en esta build, si no hay API: 
            # asume embeddings dummy [0.0] * 1536
            mock_embedding = [0.1] * 1536
            
            payload = {
                "source": "huberman_topics",
                "title": title,
                "text": body,
                "domain": "recovery_control_daños"
            }
            
            processed_chunks.append((mock_embedding, payload))
            
        return processed_chunks
        
    def run_pipeline(self):
        root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
        target_path = os.path.join(root_path, "huberman_topics.md")
        
        chunks = self.parse_markdown(target_path)
        
        if chunks:
            print(f"[Huberman ETL] Encontrados {len(chunks)} topics. Iniciando carga a V-Store...")
            vectors = [c[0] for c in chunks]
            payloads = [c[1] for c in chunks]
            self.vector_store.upsert_chunks(vectors, payloads)
            return True
        return False
