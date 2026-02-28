"""
Embedding Service for RAG Chunks
Handles embedding generation and vector database operations
Supports multiple providers: OpenAI, HuggingFace, Cohere, Google
"""

import os
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

class EmbeddingGenerator:
    """Generate embeddings for chunks using various providers"""
    
    def __init__(self, provider: str = "huggingface", model: str = None):
        """
        Initialize embedding generator
        
        Args:
            provider: Embedding provider ('openai', 'huggingface', 'cohere', 'google')
            model: Model name (optional, uses default if not specified)
        """
        self.provider = provider.lower()
        
        if self.provider == "openai":
            self._init_openai(model or "text-embedding-3-small")
        elif self.provider == "huggingface":
            self._init_huggingface(model or "all-MiniLM-L6-v2")
        elif self.provider == "cohere":
            self._init_cohere(model or "embed-english-v3.0")
        elif self.provider == "google":
            self._init_google(model or "text-embedding-004")
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _init_openai(self, model: str):
        """Initialize OpenAI client"""
        from openai import OpenAI
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def _init_huggingface(self, model: str):
        """Initialize HuggingFace embeddings (local, no API key needed)"""
        try:
            from sentence_transformers import SentenceTransformer
            self.client = SentenceTransformer(model)
            self.model = model
        except ImportError:
            raise ImportError("sentence-transformers not installed. Run: pip install sentence-transformers")
    
    def _init_cohere(self, model: str):
        """Initialize Cohere client"""
        import cohere
        api_key = os.getenv('COHERE_API_KEY')
        if not api_key:
            raise ValueError("COHERE_API_KEY not found in environment variables")
        self.client = cohere.Client(api_key=api_key)
        self.model = model
    
    def _init_google(self, model: str):
        """Initialize Google Gemini client"""
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError("google-generativeai not installed. Run: pip install google-generativeai")
        
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        self.client = genai
        self.model = model
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
        
        Returns:
            Embedding vector
        """
        try:
            if self.provider == "openai":
                response = self.client.embeddings.create(
                    input=text,
                    model=self.model
                )
                return response.data[0].embedding
            
            elif self.provider == "huggingface":
                embedding = self.client.encode(text)
                return embedding.tolist()
            
            elif self.provider == "cohere":
                response = self.client.embed(texts=[text], model=self.model)
                return response.embeddings[0]
            
            elif self.provider == "google":
                response = self.client.embed_content(
                    model=f"models/{self.model}",
                    content=text
                )
                return response['embedding']
        
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of texts to embed
        
        Returns:
            List of embedding vectors
        """
        try:
            if self.provider == "openai":
                response = self.client.embeddings.create(
                    input=texts,
                    model=self.model
                )
                embeddings = sorted(response.data, key=lambda x: x.index)
                return [item.embedding for item in embeddings]
            
            elif self.provider == "huggingface":
                embeddings = self.client.encode(texts)
                return embeddings.tolist()
            
            elif self.provider == "cohere":
                response = self.client.embed(texts=texts, model=self.model)
                return response.embeddings
            
            elif self.provider == "google":
                embeddings = []
                for text in texts:
                    response = self.client.embed_content(
                        model=f"models/{self.model}",
                        content=text
                    )
                    embeddings.append(response['embedding'])
                return embeddings
        
        except Exception as e:
            print(f"Error generating batch embeddings: {str(e)}")
            raise


