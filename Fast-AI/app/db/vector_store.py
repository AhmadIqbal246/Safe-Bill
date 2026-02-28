import os
from pinecone import Pinecone
from app.core.config import settings

class VectorStore:
    def __init__(self):
        # Initialize Pinecone Client
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        
        # Connect to index
        self.index = self.pc.Index(self.index_name)
    
    def upsert_chunks(self, vectors: list[dict]):
        """
        Vectors format: [{'id': 'id1', 'values': [...], 'metadata': {...}}]
        """
        # Batch upsert in sizes of 100 to avoid Pinecone limits
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch)
            
    def similarity_search(self, query_vector: list[float], top_k: int = 5, filter_meta: dict = None) -> list[dict]:
        """
        Searches Pinecone and returns exact matches.
        """
        results = self.index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True,
            filter=filter_meta
        )
        return results.get('matches', [])

vector_store = VectorStore()
