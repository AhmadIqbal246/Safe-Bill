from sentence_transformers import SentenceTransformer
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        # We now read this from .env (defaults to 768-dimension all-mpnet-base-v2)
        self.model_name = settings.EMBEDDING_MODEL_NAME
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
