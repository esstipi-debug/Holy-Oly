import re
from typing import List, Dict

class DocumentChunker:
    """
    Motor encargado de fragmentar textos metodológicos (USAW, Hyrox) 
    y protocolos de salud (Huberman).
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, source_type: str = "general") -> List[str]:
        """
        Divide un texto en chunks dependiendo de sus metadatos o formato original.
        """
        if source_type == "huberman":
            return self._semantic_chunk_huberman(text)
        elif source_type in ["usaw", "hyrox"]:
            return self._bulletpoint_chunk(text)
        else:
            return self._basic_chunk(text)

    def _basic_chunk(self, text: str) -> List[str]:
        # Implementación simple por caracteres (naive chunking)
        chunks = []
        start = 0
        text_length = len(text)
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            chunks.append(text[start:end])
            start += (self.chunk_size - self.chunk_overlap)
        return chunks

    def _semantic_chunk_huberman(self, text: str) -> List[str]:
        # Huberman tiene mucha prosa científica. Una buena idea es partir por párrafos
        # y luego agruparlos hasta llegar a chunk_size de forma semántica.
        # Por ahora delegamos a _basic_chunk, a mejorar en tuning RAG.
        return self._basic_chunk(text)

    def _bulletpoint_chunk(self, text: str) -> List[str]:
        # Halterofilia suele estar llena de listas. Evitar romper listas por la mitad.
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        for p in paragraphs:
            if len(current_chunk) + len(p) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = p
            else:
                current_chunk += "\n\n" + p
        if current_chunk:
            chunks.append(current_chunk.strip())
        return chunks
