import time
from typing import AsyncGenerator, List, Dict, Any

from app.db.vector_store import vector_store
from app.services.embeddings.embedder import embedding_service
from app.services.retrieval.reranker import rerank_service
from app.services.llm.generation import llm_service
from app.schemas.chat import ChatRequest, RetrievedChunk, ChunkMetadata

class QueryEngine:
    def __init__(self):
        # We retrieve top 20 from Pinecone initially
        self.raw_retrieval_count = 20
        # Then we re-rank down to the absolute top 5 most relevant ones
        self.rerank_top_n = 5

    async def _rewrite_query(self, query: str) -> str:
        """
        Extracts technical keywords from a user question to improve search results.
        Example: 'how to create a project' -> 'project creation workflow'
        """
        prompt = (
            f"Given the following user question, output 3-5 technical keywords "
            f"that would be found in a documentation index. Output ONLY the keywords separated by spaces.\n"
            f"Question: {query}"
        )
        
        try:
            # We use a non-streaming call for the expansion
            response = await llm_service.client.chat.completions.create(
                model=llm_service.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            expanded_query = response.choices[0].message.content.strip()
            return f"{query} {expanded_query}"
        except:
            return query

    async def answer_query(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """
        Orchestrates the full RAG cycle:
        Rewrite -> Retrieve -> Rerank -> Generate Response
        """
        # 1. Get the primary query
        user_query = request.messages[-1].content
        
        # 2. Query Expansion (Ensures we hit the right keywords)
        search_query = await self._rewrite_query(user_query)
        
        # 3. Vector Search (Pinecone)
        query_vector = embedding_service.embed_text(search_query)
        raw_matches = vector_store.similarity_search(
            query_vector=query_vector, 
            top_k=self.raw_retrieval_count
        )
        
        # Convert Pinecone format to our schema
        candidate_chunks = []
        for match in raw_matches:
            meta = match.get('metadata', {})
            candidate_chunks.append(RetrievedChunk(
                text=meta.get('text', ""),
                score=match.get('score', 0.0),
                metadata=ChunkMetadata(
                    source=meta.get('source', "Unknown"),
                    title=meta.get('title', "Untitled"),
                    chunk_index=int(meta.get('chunk_index', 0))
                )
            ))
            
        # 3. Intelligent Re-ranking (Cohere)
        # This fixes the "semantic drift" where Pinecone might give a noisy result
        if candidate_chunks:
            reranked_chunks = await rerank_service.rerank(
                query=user_query, 
                chunks=candidate_chunks, 
                top_n=self.rerank_top_n
            )
        else:
            reranked_chunks = []
            
        # 4. Context Preparation
        context_texts = [c.text for c in reranked_chunks]
        
        # DEBUG: Print retrieved context to terminal
        print("\n--- RETRIEVED CONTEXT ---")
        for i, chunk in enumerate(reranked_chunks):
            print(f"[{i+1}] Source: {chunk.metadata.source} | Section: {chunk.metadata.title}")
            # print(f"Text Snippet: {chunk.text[:200]}...")
        print("-------------------------\n")
        
        # 5. Continuous Stream Generation
        # We pass the full message history so the AI can handle follow-up questions
        async for chunk in llm_service.generate_response_stream(
            messages=request.messages,
            context_chunks=context_texts
        ):
            yield chunk

query_engine = QueryEngine()
