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
        standalone, search-optimized query.
        """
        if len(messages) <= 1:
            return messages[-1].content

        # Limit context to last 10 messages for the rewriter to keep it lightning fast
        context_messages = messages[-11:-1]
        history_text = "\n".join([f"{m.role}: {m.content}" for m in context_messages])
        last_query = messages[-1].content
        
        prompt = (
            "Given the following conversation history and a NEW user question, "
            "perform one of two actions:\n"
            "1. If the question is about the Safe-Bill PLATFORM (features, payments, rules), rephrase it into a standalone search query.\n"
            "2. If the question is PERSONAL or CONVERSATIONAL (about the user's name, role, shared details, or previous chat history), "
            "output 'CONVERSATIONAL_CONTEXT'. Do not search the manual for these questions.\n\n"
            "Output ONLY the standalone query or the keyword.\n\n"
            f"HISTORY:\n{history_text}\n"
            f"NEW QUESTION: {last_query}\n"
            "RESULT:"
        )
        
        try:
            response = await llm_service.client.chat.completions.create(
                model=llm_service.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                temperature=0.0 # Strict classification
            )
            result = response.choices[0].message.content.strip()
            # Clean up potential quotes or AI chatter
            result = result.strip('"').strip("'")
            return result if result else last_query
        except Exception as e:
            print(f"Warning: Query rewrite failed: {e}")
            return last_query
        
    async def answer_query(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """
        Orchestrates the full RAG cycle:
        Rewrite -> Retrieve -> Rerank -> Generate Response
        """
        # 1. Get the primary query (optimized for history context or routed to memory)
        search_query = await self._rewrite_query(request.messages)
        
        # Fallback if rewrite fails or returns empty
        if not search_query or search_query.strip() == "":
            search_query = request.messages[-1].content
            
        print(f"--- Search Optimized Query: '{search_query}' ---")

        # 2. INTELIGENT ROUTING: If the query is marked as conversational, skip RAG search
        if "CONVERSATIONAL_CONTEXT" in search_query:
            print("--- INFO: Conversational Routing Active. Skipping Manual Retrieval. ---")
            async for chunk in llm_service.generate_response_stream(
                messages=request.messages,
                context_chunks=[] # Send empty context to prioritize memory
            ):
                yield chunk
            return

        # 3. Vector Search (Pinecone)
        # Ensure we have a valid string for embedding
        if not search_query.strip():
            print("--- WARNING: Empty search query. Yielding fallback response. ---")
            async for chunk in llm_service.generate_response_stream(
                messages=request.messages,
                context_chunks=[]
            ):
                yield chunk
            return

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
            
        # 4. Intelligent Re-ranking (Cohere)
        if candidate_chunks:
            reranked_chunks = await rerank_service.rerank(
                query=search_query, 
                chunks=candidate_chunks, 
                top_n=self.rerank_top_n
            )
        else:
            reranked_chunks = []
            
        # 5. Context Preparation
        context_texts = [f"[Source: {c.metadata.source} | Section: {c.metadata.title}]\n{c.text}" for c in reranked_chunks]
        
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
