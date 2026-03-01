from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_with_ai, name='chat_with_ai'),
    path('sessions/', views.list_sessions, name='list_sessions'),
    path('sessions/<int:session_id>/', views.get_session_history, name='get_session_history'),
]
