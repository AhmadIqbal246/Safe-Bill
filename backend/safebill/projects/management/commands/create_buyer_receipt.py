from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from projects.models import Project, Quote, PaymentInstallment, Milestone
from payments.models import Payment
from accounts.models import BusinessDetail, BuyerModel
from decimal import Decimal
import random
import string
from datetime import datetime, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a buyer receipt for a specific buyer user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='hamza@gmail.com',
            help='Email of the buyer user',
        )
        parser.add_argument(
            '--project-name',
            type=str,
            default='Buyer Receipt Project',
            help='Name of the project',
        )
        parser.add_argument(
            '--total-amount',
            type=float,
            default=1000.0,
            help='Total project amount',
        )

    def generate_reference_number(self):
        """Generate a reference number in format QT-YYYY-XXXXXX"""
        year = datetime.now().year
        random_suffix = ''.join(random.choices(string.digits, k=6))
        return f"QT-{year}-{random_suffix}"

    def handle(self, *args, **options):
        buyer_email = options['email']
        project_name = options['project_name']
        total_amount = Decimal(str(options['total_amount']))

        self.stdout.write(f'Creating buyer receipt for: {buyer_email}')

        try:
            # Set environment to handle Unicode in Windows console
            import sys
            import io
            if sys.platform == 'win32':
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
            
            with transaction.atomic():
                # Get or find buyer user
                try:
                    buyer = User.objects.get(email=buyer_email)
                    if getattr(buyer, "role", None) not in ["buyer", "professional-buyer"]:
                        self.stdout.write(self.style.WARNING(f'User {buyer_email} is not a buyer. Setting role to buyer.'))
                        buyer.role = 'buyer'
                        buyer.save()
                    self.stdout.write(f'[OK] Found buyer user: {buyer_email}')
                except User.DoesNotExist:
                    buyer = User.objects.create(
                        email=buyer_email,
                        username=buyer_email.split('@')[0],
                        role='buyer',
                        is_active=True,
                    )
                    self.stdout.write(self.style.SUCCESS(f'[OK] Created buyer user: {buyer_email}'))

                # Get or find a seller user
                seller = User.objects.filter(role='seller').first()
                if seller:
                    seller_email = seller.email
                    self.stdout.write(f'[OK] Using existing seller user: {seller_email}')
                else:
                    # Create seller user with unique email
                    seller_email = 'seller@example.com'
                    try:
                        seller = User.objects.get(email=seller_email)
                        self.stdout.write(f'[OK] Found existing seller user: {seller_email}')
                    except User.DoesNotExist:
                        seller = User.objects.create(
                            email=seller_email,
                            username='seller_user',
                            role='seller',
                            is_active=True,
                        )
                        self.stdout.write(self.style.SUCCESS(f'[OK] Created seller user: {seller_email}'))

                # Ensure seller contact info and business details exist
                seller_default_company = "SafeBill Seller"
                seller_default_address = "123 Seller Street, 75001 Paris, France"
                seller_default_siret = "123 456 789 00010"
                seller_default_phone = "+33 1 23 45 67 89"

                if not seller.phone_number:
                    seller.phone_number = seller_default_phone
                    seller.save(update_fields=['phone_number'])
                    self.stdout.write(f'[OK] Set seller phone number to {seller_default_phone}')

                try:
                    existing_business_detail = seller.business_detail
                except BusinessDetail.DoesNotExist:
                    existing_business_detail = None

                BusinessDetail.objects.update_or_create(
                    user=seller,
                    defaults={
                        "company_name": (existing_business_detail.company_name if existing_business_detail else seller_default_company),
                        "siret_number": (existing_business_detail.siret_number if existing_business_detail else seller_default_siret),
                        "full_address": (existing_business_detail.full_address if existing_business_detail else seller_default_address),
                    },
                )
                self.stdout.write('[OK] Ensured seller business detail with address and SIRET')

                # Make sure buyer profile has an address for receipts
                buyer_default_address = "45 Buyer Avenue, 69000 Lyon, France"
                try:
                    existing_buyer_profile = buyer.buyer_profile
                except BuyerModel.DoesNotExist:
                    existing_buyer_profile = None

                BuyerModel.objects.update_or_create(
                    user=buyer,
                    defaults={
                        "first_name": existing_buyer_profile.first_name if existing_buyer_profile and existing_buyer_profile.first_name else (buyer.first_name or buyer.username or "Buyer"),
                        "last_name": existing_buyer_profile.last_name if existing_buyer_profile and existing_buyer_profile.last_name else (buyer.last_name or "Client"),
                        "address": existing_buyer_profile.address if existing_buyer_profile and existing_buyer_profile.address else buyer_default_address,
                    },
                )
                if not buyer.phone_number:
                    buyer.phone_number = "+33 6 12 34 56 78"
                    buyer.save(update_fields=['phone_number'])
                    self.stdout.write(f'[OK] Set buyer phone number to {buyer.phone_number}')

                # Create completed project (buyer is the client)
                # Set created_at to match the image (2025-11-14)
                project_created_at = timezone.now().replace(year=2025, month=11, day=14, hour=17, minute=32, second=59, microsecond=0)
                project = Project.objects.create(
                    user=seller,
                    client=buyer,
                    name=project_name,
                    client_email=buyer_email,
                    status='completed',
                    project_type='real_project',
                    vat_rate=Decimal('20.0'),
                    platform_fee_percentage=Decimal('10.0'),
                    created_at=project_created_at,
                )
                self.stdout.write(self.style.SUCCESS(f'[OK] Created project: {project.name} (ID: {project.id})'))

                # Generate reference number
                reference_number = self.generate_reference_number()
                # Ensure uniqueness
                while Quote.objects.filter(reference_number=reference_number).exists():
                    reference_number = self.generate_reference_number()

                # Create quote with a placeholder file
                placeholder_content = f"Quote for {project.name}\nReference: {reference_number}\nAmount: {total_amount}"
                quote_file = ContentFile(placeholder_content.encode('utf-8'))
                quote_file.name = f'quote_{reference_number}.txt'
                
                quote = Quote.objects.create(
                    project=project,
                    reference_number=reference_number,
                    file=quote_file
                )
                self.stdout.write(self.style.SUCCESS(f'[OK] Created quote with reference: {reference_number}'))

                # Create payment installments with specific amounts matching the receipt format
                # Based on the image: Quote Acceptance (€500), Project Start (€300), Project Completion (€200)
                installment_amounts = [Decimal('500.00'), Decimal('300.00'), Decimal('200.00')]
                steps = ['Step 1', 'Step 2', 'Step 3']
                
                installments = []
                for i, (step, amount) in enumerate(zip(steps, installment_amounts)):
                    installment = PaymentInstallment.objects.create(
                        project=project,
                        amount=amount,
                        step=step,
                        description=f'Payment installment for {step}'
                    )
                    installments.append(installment)
                    self.stdout.write(f'[OK] Created installment: {step} - {amount}')

                # Create milestones and link them to installments
                milestone_names = ['Step 1', 'Step 2', 'Step 3']
                milestone_descriptions = [
                    'Step 1 milestone completed',
                    'Step 2 milestone completed',
                    'Step 3 milestone completed'
                ]
                
                # Set completion dates to match the image format (2025-11-14 with specific times)
                completion_dates = [
                    timezone.now().replace(year=2025, month=11, day=14, hour=17, minute=45, second=3, microsecond=0),
                    timezone.now().replace(year=2025, month=11, day=14, hour=17, minute=51, second=35, microsecond=0),
                    timezone.now().replace(year=2025, month=11, day=14, hour=17, minute=51, second=50, microsecond=0),
                ]
                
                for i, (name, desc, installment, amount, comp_date) in enumerate(zip(milestone_names, milestone_descriptions, installments, installment_amounts, completion_dates)):
                    milestone = Milestone.objects.create(
                        project=project,
                        related_installment=installment,
                        name=name,
                        description=desc,
                        status='approved',
                        relative_payment=amount,
                        completion_date=comp_date,
                    )
                    self.stdout.write(f'[OK] Created milestone: {name} (Status: approved, Amount: {amount}, Date: {comp_date})')

                # Create payment record
                vat_rate = project.vat_rate
                platform_fee_pct = project.platform_fee_percentage
                
                # Calculate amounts
                vat_amount = total_amount * vat_rate / 100
                buyer_total = total_amount + vat_amount
                platform_fee = total_amount * platform_fee_pct / 100
                platform_fee_with_vat = platform_fee * (1 + vat_rate / 100)
                seller_net = buyer_total - platform_fee_with_vat

                payment = Payment.objects.create(
                    user=buyer,
                    project=project,
                    amount=buyer_total,
                    platform_fee_amount=platform_fee_with_vat,
                    buyer_total_amount=buyer_total,
                    seller_net_amount=seller_net,
                    status='paid',
                    stripe_payment_id=f'pi_test_{random.randint(100000, 999999)}',
                    webhook_response={},
                )
                self.stdout.write(self.style.SUCCESS(f'[OK] Created payment record (Status: paid)'))
                self.stdout.write(f'  - Total Amount: {total_amount}')
                self.stdout.write(f'  - VAT ({vat_rate}%): {vat_amount}')
                self.stdout.write(f'  - Buyer Total: {buyer_total}')
                self.stdout.write(f'  - Platform Fee: {platform_fee_with_vat}')
                self.stdout.write(f'  - Seller Net: {seller_net}')

                self.stdout.write(self.style.SUCCESS(
                    f'\n[OK] Successfully created buyer receipt for {buyer_email}'
                ))
                self.stdout.write(f'  Project ID: {project.id}')
                self.stdout.write(f'  Reference Number: {reference_number}')
                self.stdout.write(f'  Total Amount: {total_amount}')
                self.stdout.write(f'  Buyer Paid: {buyer_total}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Error creating receipt: {str(e)}'))
            # Don't raise - allow script to complete even if signals have encoding issues
            import traceback
            if 'UnicodeEncodeError' in str(type(e).__name__) or 'charmap' in str(e).lower():
                self.stdout.write(self.style.WARNING('[WARNING] Unicode encoding error in signals, but data may have been created. Check database.'))
            else:
                raise

