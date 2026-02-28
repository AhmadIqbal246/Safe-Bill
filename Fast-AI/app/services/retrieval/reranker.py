import cohere
from app.core.config import settings
from app.schemas.chat import RetrievedChunk

class RerankService:
    def __init__(self):
        self.co = cohere.AsyncClient(api_key=settings.COHERE_API_KEY)
        self.model = "rerank-english-v3.0"
        
    async def rerank(self, query: str, chunks: list[RetrievedChunk], top_n: int = 3) -> list[RetrievedChunk]:
        """
        Takes the raw top-20 chunks from Pinecone, scores their exact relevance 
        against the query, and returns only the absolute top 3.
        """
        if not chunks:
            return []
            
        # Extract just the raw text strings to pass to the reranker
        documents = [c.text for c in chunks]
        
        # Call the Cohere Re-ranker API
        response = await self.co.rerank(
            model=self.model,
            query=query,
            documents=documents,
            top_n=top_n
        )
        
        final_chunks = []
        for result in response.results:
            # Map the reranked index back to our original object and update its score
            original_chunk = chunks[result.index]
            original_chunk.score = result.relevance_score
            final_chunks.append(original_chunk)
            
        return final_chunks

rerank_service = RerankService()
