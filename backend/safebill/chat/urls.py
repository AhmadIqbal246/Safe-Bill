from django.urls import path
from . import views

urlpatterns = [
    path("projects/<int:project_id>/chat/messages/", views.MessageListAPIView.as_view()),
    path("projects/<int:project_id>/chat/messages/create/", views.MessageCreateAPIView.as_view()),
    path("projects/<int:project_id>/chat/attachments/", views.AttachmentUploadAPIView.as_view()),
    path("projects/<int:project_id>/chat/mark-read/", views.MarkReadAPIView.as_view()),
    path("chat/inbox/", views.InboxListAPIView.as_view()),
]