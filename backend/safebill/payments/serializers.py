from rest_framework import serializers
from .models import Payment, Balance, Payout, PayoutHold, PlatformFeeConfig
from projects.models import Project


class ProjectSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "status"]


class PaymentSerializer(serializers.ModelSerializer):
    project = ProjectSlimSerializer(read_only=True)
    currency = serializers.SerializerMethodField()
    platform_fee_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    stripe_fee_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    buyer_total_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    seller_net_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "currency",
            "status",
            "project",
            "stripe_payment_id",
            "platform_fee_amount",
            "stripe_fee_amount",
            "buyer_total_amount",
            "seller_net_amount",
            "created_at",
            "updated_at",
        ]

    def get_currency(self, obj):
        # Default currency for now (could be sourced from settings or project)
        return "EUR"


class BalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Balance
        fields = [
            "currency",
            "current_balance",
            "available_for_payout",
            "total_earnings",
            "total_spent",
            "held_in_escrow",
            "updated_at",
        ]


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            "id",
            "amount",
            "currency",
            "status",
            "stripe_transfer_id",
            "stripe_account_id",
            "created_at",
            "updated_at",
            "completed_at",
            "failure_reason",
        ]


class PayoutHoldSerializer(serializers.ModelSerializer):
    project = ProjectSlimSerializer(read_only=True)
    days_until_release = serializers.SerializerMethodField()

    class Meta:
        model = PayoutHold
        fields = [
            "id",
            "amount",
            "currency",
            "hold_until",
            "released",
            "created_at",
            "released_at",
            "project",
            "days_until_release",
        ]

    def get_days_until_release(self, obj):
        from django.utils import timezone

        delta = obj.hold_until - timezone.now()
        days = max(0, int(delta.total_seconds() // 86400))
        return days


class PlatformFeeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformFeeConfig
        fields = [
            "buyer_fee_pct",
            "seller_fee_pct",
        ]
