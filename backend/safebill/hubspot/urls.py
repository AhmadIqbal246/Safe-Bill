from django.urls import path
from .views import ContactSyncView

urlpatterns = [
    path("contacts/sync/", ContactSyncView.as_view(), name="hubspot-contact-sync"),
]

