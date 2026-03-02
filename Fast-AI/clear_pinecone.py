import os
from pinecone import Pinecone
from app.core.config import settings

def clear_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index = pc.Index(settings.PINECONE_INDEX_NAME)
    
    # Show current index stats before clearing
    stats = index.describe_index_stats()
    print(f"Index stats before clear: {stats}")
    
    try:
        # Pinecone's true default namespace is "" (empty string), NOT "default"
        index.delete(delete_all=True, namespace="")
        print("Success: All vectors cleared from the default namespace!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    clear_index()
