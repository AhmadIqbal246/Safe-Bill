from sentence_transformers import SentenceTransformer
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        # We use a high-accuracy 768-dimension local model
        # This matches your existing Pinecone index dimension
        self.model_name = "sentence-transformers/all-mpnet-base-v2"
        self.model = SentenceTransformer(self.model_name)
    
    def embed_text(self, text: str) -> list[float]:
        """Generate 768-dimension embeddings locally"""
        embedding = self.model.encode(text)
        return embedding.tolist()
        
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate 768-dimension embeddings for multiple chunks locally"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

embedding_service = EmbeddingService()
