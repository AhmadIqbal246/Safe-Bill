from sentence_transformers import SentenceTransformer
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        # Load the free, fast local embedding model automatically to save on API costs
        # all-MiniLM-L6-v2 creates a 384-dimension vector
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    
    def embed_text(self, text: str) -> list[float]:
        """Generate embeddings for a single string"""
        embedding = self.model.encode(text)
        return embedding.tolist()
        
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple chunks at once (much faster)"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

embedding_service = EmbeddingService()
