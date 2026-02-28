"""
RAG App URLs
"""

from django.urls import path
from . import views

app_name = 'rag'

urlpatterns = [
    # Search endpoints
    path('search/', views.search_chunks, name='search_chunks'),
    
    # Conversation management endpoints
    path('conversations/', views.get_user_conversations, name='get_user_conversations'),
    path('history/<str:conversation_id>/', views.get_conversation_history, name='get_conversation_history'),
    path('history/<str:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
    path('search-history/', views.search_conversation, name='search_conversation'),
]
