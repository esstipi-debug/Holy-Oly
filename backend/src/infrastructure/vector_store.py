import os
from typing import List, Dict, Any
import numpy as np
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, Text, String, JSON, DateTime, select, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import google.auth
from google.cloud import aiplatform_v1
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value

Base = declarative_base()

class KnowledgeBase(Base):
    __tablename__ = 'knowledge_base'
    id = Column(String, primary_key=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768)) # Matching text-embedding-004
    meta = Column('metadata', JSON, default={})
    source = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
        db_url = os.getenv("DATABASE_URL")
        # Ensure the URL starts with postgresql:// for SQLAlchemy
        if db_url and db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        self.engine = create_engine(db_url)
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
                        
            results = q.order_by(
                KnowledgeBase.embedding.cosine_distance(query_vector)
            ).limit(limit).all()
            
            return [
                {
                    "content": r.content,
                    "metadata": r.meta,
                    "source": r.source,
                    "distance": 0 # Distance could be calculated if needed
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
                content=content,
                embedding=vector,
                meta=metadata or {},
                source=source
            )
            session.merge(kb_entry)
            session.commit()
        finally:
            session.close()
