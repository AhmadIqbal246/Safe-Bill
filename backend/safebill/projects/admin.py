from django.contrib import admin
from .models import Project, Quote, PaymentInstallment, Milestone

admin.site.register(Project)
admin.site.register(Quote)
admin.site.register(PaymentInstallment)
admin.site.register(Milestone)

# Register your models here.
