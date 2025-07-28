from rest_framework import generics, status
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import Feedback
from .serializers import FeedbackSerializer


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