from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from projects.models import Project, Quote, PaymentInstallment, Milestone
from payments.models import Payment
from accounts.models import BusinessDetail
from decimal import Decimal
import random
import string
from datetime import datetime, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a seller invoice for a specific user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='7h1hwagq1z@mrotzis.com',
            help='Email of the seller user',
        )
        parser.add_argument(
            '--project-name',
            type=str,
            default='Sample Project for Invoice',
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
        seller_email = options['email']
        project_name = options['project_name']
        total_amount = Decimal(str(options['total_amount']))

        self.stdout.write(f'Creating seller invoice for: {seller_email}')

        try:
            # Set environment to handle Unicode in Windows console
            import sys
            import io
            if sys.platform == 'win32':
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
            
            with transaction.atomic():
                # Get or create seller user
                seller, created = User.objects.get_or_create(
                    email=seller_email,
                    defaults={
                        'username': seller_email.split('@')[0],
                        'role': 'seller',
                        'is_active': True,
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'[OK] Created seller user: {seller_email}'))
                else:
                    self.stdout.write(f'[OK] Found existing seller user: {seller_email}')

                # Update seller's company name to "Falcon Xoft"
                BusinessDetail.objects.update_or_create(
                    user=seller,
                    defaults={
                        'company_name': 'Falcon Xoft',
                        'siret_number': '123 456 789 00010',
                        'full_address': '123 Seller Street, 75001 Paris, France',
                    }
                )
                self.stdout.write(self.style.SUCCESS('[OK] Updated seller company name to: Falcon Xoft'))

                # Get or find an existing buyer user, or create with unique email
                # Try to find any existing buyer user first
                buyer = User.objects.filter(role='buyer').first()
                if buyer:
                    buyer_email = buyer.email
                    self.stdout.write(f'[OK] Using existing buyer user: {buyer_email}')
                else:
                    # Create buyer user with unique email based on seller email
                    buyer_email = seller_email.replace('@', '_buyer@')
                    try:
                        buyer = User.objects.get(email=buyer_email)
                        self.stdout.write(f'[OK] Found existing buyer user: {buyer_email}')
                    except User.DoesNotExist:
                        # Create buyer user - signals will fire but we'll handle encoding errors
                        try:
                            buyer = User(
                                email=buyer_email,
                                username=buyer_email.split('@')[0],
                                role='buyer',
                                is_active=True,
                            )
                            buyer.save()
                            self.stdout.write(self.style.SUCCESS(f'[OK] Created buyer user: {buyer_email}'))
                        except Exception as e:
                            # If creation fails due to signals, try to find any user as buyer
                            self.stdout.write(self.style.WARNING(f'Could not create buyer user: {e}'))
                            buyer = User.objects.filter(role__in=['buyer', 'professional-buyer']).first()
                            if not buyer:
                                # Last resort: create a simple buyer
                                buyer_email = f'buyer_{random.randint(1000, 9999)}@example.com'
                                buyer = User.objects.create(
                                    email=buyer_email,
                                    username=buyer_email.split('@')[0],
                                    role='buyer',
                                    is_active=True,
                                )
                                self.stdout.write(self.style.SUCCESS(f'[OK] Created buyer user with fallback email: {buyer_email}'))
                            else:
                                buyer_email = buyer.email
                                self.stdout.write(f'[OK] Using existing buyer: {buyer_email}')

                # Create completed project
                project = Project.objects.create(
                    user=seller,
                    client=buyer,
                    name=project_name,
                    client_email=buyer_email,
                    status='completed',
                    project_type='real_project',
                    vat_rate=Decimal('20.0'),
                    platform_fee_percentage=Decimal('10.0'),
                    created_at=timezone.now() - timedelta(days=5),
                )
                self.stdout.write(self.style.SUCCESS(f'[OK] Created project: {project.name} (ID: {project.id})'))

                # Generate reference number
                reference_number = self.generate_reference_number()
                # Ensure uniqueness
                while Quote.objects.filter(reference_number=reference_number).exists():
                    reference_number = self.generate_reference_number()

                # Create quote with a placeholder file
                # Create a simple text file as placeholder
                placeholder_content = f"Quote for {project.name}\nReference: {reference_number}\nAmount: €{total_amount}"
                quote_file = ContentFile(placeholder_content.encode('utf-8'))
                quote_file.name = f'quote_{reference_number}.txt'
                
                quote = Quote.objects.create(
                    project=project,
                    reference_number=reference_number,
                    file=quote_file
                )
                self.stdout.write(self.style.SUCCESS(f'[OK] Created quote with reference: {reference_number}'))

                # Create payment installments (split into 3 milestones)
                installment_amount = total_amount / 3
                steps = ['Initial Payment', 'Milestone Payment', 'Final Payment']
                
                installments = []
                for i, step in enumerate(steps):
                    installment = PaymentInstallment.objects.create(
                        project=project,
                        amount=installment_amount,
                        step=step,
                        description=f'Payment installment for {step}'
                    )
                    installments.append(installment)
                    self.stdout.write(f'[OK] Created installment: {step} - €{installment_amount}')

                # Create milestones and link them to installments
                milestone_names = ['Initial Milestone', 'Progress Milestone', 'Final Milestone']
                milestone_descriptions = [
                    'Initial project milestone completed',
                    'Progress milestone completed',
                    'Final project milestone completed'
                ]
                
                completion_date = timezone.now() - timedelta(days=1)
                
                for i, (name, desc, installment) in enumerate(zip(milestone_names, milestone_descriptions, installments)):
                    milestone = Milestone.objects.create(
                        project=project,
                        related_installment=installment,
                        name=name,
                        description=desc,
                        status='approved',
                        relative_payment=installment_amount,
                        completion_date=completion_date - timedelta(hours=i),
                    )
                    self.stdout.write(f'[OK] Created milestone: {name} (Status: approved)')

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
                self.stdout.write(f'  - Total Amount: €{total_amount}')
                self.stdout.write(f'  - VAT ({vat_rate}%): €{vat_amount}')
                self.stdout.write(f'  - Buyer Total: €{buyer_total}')
                self.stdout.write(f'  - Platform Fee: €{platform_fee_with_vat}')
                self.stdout.write(f'  - Seller Net: €{seller_net}')

                self.stdout.write(self.style.SUCCESS(
                    f'\n[OK] Successfully created seller invoice for {seller_email}'
                ))
                self.stdout.write(f'  Project ID: {project.id}')
                self.stdout.write(f'  Reference Number: {reference_number}')
                self.stdout.write(f'  Total Amount: €{total_amount}')
                self.stdout.write(f'  Seller Net Amount: €{seller_net}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[ERROR] Error creating invoice: {str(e)}'))
            # Don't raise - allow script to complete even if signals have encoding issues
            # The data should still be created in the database
            import traceback
            if 'UnicodeEncodeError' in str(type(e).__name__) or 'charmap' in str(e).lower():
                self.stdout.write(self.style.WARNING('[WARNING] Unicode encoding error in signals, but data may have been created. Check database.'))
            else:
                raise

