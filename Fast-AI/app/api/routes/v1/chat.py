from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
import time

from app.schemas.chat import ChatRequest
from app.pipelines.query_engine import query_engine

router = APIRouter()

@router.post("/")
async def chat_with_docs(request: ChatRequest):
    """
    Main RAG Chat endpoint. 
    Accepts a list of messages (history) and returns a streamed response.
    """
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided.")

        # Trigger the streaming RAG logic
        return StreamingResponse(
            query_engine.answer_query(request),
            media_type="text/plain"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
