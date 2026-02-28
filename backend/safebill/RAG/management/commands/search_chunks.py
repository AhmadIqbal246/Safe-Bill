"""
Django Management Command to Search Chunks in Pinecone
"""

import os
import sys
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from RAG.services.embeddings import ChunkEmbeddingManager


class Command(BaseCommand):
    help = 'Search for similar chunks in Pinecone based on query'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'query',
            type=str,
            help='Search query text'
        )
        
        parser.add_argument(
            '--top-k',
            type=int,
            default=5,
            help='Number of top results to return (default: 5)'
        )
        
        parser.add_argument(
            '--provider',
            type=str,
            default='google',
            choices=['openai', 'huggingface', 'cohere', 'google'],
            help='Embedding provider (default: google)'
        )
        
        parser.add_argument(
            '--namespace',
            type=str,
            default='default',
            help='Pinecone namespace to search (default: default)'
        )
    
    def handle(self, *args, **options):
        """Execute the command"""
        
        query = options['query']
        top_k = options['top_k']
        provider = options['provider']
        namespace = options['namespace']
        
        print("\n" + "=" * 80)
        print("RAG CHUNK SEARCH SERVICE")
        print("=" * 80 + "\n")
        
        print(f"Configuration:")
        print(f"  Query: {query}")
        print(f"  Top K: {top_k}")
        print(f"  Provider: {provider}")
        print(f"  Namespace: {namespace}")
        print()
        
        try:
            # Initialize manager
            print("Initializing search manager...")
            manager = ChunkEmbeddingManager(provider=provider)
            print("✓ Search manager initialized\n")
            
            # Search chunks
            print(f"Searching for: '{query}'")
            print()
            
            # Generate query embedding to show vector details
            print("Generating query embedding...")
            query_embedding = manager.embedding_gen.generate_embedding(query)
            print(f"✓ Query vector generated")
            print(f"  Vector dimension: {len(query_embedding)}")
            print(f"  Vector sample (first 10 values): {query_embedding[:10]}")
            print(f"  Vector magnitude: {sum(x**2 for x in query_embedding)**0.5:.4f}")
            print()
            
            # Get chunks JSON path
            chunks_json_path = os.path.join(
                Path(__file__).resolve().parent.parent.parent,
                'services',
                'chunks_output.json'
            )
            
            results = manager.search_chunks(
                query_text=query,
                top_k=top_k,
                namespace=namespace,
                chunks_json_path=chunks_json_path
            )
            
            if not results:
                print("❌ No results found")
                return
            
            print("=" * 80)
            print(f"✓ FOUND {len(results)} RESULTS")
            print("=" * 80 + "\n")
            
            # Calculate score statistics
            scores = [result.get('score', 0) for result in results]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            print(f"Score Statistics:")
            print(f"  Highest score: {max(scores):.4f}")
            print(f"  Lowest score: {min(scores):.4f}")
            print(f"  Average score: {avg_score:.4f}")
            print()
            
            for i, result in enumerate(results, 1):
                score = result.get('score', 0)
                # Calculate score percentage (0-1 normalized to 0-100%)
                score_percentage = score * 100
                # Create a simple bar chart
                bar_length = int(score * 50)
                bar = "█" * bar_length + "░" * (50 - bar_length)
                
                print(f"Result {i}:")
                print(f"  Score: {score:.4f} ({score_percentage:.2f}%) [{bar}]")
                print(f"  Chunk ID: {result.get('metadata', {}).get('chunk_id', 'N/A')}")
                print(f"  Document: {result.get('metadata', {}).get('document_title', 'N/A')}")
                print(f"  Section: {result.get('metadata', {}).get('section', 'N/A')}")
                print(f"  Subsection: {result.get('metadata', {}).get('subsection', 'N/A')}")
                print(f"  Text Preview: {result.get('text', '')[:150]}...")
                print()
            
            print("=" * 80)
            print("✓ Search complete!")
            print("=" * 80 + "\n")
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error: {str(e)}')
            )
            raise
