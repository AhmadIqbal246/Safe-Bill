from rest_framework import generics, status
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import Feedback, QuoteRequest
from .serializers import FeedbackSerializer, QuoteRequestSerializer


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
            
            # Send quote request email to the professional
            send_mail(
                subject=instance.subject,
                message=f"From: {instance.from_email}\n\n{instance.body}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.to_email],
                fail_silently=True,
            )
            
            # Send confirmation email to the sender
            send_mail(
                subject="Quote Request Sent Successfully",
                message=(
                    f"Your quote request has been sent to the professional.\n\n"
                    f"Subject: {instance.subject}\n"
                    f"Professional ID: {instance.professional_id}\n\n"
                    f"We'll notify you when they respond."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.from_email],
                fail_silently=True,
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