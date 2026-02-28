"""
Django Management Command: chunk_documents

Converts all RAG documentation into optimized chunks for RAG systems.

Usage:
    python manage.py chunk_documents
    python manage.py chunk_documents --output /path/to/output.json
    python manage.py chunk_documents --max-size 500
    python manage.py chunk_documents --verbose
"""

import os
import sys
import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from RAG.services import RecursiveHierarchicalChunker, DocumentProcessor


class Command(BaseCommand):
    """Django management command for chunking documents"""
    
    help = 'Convert RAG documentation into optimized chunks for RAG systems'
    
    def add_arguments(self, parser):
        """Add command arguments"""
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output JSON file path (default: RAG/services/chunks_output.json)'
        )
        
        parser.add_argument(
            '--max-size',
            type=int,
            default=400,
            help='Maximum chunk size in tokens (default: 400)'
        )
        
        parser.add_argument(
            '--min-size',
            type=int,
            default=50,
            help='Minimum chunk size in tokens (default: 50)'
        )
        
        parser.add_argument(
            '--overlap',
            type=int,
            default=50,
            help='Token overlap between chunks (default: 50)'
        )
        
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output'
        )
        
        parser.add_argument(
            '--stats-only',
            action='store_true',
            help='Only show statistics, do not save chunks'
        )
    
    def handle(self, *args, **options):
        """Execute the command"""
        
        # Get configuration
        rag_docs_path = self._get_rag_docs_path()
        output_path = options['output'] or self._get_default_output_path()
        max_size = options['max_size']
        min_size = options['min_size']
        overlap = options['overlap']
        verbose = options['verbose']
        stats_only = options['stats_only']
        
        # Validate paths
        if not os.path.exists(rag_docs_path):
            raise CommandError(f"Rag-Docs folder not found: {rag_docs_path}")
        
        # Print header
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('RAG Document Chunking Service'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')
        
        # Print configuration
        self.stdout.write(self.style.HTTP_INFO('Configuration:'))
        self.stdout.write(f'  Rag-Docs Path: {rag_docs_path}')
        self.stdout.write(f'  Max Chunk Size: {max_size} tokens')
        self.stdout.write(f'  Min Chunk Size: {min_size} tokens')
        self.stdout.write(f'  Token Overlap: {overlap} tokens')
        self.stdout.write(f'  Output Path: {output_path}')
        self.stdout.write('')
        
        try:
            # Initialize chunker
            self.stdout.write(self.style.HTTP_INFO('Initializing chunker...'))
            chunker = RecursiveHierarchicalChunker(
                max_chunk_size=max_size,
                min_chunk_size=min_size,
                overlap_tokens=overlap
            )
            self.stdout.write(self.style.SUCCESS('✓ Chunker initialized'))
            self.stdout.write('')
            
            # Initialize processor
            self.stdout.write(self.style.HTTP_INFO('Initializing processor...'))
            processor = DocumentProcessor(rag_docs_path, chunker)
            self.stdout.write(self.style.SUCCESS('✓ Processor initialized'))
            self.stdout.write('')
            
            # Process documents
            self.stdout.write(self.style.HTTP_INFO('Processing documents...'))
            self.stdout.write('')
            all_chunks = processor.process_all_documents()
            self.stdout.write('')
            
            # Generate statistics
            self.stdout.write(self.style.HTTP_INFO('Generating statistics...'))
            stats = processor.generate_statistics(all_chunks)
            self.stdout.write(self.style.SUCCESS('✓ Statistics generated'))
            self.stdout.write('')
            
            # Display results
            self._display_results(stats, all_chunks, verbose)
            
            # Save chunks if not stats-only
            if not stats_only:
                self.stdout.write(self.style.HTTP_INFO('Saving chunks...'))
                processor.save_chunks_to_json(all_chunks, output_path)
                self.stdout.write(self.style.SUCCESS(f'✓ Chunks saved to {output_path}'))
                self.stdout.write('')
            
            # Print footer
            self.stdout.write(self.style.SUCCESS('=' * 80))
            self.stdout.write(self.style.SUCCESS('✓ Chunking complete!'))
            self.stdout.write(self.style.SUCCESS('=' * 80))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))
            raise CommandError(f'Chunking failed: {str(e)}')
    
    def _display_results(self, stats, all_chunks, verbose):
        """Display chunking results"""
        
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('CHUNKING RESULTS'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')
        
        # Summary statistics
        self.stdout.write(self.style.HTTP_INFO('Summary Statistics:'))
        self.stdout.write(f'  Total Documents: {stats["total_documents"]}')
        self.stdout.write(f'  Total Chunks: {stats["total_chunks"]}')
        self.stdout.write(f'  Total Tokens: {stats["total_tokens"]:,}')
        self.stdout.write(f'  Total Words: {stats["total_words"]:,}')
        self.stdout.write(f'  Average Chunk Size: {stats["average_chunk_size"]} tokens')
        self.stdout.write(f'  Average Chunk Words: {stats["average_chunk_words"]} words')
        self.stdout.write('')
        
        # Per-document statistics
        if verbose:
            self.stdout.write(self.style.HTTP_INFO('Per-Document Statistics:'))
            self.stdout.write('-' * 80)
            
            for doc_name, doc_stats in sorted(stats['documents'].items()):
                self.stdout.write(f'{doc_name}')
                self.stdout.write(f'  Chunks: {doc_stats["chunks"]}')
                self.stdout.write(f'  Tokens: {doc_stats["tokens"]:,}')
                self.stdout.write(f'  Words: {doc_stats["words"]:,}')
                self.stdout.write(f'  Avg Chunk: {doc_stats["average_chunk_size"]} tokens')
                self.stdout.write('')
        
        # Display first 20 words of first chunk from each document
        self.stdout.write(self.style.HTTP_INFO('Sample Chunks (First 20 words):'))
        self.stdout.write('-' * 80)
        
        for doc_path, chunk_list in sorted(all_chunks.items()):
            doc_name = Path(doc_path).name
            
            if chunk_list:
                first_chunk = chunk_list[0]
                first_20_words = self._get_first_n_words(first_chunk.text, 20)
                
                self.stdout.write(f'{doc_name}')
                self.stdout.write(f'  Chunk ID: {first_chunk.metadata.chunk_id}')
                self.stdout.write(f'  Section: {first_chunk.metadata.section}')
                self.stdout.write(f'  Tokens: {first_chunk.metadata.tokens}')
                self.stdout.write(f'  Preview: {first_20_words}...')
                self.stdout.write('')
        
        self.stdout.write('-' * 80)
    
    def _get_first_n_words(self, text, n):
        """Get first n words from text"""
        import re
        
        # Remove markdown formatting
        clean_text = re.sub(r'[#*`\[\]\-]', '', text)
        clean_text = re.sub(r'\n+', ' ', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Get first n words
        words = clean_text.split()[:n]
        return ' '.join(words)
    
    def _get_rag_docs_path(self):
        """Get Rag-Docs folder path"""
        # Get the Django project root
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        rag_docs_path = base_dir / 'Rag-Docs'
        return str(rag_docs_path)
    
    def _get_default_output_path(self):
        """Get default output path"""
        base_dir = Path(__file__).resolve().parent.parent.parent
        output_path = base_dir / 'services' / 'chunks_output.json'
        return str(output_path)
