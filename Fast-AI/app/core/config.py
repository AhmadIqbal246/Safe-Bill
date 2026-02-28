from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # App Config
    PROJECT_NAME: str = "Fast-AI RAG Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # LLM (OpenRouter)
    OPENROUTER_API_KEY: str
    LLM_MODEL: str = "google/gemma-3-12b-it:free"

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
