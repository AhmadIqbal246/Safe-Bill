from rest_framework import serializers

from .models import Document


def validate_pdf(file):
    if file.content_type != 'application/pdf':
        raise serializers.ValidationError(
            'Only PDF files are allowed.'
        )
    if file.size > 7 * 1024 * 1024:
        raise serializers.ValidationError(
            'File size must be under 7 MB.'
        )


def validate_image(file):
    if file.content_type not in ['image/jpeg', 'image/png', 'image/tiff']:
        raise serializers.ValidationError(
            'Only JPG, PNG, or TIFF files are allowed.'
        )
    if file.size > 7 * 1024 * 1024:
        raise serializers.ValidationError(
            'File size must be under 7 MB.'
        )


def validate_id_document(file):
    """Validate ID document - accepts both PDF and image files"""
    allowed_types = [
        'application/pdf',
        'image/jpeg', 
        'image/png', 
        'image/tiff'
    ]
    if file.content_type not in allowed_types:
        raise serializers.ValidationError(
            'Only PDF, JPG, PNG, or TIFF files are allowed for ID '
            'documents.'
        )
    if file.size > 7 * 1024 * 1024:
        raise serializers.ValidationError(
            'File size must be under 7 MB.'
        )


class MultiDocumentUploadSerializer(serializers.Serializer):
    kbis = serializers.FileField(required=True, validators=[validate_pdf])
    pro_insurance = serializers.FileField(required=True, validators=[validate_pdf])
    insurance = serializers.FileField(required=True, validators=[validate_pdf])
    id = serializers.FileField(required=True, validators=[validate_id_document])
    rib = serializers.FileField(
        required=True, validators=[validate_pdf]
    )
    # Add more fields if you add more document types 


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'document_type', 'file', 'uploaded_at', 'is_verified'] 