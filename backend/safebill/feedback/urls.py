from django.urls import path
from .views import FeedbackCreateAPIView, QuoteRequestCreateAPIView, ContactMessageCreateAPIView

app_name = 'feedback'

urlpatterns = [
    path('submit/', FeedbackCreateAPIView.as_view(), name='feedback-create'),
    path('quote-request/', QuoteRequestCreateAPIView.as_view(), 
         name='quote-request-create'),
    path('contact/', ContactMessageCreateAPIView.as_view(), name='contact-create'),
]