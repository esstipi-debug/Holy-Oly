import os
from .chunker import DocumentChunker

class AutoIngestPipeline:
    """
    Pipeline asíncrono para ingestar documentos técnicos (PDFs, Markdown)
    y prepararlos para persistencia vectorial.
    """
    
    def __init__(self):
        self.chunker = DocumentChunker()

    def process_document(self, filepath: str, source_type: str = "general") -> list:
        """
        Lee el documento y devuelve una lista de chunks listos
        para ser enviados a un modelo de embeddings.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"El archivo {filepath} no existe.")

        print(f"[Ingestion Pipeline] Procesando {filepath} como {source_type}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            texto_crudo = f.read()

        lista_chunks = self.chunker.chunk_text(text=texto_crudo, source_type=source_type)
        
        print(f"[Ingestion Pipeline] Generados {len(lista_chunks)} chunks.")
        # TODO: Vectorizar con OpenAI y hacer upsert a Qdrant o PostgreSQL pgvector
        return lista_chunks

# Para pruebas rápidas:
if __name__ == "__main__":
    pipeline = AutoIngestPipeline()
    # Simulación
    # chunks = pipeline.process_document("../../README.md", source_type="general")
    # print(chunks[:2])
