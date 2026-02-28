"""
RAG API Views for Chunk Search and Conversation Management
"""

import os
import time
import uuid
from pathlib import Path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services.embeddings import ChunkEmbeddingManager
from .services.conversation_manager import ConversationManager


@api_view(['POST'])
def search_chunks(request):
    """
    Search for similar chunks in Pinecone with conversation history
    Works for both authenticated and anonymous users
    
    Request body:
    {
        "query": "search query text",
        "conversation_id": "uuid (optional, auto-generated if not provided)",
        "top_k": 5,
        "provider": "google",
        "namespace": "default",
        "save_history": true
    }
    
    Response:
    {
        "success": true,
        "conversation_id": "uuid",
        "query": "query text",
        "count": 5,
        "results": [...],
        "is_authenticated": true,
        "performance": {
            "embedding_time_ms": 150,
            "search_time_ms": 200,
            "total_time_ms": 350
        }
    }
    """
    try:
        # Determine user identifier (authenticated or anonymous)
        if request.user.is_authenticated:
            user_id = request.user.id
            anonymous_user_id = None
            is_authenticated = True
        else:
            # Create/get session-based ID for anonymous user
            if 'rag_session_id' not in request.session:
                request.session['rag_session_id'] = str(uuid.uuid4())
            
            user_id = None
            anonymous_user_id = request.session['rag_session_id']
            is_authenticated = False
        
        # Get query parameters
        query = request.data.get('query')
        conversation_id = request.data.get('conversation_id') or str(uuid.uuid4())
        top_k = request.data.get('top_k', 5)
        provider = request.data.get('provider', 'google')
        namespace = request.data.get('namespace', 'default')
        save_history = request.data.get('save_history', True)
        
        # Validate query
        if not query or not query.strip():
            return Response(
                {'error': 'Query text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate top_k
        if not isinstance(top_k, int) or top_k < 1 or top_k > 100:
            return Response(
                {'error': 'top_k must be between 1 and 100'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize managers
        embedding_manager = ChunkEmbeddingManager(provider=provider)
        conversation_manager = ConversationManager()
        
        # Get chunks JSON path
        chunks_json_path = os.path.join(
            Path(__file__).resolve().parent,
            'services',
            'chunks_output.json'
        )
        
        # Track performance
        start_time = time.time()
        
        # Generate embedding
        embedding_start = time.time()
        query_embedding = embedding_manager.embedding_gen.generate_embedding(query)
        embedding_time_ms = int((time.time() - embedding_start) * 1000)
        
        # Search chunks
        search_start = time.time()
        results = embedding_manager.search_chunks(
            query_text=query,
            top_k=top_k,
            namespace=namespace,
            chunks_json_path=chunks_json_path
        )
        search_time_ms = int((time.time() - search_start) * 1000)
        
        # Format response
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.get('id'),
                'score': round(result.get('score', 0), 4),
                'metadata': result.get('metadata', {}),
                'text': result.get('text', '')[:500]  # Limit text to 500 chars
            })
        
        # Save to conversation history
        if save_history:
            conversation_manager.save_conversation(
                conversation_id=conversation_id,
                query=query,
                chunks=formatted_results,
                embedding=query_embedding,
                embedding_time_ms=embedding_time_ms,
                search_time_ms=search_time_ms,
                user_id=user_id,
                anonymous_user_id=anonymous_user_id,
                is_authenticated=is_authenticated
            )
        
        total_time_ms = int((time.time() - start_time) * 1000)
        
        return Response({
            'success': True,
            'conversation_id': conversation_id,
            'query': query,
            'count': len(formatted_results),
            'results': formatted_results,
            'is_authenticated': is_authenticated,
            'performance': {
                'embedding_time_ms': embedding_time_ms,
                'search_time_ms': search_time_ms,
                'total_time_ms': total_time_ms
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_conversation_history(request, conversation_id):
    """
    Get conversation history for a specific conversation
    Works for both authenticated and anonymous users
    
    URL: /api/rag/history/{conversation_id}/
    
    Response:
    {
        "success": true,
        "conversation_id": "uuid",
        "is_authenticated": true,
        "messages": [
            {
                "id": 1,
                "query": "...",
                "response": "...",
                "score": 0.65,
                "created_at": "2025-12-07T20:30:00Z"
            }
        ],
        "stats": {
            "total_messages": 5,
            "avg_chunk_score": 0.65,
            "max_chunk_score": 0.78
        }
    }
    """
    try:
        # Determine user identifier
        if request.user.is_authenticated:
            user_id = request.user.id
            anonymous_user_id = None
            is_authenticated = True
        else:
            # Get session-based ID for anonymous user
            if 'rag_session_id' not in request.session:
                return Response(
                    {'error': 'No conversation history found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            user_id = None
            anonymous_user_id = request.session['rag_session_id']
            is_authenticated = False
        
        conversation_manager = ConversationManager()
        
        # Get conversation history
        history = conversation_manager.get_conversation_history(
            conversation_id=conversation_id,
            user_id=user_id,
            anonymous_user_id=anonymous_user_id,
            limit=50
        )
        
        # Get session stats
        stats = conversation_manager.get_session_stats(conversation_id)
        
        # Format messages
        messages = []
        for conv in history:
            messages.append({
                'id': conv.id,
                'query': conv.user_query,
                'response': conv.response_text,
                'score': round(conv.avg_chunk_score, 4),
                'created_at': conv.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'conversation_id': conversation_id,
            'is_authenticated': is_authenticated,
            'messages': messages,
            'stats': stats
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_user_conversations(request):
    """
    Get all conversations for user (authenticated or anonymous)
    
    URL: /api/rag/conversations/
    
    Response:
    {
        "success": true,
        "is_authenticated": true,
        "conversations": [
            {
                "conversation_id": "uuid",
                "message_count": 5,
                "first_message": "What is...",
                "last_message_at": "2025-12-07T20:30:00Z",
                "avg_score": 0.65
            }
        ]
    }
    """
    try:
        # Determine user identifier
        if request.user.is_authenticated:
            user_id = request.user.id
            anonymous_user_id = None
            is_authenticated = True
        else:
            # Get session-based ID for anonymous user
            if 'rag_session_id' not in request.session:
                return Response({
                    'success': True,
                    'is_authenticated': False,
                    'count': 0,
                    'conversations': []
                }, status=status.HTTP_200_OK)
            
            user_id = None
            anonymous_user_id = request.session['rag_session_id']
            is_authenticated = False
        
        conversation_manager = ConversationManager()
        
        # Get user conversations
        conversations = conversation_manager.get_user_conversations(
            user_id=user_id,
            anonymous_user_id=anonymous_user_id,
            limit=50
        )
        
        return Response({
            'success': True,
            'is_authenticated': is_authenticated,
            'count': len(conversations),
            'conversations': conversations
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def search_conversation(request):
    """
    Search user's conversation history (authenticated or anonymous)
    
    Request body:
    {
        "query": "search term"
    }
    
    Response:
    {
        "success": true,
        "is_authenticated": true,
        "results": [...]
    }
    """
    try:
        # Determine user identifier
        if request.user.is_authenticated:
            user_id = request.user.id
            anonymous_user_id = None
            is_authenticated = True
        else:
            # Get session-based ID for anonymous user
            if 'rag_session_id' not in request.session:
                return Response({
                    'success': True,
                    'is_authenticated': False,
                    'count': 0,
                    'results': []
                }, status=status.HTTP_200_OK)
            
            user_id = None
            anonymous_user_id = request.session['rag_session_id']
            is_authenticated = False
        
        search_query = request.data.get('query', '')
        if not search_query:
            return Response(
                {'error': 'Search query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        conversation_manager = ConversationManager()
        
        # Search conversations
        results = conversation_manager.search_conversation_history(
            search_query=search_query,
            user_id=user_id,
            anonymous_user_id=anonymous_user_id,
            limit=20
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.id,
                'conversation_id': str(result.conversation_id),
                'query': result.user_query,
                'response': result.response_text[:200] if result.response_text else None,
                'score': round(result.avg_chunk_score, 4),
                'created_at': result.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'is_authenticated': is_authenticated,
            'count': len(formatted_results),
            'results': formatted_results
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def delete_conversation(request, conversation_id):
    """
    Delete a conversation and its history (authenticated or anonymous)
    
    URL: /api/rag/history/{conversation_id}/
    Method: DELETE
    
    Response:
    {
        "success": true,
        "message": "Conversation deleted successfully"
    }
    """
    try:
        # Determine user identifier
        if request.user.is_authenticated:
            user_id = request.user.id
            anonymous_user_id = None
            is_authenticated = True
        else:
            # Get session-based ID for anonymous user
            if 'rag_session_id' not in request.session:
                return Response(
                    {'error': 'No conversation found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            user_id = None
            anonymous_user_id = request.session['rag_session_id']
            is_authenticated = False
        
        conversation_manager = ConversationManager()
        
        # Delete conversation
        success = conversation_manager.delete_conversation(conversation_id)
        
        if success:
            return Response({
                'success': True,
                'message': 'Conversation deleted successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to delete conversation'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