class PineconeVectorDB:
    """Manage Pinecone vector database operations"""
    
    def __init__(self, index_name: Optional[str] = None):
        """
        Initialize Pinecone connection
        
        Args:
            index_name: Name of Pinecone index
        """
        self.api_key = os.getenv('PINECONE_API_KEY')
        self.environment = os.getenv('PINECONE_ENVIRONMENT')
        self.index_name = index_name or os.getenv('PINECONE_INDEX_NAME', 'safe-bill-chunks')
        
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY not found in environment variables")
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=self.api_key)
        self.index = None
        self._connect_to_index()
    
    def _connect_to_index(self):
        """Connect to existing Pinecone index"""
        try:
            self.index = self.pc.Index(self.index_name)
            print(f"[OK] Connected to Pinecone index: {self.index_name}")
        except Exception as e:
            print(f"Error connecting to index: {str(e)}")
            raise
    
    def create_index_if_not_exists(self, dimension: int = 1536):
        """
        Create Pinecone index if it doesn't exist
        
        Args:
            dimension: Embedding dimension (1536 for text-embedding-3-small)
        """
        try:
            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            index_names = [idx.name for idx in existing_indexes.indexes] if hasattr(existing_indexes, 'indexes') else [idx.name for idx in existing_indexes]
            
            if self.index_name not in index_names:
                print(f"Creating index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=dimension,
                    metric="cosine"
                )
                print(f"✓ Index created: {self.index_name}")
            else:
                print(f"✓ Index already exists: {self.index_name}")
            
            self._connect_to_index()
        except Exception as e:
            print(f"Error creating index: {str(e)}")
            raise
    
    def upsert_vectors(self, vectors: List[tuple], namespace: str = "default"):
        """
        Upsert vectors to Pinecone
        
        Args:
            vectors: List of (id, embedding, metadata) tuples
            namespace: Pinecone namespace
        """
        try:
            self.index.upsert(
                vectors=vectors,
                namespace=namespace
            )
            print(f"✓ Upserted {len(vectors)} vectors to namespace: {namespace}")
        except Exception as e:
            print(f"Error upserting vectors: {str(e)}")
            raise
    
    def query_vectors(self, embedding: List[float], top_k: int = 5, namespace: str = "default") -> List[Dict]:
        """
        Query similar vectors from Pinecone
        
        Args:
            embedding: Query embedding vector
            top_k: Number of results to return
            namespace: Pinecone namespace to search
        
        Returns:
            List of matching results with metadata
        """
        try:
            results = self.index.query(
                vector=embedding,
                top_k=top_k,
                include_metadata=True,
                namespace=namespace
            )
            return results['matches']
        except Exception as e:
            print(f"Error querying vectors: {str(e)}")
            raise
    
    def delete_namespace(self, namespace: str):
        """
        Delete all vectors in a namespace
        
        Args:
            namespace: Namespace to delete
        """
        try:
            self.index.delete(delete_all=True, namespace=namespace)
            print(f"✓ Deleted namespace: {namespace}")
        except Exception as e:
            print(f"Error deleting namespace: {str(e)}")
            raise
    
    def get_index_stats(self) -> Dict:
        """Get index statistics"""
        try:
            stats = self.index.describe_index_stats()
            return stats
        except Exception as e:
            print(f"Error getting index stats: {str(e)}")
            raise


