from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.routes.v1 import ingest

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Allow Cross-Origin Requests from the React frontend (or Django)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect all our API endpoints to the main engine
app.include_router(ingest.router, prefix=f"{settings.API_V1_STR}/ingest", tags=["ingestion"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}
