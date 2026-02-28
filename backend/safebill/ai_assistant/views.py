import httpx
import json
from django.conf import settings
from django.http import StreamingHttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from asgiref.sync import sync_to_async
from .models import AIChatSession, AIMessage

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_ai(request):
    """
    Main entry point for AI Chat. 
    Handles session creation/lookup and proxies to FastAPI.
    """
    user = request.user
    session_id = request.data.get('session_id')
    user_query = request.data.get('message')

    if not user_query:
        return JsonResponse({"error": "Message is required"}, status=400)

    # 1. Get or Create Session
    if session_id:
        try:
            session = AIChatSession.objects.get(id=session_id, user=user)
        except AIChatSession.DoesNotExist:
            return JsonResponse({"error": "Session not found"}, status=404)
    else:
        # Auto-create session if none provided
        session = AIChatSession.objects.create(user=user, title=user_query[:50])

    # 2. Save User Message to PostgreSQL
    AIMessage.objects.create(session=session, role='user', content=user_query)

    # 3. Retrieve History for RAG Context
    history = []
    # Fetch last 10 messages to keep context lean
    past_messages = session.messages.all().order_by('created_at')[:10]
    for msg in past_messages:
        history.append({"role": msg.role, "content": msg.content})

    # 4. Define the Streaming Proxy Generator
    async def stream_generator():
        full_ai_response = ""
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # We call our FastAPI Microservice on Port 8001
            async with client.stream(
                "POST", 
                f"{settings.FAST_AI_URL}/api/v1/chat/",
                json={
                    "messages": history,
                    "stream": True,
                    "session_id": str(session.id)
                }
            ) as response:
                async for chunk in response.aiter_text():
                    full_ai_response += chunk
                    yield chunk
        
        # 5. Save the Full AI Response to DB after streaming finishes
        if full_ai_response:
            await sync_to_async(AIMessage.objects.create)(
                session=session, 
                role='assistant', 
                content=full_ai_response
            )

    return StreamingHttpResponse(stream_generator(), content_type="text/plain")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """Returns all chat sessions for the logged-in user."""
    sessions = AIChatSession.objects.filter(user=request.user).values('id', 'title', 'updated_at')
    return JsonResponse(list(sessions), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_history(request, session_id):
    """Returns all messages in a specific session."""
    try:
        session = AIChatSession.objects.get(id=session_id, user=request.user)
        messages = session.messages.all().values('role', 'content', 'created_at', 'metadata')
        return JsonResponse({
            "session_id": session.id,
            "title": session.title,
            "messages": list(messages)
        })
    except AIChatSession.DoesNotExist:
        return JsonResponse({"error": "Session not found"}, status=404)
