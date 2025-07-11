from django.urls import path
from .views import MultiDocumentUploadView

urlpatterns = [
    path('upload-multiple/', MultiDocumentUploadView.as_view(), name='upload-multiple'),
] 