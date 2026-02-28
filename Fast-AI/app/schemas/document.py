from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Chunk(BaseModel):
    chunk_id: str = Field(..., description="Unique ID for Pinecone e.g., 'doc1-chunk12'")
    text: str = Field(..., description="The chunked text content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata to embed for hybrid filtering")

class DocumentIngestRequest(BaseModel):
    file_path: str = Field(..., description="Path to the document to be ingested")
    source_url: Optional[str] = Field(None, description="The URL or origin where the scraped doc came from")
    clean: bool = Field(True, description="Whether to run pre-processing text cleaning before chunking")

class IngestionResponse(BaseModel):
    status: str = Field(..., description="'success' or 'error'")
    chunks_created: int = Field(0, description="Number of distinct semantic chunks extracted and stored")
    processing_time_ms: int = Field(0, description="Total time taken to parse, embed, and store")
