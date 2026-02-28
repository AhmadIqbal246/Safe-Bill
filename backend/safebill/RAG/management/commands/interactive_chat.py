"""
Interactive RAG Chat Command
Allows users to chat with RAG system from terminal with multi-turn support
"""

import os
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db.models import Q
from RAG.services.embeddings import ChunkEmbeddingManager
from RAG.services.conversation_manager import ConversationManager
from RAG.services.llm_service import LLMService
import uuid


class Command(BaseCommand):
    help = 'Interactive RAG chat with multi-turn conversation support'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--provider',
            type=str,
            default='google',
            help='Embedding provider (google, openai, huggingface, cohere)'
        )
        parser.add_argument(
            '--llm-provider',
            type=str,
            default='google',
            help='LLM provider for response generation'
        )
        parser.add_argument(
            '--top-k',
            type=int,
            default=5,
            help='Number of top results to retrieve'
        )
        parser.add_argument(
            '--namespace',
            type=str,
            default='default',
            help='Pinecone namespace'
        )
    
    def handle(self, *args, **options):
        """Execute the command"""
        
        provider = options['provider']
        llm_provider = options['llm_provider']
        top_k = options['top_k']
        namespace = options['namespace']
        
        # Initialize managers
        embedding_manager = ChunkEmbeddingManager(provider=provider)
        conversation_manager = ConversationManager()
        llm_service = LLMService(provider=llm_provider)
        
        # Get chunks JSON path
        chunks_json_path = os.path.join(
            Path(__file__).resolve().parent.parent.parent,
            'services',
            'chunks_output.json'
        )
        
        # Create conversation session
        conversation_id = str(uuid.uuid4())
        anonymous_user_id = str(uuid.uuid4())
        
        self.print_header()
        self.stdout.write(
            self.style.SUCCESS(f'\n[OK] Conversation ID: {conversation_id}\n')
        )
        
        conversation_history = []
        
        try:
            while True:
                # Get user input
                self.stdout.write(self.style.HTTP_INFO('\n>>> '), ending='')
                user_query = input().strip()
                
                if not user_query:
                    continue
                
                if user_query.lower() in ['exit', 'quit', 'bye']:
                    self.print_goodbye()
                    break
                
                if user_query.lower() == 'history':
                    self.print_conversation_history(conversation_history)
                    continue
                
                if user_query.lower() == 'clear':
                    conversation_history = []
                    self.stdout.write(self.style.SUCCESS('\n[OK] Conversation cleared\n'))
                    continue
                
                # Print original query
                self.stdout.write(
                    self.style.HTTP_INFO(f'\n[QUERY] {user_query}')
                )
                
                # Analyze and enrich query if there's history
                analyzed_query = user_query
                if conversation_history:
                    self.stdout.write(
                        self.style.WARNING('\n[ANALYZING] Enriching query with conversation history...')
                    )
                    analyzed_query = self.enrich_query_with_history(
                        user_query,
                        conversation_history,
                        llm_service
                    )
                    self.stdout.write(
                        self.style.HTTP_SUCCESS(f'[ENRICHED QUERY] {analyzed_query}')
                    )
                
                # Search chunks
                self.stdout.write(
                    self.style.WARNING('\n[SEARCHING] Querying Pinecone...')
                )
                results = embedding_manager.search_chunks(
                    query_text=analyzed_query,
                    top_k=top_k,
                    namespace=namespace,
                    chunks_json_path=chunks_json_path
                )
                
                # Generate LLM response
                self.stdout.write(
                    self.style.WARNING('\n[GENERATING] Creating response...')
                )
                response_text = llm_service.generate_response(
                    query=user_query,
                    chunks=results
                )
                
                # Format results
                formatted_results = []
                for result in results:
                    formatted_results.append({
                        'id': result.get('id'),
                        'score': round(result.get('score', 0), 4),
                        'metadata': result.get('metadata', {}),
                        'text': result.get('text', '')[:500]
                    })
                
                # Save to conversation history
                conversation_manager.save_conversation(
                    conversation_id=conversation_id,
                    query=user_query,
                    response=response_text,
                    chunks=formatted_results,
                    anonymous_user_id=anonymous_user_id,
                    is_authenticated=False
                )
                
                # Add to local history
                conversation_history.append({
                    'query': user_query,
                    'enriched_query': analyzed_query,
                    'response': response_text,
                    'chunks': formatted_results,
                    'score': sum([r['score'] for r in formatted_results]) / len(formatted_results) if formatted_results else 0
                })
                
                # Print response
                self.print_response(response_text, formatted_results)
                
        except KeyboardInterrupt:
            self.print_goodbye()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n[ERROR] {str(e)}\n')
            )
    
    def enrich_query_with_history(self, query, history, llm_service):
        """Enrich query using conversation history"""
        
        # Build context from history
        context_messages = []
        for item in history[-3:]:  # Last 3 messages
            context_messages.append(f"Q: {item['query']}")
            context_messages.append(f"A: {item['response'][:200]}...")
        
        context = "\n".join(context_messages)
        
        # Create enrichment prompt
        enrichment_prompt = f"""Given the conversation history below, analyze the new query and create an enriched version that includes relevant context from previous messages.

Conversation History:
{context}

New Query: {query}

Provide ONLY the enriched query without any explanation. Make it more specific and contextual."""
        
        # Get enriched query from LLM
        enriched = llm_service.generate_response(
            query=enrichment_prompt,
            chunks=[]
        )
        
        return enriched.strip() if enriched else query
    
    def print_header(self):
        """Print welcome header"""
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 80)
        )
        self.stdout.write(
            self.style.SUCCESS('RAG INTERACTIVE CHAT')
        )
        self.stdout.write(
            self.style.SUCCESS('=' * 80)
        )
        self.stdout.write(
            self.style.HTTP_INFO('\nCommands:')
        )
        self.stdout.write('  history - Show conversation history')
        self.stdout.write('  clear   - Clear conversation')
        self.stdout.write('  exit    - Exit chat')
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 80 + '\n')
        )
    
    def print_response(self, response, chunks):
        """Print formatted response"""
        
        self.stdout.write(
            self.style.SUCCESS('\n[RESPONSE]')
        )
        self.stdout.write(
            self.style.HTTP_SUCCESS(f'\n{response}\n')
        )
        
        # Print retrieved chunks
        self.stdout.write(
            self.style.HTTP_INFO('\n[RETRIEVED CHUNKS]')
        )
        
        for i, chunk in enumerate(chunks, 1):
            score_color = self.get_score_color(chunk['score'])
            self.stdout.write(
                f"\n{i}. {chunk['metadata'].get('document_title', 'Unknown')} "
                f"(Section: {chunk['metadata'].get('section', 'N/A')})"
            )
            self.stdout.write(
                score_color(f"   Score: {chunk['score']:.4f}")
            )
            self.stdout.write(
                f"   Text: {chunk['text'][:150]}...\n"
            )
        
        # Print statistics
        if chunks:
            scores = [c['score'] for c in chunks]
            avg_score = sum(scores) / len(scores)
            max_score = max(scores)
            min_score = min(scores)
            
            self.stdout.write(
                self.style.HTTP_INFO('\n[STATISTICS]')
            )
            self.stdout.write(
                self.get_score_color(avg_score)(f'  Avg Score: {avg_score:.4f}')
            )
            self.stdout.write(
                self.get_score_color(max_score)(f'  Max Score: {max_score:.4f}')
            )
            self.stdout.write(
                self.get_score_color(min_score)(f'  Min Score: {min_score:.4f}')
            )
    
    def print_conversation_history(self, history):
        """Print conversation history"""
        
        if not history:
            self.stdout.write(
                self.style.WARNING('\n[INFO] No conversation history yet\n')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 80)
        )
        self.stdout.write(
            self.style.SUCCESS('CONVERSATION HISTORY')
        )
        self.stdout.write(
            self.style.SUCCESS('=' * 80 + '\n')
        )
        
        for i, item in enumerate(history, 1):
            self.stdout.write(
                self.style.HTTP_INFO(f'\n[Turn {i}]')
            )
            self.stdout.write(
                self.style.HTTP_INFO(f'Original Query: {item["query"]}')
            )
            
            if item['enriched_query'] != item['query']:
                self.stdout.write(
                    self.style.WARNING(f'Enriched Query: {item["enriched_query"]}')
                )
            
            self.stdout.write(
                self.style.HTTP_SUCCESS(f'Response: {item["response"][:200]}...')
            )
            self.stdout.write(
                self.get_score_color(item['score'])(f'Avg Score: {item["score"]:.4f}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 80 + '\n')
        )
    
    def print_goodbye(self):
        """Print goodbye message"""
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 80)
        )
        self.stdout.write(
            self.style.SUCCESS('Thank you for using RAG Chat!')
        )
        self.stdout.write(
            self.style.SUCCESS('=' * 80 + '\n')
        )
    
    def get_score_color(self, score):
        """Get color based on score"""
        if score >= 0.7:
            return self.style.SUCCESS  # Green
        elif score >= 0.5:
            return self.style.HTTP_INFO  # Blue
        else:
            return self.style.WARNING  # Yellow
