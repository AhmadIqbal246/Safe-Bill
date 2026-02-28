from django.urls import path
from .views import MultiDocumentUploadView, UserDocumentListView
 
urlpatterns = [
    path('upload-multiple/', MultiDocumentUploadView.as_view(), name='upload-multiple'),
    path('my-documents/', UserDocumentListView.as_view(), name='my-documents'),
] 