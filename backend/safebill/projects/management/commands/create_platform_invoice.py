from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from decimal import Decimal, ROUND_HALF_UP
import random
import string
from datetime import datetime, timedelta
import sys
import io

from projects.models import Project, Quote, PaymentInstallment, Milestone
from payments.models import Payment
from accounts.models import BusinessDetail, BuyerModel


User = get_user_model()


class Command(BaseCommand):
    help = "Create sample seller/platform receipt data for a given seller email"

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            required=True,
            help="Email of the seller user who should receive the platform invoice",
        )
        parser.add_argument(
            "--project-name",
            type=str,
            default="Platform Invoice Project",
            help="Name of the project to create",
        )
        parser.add_argument(
            "--total-amount",
            type=float,
            default=1000.0,
            help="Total amount (ex VAT) for the project/installments",
        )

    def generate_reference_number(self):
        year = datetime.now().year
        random_suffix = "".join(random.choices(string.digits, k=6))
        return f"QT-{year}-{random_suffix}"

    def handle(self, *args, **options):
        seller_email = options["email"]
        project_name = options["project_name"]
        total_amount = Decimal(str(options["total_amount"]))

        self.stdout.write(f"Creating platform invoice data for seller: {seller_email}")

        try:
            if sys.platform == "win32":
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

            with transaction.atomic():
                # Ensure seller user exists
                seller, created = User.objects.get_or_create(
                    email=seller_email,
                    defaults={
                        "username": seller_email.split("@")[0],
                        "role": "seller",
                        "is_active": True,
                    },
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"[OK] Created seller {seller_email}"))
                elif getattr(seller, "role", None) != "seller":
                    self.stdout.write(self.style.WARNING(f"[WARN] User {seller_email} was role {seller.role}, updating to seller"))
                    seller.role = "seller"
                    seller.save(update_fields=["role"])
                else:
                    self.stdout.write(f"[OK] Using existing seller {seller_email}")

                # Ensure seller contact info
                if not seller.phone_number:
                    seller.phone_number = "+33 1 23 45 67 89"
                    seller.save(update_fields=["phone_number"])
                    self.stdout.write("[OK] Set default seller phone number")

                BusinessDetail.objects.update_or_create(
                    user=seller,
                    defaults={
                        "company_name": "SafeBill Seller",
                        "siret_number": "123 456 789 00010",
                        "full_address": "123 Seller Street, 75001 Paris, France",
                    },
                )
                self.stdout.write("[OK] Ensured seller business details")

                # Ensure a buyer exists to attach to the project
                buyer_email = "demo-buyer@safebill.fr"
                buyer, created = User.objects.get_or_create(
                    email=buyer_email,
                    defaults={
                        "username": "demo_buyer",
                        "role": "buyer",
                        "is_active": True,
                    },
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"[OK] Created buyer {buyer_email}"))
                elif getattr(buyer, "role", None) not in ["buyer", "professional-buyer"]:
                    buyer.role = "buyer"
                    buyer.save(update_fields=["role"])
                    self.stdout.write(f"[OK] Updated {buyer_email} role to buyer")

                BuyerModel.objects.update_or_create(
                    user=buyer,
                    defaults={
                        "first_name": buyer.first_name or "Demo",
                        "last_name": buyer.last_name or "Client",
                        "address": "45 Buyer Avenue, 69000 Lyon, France",
                    },
                )

                if not buyer.phone_number:
                    buyer.phone_number = "+33 6 12 34 56 78"
                    buyer.save(update_fields=["phone_number"])

                # Create project
                project_created_at = timezone.now().replace(year=2025, month=11, day=14, hour=17, minute=45, second=0, microsecond=0)
                project = Project.objects.create(
                    user=seller,
                    client=buyer,
                    name=project_name,
                    client_email=buyer.email,
                    status="completed",
                    project_type="real_project",
                    vat_rate=Decimal("20.0"),
                    platform_fee_percentage=Decimal("10.0"),
                    created_at=project_created_at,
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Created project {project.id}"))

                # Quote
                reference_number = self.generate_reference_number()
                while Quote.objects.filter(reference_number=reference_number).exists():
                    reference_number = self.generate_reference_number()

                quote_file = ContentFile(f"Quote for {project.name}".encode("utf-8"))
                quote_file.name = f"quote_{reference_number}.txt"

                Quote.objects.create(
                    project=project,
                    reference_number=reference_number,
                    file=quote_file,
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Created quote {reference_number}"))

                # Installments
                steps = ["Quote Acceptance", "Project Start", "Project Completion"]
                share_percentages = [Decimal("0.5"), Decimal("0.3"), Decimal("0.2")]
                installment_amounts = [
                    (total_amount * share).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    for share in share_percentages
                ]
                # Adjust last installment to fix rounding drift
                drift = total_amount - sum(installment_amounts)
                installment_amounts[-1] = (installment_amounts[-1] + drift).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                installments = []
                for step, amount in zip(steps, installment_amounts):
                    inst = PaymentInstallment.objects.create(
                        project=project,
                        amount=amount,
                        step=step,
                        description=f"Installment for {step}",
                    )
                    installments.append(inst)

                # Milestones
                completion_dates = [
                    project_created_at,
                    project_created_at + timedelta(minutes=15),
                    project_created_at + timedelta(minutes=30),
                ]

                for name, inst, amount, comp_date in zip(steps, installments, installment_amounts, completion_dates):
                    Milestone.objects.create(
                        project=project,
                        related_installment=inst,
                        name=name,
                        description=f"{name} milestone completed",
                        status="approved",
                        relative_payment=amount,
                        completion_date=comp_date,
                    )

                # Payment
                vat_rate = project.vat_rate
                platform_pct = project.platform_fee_percentage
                vat_amount = total_amount * vat_rate / 100
                buyer_total = total_amount + vat_amount
                platform_fee = total_amount * platform_pct / 100
                platform_fee_with_vat = platform_fee * (1 + vat_rate / 100)
                seller_net = buyer_total - platform_fee_with_vat

                Payment.objects.create(
                    user=buyer,
                    project=project,
                    amount=buyer_total,
                    platform_fee_amount=platform_fee_with_vat,
                    buyer_total_amount=buyer_total,
                    seller_net_amount=seller_net,
                    status="paid",
                    stripe_payment_id=f"pi_platform_{random.randint(100000, 999999)}",
                    webhook_response={},
                )

                self.stdout.write(self.style.SUCCESS("[OK] Platform invoice data created successfully"))

        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"[ERROR] Failed to create platform invoice data: {exc}"))
            raise