class ChunkEmbeddingManager:
    """Manage embedding and storage of chunks"""
    
    def __init__(self, provider: str = "huggingface", embedding_model: str = None, index_name: Optional[str] = None):
        """
        Initialize chunk embedding manager
        
        Args:
            provider: Embedding provider ('openai', 'huggingface', 'cohere', 'google')
            embedding_model: Specific model to use (optional)
            index_name: Pinecone index name
        """
        self.embedding_gen = EmbeddingGenerator(provider=provider, model=embedding_model)
        self.vector_db = PineconeVectorDB(index_name=index_name)
    
    def embed_and_store_chunks(self, chunks_json_path: str, namespace: str = "default", batch_size: int = 100):
        """
        Load chunks from JSON and embed them into Pinecone
        
        Args:
            chunks_json_path: Path to chunks_output.json
            namespace: Pinecone namespace
            batch_size: Batch size for embedding generation
        """
        try:
            # Load chunks from JSON
            with open(chunks_json_path, 'r', encoding='utf-8') as f:
                chunks_data = json.load(f)
            
            print(f"Loaded chunks from: {chunks_json_path}")
            
            # Flatten chunks (they're organized by document)
            all_chunks = []
            for doc_path, chunks in chunks_data.items():
                for chunk in chunks:
                    all_chunks.append({
                        'doc_path': doc_path,
                        'chunk': chunk
                    })
            
            print(f"Total chunks to embed: {len(all_chunks)}")
            
            # Process in batches
            vectors_to_upsert = []
            
            for i in range(0, len(all_chunks), batch_size):
                batch = all_chunks[i:i + batch_size]
                
                # Extract texts for embedding
                texts = [item['chunk']['text'] for item in batch]
                
                # Generate embeddings
                print(f"Generating embeddings for batch {i//batch_size + 1}...")
                embeddings = self.embedding_gen.generate_embeddings_batch(texts)
                
                # Prepare vectors for Pinecone
                for j, (item, embedding) in enumerate(zip(batch, embeddings)):
                    chunk = item['chunk']
                    chunk_id = chunk['metadata'].get('chunk_id', f"chunk_{i + j}")
                    
                    # Helper function to sanitize metadata values
                    def sanitize_value(val):
                        """Convert None to empty string, keep other values as-is"""
                        if val is None:
                            return ""
                        return str(val) if not isinstance(val, (str, int, float, bool, list)) else val
                    
                    # Prepare metadata - sanitize all values
                    metadata = {
                        'chunk_id': sanitize_value(chunk_id),
                        'document_id': sanitize_value(chunk['metadata'].get('document_id')),
                        'document_title': sanitize_value(chunk['metadata'].get('document_title')),
                        'section': sanitize_value(chunk['metadata'].get('section')),
                        'subsection': sanitize_value(chunk['metadata'].get('subsection')),
                        'tokens': int(chunk['metadata'].get('tokens', 0)) if chunk['metadata'].get('tokens') else 0,
                        'word_count': int(chunk['metadata'].get('word_count', 0)) if chunk['metadata'].get('word_count') else 0,
                        'difficulty': sanitize_value(chunk['metadata'].get('difficulty')),
                        'category': sanitize_value(chunk['metadata'].get('category')),
                        'doc_path': sanitize_value(item['doc_path'])
                    }
                    
                    vectors_to_upsert.append((
                        chunk_id,
                        embedding,
                        metadata
                    ))
                
                # Upsert batch
                if vectors_to_upsert:
                    self.vector_db.upsert_vectors(vectors_to_upsert, namespace=namespace)
                    vectors_to_upsert = []
            
            print(f"✓ Successfully embedded and stored all chunks in namespace: {namespace}")
            
            # Print stats
            stats = self.vector_db.get_index_stats()
            print(f"\nIndex Statistics:")
            print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
            print(f"  Namespaces: {list(stats.get('namespaces', {}).keys())}")
        
        except Exception as e:
            print(f"Error embedding and storing chunks: {str(e)}")
            raise
    
    def search_chunks(self, query_text: str, top_k: int = 5, namespace: str = "default", chunks_json_path: str = None) -> List[Dict]:
        """
        Search for similar chunks
        
        Args:
            query_text: Query text
            top_k: Number of results
            namespace: Pinecone namespace
            chunks_json_path: Path to chunks JSON for text retrieval
        
        Returns:
            List of matching chunks with text and metadata
        """
        try:
            # Generate embedding for query
            query_embedding = self.embedding_gen.generate_embedding(query_text)
            
            # Search in Pinecone
            pinecone_results = self.vector_db.query_vectors(query_embedding, top_k=top_k, namespace=namespace)
            
            # Load chunk texts if path provided
            chunk_texts = {}
            if chunks_json_path and os.path.exists(chunks_json_path):
                try:
                    with open(chunks_json_path, 'r', encoding='utf-8') as f:
                        chunks_data = json.load(f)
                    
                    # Build lookup map: chunk_id -> text
                    for doc_path, chunks in chunks_data.items():
                        for chunk in chunks:
                            chunk_id = chunk['metadata'].get('chunk_id')
                            if chunk_id:
                                chunk_texts[chunk_id] = chunk.get('text', '')
                except Exception as e:
                    print(f"Warning: Could not load chunk texts: {str(e)}")
            
            # Enrich results with text
            enriched_results = []
            for result in pinecone_results:
                chunk_id = result.get('id')
                enriched_result = {
                    'id': chunk_id,
                    'score': result.get('score', 0),
                    'metadata': result.get('metadata', {}),
                    'text': chunk_texts.get(chunk_id, '')
                }
                enriched_results.append(enriched_result)
            
            return enriched_results
        except Exception as e:
            print(f"Error searching chunks: {str(e)}")
            raise
