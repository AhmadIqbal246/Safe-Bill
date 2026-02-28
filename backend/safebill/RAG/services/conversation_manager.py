"""
Conversation Manager Service
Handles storing and retrieving conversation history from PostgreSQL and Redis
"""

import time
from typing import Dict, List, Optional
from django.contrib.auth.models import User
from django.db.models import Q
from RAG.models import ChatbotHistoryConversation, ConversationSession
from RAG.services.redis_cache import RedisCacheManager
import uuid


class ConversationManager:
    """
    Manages conversation history with hybrid PostgreSQL + Redis approach
    - Redis: Fast access to active conversations
    - PostgreSQL: Persistent storage and historical data
    """
    
    def __init__(self):
        """Initialize conversation manager"""
        self.redis_manager = RedisCacheManager()
    
    def save_conversation(
        self,
        conversation_id: str,
        query: str,
        response: Optional[str] = None,
        chunks: Optional[List[Dict]] = None,
        embedding: Optional[List[float]] = None,
        response_time_ms: int = 0,
        embedding_time_ms: int = 0,
        search_time_ms: int = 0,
        context_summary: Optional[str] = None,
        user_id: Optional[int] = None,
        anonymous_user_id: Optional[str] = None,
        is_authenticated: bool = False
    ) -> ChatbotHistoryConversation:
        """
        Save conversation to both PostgreSQL and Redis
        Supports both authenticated and anonymous users
        
        Args:
            conversation_id: Conversation ID (UUID)
            query: User query
            response: LLM-generated response
            chunks: Retrieved chunks
            embedding: Query embedding vector
            response_time_ms: Response generation time
            embedding_time_ms: Embedding generation time
            search_time_ms: Search time in Pinecone
            context_summary: Summary of conversation context
            user_id: Authenticated user ID (optional)
            anonymous_user_id: Anonymous user ID (optional)
            is_authenticated: Whether user is authenticated
        
        Returns:
            ChatbotHistoryConversation instance
        """
        
        # Calculate average and max chunk scores
        avg_score = 0.0
        max_score = 0.0
        if chunks:
            scores = [chunk.get('score', 0) for chunk in chunks]
            avg_score = sum(scores) / len(scores) if scores else 0.0
            max_score = max(scores) if scores else 0.0
        
        # Save to PostgreSQL
        conversation = ChatbotHistoryConversation.objects.create(
            user_id=user_id,
            anonymous_user_id=anonymous_user_id,
            is_authenticated=is_authenticated,
            conversation_id=conversation_id,
            user_query=query,
            response_text=response,
            query_embedding=embedding,
            retrieved_chunks=chunks or [],
            context_summary=context_summary,
            metadata={
                'provider': 'google',
                'model': 'text-embedding-004',
                'top_k': 5,
                'is_authenticated': is_authenticated
            },
            response_time_ms=response_time_ms,
            embedding_time_ms=embedding_time_ms,
            search_time_ms=search_time_ms,
            avg_chunk_score=avg_score,
            max_chunk_score=max_score
        )
        
        # Cache to Redis for fast access
        cache_user_id = user_id or anonymous_user_id
        self.redis_manager.cache_conversation(
            conversation_id=str(conversation_id),
            user_id=cache_user_id,
            query=query,
            response=response or '',
            chunks=chunks or [],
            embedding=embedding or [],
            ttl_hours=24
        )
        
        return conversation
    
    def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 5,
        user_id: Optional[int] = None,
        anonymous_user_id: Optional[str] = None
    ) -> List[ChatbotHistoryConversation]:
        """
        Get conversation history for context enrichment
        Supports both authenticated and anonymous users
        
        Args:
            conversation_id: Conversation ID
            limit: Number of previous messages to retrieve
            user_id: Authenticated user ID (optional)
            anonymous_user_id: Anonymous user ID (optional)
        
        Returns:
            List of previous conversations in chronological order
        """
        
        # Build query based on user type
        if user_id:
            query = ChatbotHistoryConversation.objects.filter(
                user_id=user_id,
                conversation_id=conversation_id
            )
        elif anonymous_user_id:
            query = ChatbotHistoryConversation.objects.filter(
                anonymous_user_id=anonymous_user_id,
                conversation_id=conversation_id
            )
        else:
            return []
        
        conversations = query.order_by('-created_at')[:limit]
        return list(reversed(conversations))
    
    def get_user_conversations(
        self,
        limit: int = 20,
        user_id: Optional[int] = None,
        anonymous_user_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Get all conversations for a user (grouped by session)
        Supports both authenticated and anonymous users
        
        Args:
            limit: Number of conversations to retrieve
            user_id: Authenticated user ID (optional)
            anonymous_user_id: Anonymous user ID (optional)
        
        Returns:
            List of conversations grouped by session
        """
        
        # Build query based on user type
        if user_id:
            conversations = ChatbotHistoryConversation.objects.filter(
                user_id=user_id
            ).values('conversation_id').distinct().order_by('-created_at')[:limit]
            
            result = []
            for conv in conversations:
                conv_id = conv['conversation_id']
                messages = ChatbotHistoryConversation.objects.filter(
                    user_id=user_id,
                    conversation_id=conv_id
                ).order_by('created_at')
                
                result.append({
                    'conversation_id': conv_id,
                    'message_count': messages.count(),
                    'first_message': messages.first().user_query if messages.exists() else '',
                    'last_message_at': messages.last().created_at if messages.exists() else None,
                    'avg_score': messages.aggregate(
                        avg=__import__('django.db.models', fromlist=['Avg']).Avg('avg_chunk_score')
                    )['avg'] or 0
                })
        
        elif anonymous_user_id:
            conversations = ChatbotHistoryConversation.objects.filter(
                anonymous_user_id=anonymous_user_id
            ).values('conversation_id').distinct().order_by('-created_at')[:limit]
            
            result = []
            for conv in conversations:
                conv_id = conv['conversation_id']
                messages = ChatbotHistoryConversation.objects.filter(
                    anonymous_user_id=anonymous_user_id,
                    conversation_id=conv_id
                ).order_by('created_at')
                
                result.append({
                    'conversation_id': conv_id,
                    'message_count': messages.count(),
                    'first_message': messages.first().user_query if messages.exists() else '',
                    'last_message_at': messages.last().created_at if messages.exists() else None,
                    'avg_score': messages.aggregate(
                        avg=__import__('django.db.models', fromlist=['Avg']).Avg('avg_chunk_score')
                    )['avg'] or 0
                })
        else:
            result = []
        
        return result
    
    def search_conversation_history(
        self,
        search_query: str,
        limit: int = 20,
        user_id: Optional[int] = None,
        anonymous_user_id: Optional[str] = None
    ) -> List[ChatbotHistoryConversation]:
        """
        Search user's conversation history
        Supports both authenticated and anonymous users
        
        Args:
            search_query: Search query string
            limit: Number of results
            user_id: Authenticated user ID (optional)
            anonymous_user_id: Anonymous user ID (optional)
        
        Returns:
            List of matching conversations
        """
        
        # Build query based on user type
        if user_id:
            return ChatbotHistoryConversation.objects.filter(
                user_id=user_id
            ).filter(
                Q(user_query__icontains=search_query) |
                Q(response_text__icontains=search_query)
            ).order_by('-created_at')[:limit]
        
        elif anonymous_user_id:
            return ChatbotHistoryConversation.objects.filter(
                anonymous_user_id=anonymous_user_id
            ).filter(
                Q(user_query__icontains=search_query) |
                Q(response_text__icontains=search_query)
            ).order_by('-created_at')[:limit]
        
        else:
            return []
    
    def get_context_for_enrichment(
        self,
        user_id: int,
        conversation_id: str,
        num_messages: int = 3
    ) -> str:
        """
        Get context from previous messages for query enrichment
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
            num_messages: Number of previous messages to include
        
        Returns:
            Context string for query enrichment
        """
        
        history = self.get_conversation_history(
            user_id=user_id,
            conversation_id=conversation_id,
            limit=num_messages
        )
        
        if not history:
            return ""
        
        context_parts = []
        for conv in history:
            context_parts.append(f"Q: {conv.user_query}")
            if conv.response_text:
                context_parts.append(f"A: {conv.response_text[:200]}...")
        
        return "\n".join(context_parts)
    
    def create_session(
        self,
        user_id: int,
        conversation_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> ConversationSession:
        """
        Create a new conversation session
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID (auto-generated if not provided)
            title: Session title
        
        Returns:
            ConversationSession instance
        """
        
        if not conversation_id:
            conversation_id = uuid.uuid4()
        
        session = ConversationSession.objects.create(
            user_id=user_id,
            conversation_id=conversation_id,
            title=title or f"Conversation {conversation_id.hex[:8]}"
        )
        
        return session
    
    def update_session_message_count(
        self,
        conversation_id: str
    ) -> None:
        """
        Update message count for a session
        
        Args:
            conversation_id: Conversation ID
        """
        
        try:
            session = ConversationSession.objects.get(conversation_id=conversation_id)
            message_count = ChatbotHistoryConversation.objects.filter(
                conversation_id=conversation_id
            ).count()
            session.message_count = message_count
            session.save()
        except ConversationSession.DoesNotExist:
            pass
    
    def close_session(self, conversation_id: str) -> None:
        """
        Close a conversation session
        
        Args:
            conversation_id: Conversation ID
        """
        
        try:
            session = ConversationSession.objects.get(conversation_id=conversation_id)
            session.close_session()
        except ConversationSession.DoesNotExist:
            pass
    
    def get_session_stats(self, conversation_id: str) -> Dict:
        """
        Get statistics for a conversation session
        
        Args:
            conversation_id: Conversation ID
        
        Returns:
            Session statistics
        """
        
        conversations = ChatbotHistoryConversation.objects.filter(
            conversation_id=conversation_id
        )
        
        if not conversations.exists():
            return {}
        
        from django.db.models import Avg, Max, Min
        
        stats = conversations.aggregate(
            total_messages=__import__('django.db.models', fromlist=['Count']).Count('id'),
            avg_score=Avg('avg_chunk_score'),
            max_score=Max('max_chunk_score'),
            total_response_time=__import__('django.db.models', fromlist=['Sum']).Sum('response_time_ms'),
            total_embedding_time=__import__('django.db.models', fromlist=['Sum']).Sum('embedding_time_ms'),
            total_search_time=__import__('django.db.models', fromlist=['Sum']).Sum('search_time_ms'),
        )
        
        return {
            'total_messages': stats['total_messages'] or 0,
            'avg_chunk_score': round(stats['avg_score'] or 0, 4),
            'max_chunk_score': round(stats['max_score'] or 0, 4),
            'total_response_time_ms': stats['total_response_time'] or 0,
            'total_embedding_time_ms': stats['total_embedding_time'] or 0,
            'total_search_time_ms': stats['total_search_time'] or 0,
        }
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation and its session
        
        Args:
            conversation_id: Conversation ID
        
        Returns:
            True if deleted successfully
        """
        
        try:
            # Delete from database
            ChatbotHistoryConversation.objects.filter(
                conversation_id=conversation_id
            ).delete()
            
            # Delete session
            ConversationSession.objects.filter(
                conversation_id=conversation_id
            ).delete()
            
            # Delete from cache
            self.redis_manager.delete_conversation(str(conversation_id))
            
            return True
        except Exception as e:
            print(f"Error deleting conversation: {str(e)}")
            return False
    
    def export_conversation(
        self,
        conversation_id: str,
        format: str = 'json'
    ) -> Dict:
        """
        Export conversation in specified format
        
        Args:
            conversation_id: Conversation ID
            format: Export format ('json', 'markdown')
        
        Returns:
            Exported conversation data
        """
        
        conversations = ChatbotHistoryConversation.objects.filter(
            conversation_id=conversation_id
        ).order_by('created_at')
        
        if format == 'markdown':
            lines = [f"# Conversation {conversation_id}\n"]
            for conv in conversations:
                lines.append(f"## Message {conv.id}")
                lines.append(f"**Q:** {conv.user_query}\n")
                if conv.response_text:
                    lines.append(f"**A:** {conv.response_text}\n")
                lines.append(f"*Score: {conv.avg_chunk_score:.4f}*\n")
            return {'format': 'markdown', 'content': '\n'.join(lines)}
        
        else:  # JSON format
            return {
                'format': 'json',
                'conversation_id': str(conversation_id),
                'messages': [
                    {
                        'id': conv.id,
                        'query': conv.user_query,
                        'response': conv.response_text,
                        'score': conv.avg_chunk_score,
                        'created_at': conv.created_at.isoformat()
                    }
                    for conv in conversations
                ]
            }
