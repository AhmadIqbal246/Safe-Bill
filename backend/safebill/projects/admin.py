from django.contrib import admin
from .models import Project, Quote, PaymentInstallment

admin.site.register(Project)
admin.site.register(Quote)
admin.site.register(PaymentInstallment)

# Register your models here.
