import re
import uuid
from typing import List, Dict, Any

class Chunker:
    @staticmethod
    def split_by_markdown_headers(text: str, chunk_size: int, overlap: int) -> List[str]:
        # Split by H2 or H3 headers as per instructions
        sections = re.split(r'(?m)^##+\s+', text)
        chunks = []
        
        for section in sections:
            if not section.strip():
                continue
            
            # If section is too big, sub-chunk it
            if len(section) > chunk_size * 4:
                sub_chunks = Chunker.sliding_window(section, chunk_size * 4, overlap * 4)
                chunks.extend(sub_chunks)
            else:
                chunks.append(section.strip())
        
        return chunks

    @staticmethod
    def sliding_window(text: str, size: int, overlap: int) -> List[str]:
        chunks = []
        if len(text) <= size:
            return [text]
        
        start = 0
        while start < len(text):
            end = start + size
            chunks.append(text[start:end])
            start += size - overlap
            if start + overlap >= len(text):
                break
        return chunks

    @staticmethod
    def generate_metadata(brand: str, sport: str, topic: str, source: str, section: str, text: str) -> Dict[str, Any]:
        return {
            "brand": brand,
            "sport": sport,
            "topic": topic,
            "difficulty": "intermediate", # Default
            "source": source,
            "section": section,
            "token_count": len(text.split()) + (len(text) // 10), # Approximation
            "lang": "es" if any(word in text.lower() for word in ["entrenamiento", "fuerza", "pausa"]) else "en"
        }

    @staticmethod
    def generate_deterministic_id(brand: str, source: str, index: int) -> str:
        namespace = uuid.NAMESPACE_DNS
        return str(uuid.uuid5(namespace, f"{brand}_{source}_{index}"))
