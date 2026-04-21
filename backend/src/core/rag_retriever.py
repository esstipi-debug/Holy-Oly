from typing import List, Dict, Any
from ..infrastructure.vector_store import VectorStore
from ..infrastructure.gemini_provider import gemini_provider

class RAGRetriever:
    def __init__(self):
        self.vector_store = VectorStore()

    def get_context(self, query: str, limit: int = 3) -> str:
        # Perform vector search
        results = self.vector_store.search(query, limit=limit)
        
        if not results:
            return "No relevant context found in training knowledge base."

        context_parts = []
        for i, res in enumerate(results):
            content = res.get("content", "")
            source = res.get("source", "Unknown")
            context_parts.append(f"[{i+1}] Source: {source}\nContent: {content}")

        return "\n\n".join(context_parts)

    async def answer_with_context(self, query: str, user_role: str = "athlete") -> Dict[str, Any]:
        context = self.get_context(query)
        
        system_prompt = f"""You are Holy Oly, an empathetic AI coach. 
You are speaking to an {user_role}. 
Your goal is "Damage Control" and smart training.
Use the following technical context to answer the user's question. 
If the context doesn't contain the answer, use your general knowledge but prioritize the provided technical protocols.

CONTEXT:
{context}
"""
        
        # Use Pro model for reasoning and empathy
        response = gemini_provider.generate_pro(query, system_instruction=system_prompt)
        
        return {
            "answer": response,
            "context_used": context,
            "model": "gemini-1.5-flash"
        }

rag_retriever = RAGRetriever()
