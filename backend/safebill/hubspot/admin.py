from django.contrib import admin

# Register your models here.
from .models import HubSpotContactLink, HubSpotCompanyLink
admin.site.register(HubSpotContactLink)
admin.site.register(HubSpotCompanyLink)