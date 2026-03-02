import time
import json
from typing import AsyncGenerator, List, Dict, Any

from app.db.vector_store import vector_store
from app.db.redis_client import cache_service
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

    async def _rewrite_query(self, messages: List[MessagePrompt]) -> Dict[str, str]:
        """
        Analyzes history to create two outputs:
        1. 'canonical_id': A stable, semantic ID for the Cache (e.g. 'account_deletion')
        2. 'search_query': A descriptive humanized sentence for Pinecone search.
        """
        last_query = messages[-1].content
        context_messages = messages[-11:-1]
        history_text = "\n".join([f"{m.role}: {m.content}" for m in context_messages])
        
        prompt = (
            "Given the following history and a NEW question, analyze the intent and output a JSON object.\n\n"
            "RULES:\n"
            "1. If technical/platform question, output JSON with:\n"
            "   - 'canonical_id': A stabilized semantic ID (lowercase, underscores, no punctuation). "
            "     Example: 'How to delete?' and 'I want to delete account' BOTH map to 'account_deletion_process'.\n"
            "   - 'search_query': A descriptive, standalone version of the question for a search engine.\n"
            "2. If personal/conversational, output: {\"canonical_id\": \"CONVERSATIONAL_CONTEXT\", \"search_query\": \"\"}\n\n"
            f"HISTORY:\n{history_text}\n"
            f"NEW QUESTION: {last_query}\n"
            "JSON OUTPUT:"
        )
        
        fallback = {"canonical_id": last_query.lower().replace(" ", "_"), "search_query": last_query}
        
        try:
            response = await llm_service.client.chat.completions.create(
                model=llm_service.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                temperature=0.0,
                response_format={"type": "json_object"} # Ensure valid JSON
            )
            result = json.loads(response.choices[0].message.content.strip())
            return result
        except Exception as e:
            print(f"Warning: Query rewrite failed: {e}")
            return fallback
        
    async def answer_query(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """
        Orchestrates the full RAG cycle:
        Cache Check -> Rewrite -> Retrieve -> Rerank -> Generate Response -> Cache Save
        """
        # 1. Get the primary query (optimized for history context or routed to memory)
        # Returns: {"canonical_id": "...", "search_query": "..."}
        optimized_query = await self._rewrite_query(request.messages)
        
        canonical_id = optimized_query.get("canonical_id", "")
        search_query = optimized_query.get("search_query", "")

        # Fallback if rewrite is completely empty
        if not search_query:
            search_query = request.messages[-1].content
        if not canonical_id:
            canonical_id = search_query.lower().replace(" ", "_")
            
        print("\n" + "="*50)
        print(f"🧠 CANONICAL ID (Cache): {canonical_id}")
        print(f"🔍 SEARCH QUERY (Pinecone): {search_query}")
        print("="*50 + "\n")

        # 2. INTELLIGENT ROUTING: If the query is marked as conversational, skip RAG + cache
        if "CONVERSATIONAL_CONTEXT" in canonical_id:
            print("--- INFO: Conversational Routing Active. Skipping Manual Retrieval. ---")
            async for chunk in llm_service.generate_response_stream(
                messages=request.messages,
                context_chunks=[] # Send empty context to prioritize memory
            ):
                yield chunk
            return

        # 3. Vector Search (Pinecone) - We move this UP to use as a 'Safety Key'
        if not search_query.strip():
            print("--- WARNING: Empty search query. Yielding fallback response. ---")
            async for chunk in llm_service.generate_response_stream(messages=request.messages, context_chunks=[]):
                yield chunk
            return

        query_vector = embedding_service.embed_text(search_query)
        raw_matches = vector_store.similarity_search(query_vector=query_vector, top_k=self.raw_retrieval_count)
        
        # Determine the "Fingerprint" of this specific search result
        # This is the 'Safety Check' to prevent cache collisions
        current_top_ref = ""
        if raw_matches:
            top_meta = raw_matches[0].get('metadata', {})
            current_top_ref = f"{top_meta.get('source')}:{top_meta.get('title')}:{top_meta.get('chunk_index')}"

        # 4. CACHE CHECK with Safety Validation (using canonical_id)
        cached_data_json = await cache_service.get(canonical_id)
        if cached_data_json:
            try:
                cached_data = json.loads(cached_data_json)
                cached_answer = cached_data.get("answer")
                cached_ref = cached_data.get("reference_context")

                # If the search results point to a DIFFERENT part of the manual, 
                # the cache MUST be wrong (a collision). We bypass it.
                if cached_ref == current_top_ref:
                    print(f"⚡ VERIFIED CACHE HIT: Validated against context '{cached_ref}'")
                    chunk_size = 50
                    for i in range(0, len(cached_answer), chunk_size):
                        yield cached_answer[i:i + chunk_size]
                    return
                else:
                    print(f"⚠️ CACHE COLLISION DETECTED: Expected '{cached_ref}' but found '{current_top_ref}'. Bypassing cache for accuracy.")
            except Exception as e:
                print(f"⚠️ Cache parse error: {e}")

        # 5. Convert Pinecone format to our schema
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
            
        # 6. Intelligent Re-ranking (Cohere)
        if candidate_chunks:
            reranked_chunks = await rerank_service.rerank(
                query=search_query, 
                chunks=candidate_chunks, 
                top_n=self.rerank_top_n
            )
        else:
            reranked_chunks = []
            
        # 7. Context Preparation
        context_texts = [c.text for c in reranked_chunks]
        
        # DEBUG: Print retrieved context to terminal
        print("\n--- RETRIEVED CONTEXT ---")
        for i, chunk in enumerate(reranked_chunks):
            print(f"[{i+1}] Source: {chunk.metadata.source} | Section: {chunk.metadata.title}")
        print("-------------------------\n")
        
        # 8. Stream Generation + Collect for Cache
        full_response = ""
        async for chunk in llm_service.generate_response_stream(
            messages=request.messages,
            context_chunks=context_texts
        ):
            full_response += chunk
            yield chunk
        
        # 9. CACHE SAVE: Store the answer + the Safety Fingerprint
        if full_response.strip():
            cache_payload = {
                "answer": full_response,
                "reference_context": current_top_ref # The 'Safety Key'
            }
            await cache_service.set(canonical_id, json.dumps(cache_payload))

query_engine = QueryEngine()
