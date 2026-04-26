from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

class DocumentInput(BaseModel):
    """Modelo para la ingesta de nuevos documentos."""
    content: str = Field(..., description="Contenido de texto del fragmento de documento.")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Metadatos adicionales (ej: fuente, fecha, categoría)."
    )

class DocumentResponse(DocumentInput):
    """Modelo de respuesta para documentos recuperados."""
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    score: Optional[float] = Field(None, description="Puntuación de similitud (cosine similarity).")
