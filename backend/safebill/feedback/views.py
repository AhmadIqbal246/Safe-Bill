from rest_framework import generics, status
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from utils.email_service import EmailService
from .models import Feedback, QuoteRequest, ContactMessage
from .serializers import FeedbackSerializer, QuoteRequestSerializer, ContactMessageSerializer


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
            
            # Send feedback to admin email
            send_mail(
                subject=f"New Feedback from {instance.email}",
                message=f"Email: {instance.email}\n\nFeedback:\n"
                        f"{instance.feedback}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=True,
            )
            
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

            # Notify admin via email (optional)
            try:
                send_mail(
                    subject=f"New Contact Message: {instance.subject}",
                    message=(
                        f"From: {instance.name} <{instance.email}>\n\n"
                        f"{instance.message}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.EMAIL_HOST_USER],
                    fail_silently=True,
                )
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
            
            # Send quote request email to the professional using new email service
            EmailService.send_quote_request_email(
                professional_email=instance.to_email,
                from_email=instance.from_email,
                subject=instance.subject,
                body=instance.body,
                professional_id=instance.professional_id
            )
            
            # Send confirmation email to the sender using new email service
            EmailService.send_quote_request_confirmation(
                sender_email=instance.from_email,
                subject=instance.subject,
                professional_id=instance.professional_id,
                to_email=instance.to_email
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