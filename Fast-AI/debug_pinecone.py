import os
from pinecone import Pinecone
from app.core.config import settings

def check_namespaces():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index = pc.Index(settings.PINECONE_INDEX_NAME)
    stats = index.describe_index_stats()
    print("Full Stats:", stats)
    
if __name__ == "__main__":
    check_namespaces()
