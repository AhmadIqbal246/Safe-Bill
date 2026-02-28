from fastapi import APIRouter, HTTPException
import os
from pathlib import Path

from app.pipelines.ingestion import ingestion_pipeline
from app.schemas.document import IngestionResponse

router = APIRouter()

@router.post("/", response_model=IngestionResponse)
async def trigger_ingestion():
    """
    Triggers the data ingestion pipeline.
    Reads all Markdown files from data/raw, chunks them semantically,
    embeds them locally, and pushes to Pinecone.
    """
    # Resolve the physical path to our data/raw folder
    base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    data_dir = os.path.join(base_dir, "data", "raw")
    
    if not os.path.exists(data_dir):
        raise HTTPException(status_code=404, detail=f"Directory {data_dir} not found! Ensure files are mapped correctly.")
        
    try:
        # Launch the chunker!
        response = await ingestion_pipeline.ingest_directory(data_dir)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
