"""
RAG Conversation Models
Stores conversation history for multi-turn RAG interactions
"""

from django.db import models
from django.conf import settings
import uuid


class ChatbotHistoryConversation(models.Model):
    """
    Stores conversation history for RAG chatbot interactions
    Supports multi-turn conversations with context awareness
    """
    
    # Primary identifiers
    id = models.BigAutoField(primary_key=True)
    conversation_id = models.UUIDField(
        default=uuid.uuid4,
        db_index=True,
        help_text="Unique identifier for conversation thread"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rag_conversations',
        null=True,
        blank=True,
        help_text="Authenticated user (NULL for anonymous users)"
    )
    
    anonymous_user_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        help_text="Anonymous user identifier (session/device ID)"
    )
    
    is_authenticated = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether user was authenticated when creating conversation"
    )
    
    # Conversation content
    user_query = models.TextField(
        help_text="Original user query"
    )
    response_text = models.TextField(
        null=True,
        blank=True,
        help_text="LLM-generated response (if applicable)"
    )
    
    # Embeddings and retrieved data
    query_embedding = models.JSONField(
        null=True,
        blank=True,
        help_text="Query embedding vector (768 dimensions for Google)"
    )
    retrieved_chunks = models.JSONField(
        default=list,
        blank=True,
        help_text="Top 5 retrieved chunks with metadata and scores"
    )
    
    # Context and metadata
    context_summary = models.TextField(
        null=True,
        blank=True,
        help_text="Summary of conversation context for enrichment"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata (provider, model, etc.)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When conversation was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When conversation was last updated"
    )
    
    # Performance tracking
    response_time_ms = models.IntegerField(
        default=0,
        help_text="Time taken to generate response in milliseconds"
    )
    embedding_time_ms = models.IntegerField(
        default=0,
        help_text="Time taken to generate embedding in milliseconds"
    )
    search_time_ms = models.IntegerField(
        default=0,
        help_text="Time taken to search Pinecone in milliseconds"
    )
    
    # Quality metrics
    avg_chunk_score = models.FloatField(
        default=0.0,
        help_text="Average similarity score of retrieved chunks"
    )
    max_chunk_score = models.FloatField(
        default=0.0,
        help_text="Maximum similarity score of retrieved chunks"
    )
    
    class Meta:
        db_table = 'chatbot_history_conversation'
        ordering = ['-created_at']
        verbose_name = 'Chatbot Conversation'
        verbose_name_plural = 'Chatbot Conversations'
        
        # Indexes for common queries
        indexes = [
            models.Index(fields=['user', 'conversation_id']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['conversation_id', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.conversation_id} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    def get_performance_summary(self):
        """Get performance metrics for this conversation"""
        return {
            'total_time_ms': self.response_time_ms + self.embedding_time_ms + self.search_time_ms,
            'embedding_time_ms': self.embedding_time_ms,
            'search_time_ms': self.search_time_ms,
            'response_time_ms': self.response_time_ms,
            'avg_chunk_score': round(self.avg_chunk_score, 4),
            'max_chunk_score': round(self.max_chunk_score, 4),
        }
    
    def get_chunks_summary(self):
        """Get summary of retrieved chunks"""
        if not self.retrieved_chunks:
            return []
        
        return [
            {
                'id': chunk.get('id'),
                'score': chunk.get('score'),
                'document': chunk.get('metadata', {}).get('document_title'),
                'section': chunk.get('metadata', {}).get('section'),
            }
            for chunk in self.retrieved_chunks[:5]
        ]


class ConversationSession(models.Model):
    """
    Tracks conversation sessions for grouping related messages
    Useful for managing conversation lifecycle
    """
    
    id = models.BigAutoField(primary_key=True)
    conversation_id = models.UUIDField(
        unique=True,
        db_index=True,
        help_text="Unique session identifier"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rag_sessions'
    )
    
    # Session metadata
    title = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="User-provided or auto-generated session title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Session description or summary"
    )
    
    # Session state
    message_count = models.IntegerField(
        default=0,
        help_text="Number of messages in this session"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether session is still active"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When session was ended"
    )
    
    class Meta:
        db_table = 'chatbot_conversation_session'
        ordering = ['-updated_at']
        verbose_name = 'Conversation Session'
        verbose_name_plural = 'Conversation Sessions'
    
    def __str__(self):
        return f"{self.user.username} - {self.title or self.conversation_id}"
    
    def close_session(self):
        """Close the conversation session"""
        from django.utils import timezone
        self.is_active = False
        self.ended_at = timezone.now()
        self.save()
