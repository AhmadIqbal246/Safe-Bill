from django.db import models
from django.conf import settings
from projects.models import Project


def chat_upload_path(instance, filename):
    return f"chat_attachments/project_{instance.conversation.project_id}/{filename}"


class Conversation(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="conversation")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chat_conversations")
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_text = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"Conversation(project_id={self.project_id})"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_messages")
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to=chat_upload_path, null=True, blank=True)
    client_message_id = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["conversation", "id"]),
            models.Index(fields=["conversation", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Message({self.id}) by {self.sender_id} in conv {self.conversation_id}"