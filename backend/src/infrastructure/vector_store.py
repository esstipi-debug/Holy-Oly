import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List

class VectorStoreManager:
    """
    Manager de infraestructura para Qdrant (Base de datos vectorial).
    Maneja la inicialización de colecciones y persistencia (local o managed cluster).
    """
    def __init__(self, collection_name: str = "holyoly_knowledge"):
        # Utilizamos entorno local o de memoria de ser necesario hasta recibir keys
        qdrant_url = os.getenv("QDRANT_URL", ":memory:")
        qdrant_key = os.getenv("QDRANT_API_KEY", None)

        if qdrant_url == ":memory:":
            self.client = QdrantClient(location=":memory:")
            print("[VectorStore] Advertencia: Ejecutando Qdrant en Memoria (Local).")
        else:
            self.client = QdrantClient(url=qdrant_url, api_key=qdrant_key)

        self.collection_name = collection_name
        self._ensure_collection()

    def _ensure_collection(self):
        """Crea la colección si no existe."""
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE), # Tamaño embedding OpenAI target
            )
            print(f"[VectorStore] Colección '{self.collection_name}' inicializada (1536 dims).")

    def upsert_chunks(self, vectors: List[list], payloads: List[dict]):
        """Sube lotes de embeddings a Qdrant."""
        points = [
            PointStruct(id=idx, vector=vec, payload=payload)
            for idx, (vec, payload) in enumerate(zip(vectors, payloads))
        ]
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        print(f"[VectorStore] {len(points)} puntos ingestados correctamente.")
