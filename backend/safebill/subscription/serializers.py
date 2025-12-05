from rest_framework import serializers
from .models import Subscription, SubscriptionInvoice
from decimal import Decimal


class SubscriptionInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for subscription invoices with complete seller information.
    """
    seller_name = serializers.CharField(source="user.username", read_only=True)
    seller_email = serializers.EmailField(source="user.email", read_only=True)
    seller_company = serializers.SerializerMethodField()
    seller_address = serializers.SerializerMethodField()
    seller_siret = serializers.SerializerMethodField()
    seller_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionInvoice
        fields = [
            "id", "amount",
            "billing_period_start", "billing_period_end", "status",
            "created_at",
            "seller_name", "seller_email", "seller_company",
            "seller_address", "seller_siret", "seller_phone"
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_seller_company(self, obj):
        """Get seller's company name from business detail"""
        try:
            if hasattr(obj.user, 'business_detail') and obj.user.business_detail:
                return obj.user.business_detail.company_name
            return None
        except Exception:
            return None
    
    def get_seller_address(self, obj):
        """Get seller's address from business detail"""
        try:
            if hasattr(obj.user, 'business_detail') and obj.user.business_detail:
                return obj.user.business_detail.full_address
            return None
        except Exception:
            return None
    
    def get_seller_siret(self, obj):
        """Get seller's SIRET number from business detail"""
        try:
            if hasattr(obj.user, 'business_detail') and obj.user.business_detail:
                return obj.user.business_detail.siret_number
            return None
        except Exception:
            return None
    
    def get_seller_phone(self, obj):
        """Get seller's phone number"""
        try:
            return getattr(obj.user, "phone_number", None)
        except Exception:
            return None
