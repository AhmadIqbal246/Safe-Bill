"""
Django Management Command: Embed Chunks to Pinecone
Converts chunks to embeddings and stores them in Pinecone vector database
"""

import os
import sys
from django.core.management.base import BaseCommand
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

from RAG.services.embeddings import ChunkEmbeddingManager


class Command(BaseCommand):
    help = 'Embed chunks and store them in Pinecone vector database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--chunks-file',
            type=str,
            default='RAG/services/chunks_output.json',
            help='Path to chunks JSON file (default: RAG/services/chunks_output.json)'
        )
        
        parser.add_argument(
            '--namespace',
            type=str,
            default='default',
            help='Pinecone namespace (default: default)'
        )
        
        parser.add_argument(
            '--index-name',
            type=str,
            default='safe-bill-chunks',
            help='Pinecone index name (default: safe-bill-chunks)'
        )
        
        parser.add_argument(
            '--create-index',
            action='store_true',
            help='Create Pinecone index if it doesn\'t exist'
        )
        
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Batch size for embedding generation (default: 100)'
        )
        
        parser.add_argument(
            '--provider',
            type=str,
            default='huggingface',
            choices=['openai', 'huggingface', 'cohere', 'google'],
            help='Embedding provider (default: huggingface)'
        )
        
        parser.add_argument(
            '--embedding-model',
            type=str,
            default=None,
            help='Specific embedding model (optional, uses provider default if not specified)'
        )
    
    def handle(self, *args, **options):
        """Execute the command"""
        
        print("\n" + "=" * 80)
        print("RAG CHUNK EMBEDDING SERVICE")
        print("=" * 80 + "\n")
        
        # Get options
        chunks_file = options['chunks_file']
        namespace = options['namespace']
        index_name = options['index_name']
        create_index = options['create_index']
        batch_size = options['batch_size']
        provider = options['provider']
        embedding_model = options['embedding_model']
        
        # Validate chunks file exists
        if not os.path.exists(chunks_file):
            self.stdout.write(
                self.style.ERROR(f'✗ Chunks file not found: {chunks_file}')
            )
            return
        
        print("Configuration:")
        print(f"  Chunks File: {chunks_file}")
        print(f"  Pinecone Index: {index_name}")
        print(f"  Namespace: {namespace}")
        print(f"  Provider: {provider}")
        print(f"  Embedding Model: {embedding_model or 'default'}")
        print(f"  Batch Size: {batch_size}")
        print()
        
        try:
            # Initialize manager
            print("Initializing embedding manager...")
            manager = ChunkEmbeddingManager(
                provider=provider,
                embedding_model=embedding_model,
                index_name=index_name
            )
            print("✓ Embedding manager initialized\n")
            
            # Create index if requested
            if create_index:
                print("Creating Pinecone index if needed...")
                manager.vector_db.create_index_if_not_exists()
                print()
            
            # Embed and store chunks
            print("Embedding chunks and storing in Pinecone...")
            manager.embed_and_store_chunks(
                chunks_json_path=chunks_file,
                namespace=namespace,
                batch_size=batch_size
            )
            
            print("\n" + "=" * 80)
            print("✓ Embedding complete!")
            print("=" * 80 + "\n")
            
            self.stdout.write(
                self.style.SUCCESS('Successfully embedded chunks to Pinecone')
            )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error: {str(e)}')
            )
            raise
