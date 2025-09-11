from django.contrib import admin
from .models import Payment, Balance, Payout, PayoutHold, Refund

# Register your models here.
admin.site.register(Payment)
admin.site.register(Balance)
admin.site.register(Payout)
admin.site.register(PayoutHold)
admin.site.register(Refund)
