from rest_framework import serializers
from .models import Payment, Balance, Payout
from projects.models import Project


class ProjectSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "status"]


class PaymentSerializer(serializers.ModelSerializer):
    project = ProjectSlimSerializer(read_only=True)
    currency = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "currency",
            "status",
            "project",
            "stripe_payment_id",
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
