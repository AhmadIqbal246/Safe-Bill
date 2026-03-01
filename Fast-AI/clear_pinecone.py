import os
from pinecone import Pinecone
from app.core.config import settings

def clear_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index = pc.Index(settings.PINECONE_INDEX_NAME)
    
    print(f"Deleting 426 vectors in namespace 'default'...")
    
    try:
        # Specifically delete from 'default' namespace
        index.delete(delete_all=True, namespace='default')
        print("Success: Default namespace cleared!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    clear_index()
