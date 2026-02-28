"""
RAG Document Chunker Service
Implements Recursive Hierarchical Chunking for Safe Bill Documentation

This service converts large markdown documents into optimally-sized chunks
for RAG (Retrieval-Augmented Generation) systems.

Chunking Strategy:
1. Split by H2 sections (## )
2. Split by H3 subsections (### )
3. Split by paragraphs (\n\n)
4. Split by sentences (. )
5. Merge small chunks to maintain coherence

Optimal chunk size: 300-500 tokens (~200-350 words)
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
import json
from datetime import datetime


@dataclass
class ChunkMetadata:
    """Metadata for each chunk"""
    chunk_id: str
    document_id: str
    document_title: str
    document_path: str
    section: str
    subsection: Optional[str] = None
    tokens: int = 0
    word_count: int = 0
    char_count: int = 0
    chunk_order: int = 0
    total_chunks: int = 0
    user_roles: List[str] = None
    topics: List[str] = None
    keywords: List[str] = None
    difficulty: str = "Intermediate"
    category: str = "Feature"
    has_example: bool = False
    has_error: bool = False
    has_question: bool = False
    created_at: str = None
    
    def __post_init__(self):
        if self.user_roles is None:
            self.user_roles = []
        if self.topics is None:
            self.topics = []
        if self.keywords is None:
            self.keywords = []
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


@dataclass
class Chunk:
    """Represents a single chunk of text"""
    text: str
    metadata: ChunkMetadata
    
    def to_dict(self) -> Dict:
        """Convert chunk to dictionary"""
        return {
            'text': self.text,
            'metadata': asdict(self.metadata)
        }


class TokenCounter:
    """Utility class for counting tokens"""
    
    @staticmethod
    def count_tokens(text: str) -> int:
        """
        Estimate token count using simple word-based approach
        Approximation: 1 token ≈ 0.75 words
        More accurate than character count for LLM context
        """
        if not text:
            return 0
        
        # Split by whitespace and punctuation
        words = re.findall(r'\b\w+\b', text)
        # Rough estimation: 1 token ≈ 0.75 words
        return max(1, int(len(words) / 0.75))
    
    @staticmethod
    def count_words(text: str) -> int:
        """Count words in text"""
        if not text:
            return 0
        return len(re.findall(r'\b\w+\b', text))
    
    @staticmethod
    def count_chars(text: str) -> int:
        """Count characters in text"""
        return len(text) if text else 0


class MetadataExtractor:
    """Extract metadata from documents"""
    
    @staticmethod
    def extract_from_frontmatter(text: str) -> Dict:
        """Extract metadata from YAML frontmatter"""
        metadata = {
            'doc_id': None,
            'title': None,
            'category': 'Feature',
            'user_roles': [],
            'topics': [],
            'difficulty': 'Intermediate'
        }
        
        # Extract YAML frontmatter
        if text.startswith('---'):
            match = re.search(r'^---\n(.*?)\n---', text, re.DOTALL)
            if match:
                frontmatter = match.group(1)
                
                # Extract doc_id
                doc_id_match = re.search(r'doc_id:\s*(.+)', frontmatter)
                if doc_id_match:
                    metadata['doc_id'] = doc_id_match.group(1).strip()
                
                # Extract title
                title_match = re.search(r'title:\s*(.+)', frontmatter)
                if title_match:
                    metadata['title'] = title_match.group(1).strip()
                
                # Extract category
                category_match = re.search(r'category:\s*(.+)', frontmatter)
                if category_match:
                    metadata['category'] = category_match.group(1).strip()
                
                # Extract user_roles
                roles_match = re.search(r'user_roles:\s*\[(.+?)\]', frontmatter)
                if roles_match:
                    roles_str = roles_match.group(1)
                    metadata['user_roles'] = [r.strip() for r in roles_str.split(',')]
                
                # Extract topics
                topics_match = re.search(r'topics:\s*\[(.+?)\]', frontmatter)
                if topics_match:
                    topics_str = topics_match.group(1)
                    metadata['topics'] = [t.strip() for t in topics_str.split(',')]
                
                # Extract difficulty
                difficulty_match = re.search(r'difficulty:\s*(.+)', frontmatter)
                if difficulty_match:
                    metadata['difficulty'] = difficulty_match.group(1).strip()
        
        return metadata
    
    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 5) -> List[str]:
        """Extract keywords from text"""
        # Remove markdown formatting
        clean_text = re.sub(r'[#*`\[\]]', '', text)
        
        # Extract bold terms (likely important)
        bold_terms = re.findall(r'\*\*(.+?)\*\*', text)
        
        # Extract code terms
        code_terms = re.findall(r'`([^`]+)`', text)
        
        # Combine and deduplicate
        keywords = list(set(bold_terms + code_terms))[:max_keywords]
        
        return keywords
    
    @staticmethod
    def detect_content_type(text: str) -> Dict[str, bool]:
        """Detect what type of content is in the chunk"""
        return {
            'has_example': '**Example**' in text or '```' in text,
            'has_error': 'Error' in text or 'error' in text,
            'has_question': '**Q:' in text or 'Q:' in text,
            'has_code': '```' in text,
            'has_table': '|' in text and '---' in text
        }


class RecursiveHierarchicalChunker:
    """
    Implements recursive hierarchical chunking strategy
    
    Hierarchy:
    1. H2 sections (## )
    2. H3 subsections (### )
    3. Paragraphs (\n\n)
    4. Sentences (. )
    5. Words ( )
    """
    
    def __init__(
        self,
        max_chunk_size: int = 400,
        min_chunk_size: int = 150,
        overlap_tokens: int = 50
    ):
        """
        Initialize chunker
        
        Args:
            max_chunk_size: Maximum tokens per chunk (default 400)
            min_chunk_size: Minimum tokens per chunk (default 150)
            overlap_tokens: Token overlap between chunks (default 50)
        """
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size
        self.overlap_tokens = overlap_tokens
        self.token_counter = TokenCounter()
        self.metadata_extractor = MetadataExtractor()
    
    def chunk_document(
        self,
        text: str,
        document_path: str,
        doc_metadata: Optional[Dict] = None
    ) -> List[Chunk]:
        """
        Chunk a complete document using hybrid markdown approach
        Combines structural (headers), semantic (paragraphs), and content-aware (Q&A, examples) splitting
        
        Args:
            text: Full document text
            document_path: Path to document file
            doc_metadata: Document metadata from frontmatter
        
        Returns:
            List of Chunk objects
        """
        if not doc_metadata:
            doc_metadata = self.metadata_extractor.extract_from_frontmatter(text)
        
        chunks = []
        chunk_id = 0
        
        # Remove frontmatter for processing
        text_without_frontmatter = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL)
        
        # Split by H2 sections (main sections)
        h2_sections = self._split_by_header(text_without_frontmatter, level=2)
        
        for section_title, section_content in h2_sections:
            # For each H2 section, split by H3 subsections
            h3_subsections = self._split_by_header(section_content, level=3)
            
            for subsection_title, subsection_content in h3_subsections:
                # Split by H4 headers if they exist (for sub-subsections)
                h4_subsections = self._split_by_header(subsection_content, level=4)
                
                for h4_title, h4_content in h4_subsections:
                    # Split content by semantic boundaries (Q&A, examples, lists, paragraphs)
                    semantic_chunks = self._split_by_semantic_boundaries(h4_content)
                    
                    current_chunk_text = ""
                    
                    for semantic_unit in semantic_chunks:
                        if not semantic_unit.strip():
                            continue
                        
                        unit_tokens = self.token_counter.count_tokens(semantic_unit)
                        current_tokens = self.token_counter.count_tokens(current_chunk_text)
                        
                        # If adding unit exceeds max size, save current chunk
                        if current_tokens > 0 and (current_tokens + unit_tokens) > self.max_chunk_size:
                            if current_tokens >= self.min_chunk_size:
                                chunk = self._create_chunk(
                                    current_chunk_text,
                                    chunk_id,
                                    section_title,
                                    subsection_title if subsection_title != "Introduction" else None,
                                    doc_metadata,
                                    document_path
                                )
                                chunks.append(chunk)
                                chunk_id += 1
                            
                            # Start new chunk
                            current_chunk_text = semantic_unit + '\n\n'
                        else:
                            current_chunk_text += semantic_unit + '\n\n'
                    
                    # Add remaining chunk
                    if current_chunk_text.strip():
                        current_tokens = self.token_counter.count_tokens(current_chunk_text)
                        if current_tokens >= self.min_chunk_size:
                            chunk = self._create_chunk(
                                current_chunk_text,
                                chunk_id,
                                section_title,
                                subsection_title if subsection_title != "Introduction" else None,
                                doc_metadata,
                                document_path
                            )
                            chunks.append(chunk)
                            chunk_id += 1
        
        # Update total chunks count
        for i, chunk in enumerate(chunks):
            chunk.metadata.chunk_order = i
            chunk.metadata.total_chunks = len(chunks)
        
        return chunks
    
    def _split_by_semantic_boundaries(self, text: str) -> List[str]:
        """
        Split text by semantic boundaries (Q&A pairs, code blocks, lists, paragraphs)
        
        Args:
            text: Text to split
        
        Returns:
            List of semantic units
        """
        units = []
        current_unit = ""
        
        lines = text.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Detect Q&A pairs (Q: ... A: ...)
            if line.strip().startswith('**Q:'):
                qa_block = line
                i += 1
                # Collect answer lines
                while i < len(lines) and not lines[i].strip().startswith('**Q:'):
                    qa_block += '\n' + lines[i]
                    i += 1
                
                if current_unit.strip():
                    units.append(current_unit.strip())
                    current_unit = ""
                units.append(qa_block.strip())
                continue
            
            # Detect code blocks
            if line.strip().startswith('```'):
                code_block = line
                i += 1
                while i < len(lines) and not lines[i].strip().startswith('```'):
                    code_block += '\n' + lines[i]
                    i += 1
                if i < len(lines):
                    code_block += '\n' + lines[i]
                    i += 1
                
                if current_unit.strip():
                    units.append(current_unit.strip())
                    current_unit = ""
                units.append(code_block.strip())
                continue
            
            # Detect list items (bullet points or numbered)
            if line.strip() and (line.strip()[0] in '-*' or (len(line.strip()) > 1 and line.strip()[0].isdigit() and line.strip()[1] == '.')):
                list_block = line
                i += 1
                while i < len(lines) and lines[i].strip() and (lines[i].strip()[0] in '-*' or (len(lines[i].strip()) > 1 and lines[i].strip()[0].isdigit() and lines[i].strip()[1] == '.')):
                    list_block += '\n' + lines[i]
                    i += 1
                
                if current_unit.strip():
                    units.append(current_unit.strip())
                    current_unit = ""
                units.append(list_block.strip())
                continue
            
            # Regular paragraph
            if line.strip():
                current_unit += line + '\n'
            elif current_unit.strip():
                units.append(current_unit.strip())
                current_unit = ""
            
            i += 1
        
        if current_unit.strip():
            units.append(current_unit.strip())
        
        return units
    
    def _split_by_header(self, text: str, level: int = 2) -> List[Tuple[str, str]]:
        """
        Split text by header level
        
        Args:
            text: Text to split
            level: Header level (2 for ##, 3 for ###)
        
        Returns:
            List of (header_title, content) tuples
        """
        pattern = f"^{'#' * level} (.+)$"
        sections = []
        
        current_title = "Introduction"
        current_content = ""
        
        for line in text.split('\n'):
            match = re.match(pattern, line)
            if match:
                if current_content.strip():
                    sections.append((current_title, current_content))
                current_title = match.group(1).strip()
                current_content = ""
            else:
                current_content += line + '\n'
        
        if current_content.strip():
            sections.append((current_title, current_content))
        
        return sections
    
    def _split_by_paragraphs(self, text: str) -> List[str]:
        """
        Split text by paragraphs
        
        Args:
            text: Text to split
        
        Returns:
            List of paragraphs
        """
        # Split by double newlines
        paragraphs = text.split('\n\n')
        # Filter empty paragraphs
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _create_chunk(
        self,
        text: str,
        chunk_id: int,
        section: str,
        subsection: Optional[str],
        doc_metadata: Dict,
        document_path: str
    ) -> Chunk:
        """
        Create a Chunk object with metadata
        
        Args:
            text: Chunk text
            chunk_id: Chunk ID
            section: Section title
            subsection: Subsection title
            doc_metadata: Document metadata
            document_path: Path to document
        
        Returns:
            Chunk object
        """
        tokens = self.token_counter.count_tokens(text)
        words = self.token_counter.count_words(text)
        chars = self.token_counter.count_chars(text)
        
        keywords = self.metadata_extractor.extract_keywords(text)
        content_types = self.metadata_extractor.detect_content_type(text)
        
        # Generate unique document ID from filename if not in metadata
        doc_id = doc_metadata.get('doc_id')
        if not doc_id or doc_id == 'None':
            # Use filename without extension as doc_id
            doc_id = Path(document_path).stem
        
        metadata = ChunkMetadata(
            chunk_id=f"{doc_id}_chunk_{chunk_id}",
            document_id=doc_id,
            document_title=doc_metadata.get('title', 'Unknown'),
            document_path=document_path,
            section=section,
            subsection=subsection,
            tokens=tokens,
            word_count=words,
            char_count=chars,
            chunk_order=chunk_id,
            user_roles=doc_metadata.get('user_roles', []),
            topics=doc_metadata.get('topics', []),
            keywords=keywords,
            difficulty=doc_metadata.get('difficulty', 'Intermediate'),
            category=doc_metadata.get('category', 'Feature'),
            has_example=content_types['has_example'],
            has_error=content_types['has_error'],
            has_question=content_types['has_question']
        )
        
        return Chunk(text=text.strip(), metadata=metadata)


class DocumentProcessor:
    """Process all documents in Rag-Docs folder"""
    
    def __init__(self, rag_docs_path: str, chunker: RecursiveHierarchicalChunker):
        """
        Initialize processor
        
        Args:
            rag_docs_path: Path to Rag-Docs folder
            chunker: RecursiveHierarchicalChunker instance
        """
        self.rag_docs_path = Path(rag_docs_path)
        self.chunker = chunker
    
    def process_all_documents(self) -> Dict[str, List[Chunk]]:
        """
        Process all markdown documents in Rag-Docs folder
        
        Returns:
            Dictionary mapping document path to list of chunks
        """
        all_chunks = {}
        
        # Find all markdown files
        md_files = list(self.rag_docs_path.glob('*.md'))
        
        print(f"Found {len(md_files)} markdown files")
        
        for md_file in sorted(md_files):
            print(f"Processing: {md_file.name}")
            
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                chunks = self.chunker.chunk_document(
                    content,
                    str(md_file)
                )
                
                all_chunks[str(md_file)] = chunks
                print(f"  ✓ Created {len(chunks)} chunks")
            
            except Exception as e:
                print(f"  ✗ Error processing {md_file.name}: {str(e)}")
        
        return all_chunks
    
    def save_chunks_to_json(
        self,
        chunks: Dict[str, List[Chunk]],
        output_path: str
    ) -> None:
        """
        Save chunks to JSON file
        
        Args:
            chunks: Dictionary of chunks
            output_path: Path to save JSON file
        """
        output_data = {}
        
        for doc_path, chunk_list in chunks.items():
            output_data[doc_path] = [chunk.to_dict() for chunk in chunk_list]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved chunks to {output_path}")
    
    def generate_statistics(self, chunks: Dict[str, List[Chunk]]) -> Dict:
        """
        Generate statistics about chunks
        
        Args:
            chunks: Dictionary of chunks
        
        Returns:
            Statistics dictionary
        """
        total_chunks = sum(len(chunk_list) for chunk_list in chunks.values())
        total_tokens = sum(
            sum(chunk.metadata.tokens for chunk in chunk_list)
            for chunk_list in chunks.values()
        )
        total_words = sum(
            sum(chunk.metadata.word_count for chunk in chunk_list)
            for chunk_list in chunks.values()
        )
        
        stats = {
            'total_documents': len(chunks),
            'total_chunks': total_chunks,
            'total_tokens': total_tokens,
            'total_words': total_words,
            'average_chunk_size': total_tokens // total_chunks if total_chunks > 0 else 0,
            'average_chunk_words': total_words // total_chunks if total_chunks > 0 else 0,
            'documents': {}
        }
        
        for doc_path, chunk_list in chunks.items():
            doc_name = Path(doc_path).name
            doc_tokens = sum(chunk.metadata.tokens for chunk in chunk_list)
            doc_words = sum(chunk.metadata.word_count for chunk in chunk_list)
            
            stats['documents'][doc_name] = {
                'chunks': len(chunk_list),
                'tokens': doc_tokens,
                'words': doc_words,
                'average_chunk_size': doc_tokens // len(chunk_list) if chunk_list else 0
            }
        
        return stats


def main():
    """Main function to process all documents"""
    
    # Configuration
    RAG_DOCS_PATH = r'd:\Safe Bill 2\Safe-Bill\backend\safebill\Rag-Docs'
    OUTPUT_JSON_PATH = r'd:\Safe Bill 2\Safe-Bill\backend\safebill\RAG\services\chunks_output.json'
    STATS_PATH = r'd:\Safe Bill 2\Safe-Bill\backend\safebill\RAG\services\chunking_stats.json'
    
    # Initialize chunker
    chunker = RecursiveHierarchicalChunker(
        max_chunk_size=400,
        min_chunk_size=50,
        overlap_tokens=50
    )
    
    # Initialize processor
    processor = DocumentProcessor(RAG_DOCS_PATH, chunker)
    
    # Process all documents
    print("=" * 60)
    print("RAG Document Chunking Service")
    print("=" * 60)
    print()
    
    all_chunks = processor.process_all_documents()
    
    print()
    print("=" * 60)
    print("Saving chunks...")
    print("=" * 60)
    
    # Save chunks
    processor.save_chunks_to_json(all_chunks, OUTPUT_JSON_PATH)
    
    # Generate and save statistics
    stats = processor.generate_statistics(all_chunks)
    
    with open(STATS_PATH, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    print(f"✓ Saved statistics to {STATS_PATH}")
    
    # Print statistics
    print()
    print("=" * 60)
    print("Chunking Statistics")
    print("=" * 60)
    print(f"Total Documents: {stats['total_documents']}")
    print(f"Total Chunks: {stats['total_chunks']}")
    print(f"Total Tokens: {stats['total_tokens']:,}")
    print(f"Total Words: {stats['total_words']:,}")
    print(f"Average Chunk Size: {stats['average_chunk_size']} tokens")
    print(f"Average Chunk Words: {stats['average_chunk_words']} words")
    print()
    
    print("Per-Document Statistics:")
    print("-" * 60)
    for doc_name, doc_stats in stats['documents'].items():
        print(f"{doc_name}")
        print(f"  Chunks: {doc_stats['chunks']}")
        print(f"  Tokens: {doc_stats['tokens']:,}")
        print(f"  Avg Chunk: {doc_stats['average_chunk_size']} tokens")
    
    print()
    print("=" * 60)
    print("✓ Chunking complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
