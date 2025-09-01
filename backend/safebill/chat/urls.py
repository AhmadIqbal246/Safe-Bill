from django.urls import path
from . import views

urlpatterns = [
    # Existing project-based chat endpoints
    path("projects/<int:project_id>/chat/messages/", 
         views.MessageListAPIView.as_view()),
    path("projects/<int:project_id>/chat/messages/create/", 
         views.MessageCreateAPIView.as_view()),
    path("projects/<int:project_id>/chat/attachments/", 
         views.AttachmentUploadAPIView.as_view()),
    path("projects/<int:project_id>/chat/mark-read/", 
         views.MarkReadAPIView.as_view()),
    
    # Chat inbox and conversation list
    path("chat/inbox/", views.InboxListAPIView.as_view()),
    
    # New chat list functionality (WhatsApp-like)
    path("chat/contacts/", views.ChatContactListAPIView.as_view()),
    path("chat/contacts/<int:pk>/", 
         views.ChatContactDetailAPIView.as_view()),
    path("chat/contacts/<int:contact_id>/mark-read/", 
         views.MarkContactReadAPIView.as_view()),

    # Start a quote chat between current user and a professional (creates/returns a hidden project)
    path("chat/start-quote/<int:professional_id>/", 
         views.StartQuoteChatAPIView.as_view()),
    
]