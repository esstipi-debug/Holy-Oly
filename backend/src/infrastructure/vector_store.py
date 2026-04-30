import os
from typing import List, Dict, Any
import numpy as np
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, Text, String, JSON, DateTime, select, create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import google.auth
from google.cloud import aiplatform_v1
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value
try:
    from ..context import current_user_id_var
except ImportError:
    from context import current_user_id_var

Base = declarative_base()

class KnowledgeBase(Base):
    __tablename__ = 'knowledge_base'
    id = Column(String, primary_key=True)
    chunk_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768)) # Matching text-embedding-004
    meta = Column('metadata', JSON, default={})
    source = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Self-healing columns
    file_hash       = Column(String(64))
    quality_score   = Column(String)  # DECIMAL via raw
    retrieval_count = Column(Integer, default=0)
    low_score_count = Column(Integer, default=0)
    flagged         = Column(String)  # BOOLEAN via raw
    updated_at      = Column(DateTime, default=datetime.datetime.utcnow)

class MacrocycleAdjustmentLog(Base):
    __tablename__ = 'macrocycle_adjustment_log'
    id = Column(String, primary_key=True)
    athlete_id = Column(String, nullable=False)
    macrocycle_id = Column(String, nullable=False)
    session_id = Column(String)
    trigger = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    old_value = Column(JSON)
    new_value = Column(JSON)
    decided_by = Column(String, nullable=False)
    approved_by = Column(String)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class VectorStore:
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        db_url = os.getenv("DATABASE_URL")
        # Ensure the URL starts with postgresql:// for SQLAlchemy
        if db_url and db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        self.engine = create_engine(db_url)
        
        @event.listens_for(self.engine, "checkout")
        def set_rls_user(dbapi_connection, connection_record, connection_proxy):
            """Se ejecuta cada vez que se obtiene una conexión del pool."""
            user_id = current_user_id_var.get()
            if user_id:
                try:
                    cursor = dbapi_connection.cursor()
                    cursor.execute("SET LOCAL app.current_user_id = %s", (user_id,))
                    cursor.close()
                except Exception as e:
                    # Si falla, no bloqueamos la conexión pero loggeamos
                    print(f"[RLS Warning] No se pudo establecer el contexto de usuario: {e}")

        self.Session = sessionmaker(bind=self.engine)
        
        # Vertex AI client for embeddings
        self.project = "liftai-evolved-strength"
        self.location = "us-central1"
        self.client = aiplatform_v1.PredictionServiceClient(client_options={
            "api_endpoint": f"{self.location}-aiplatform.googleapis.com"
        })

    def _get_embedding(self, text: str) -> List[float]:
        endpoint = f"projects/{self.project}/locations/{self.location}/publishers/google/models/text-embedding-004"
        instance = Value()
        json_format.ParseDict({"content": text, "task_type": "RETRIEVAL_DOCUMENT"}, instance)
        
        response = self.client.predict(
            endpoint=endpoint,
            instances=[instance]
        )
        # Extract embedding from response
        predictions = response.predictions
        if not predictions:
            return []
        
        # Structure varies, but for text-embedding-004 it's often in 'embeddings' -> 'values'
        emb_data = predictions[0].get("embeddings", {}).get("values", [])
        return emb_data

    def search(self, query: str, limit: int = 5, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        query_vector = self._get_embedding(query)
        if not query_vector:
            return []
        
        session = self.Session()
        try:
            q = session.query(KnowledgeBase)
            
            # Apply metadata filters if provided
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        # Filtering JSON column
                        q = q.filter(KnowledgeBase.meta[key].astext == str(value))
                        
            # Excluir chunks flagged como malos
            q = q.filter(
                (KnowledgeBase.flagged == None) | (KnowledgeBase.flagged == 'false')
            )

            results = q.order_by(
                KnowledgeBase.embedding.cosine_distance(query_vector)
            ).limit(limit).all()
            
            # Incrementar retrieval_count por chunk usado
            for r in results:
                session.execute(
                    text("UPDATE knowledge_base SET retrieval_count = retrieval_count + 1 WHERE id = :id"),
                    {"id": r.id}
                )
            session.commit()

            return [
                {
                    "content": r.content,
                    "metadata": r.meta,
                    "source": r.source,
                    "chunk_id": r.id,
                    "distance": 0,
                } for r in results
            ]
        finally:
            session.close()

    def upsert(self, id: str, content: str, metadata: Dict[str, Any] = None, source: str = None):
        vector = self._get_embedding(content)
        session = self.Session()
        try:
            kb_entry = KnowledgeBase(
                id=id,
                chunk_id=id,
                content=content,
                embedding=vector,
                meta=metadata or {},
                source=source
            )
            session.merge(kb_entry)
            session.commit()
        finally:
            session.close()
