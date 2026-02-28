from rest_framework import serializers


class ContactSyncSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


