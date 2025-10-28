from rest_framework import generics, status
from rest_framework.response import Response
from .models import Feedback, QuoteRequest, ContactMessage, CallbackRequest
from hubspot.tasks import (
    create_feedback_task,
    create_contact_message_task,
)
from .serializers import (
    FeedbackSerializer,
    QuoteRequestSerializer,
    ContactMessageSerializer,
    CallbackRequestSerializer,
)
from .tasks import (
    send_feedback_admin_notification_task,
    send_contact_admin_notification_task,
    send_quote_request_email_task,
    send_quote_request_confirmation_email_task,
)
from hubspot.sync_utils import safe_hubspot_sync
from hubspot.tasks import create_lead_from_callback_task


class FeedbackCreateAPIView(generics.CreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'detail': 'Validation failed',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instance = serializer.save()

            # Send feedback to admin email asynchronously
            send_feedback_admin_notification_task.delay(
                user_email=instance.email,
                feedback_text=instance.feedback,
            )

            # Queue for HubSpot sync (non-critical data)
            try:
                from hubspot.sync_utils import queue_feedback_sync
                queue_feedback_sync(instance, priority='normal')
            except Exception:
                pass

            return Response(
                {
                    'detail': 'Feedback submitted successfully',
                    'id': instance.id
                },
                status=status.HTTP_201_CREATED
            )

        except Exception:
            return Response(
                {
                    'detail': 'Failed to submit feedback. Please try again.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CallbackRequestCreateAPIView(generics.CreateAPIView):
    queryset = CallbackRequest.objects.all()
    serializer_class = CallbackRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'detail': 'Validation failed',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Persist request
            instance = serializer.save()

            # Queue HubSpot Lead creation safely (no blocking)
            try:
                safe_hubspot_sync(
                    create_lead_from_callback_task,
                    "Create Lead from Callback",
                    instance.id,
                    use_transaction_commit=True,
                )
            except Exception:
                # Non-blocking: we don't fail the API if queueing fails
                pass

            return Response(
                {
                    'detail': 'Callback request submitted successfully',
                    'id': instance.id
                },
                status=status.HTTP_201_CREATED
            )

        except Exception:
            return Response(
                {
                    'detail': 'Failed to submit callback request. Please try again.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ContactMessageCreateAPIView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'detail': 'Validation failed',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instance = serializer.save()

            # Notify admin via email asynchronously
            send_contact_admin_notification_task.delay(
                name=instance.name,
                email=instance.email,
                subject=instance.subject,
                message=instance.message,
            )

            # Queue for HubSpot sync (non-critical data)
            try:
                from hubspot.sync_utils import queue_contact_message_sync
                queue_contact_message_sync(instance, priority='normal')
            except Exception:
                pass

            return Response(
                {
                    'detail': 'Message sent successfully',
                    'id': instance.id
                },
                status=status.HTTP_201_CREATED
            )

        except Exception:
            return Response(
                {'detail': 'Failed to send message. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuoteRequestCreateAPIView(generics.CreateAPIView):
    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'detail': 'Validation failed',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instance = serializer.save()

            # Extract language from request headers
            preferred_lang = (
                request.headers.get("X-User-Language") or
                request.META.get("HTTP_ACCEPT_LANGUAGE", "en")
            )
            language = (
                preferred_lang.split(",")[0][:2] if preferred_lang else "en"
            )

            # Send quote request email to the professional asynchronously
            send_quote_request_email_task.delay(
                professional_email=instance.to_email,
                from_email=instance.from_email,
                subject=instance.subject,
                body=instance.body,
                professional_id=instance.professional_id,
                language=language
            )

            # Send confirmation email to the sender asynchronously
            send_quote_request_confirmation_email_task.delay(
                sender_email=instance.from_email,
                subject=instance.subject,
                professional_id=instance.professional_id,
                to_email=instance.to_email,
                language=language
            )

            return Response(
                {
                    'detail': 'Quote request sent successfully',
                    'id': instance.id
                },
                status=status.HTTP_201_CREATED
            )

        except Exception:
            return Response(
                {
                    'detail': 'Failed to send quote request. Please try again.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )