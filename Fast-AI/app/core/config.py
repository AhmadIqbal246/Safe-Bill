import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Fast-AI RAG Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # LLM (Multi-Provider Support)
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # Vector Store (Pinecone)
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str
    PINECONE_INDEX_NAME: str

    # Re-ranker (Cohere)
    COHERE_API_KEY: str

    # Google API (For Embeddings)
    GOOGLE_API_KEY: str
    
    # Hugging Face (Optional)
    HF_TOKEN: Optional[str] = None

    # Local Embeddings (Sentence Transformers)
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 768

    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Set HF_TOKEN in system environment so Hugging Face libraries can find it
if settings.HF_TOKEN:
    os.environ["HF_TOKEN"] = settings.HF_TOKEN
