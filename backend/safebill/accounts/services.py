from django.db import transaction
from django.utils import timezone
from django.contrib.auth import authenticate
from datetime import timedelta
from .models import User, DeletedUser


class UserDeletionService:
    """Service for handling user account deletion with smart validation"""
    
    @staticmethod
    def can_delete_user(user):
        """Check if user can be deleted with smart validation"""
        
        # 1. HARD BLOCKS - Always prevent deletion
        if UserDeletionService._has_active_issues(user):
            return False, "Cannot delete account with active projects, payments, or disputes"
        
        # 2. SMART ALLOWS - Check recent transactions intelligently
        recent_status = UserDeletionService._check_recent_transactions(user)
        if not recent_status['can_delete']:
            return False, recent_status['reason']
        
        return True, "Account can be deleted"
    
    @staticmethod
    def _has_active_issues(user):
        """Check for active issues that always block deletion"""
        
        # Active projects (pending, in-progress, approved) - check both as seller and buyer
        from projects.models import Project
        seller_active_projects = user.projects.filter(
            status__in=['pending', 'payment_in_progress', 'approved', 'in_progress']
        ).exists()
        buyer_active_projects = Project.objects.filter(
            client=user,
            status__in=['pending', 'payment_in_progress', 'approved', 'in_progress']
        ).exists()
        active_projects = seller_active_projects or buyer_active_projects
        
        # Pending payments - check both as buyer and seller
        from payments.models import Payment
        buyer_pending_payments = Payment.objects.filter(
            user=user,
            status='pending'
        ).exists()
        seller_pending_payments = Payment.objects.filter(
            project__user=user,
            status='pending'
        ).exists()
        pending_payments = buyer_pending_payments or seller_pending_payments
        
        # Active disputes
        from disputes.models import Dispute
        initiator_disputes = Dispute.objects.filter(
            initiator=user,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        ).exists()
        respondent_disputes = Dispute.objects.filter(
            respondent=user,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        ).exists()
        active_disputes = initiator_disputes or respondent_disputes
        
        # Outstanding balances (if any) - only block if there are active projects
        # For completed projects, outstanding balance should not block deletion
        try:
            if hasattr(user, 'balance'):
                has_balance = user.balance.current_balance != 0
                # Only block deletion if there are active projects AND outstanding balance
                # If all projects are completed, balance doesn't matter
                balance_blocks_deletion = has_balance and active_projects
            else:
                has_balance = False
                balance_blocks_deletion = False
        except:
            has_balance = False
            balance_blocks_deletion = False
        
        # Debug logging
        print(f"DEBUG - User {user.id} deletion check:")
        print(f"  - Seller active projects: {seller_active_projects}")
        print(f"  - Buyer active projects: {buyer_active_projects}")
        print(f"  - Buyer pending payments: {buyer_pending_payments}")
        print(f"  - Seller pending payments: {seller_pending_payments}")
        print(f"  - Initiator disputes: {initiator_disputes}")
        print(f"  - Respondent disputes: {respondent_disputes}")
        print(f"  - Has balance: {has_balance}")
        print(f"  - Balance blocks deletion: {balance_blocks_deletion}")
        
        return active_projects or pending_payments or active_disputes or balance_blocks_deletion
    
    @staticmethod
    def _check_recent_transactions(user):
        """Smart checking of recent transactions"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Get recent payments - both as buyer and seller
        from payments.models import Payment
        recent_payments = Payment.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago
        ) | Payment.objects.filter(
            project__user=user,
            created_at__gte=thirty_days_ago
        )
        
        # Check each recent payment
        for payment in recent_payments:
            if payment.status == 'pending':
                return {
                    'can_delete': False,
                    'reason': 'Cannot delete with pending payments'
                }
            elif payment.status == 'failed':
                return {
                    'can_delete': False,
                    'reason': 'Cannot delete with failed payments'
                }
            # Allow completed payments for completed projects
            elif (payment.status == 'completed' and 
                  hasattr(payment, 'project') and 
                  payment.project.status == 'completed'):
                continue
        
        # Check for recent disputes - only block if they are still active
        from disputes.models import Dispute
        recent_active_disputes = Dispute.objects.filter(
            initiator=user,
            created_at__gte=thirty_days_ago,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        ) | Dispute.objects.filter(
            respondent=user,
            created_at__gte=thirty_days_ago,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        )
        if recent_active_disputes.exists():
            return {
                'can_delete': False,
                'reason': 'Cannot delete with recent active disputes'
            }
        
        return {'can_delete': True, 'reason': 'All recent transactions are completed'}
    
    @staticmethod
    def delete_user_account(user, reason=None, deletion_initiated_by='user'):
        """Delete user account and create tracking record"""
        
        # 1. Validate deletion eligibility
        can_delete, message = UserDeletionService.can_delete_user(user)
        if not can_delete:
            raise ValueError(message)
        
        with transaction.atomic():
            # 2. Create deleted user record BEFORE deletion
            deleted_user_record = UserDeletionService._create_deleted_user_record(
                user, reason, deletion_initiated_by
            )
            
            # 3. Delete related records in correct order
            UserDeletionService._delete_related_records(user)
            
            # 4. Delete user account
            user.delete()
            
            return deleted_user_record
    
    @staticmethod
    def _create_deleted_user_record(user, reason, deletion_initiated_by):
        """Create tracking record for deleted user"""
        
        # Calculate data retention period (7 years for compliance)
        data_retention_until = timezone.now() + timedelta(days=7*365)
        
        # Create deleted user record
        deleted_user = DeletedUser.objects.create(
            original_user_id=user.id,
            original_email=user.email,
            original_username=user.username,
            original_role=user.role,
            deletion_reason=reason,
            deletion_initiated_by=deletion_initiated_by,
            account_created_at=user.date_joined,
            last_login_at=user.last_login,
            was_email_verified=user.is_email_verified,
            onboarding_complete=user.onboarding_complete,
            data_retention_until=data_retention_until
        )
        
        return deleted_user
    
    @staticmethod
    def _delete_related_records(user):
        """Delete all related records in correct order to avoid foreign key constraints"""
        
        try:
            # 1. Notifications
            from notifications.models import Notification
            Notification.objects.filter(user=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete notifications: {e}")
        
        try:
            # 2. Business documents
            from bussiness_documents.models import Document
            Document.objects.filter(user=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete documents: {e}")
        
        try:
            # 3. Ratings (both given and received)
            from .models import SellerRating
            SellerRating.objects.filter(seller=user).delete()  # Ratings received
            SellerRating.objects.filter(buyer=user).delete()    # Ratings given
        except Exception as e:
            print(f"Warning: Could not delete ratings: {e}")
        
        try:
            # 4. Disputes (as initiator and respondent)
            from disputes.models import Dispute
            Dispute.objects.filter(initiator=user).delete()
            Dispute.objects.filter(respondent=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete disputes: {e}")
        
        try:
            # 5. Payments and financial records
            from payments.models import Payment, Payout, PayoutHold, Refund
            Payment.objects.filter(user=user).delete()
            Payment.objects.filter(project__user=user).delete()  # Payments for user's projects
            Payout.objects.filter(user=user).delete()
            PayoutHold.objects.filter(user=user).delete()
            Refund.objects.filter(user=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete payments: {e}")
        
        try:
            # 6. Stripe accounts
            from connect_stripe.models import StripeAccount, StripeIdentity
            StripeAccount.objects.filter(user=user).delete()
            StripeIdentity.objects.filter(user=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete Stripe accounts: {e}")
        
        try:
            # 7. HubSpot links
            from hubspot.models import HubSpotContactLink, HubSpotCompanyLink
            HubSpotContactLink.objects.filter(user=user).delete()
            HubSpotCompanyLink.objects.filter(business_detail__user=user).delete()
        except Exception as e:
            print(f"Warning: Could not delete HubSpot links: {e}")
        
        try:
            # 8. Business details and bank accounts
            if hasattr(user, 'business_detail'):
                user.business_detail.delete()
            if hasattr(user, 'bank_account'):
                user.bank_account.delete()
            if hasattr(user, 'buyer_profile'):
                user.buyer_profile.delete()
        except Exception as e:
            print(f"Warning: Could not delete business details: {e}")
        
        try:
            # 9. Projects (as seller)
            user.projects.all().delete()
            
            # 10. Client projects (as buyer)
            user.client_projects.all().delete()
        except Exception as e:
            print(f"Warning: Could not delete projects: {e}")
    
    @staticmethod
    def get_deletion_eligibility(user):
        """Get detailed deletion eligibility information"""
        can_delete, message = UserDeletionService.can_delete_user(user)
        
        # Get counts for detailed feedback - check both as seller and buyer
        from projects.models import Project
        seller_active_projects = user.projects.filter(
            status__in=['pending', 'payment_in_progress', 'approved', 'in_progress']
        ).count()
        buyer_active_projects = Project.objects.filter(
            client=user,
            status__in=['pending', 'payment_in_progress', 'approved', 'in_progress']
        ).count()
        active_projects = seller_active_projects + buyer_active_projects
        
        from payments.models import Payment
        pending_payments = Payment.objects.filter(
            user=user,
            status='pending'
        ).count() + Payment.objects.filter(
            project__user=user,
            status='pending'
        ).count()
        
        from disputes.models import Dispute
        active_disputes = Dispute.objects.filter(
            initiator=user,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        ).count() + Dispute.objects.filter(
            respondent=user,
            status__in=['submitted', 'in_progress', 'mediation_initiated', 'awaiting_decision']
        ).count()
        
        # Outstanding balance (if any)
        outstanding_balance = 0
        balance_blocks_deletion = False
        try:
            if hasattr(user, 'balance'):
                outstanding_balance = user.balance.current_balance
                # Only block deletion if there are active projects AND outstanding balance
                balance_blocks_deletion = outstanding_balance != 0 and active_projects > 0
        except:
            pass
        
        return {
            'can_delete': can_delete,
            'message': message,
            'active_projects': active_projects,
            'seller_active_projects': seller_active_projects,
            'buyer_active_projects': buyer_active_projects,
            'pending_payments': pending_payments,
            'active_disputes': active_disputes,
            'outstanding_balance': outstanding_balance,
            'balance_blocks_deletion': balance_blocks_deletion
        }
