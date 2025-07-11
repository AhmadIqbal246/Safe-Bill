from rest_framework import serializers
from .models import Document

class MultiDocumentUploadSerializer(serializers.Serializer):
    kbis = serializers.FileField(required=True)
    pro_insurance = serializers.FileField(required=True)
    insurance = serializers.FileField(required=True)
    id = serializers.FileField(required=True)
    rib = serializers.FileField(required=True)
    # Add more fields if you add more document types 