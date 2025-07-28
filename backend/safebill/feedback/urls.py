from django.urls import path
from .views import FeedbackCreateAPIView

urlpatterns = [
    path('submit/', FeedbackCreateAPIView.as_view(), name='feedback-create'),
]