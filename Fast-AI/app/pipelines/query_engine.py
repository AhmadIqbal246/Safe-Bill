import time
from typing import AsyncGenerator, List, Dict, Any

from app.db.vector_store import vector_store
from app.services.embeddings.embedder import embedding_service
from app.services.retrieval.reranker import rerank_service
from app.services.llm.generation import llm_service
from app.schemas.chat import ChatRequest, MessagePrompt, RetrievedChunk, ChunkMetadata

class QueryEngine:
    def __init__(self):
        # We retrieve top 20 from Pinecone initially
        self.raw_retrieval_count = 20
        # Then we re-rank down to the absolute top 5 most relevant ones
        self.rerank_top_n = 5

    async def _rewrite_query(self, messages: List[MessagePrompt]) -> str:
        """
        Analyzes the chat history and the latest user question to create a 
        standalone, search-optimized query. This handles follow-up questions
        like 'how do I delete it?' by resolving 'it' from the history.
        """
        if len(messages) == 1:
            return messages[-1].content

        # Create a prompt for the LLM to condense the history and question
        history_text = "\n".join([f"{m.role}: {m.content}" for m in messages[:-3]]) # last 3 messages for context
        last_query = messages[-1].content
        
        prompt = (
            "Given the following conversation history and a NEW user question, "
            "rephrase the NEW question into a STANDALONE search query that contains all necessary context. "
            "Internalize keywords from the history into the new query. Output ONLY the standalone query.\n\n"
            f"HISTORY:\n{history_text}\n"
            f"NEW QUESTION: {last_query}\n"
            "STANDALONE SEARCH QUERY:"
        )
        
        try:
            response = await llm_service.client.chat.completions.create(
                model=llm_service.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            condensed_query = response.choices[0].message.content.strip()
            # Clean up potential quotes or AI chatter
            condensed_query = condensed_query.strip('"').strip("'")
            return condensed_query if condensed_query else last_query
        except Exception as e:
            print(f"Warning: Query rewrite failed: {e}")
            return last_query

    async def answer_query(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """
        Orchestrates the full RAG cycle:
        Rewrite -> Retrieve -> Rerank -> Generate Response
        """
        # 1. Get the primary query (optimized for history context)
        search_query = await self._rewrite_query(request.messages)
        print(f"--- Search Optimized Query: '{search_query}' ---")
        # 2. Vector Search (Pinecone)
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
                query=search_query, 
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
