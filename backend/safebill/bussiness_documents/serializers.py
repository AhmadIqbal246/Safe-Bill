from rest_framework import serializers


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


class MultiDocumentUploadSerializer(serializers.Serializer):
    kbis = serializers.FileField(required=True, validators=[validate_pdf])
    pro_insurance = serializers.FileField(required=True, validators=[validate_pdf])
    insurance = serializers.FileField(required=True, validators=[validate_pdf])
    id = serializers.FileField(required=True, validators=[validate_image])
    rib = serializers.FileField(
        required=True, validators=[validate_pdf]
    )
    # Add more fields if you add more document types 