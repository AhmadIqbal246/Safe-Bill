from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class MessagePrompt(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="The content of the message")

class ChatRequest(BaseModel):
    messages: List[MessagePrompt] = Field(..., description="The chat history containing new user prompt")
    session_id: Optional[str] = Field(None, description="Optional tracked session for continuous conversations")
    stream: bool = Field(True, description="Whether to stream the response via SSE")

class ChunkMetadata(BaseModel):
    source: str = Field(..., description="Source filename or URL")
    title: Optional[str] = Field(None, description="Section title where chunk was found")
    chunk_index: int = Field(..., description="The ordinal index of this chunk in the document")

class RetrievedChunk(BaseModel):
    text: str = Field(..., description="The exact text retrieved from Pinecone/Postgres")
    score: float = Field(..., description="The similarity/rerank score")
    metadata: ChunkMetadata

class ChatResponse(BaseModel):
    response: str = Field(..., description="The generated response text")
    sources: List[RetrievedChunk] = Field(default_factory=list, description="The chunks used to generate the answer")
    processing_time_ms: int = Field(0, description="Total Time to First Token or total completion time")

class StreamChunk(BaseModel):
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: List[Dict[str, Any]]
