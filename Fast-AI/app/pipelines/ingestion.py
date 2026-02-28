import os
import yaml
from pathlib import Path
from typing import List

from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

from app.db.vector_store import vector_store
from app.services.embeddings.embedder import embedding_service
from app.schemas.document import Chunk, IngestionResponse

class DataIngestionPipeline:
    def __init__(self):
        # 1. Semantic Splitting: We split strictly by defining Markdown headers
        self.headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
            ("####", "Header 4"),
        ]
        self.md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=self.headers_to_split_on)
        
        # 2. Fallback Character Splitting:
        # If a single section under a header is massively long (e.g. >1000 characters),
        # this safely breaks it up without cutting sentences in half.
        self.char_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=150,  # Overlap ensures sentences spanning boundaries keep context
            separators=["\n\n", "\n", ".", " ", ""]
        )
        
    def _extract_frontmatter_and_content(self, raw_text: str):
        """Extracts YAML frontmatter safely from the top of the Markdown."""
        if not raw_text.startswith("---"):
            return {}, raw_text
            
        parts = raw_text.split("---", 2)
        if len(parts) >= 3:
            try:
                frontmatter = yaml.safe_load(parts[1])
                content = parts[2].strip()
                return frontmatter or {}, content
            except yaml.YAMLError:
                return {}, raw_text
        return {}, raw_text

    def process_document(self, file_path: str) -> List[Chunk]:
        """Reads a single markdown file, chunks it semantically, and attaches metadata."""
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_text = f.read()
            
        # 1. Parse Global Metadata (from the document's YAML Frontmatter)
        frontmatter, content = self._extract_frontmatter_and_content(raw_text)
        
        doc_title = frontmatter.get("title", Path(file_path).stem)
        doc_category = frontmatter.get("category", "Uncategorized")
        
        # 2. Semantic Document Split
        header_splits = self.md_splitter.split_text(content)
        
        # 3. Fallback Character Split on top
        final_splits = self.char_splitter.split_documents(header_splits)
        
        chunks = []
        for i, split in enumerate(final_splits):
            # Combine the section headers into a "breadcrumb trail" (e.g. "How It Works > Component 1")
            headers = [v for k, v in split.metadata.items() if k.startswith("Header")]
            section_path = " > ".join(headers) if headers else "Introduction"
            
            # 4. Inject global context directly into the chunk text so the AI never loses meaning!
            enriched_text = f"Title: {doc_title}\nSection: {section_path}\n---\n{split.page_content.strip()}"
            
            # Combine the global frontmatter metadata with the specific chunk metadata
            chunk_metadata = {
                "source": Path(file_path).name,
                "title": doc_title,
                "category": doc_category,
                "section": section_path,
                "chunk_index": i
            }
            
            # 5. Deterministic ID for duplicate prevention (filename + index)
            chunk_id_str = f"{Path(file_path).stem}-chunk-{i}"
            
            chunks.append(Chunk(
                chunk_id=chunk_id_str,
                text=enriched_text,
                metadata=chunk_metadata
            ))
            
        return chunks

    async def ingest_directory(self, dir_path: str) -> IngestionResponse:
        """Processes all markdown files in a directory, embeds them, and upserts to Pinecone."""
        import time
        start_time = time.time()
        
        paths = list(Path(dir_path).glob("*.md"))
        if not paths:
            return IngestionResponse(status="error", chunks_created=0, processing_time_ms=0)
            
        all_chunks: List[Chunk] = []
        for file_path in paths:
            chunks = self.process_document(str(file_path))
            all_chunks.extend(chunks)
            
        if not all_chunks:
            return IngestionResponse(status="success", chunks_created=0, processing_time_ms=int((time.time() - start_time) * 1000))
            
        # 5. Batch Embedding (Local 768-dim)
        texts_to_embed = [chunk.text for chunk in all_chunks]
        
        all_embeddings = []
        batch_size = 100
        for i in range(0, len(texts_to_embed), batch_size):
            batch_texts = texts_to_embed[i:i + batch_size]
            batch_embeddings = embedding_service.embed_batch(batch_texts)
            all_embeddings.extend(batch_embeddings)
            print(f"Processed {min(i + batch_size, len(texts_to_embed))}/{len(texts_to_embed)} chunks...")
            
        # 6. Format exactly for Pinecone's Database Schema
        pinecone_vectors = []
        for chunk, emb in zip(all_chunks, all_embeddings):
            pinecone_vectors.append({
                "id": chunk.chunk_id,
                "values": emb,
                "metadata": {
                    "text": chunk.text,
                    **chunk.metadata
                }
            })
            
        # 7. Upsert to Pinecone
        vector_store.upsert_chunks(pinecone_vectors)
        
        total_time_ms = int((time.time() - start_time) * 1000)
        return IngestionResponse(
            status="success", 
            chunks_created=len(all_chunks), 
            processing_time_ms=total_time_ms
        )

ingestion_pipeline = DataIngestionPipeline()
