from typing import List, Dict, Any

class RAGRetriever:
    def __init__(self):
        self._vector_store = None
        self._configured = False
        try:
            from infrastructure.vector_store import VectorStore
            self._vector_store = VectorStore()
            self._configured = True
        except Exception as e:
            print(f"[Warning] VectorStore init failed: {e}")

    def get_context(self, query: str, brand: str = None, limit: int = 5) -> str:
        if not self._configured:
            return "Vector store not configured. Set up pgvector and GOOGLE_API_KEY."
        
        try:
            filters = {"brand": brand} if brand else {}
            results = self._vector_store.search(query, limit=limit, filters=filters)
            
            if not results:
                return "No relevant context found in training knowledge base."

            context_parts = []
            for i, res in enumerate(results):
                content = res.get("content", "")
                source = res.get("source", "Unknown")
                context_parts.append(f"[{i+1}] Source: {source}\nContent: {content}")

            return "\n\n".join(context_parts)
        except Exception as e:
            return f"Context retrieval failed: {e}"

    def query(self, query: str, brand: str = None, user_role: str = "athlete") -> Dict[str, Any]:
        context = self.get_context(query, brand=brand)
        
        from infrastructure.gemini_provider import gemini_provider
        
        system_prompt = f"""You are Holy Oly, an empathetic AI coach. 
You are speaking to an {user_role}. 
Your goal is "Damage Control" and smart training.
Use the following technical context to answer the user's question. 

CONTEXT:
{context}
"""
        
        response = gemini_provider.generate_pro(query, system_instruction=system_prompt)
        
        return {
            "answer": response,
            "context_used": context,
            "model": "gemini-2.0-flash-lite"
        }

    async def answer_with_context(self, query: str, user_role: str = "athlete") -> Dict[str, Any]:
        """Async version for FastAPI"""
        return self.query(query, user_role=user_role)

rag_retriever = RAGRetriever()
