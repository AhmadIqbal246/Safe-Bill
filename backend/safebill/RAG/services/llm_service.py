"""
LLM Service for RAG Response Generation
Supports multiple LLM providers for generating natural language responses
"""

import os
from typing import List, Dict, Optional
import google.generativeai as genai
from django.conf import settings


class LLMService:
    """
    Service for generating natural language responses using LLMs
    Supports Google Gemini, OpenAI, and other providers
    """
    
    def __init__(self, provider: str = 'google'):
        """
        Initialize LLM service
        
        Args:
            provider: LLM provider ('google', 'openai', etc.)
        """
        self.provider = provider
        self.model = None
        self.client = None
        
        if provider == 'google':
            self._init_google()
        elif provider == 'openai':
            self._init_openai()
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _init_google(self):
        """Initialize Google Gemini"""
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set in environment")
        
        genai.configure(api_key=api_key)
        
        # Try models in order of preference
        models_to_try = [
            'gemini-2.0-flash',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro'
        ]
        
        for model_name in models_to_try:
            try:
                self.model = genai.GenerativeModel(model_name)
                print(f"[OK] Using model: {model_name}")
                return
            except Exception as e:
                continue
        
        # If all fail, raise error
        raise ValueError(
            f"No compatible Gemini model found. Tried: {', '.join(models_to_try)}"
        )
    
    def _init_openai(self):
        """Initialize OpenAI"""
        try:
            from openai import OpenAI
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in environment")
            
            self.client = OpenAI(api_key=api_key)
        except ImportError:
            raise ImportError("OpenAI package not installed: pip install openai")
    
    def generate_response(
        self,
        query: str,
        chunks: Optional[List[Dict]] = None,
        max_tokens: int = 500
    ) -> str:
        """
        Generate a natural language response based on query and chunks
        
        Args:
            query: User query
            chunks: Retrieved chunks (list of dicts with 'text' and 'metadata')
            max_tokens: Maximum tokens in response
        
        Returns:
            Generated response text
        """
        
        if not chunks:
            chunks = []
        
        # Build context from chunks
        context = self._build_context(chunks)
        
        # Create prompt
        prompt = self._create_prompt(query, context)
        
        # Generate response
        if self.provider == 'google':
            return self._generate_google(prompt, max_tokens)
        elif self.provider == 'openai':
            return self._generate_openai(prompt, max_tokens)
        else:
            return "Unable to generate response"
    
    def _build_context(self, chunks: List[Dict]) -> str:
        """Build context string from chunks"""
        
        if not chunks:
            return "No relevant information found."
        
        context_parts = []
        
        for i, chunk in enumerate(chunks, 1):
            # Handle both dict and object formats
            if isinstance(chunk, dict):
                text = chunk.get('text', '')
                metadata = chunk.get('metadata', {})
                score = chunk.get('score', 0)
            else:
                text = getattr(chunk, 'text', '')
                metadata = getattr(chunk, 'metadata', {})
                score = getattr(chunk, 'score', 0)
            
            if text:
                doc_title = metadata.get('document_title', 'Unknown') if isinstance(metadata, dict) else 'Unknown'
                section = metadata.get('section', '') if isinstance(metadata, dict) else ''
                
                context_parts.append(
                    f"[Source {i}: {doc_title}" + 
                    (f" - {section}" if section else "") + 
                    f" (Relevance: {score:.2%})]\n{text}"
                )
        
        return "\n\n".join(context_parts) if context_parts else "No relevant information found."
    
    def _create_prompt(self, query: str, context: str) -> str:
        """Create prompt for LLM"""
        
        prompt = f"""You are a helpful assistant answering questions based on provided documentation.

CONTEXT:
{context}

USER QUESTION:
{query}

INSTRUCTIONS:
1. Answer based ONLY on the provided context
2. Be concise and clear
3. If information is not in context, say "I don't have information about that"
4. Cite the source when possible
5. Use bullet points for lists
6. Keep response under 500 words

ANSWER:"""
        
        return prompt
    
    def _generate_google(self, prompt: str, max_tokens: int) -> str:
        """Generate response using Google Gemini"""
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                    top_p=0.9,
                )
            )
            
            if response.text:
                return response.text.strip()
            else:
                return "Unable to generate response"
        
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def _generate_openai(self, prompt: str, max_tokens: int) -> str:
        """Generate response using OpenAI"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9
            )
            
            if response.choices:
                return response.choices[0].message.content.strip()
            else:
                return "Unable to generate response"
        
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def enrich_query(
        self,
        query: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Enrich a query based on conversation history
        
        Args:
            query: Current user query
            conversation_history: List of previous messages
        
        Returns:
            Enriched query
        """
        
        if not conversation_history:
            return query
        
        # Build history context
        history_context = []
        for item in conversation_history[-3:]:  # Last 3 messages
            history_context.append(f"Q: {item.get('query', '')}")
            response = item.get('response', '')
            if response:
                history_context.append(f"A: {response[:150]}...")
        
        history_text = "\n".join(history_context)
        
        # Create enrichment prompt
        enrichment_prompt = f"""Given the conversation history below, analyze the new query and create an enriched version that includes relevant context from previous messages.

CONVERSATION HISTORY:
{history_text}

NEW QUERY: {query}

INSTRUCTIONS:
1. Keep the original intent of the query
2. Add context from history if relevant
3. Make it more specific and contextual
4. Return ONLY the enriched query without explanation

ENRICHED QUERY:"""
        
        enriched = self._generate_google(enrichment_prompt, 200) if self.provider == 'google' else self._generate_openai(enrichment_prompt, 200)
        
        return enriched.strip() if enriched else query
