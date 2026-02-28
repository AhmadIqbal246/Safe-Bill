"""
Redis Cache Manager for Conversation History
Handles fast caching of active conversations
"""

import redis
import json
import os
from typing import Dict, List, Optional
from datetime import timedelta


class RedisCacheManager:
    """
    Manages Redis caching for conversation history
    Provides fast access to active conversations
    """
    
    def __init__(self):
        """Initialize Redis connection"""
        try:
            # Try to connect to Redis
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_DB', 0)),
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.is_available = True
            print("[OK] Redis connected successfully")
        except Exception as e:
            print(f"[WARNING] Redis not available: {str(e)}")
            self.is_available = False
            self.redis_client = None
    
    def _get_conversation_key(self, conversation_id: str) -> str:
        """Generate Redis key for conversation"""
        return f"conversation:{conversation_id}"
    
    def _get_session_key(self, user_id: int) -> str:
        """Generate Redis key for user sessions"""
        return f"sessions:{user_id}"
    
    def cache_conversation(
        self,
        conversation_id: str,
        user_id: int,
        query: str,
        response: str,
        chunks: List[Dict],
        embedding: List[float],
        ttl_hours: int = 24
    ) -> bool:
        """
        Cache conversation in Redis
        
        Args:
            conversation_id: Unique conversation identifier
            user_id: User ID
            query: User query
            response: LLM response
            chunks: Retrieved chunks
            embedding: Query embedding vector
            ttl_hours: Time to live in hours
        
        Returns:
            True if cached successfully, False otherwise
        """
        if not self.is_available:
            return False
        
        try:
            key = self._get_conversation_key(conversation_id)
            
            # Prepare conversation data
            conversation_data = {
                'conversation_id': conversation_id,
                'user_id': user_id,
                'query': query,
                'response': response,
                'chunks': json.dumps(chunks),
                'embedding': json.dumps(embedding),
                'timestamp': str(__import__('datetime').datetime.now())
            }
            
            # Store in Redis with TTL
            ttl_seconds = ttl_hours * 3600
            self.redis_client.hset(
                key,
                mapping=conversation_data
            )
            self.redis_client.expire(key, ttl_seconds)
            
            # Add to user's session list
            session_key = self._get_session_key(user_id)
            self.redis_client.lpush(session_key, conversation_id)
            self.redis_client.expire(session_key, ttl_seconds)
            
            return True
        except Exception as e:
            print(f"Error caching conversation: {str(e)}")
            return False
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """
        Retrieve conversation from Redis cache
        
        Args:
            conversation_id: Conversation ID
        
        Returns:
            Conversation data or None if not found
        """
        if not self.is_available:
            return None
        
        try:
            key = self._get_conversation_key(conversation_id)
            data = self.redis_client.hgetall(key)
            
            if not data:
                return None
            
            # Parse JSON fields
            if data.get('chunks'):
                data['chunks'] = json.loads(data['chunks'])
            if data.get('embedding'):
                data['embedding'] = json.loads(data['embedding'])
            
            return data
        except Exception as e:
            print(f"Error retrieving conversation from cache: {str(e)}")
            return None
    
    def get_conversation_history(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict]:
        """
        Get recent conversations for user from cache
        
        Args:
            user_id: User ID
            limit: Number of conversations to retrieve
        
        Returns:
            List of recent conversations
        """
        if not self.is_available:
            return []
        
        try:
            session_key = self._get_session_key(user_id)
            conversation_ids = self.redis_client.lrange(session_key, 0, limit - 1)
            
            conversations = []
            for conv_id in conversation_ids:
                conv_data = self.get_conversation(conv_id)
                if conv_data:
                    conversations.append(conv_data)
            
            return conversations
        except Exception as e:
            print(f"Error retrieving conversation history: {str(e)}")
            return []
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete conversation from cache
        
        Args:
            conversation_id: Conversation ID
        
        Returns:
            True if deleted successfully
        """
        if not self.is_available:
            return False
        
        try:
            key = self._get_conversation_key(conversation_id)
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting conversation: {str(e)}")
            return False
    
    def clear_user_cache(self, user_id: int) -> bool:
        """
        Clear all cached conversations for user
        
        Args:
            user_id: User ID
        
        Returns:
            True if cleared successfully
        """
        if not self.is_available:
            return False
        
        try:
            session_key = self._get_session_key(user_id)
            conversation_ids = self.redis_client.lrange(session_key, 0, -1)
            
            # Delete all conversations
            for conv_id in conversation_ids:
                self.delete_conversation(conv_id)
            
            # Delete session key
            self.redis_client.delete(session_key)
            return True
        except Exception as e:
            print(f"Error clearing user cache: {str(e)}")
            return False
    
    def get_cache_stats(self) -> Dict:
        """
        Get Redis cache statistics
        
        Returns:
            Cache statistics
        """
        if not self.is_available:
            return {'status': 'unavailable'}
        
        try:
            info = self.redis_client.info()
            return {
                'status': 'available',
                'used_memory_mb': info.get('used_memory_mb', 0),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
            }
        except Exception as e:
            print(f"Error getting cache stats: {str(e)}")
            return {'status': 'error', 'error': str(e)}
