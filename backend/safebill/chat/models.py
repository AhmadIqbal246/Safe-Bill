from django.db import models
from django.conf import settings
from projects.models import Project


def chat_upload_path(instance, filename):
    return (f"chat_attachments/project_"
            f"{instance.conversation.project_id}/{filename}")


class ChatContact(models.Model):
    """
    Represents a chat contact between two users.
    This allows users to see all their chat contacts in a WhatsApp-like list.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="chat_contacts"
    )
    contact = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="contacted_by"
    )
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name="chat_contacts"
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_text = models.TextField(blank=True, default="")
    unread_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'contact', 'project']
        ordering = ['-last_message_at', '-updated_at']
        indexes = [
            models.Index(fields=['user', 'last_message_at']),
            models.Index(fields=['user', 'contact']),
            models.Index(fields=['project', 'user']),
        ]

    def __str__(self):
        return (f"ChatContact({self.user.username} -> "
                f"{self.contact.username} via {self.project.name})")

    def update_last_message(self, message_text, message_time):
        """Update the last message info for this contact"""
        self.last_message_text = message_text[:255] if message_text else ""
        self.last_message_at = message_time
        update_fields = ['last_message_text', 'last_message_at', 'updated_at']
        self.save(update_fields=update_fields)

    def increment_unread_count(self):
        """Increment unread count for this contact"""
        self.unread_count += 1
        self.save(update_fields=['unread_count', 'updated_at'])

    def reset_unread_count(self):
        """Reset unread count to 0"""
        self.unread_count = 0
        self.save(update_fields=['unread_count', 'updated_at'])


class Conversation(models.Model):
    project = models.OneToOneField(
        Project, 
        on_delete=models.CASCADE, 
        related_name="conversation"
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name="chat_conversations"
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_text = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"Conversation(project_id={self.project_id})"

    def get_other_participant(self, user):
        """Get the other participant in this conversation"""
        return self.participants.exclude(id=user.id).first()

    def update_chat_contacts(self, message_text, message_time, sender):
        """Update chat contacts for both participants"""
        other_participant = self.get_other_participant(sender)
        if other_participant:
            # Update sender's chat contact
            sender_contact, _ = ChatContact.objects.get_or_create(
                user=sender,
                contact=other_participant,
                project=self.project
            )
            sender_contact.update_last_message(message_text, message_time)
            
            # Update other participant's chat contact (increment unread)
            other_contact, _ = ChatContact.objects.get_or_create(
                user=other_participant,
                contact=sender,
                project=self.project
            )
            other_contact.update_last_message(message_text, message_time)
            other_contact.increment_unread_count()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="chat_messages"
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to=chat_upload_path, 
        null=True, 
        blank=True
    )
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
        return (f"Message({self.id}) by {self.sender_id} "
                f"in conv {self.conversation_id}")

    def save(self, *args, **kwargs):
        """Override save to update chat contacts"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.content:
            # Update chat contacts when a new message is created
            self.conversation.update_chat_contacts(
                self.content, 
                self.created_at, 
                self.sender
            )