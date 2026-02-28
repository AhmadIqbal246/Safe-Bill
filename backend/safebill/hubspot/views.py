from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ContactSyncSerializer
from .tasks import sync_contact_task


class ContactSyncView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ContactSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        sync_contact_task.delay(user_id)
        return Response({"status": "accepted", "user_id": user_id})
