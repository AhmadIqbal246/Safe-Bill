from django.contrib import admin
from .models import User, BusinessDetail, BankAccount, BuyerModel, SellerRating , DeletedUser

# Register your models here.
admin.site.register(User)
admin.site.register(BusinessDetail)
admin.site.register(BankAccount)
admin.site.register(BuyerModel)
admin.site.register(SellerRating)
admin.site.register(DeletedUser)