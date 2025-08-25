from django.urls import path
from .views import FeedbackCreateAPIView, QuoteRequestCreateAPIView

app_name = 'feedback'

urlpatterns = [
    path('create/', FeedbackCreateAPIView.as_view(), name='feedback-create'),
    path('quote-request/', QuoteRequestCreateAPIView.as_view(), 
         name='quote-request-create'),
]