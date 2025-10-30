"""
Centralized email service utility for Safe Bill application.
Provides consistent email sending functionality with HTML templates.
"""

import logging
from typing import List, Optional, Dict, Any
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import translation
from django.contrib.staticfiles.storage import staticfiles_storage
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _get_logo_url() -> str:
        """Return absolute URL for logo used in emails.

        Resolution order:
        1) settings.SITE_LOGO_URL (absolute URL you can set in .env)
        2) Project static files: 'images/Safe_Bill_Logo_Bleu.png' (preferred for emails)
           If missing, fallback to 'images/Safe_Bill_Logo_Bleu.svg'

        Builds an absolute URL using SITE_URL (or FRONTEND_URL) + static path.
        """
        # If explicit absolute URL configured, use it
        configured = getattr(settings, "SITE_LOGO_URL", None)
        if configured:
            return configured

        # Try PNG first for email client compatibility, else SVG
        candidate_paths = [
            "images/Safe_Bill_Logo_Bleu.png",
            "images/Safe_Bill_Logo_Bleu.svg",
        ]
        for path in candidate_paths:
            try:
                static_path = staticfiles_storage.url(path)
                base = getattr(settings, "SITE_URL", None) or getattr(
                    settings, "FRONTEND_URL", ""
                )
                if not base:
                    # Cannot build absolute URL; return static path (best effort)
                    return static_path
                return urljoin(base.rstrip("/") + "/", static_path.lstrip("/"))
            except Exception:
                continue
        return ""
    """
    Centralized email service for sending various types of emails.
    """

    @staticmethod
    def send_email(
        subject: str,
        recipient_list: List[str],
        template_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None,
        fail_silently: bool = False,
        language: str = "fr",
    ) -> bool:
        """
        Send an HTML email using Django templates.

        Args:
            subject: Email subject line
            recipient_list: List of recipient email addresses
            template_name: Name of the HTML template (without .html extension)
            context: Context variables for the template
            from_email: Sender email address (defaults to
            settings.DEFAULT_FROM_EMAIL)
            fail_silently: Whether to fail silently on errors

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            if not from_email:
                from_email = settings.DEFAULT_FROM_EMAIL

            # Try localized template first: emails/{template_name}_{language}.html
            lang = (language or "en").split("-")[0].lower()
            template_candidates = [
                f"emails/{template_name}_{lang}.html",
                f"emails/{template_name}.html",
            ]

            # Render HTML template (first existing)
            last_error = None
            html_content = None
            for tmpl in template_candidates:
                try:
                    html_content = render_to_string(tmpl, context)
                    break
                except Exception as e:
                    last_error = e
                    continue
            if html_content is None:
                raise last_error or Exception("Email template not found")

            # Create plain text version by stripping HTML tags
            text_content = strip_tags(html_content)

            # Create email message
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=recipient_list,
            )

            # Attach HTML version with proper MIME type
            msg.attach_alternative(html_content, "text/html; charset=UTF-8")

            # Set additional headers for better email client compatibility
            msg.extra_headers = {
                "X-Mailer": "Safe Bill Email Service",
                "X-Priority": "3",
                "X-MSMail-Priority": "Normal",
            }

            # Send email
            msg.send(fail_silently=fail_silently)

            logger.info(
                f"Email sent successfully to {recipient_list} "
                f"with subject: {subject}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient_list}: {str(e)}")
            if not fail_silently:
                raise
            return False

    @staticmethod
    def send_verification_email(
        user_email: str,
        user_name: str,
        verification_url: str,
        user_type: str = "user",
        verification_code: str = None,
        language: str = 'fr',
    ) -> bool:
        """
        Send email verification email.

        Args:
            user_email: Recipient email address
            user_name: Recipient name
            verification_url: Email verification URL
            user_type: Type of user (buyer, seller, etc.)
            verification_code: Optional verification code for manual entry

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "user_name": user_name,
            "verification_url": verification_url,
            "user_type": user_type,
            "verification_code": verification_code,
            "frontend_verification_url": (f"{settings.FRONTEND_URL}email-verification"),
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Verify Your Email - Safe Bill")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="email_verification",
            context=context,
            language=language,
        )

    @staticmethod
    def send_password_reset_email(
        user_email: str, user_name: str, reset_url: str, reset_code: str = None, language: str = 'fr'
    ) -> bool:
        """
        Send password reset email.

        Args:
            user_email: Recipient email address
            user_name: Recipient name
            reset_url: Password reset URL
            reset_code: Optional reset code for manual entry

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "user_name": user_name,
            "reset_url": reset_url,
            "reset_code": reset_code,
            "frontend_reset_url": (f"{settings.FRONTEND_URL}reset-password"),
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Reset Your Password - Safe Bill")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="password_reset",
            context=context,
            language=language,
        )

    @staticmethod
    def send_welcome_email(
        user_email: str, user_name: str, user_type: str = "user", language: str = 'fr'
    ) -> bool:
        """
        Send welcome email after successful registration.

        Args:
            user_email: Recipient email address
            user_name: Recipient name
            user_type: Type of user (buyer, seller, etc.)

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "user_name": user_name,
            "user_type": user_type,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Welcome to Safe Bill!")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="welcome",
            context=context,
            language=language,
        )

    @staticmethod
    def send_notification_email(
        user_email: str,
        user_name: str,
        notification_title: str,
        notification_message: str,
        action_url: Optional[str] = None,
        language: str = 'fr',
    ) -> bool:
        """
        Send general notification email.

        Args:
            user_email: Recipient email address
            user_name: Recipient name
            notification_title: Title of the notification
            notification_message: Message content
            action_url: Optional URL for action button

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "user_name": user_name,
            "notification_title": notification_title,
            "notification_message": notification_message,
            "action_url": action_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        subject = f"{notification_title} - Safe Bill"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="notification",
            context=context,
            language=language,
        )

    @staticmethod
    def send_dispute_created_email(
        seller_email: str,
        seller_name: str,
        project_name: str,
        dispute_id: str,
        language: str = "fr",
        dashboard_url: Optional[str] = None,
    ) -> bool:
        """
        Send localized email to the seller when a dispute is created.

        Args:
            seller_email: Seller's email address
            seller_name: Seller's name
            project_name: Project name
            dispute_id: Dispute reference id
            language: Preferred language code ('fr' | 'en')
            dashboard_url: Optional URL to view disputes
        """
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}seller-dashboard"

        with translation.override((language or "fr").split(",")[0][:2]):
            notification_title = translation.gettext(
                "New dispute opened - {project_name}"
            ).format(project_name=project_name)
            notification_message = translation.gettext(
                "A dispute ({dispute_id}) has been opened for project '{project_name}'."
            ).format(dispute_id=dispute_id, project_name=project_name)

            context = {
                "user_name": seller_name,
                "notification_title": notification_title,
                "notification_message": notification_message,
                "action_url": dashboard_url,
                "site_name": "Safe Bill",
                "support_email": settings.DEFAULT_FROM_EMAIL,
                "logo_url": EmailService._get_logo_url(),
            }

            return EmailService.send_email(
                subject=notification_title,
                recipient_list=[seller_email],
                template_name="notification",
                context=context,
                language=language,
            )

    @staticmethod
    def send_quote_chat_notification(
        seller_email: str,
        seller_name: str,
        buyer_name: str,
        buyer_email: str,
        project_name: str,
        message_preview: str,
        language: str = 'fr',
    ) -> bool:
        """
        Send email notification to seller for new quote chat message.

        Args:
            seller_email: Seller's email address
            seller_name: Seller's name
            buyer_name: Buyer's name
            buyer_email: Buyer's email address
            project_name: Name of the project
            message_preview: Preview of the message content

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "seller_name": seller_name,
            "buyer_name": buyer_name,
            "buyer_email": buyer_email,
            "project_name": project_name,
            "message_preview": message_preview,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("New Business Opportunity - Message from {buyer_name}").format(buyer_name=buyer_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[seller_email],
            template_name="quote_chat_notification",
            context=context,
            language=language,
        )

    @staticmethod
    def send_milestone_approval_request_email(
        user_email: str,
        user_name: str,
        project_name: str,
        milestone_name: str,
        amount: str,
        dashboard_url: Optional[str] = None,
        language: str = 'fr',
    ) -> bool:
        """
        Notify the buyer that the seller has requested approval for a milestone.
        """
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/buyer-dashboard"

        context = {
            "user_name": user_name,
            "project_name": project_name,
            "milestone_name": milestone_name,
            "amount": amount,
            "dashboard_url": dashboard_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        with translation.override(language):
            subject = translation.gettext("Milestone Approval Requested - {project_name}").format(project_name=project_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="milestone_approval_request",
            context=context,
            language=language,
        )

    @staticmethod
    def send_quote_request_email(
        professional_email: str,
        from_email: str,
        subject: str,
        body: str,
        professional_id: str,
        language: str = 'fr',
    ) -> bool:
        """
        Send quote request email to professional.

        Args:
            professional_email: Professional's email address
            from_email: Sender's email address
            subject: Email subject
            body: Email body content
            professional_id: Professional's ID

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "from_email": from_email,
            "subject": subject,
            "body": body,
            "professional_id": professional_id,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "logo_url": EmailService._get_logo_url(),
        }

        return EmailService.send_email(
            subject=subject,
            recipient_list=[professional_email],
            template_name="quote_request",
            context=context,
            language=language,
        )

    @staticmethod
    def send_quote_request_confirmation(
        sender_email: str, subject: str, professional_id: str, to_email: str, language: str = 'fr'
    ) -> bool:
        """
        Send confirmation email to quote request sender.

        Args:
            sender_email: Sender's email address
            subject: Original email subject
            professional_id: Professional's ID
            to_email: Professional's email address

        Returns:
            bool: True if email was sent successfully
        """
        context = {
            "subject": subject,
            "professional_id": professional_id,
            "to_email": to_email,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Quote Request Sent Successfully")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[sender_email],
            template_name="quote_request_confirmation",
            context=context,
            language=language,
        )

    @staticmethod
    def send_callback_request_confirmation(
        user_email: str,
        first_name: str,
        language: str = 'fr',
    ) -> bool:
        """
        Send confirmation email to a user who submitted a callback request.
        """
        contact_url = f"{settings.FRONTEND_URL}contact-us"

        context = {
            "first_name": first_name,
            "contact_url": contact_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Localize subject
        with translation.override(language):
            subject = translation.gettext("We received your callback request")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="Lead Nuturing Emails/callback_request_confirmation",
            context=context,
            language=language,
        )

    @staticmethod
    def send_project_invitation_email(
        client_email: str,
        project_name: str,
        invitation_url: str,
        invitation_token: str,
        language: str = "fr",
    ) -> bool:
        """
        Send project invitation email to client.

        Args:
            client_email: Client's email address
            project_name: Name of the project
            invitation_url: Full invitation URL
            invitation_token: Invitation token for manual entry

        Returns:
            bool: True if email was sent successfully
        """
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        print(language)
        context = {
            "project_name": project_name,
            "invitation_url": invitation_url,
            "invitation_token": invitation_token,
            "frontend_url": frontend_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("You've been invited to join the '{project_name}' project on Safe Bill").format(project_name=project_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[client_email],
            template_name="project_invitation",
            context=context,
            fail_silently=True,  # Don't fail if email can't be sent
            language=language,
        )

    @staticmethod
    def send_client_payment_success_email(
        user_email: str,
        user_name: str,
        project_name: str,
        amount: str,
        dashboard_url: Optional[str] = None,
        language: str = 'fr',
    ) -> bool:
        """
        Send payment success email to client.
        """
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/buyer-dashboard"

        context = {
            "user_name": user_name,
            "project_name": project_name,
            "amount": amount,
            "dashboard_url": dashboard_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Payment Successful - {project_name}").format(project_name=project_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="payment_success_client",
            context=context,
            language=language,
        )

    @staticmethod
    def send_seller_payment_success_email(
        user_email: str,
        user_name: str,
        project_name: str,
        amount: str,
        dashboard_url: Optional[str] = None,
        language: str = 'fr',
    ) -> bool:
        """
        Notify the seller that the buyer has credited the payment so the project can start.
        """
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/seller-dashboard"

        context = {
            "user_name": user_name,
            "project_name": project_name,
            "amount": amount,
            "dashboard_url": dashboard_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        with translation.override(language):
            subject = translation.gettext("Client Payment Received - {project_name}").format(project_name=project_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="payment_success_seller",
            context=context,
            language=language,
        )

    @staticmethod
    def send_client_payment_failed_email(
        user_email: str,
        user_name: str,
        project_name: str,
        amount: str,
        retry_url: Optional[str] = None,
        language: str = 'fr',
    ) -> bool:
        """
        Send payment failed email to client.
        """
        if not retry_url:
            retry_url = f"{settings.FRONTEND_URL}/buyer-dashboard"

        context = {
            "user_name": user_name,
            "project_name": project_name,
            "amount": amount,
            "retry_url": retry_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        # Use Django's translation system
        with translation.override(language):
            subject = translation.gettext("Payment Failed - {project_name}").format(project_name=project_name)

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="payment_failed_client",
            context=context,
            language=language,
        )
# Sending email to that user who is not involvced in any project
    @staticmethod
    def send_no_project_nurture_email(
        user_email: str,
        first_name: str,
        step: str,
        language: str = 'fr',
    ) -> bool:
        """Send lead nurturing email to users with no projects (day7/day14/day30)."""
        # Choose CTA based on common flows
        # Sellers: project creation; Buyers: find professionals; generic dashboard/home as fallback
        login_url = f"{settings.FRONTEND_URL}login"
        find_professionals_url = f"{settings.FRONTEND_URL}find-professionals"
        dashboard_url = f"{settings.FRONTEND_URL}dashboard"

        context = {
            "first_name": first_name,
            "login_url": login_url,
            "find_professionals_url": find_professionals_url,
            "dashboard_url": dashboard_url,
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        with translation.override(language):
            if step == 'day14':
                subject = translation.gettext("Explore what you can do with Safe Bill")
                template = "Lead Nuturing Emails/No Project Emails Nuturing/no_project_day14"
            elif step == 'day30':
                subject = translation.gettext("We’re here to help you get started")
                template = "Lead Nuturing Emails/No Project Emails Nuturing/no_project_day30"
            else:
                subject = translation.gettext("Get started on Safe Bill today")
                template = "Lead Nuturing Emails/No Project Emails Nuturing/no_project_day7"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name=template,
            context=context,
            language=language,
        )

    @staticmethod
    def send_reengage_login_email(
        user_email: str,
        first_name: str,
        language: str = 'fr',
    ) -> bool:
        """Send a one-time re-login reminder email after inactivity."""
        context = {
            "first_name": first_name,
            "login_url": f"{settings.FRONTEND_URL}login",
            "site_name": "Safe Bill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "logo_url": EmailService._get_logo_url(),
        }

        with translation.override(language):
            subject = translation.gettext("We miss you at Safe Bill - log in to continue")

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="Lead Nuturing Emails/Relogin emails/reengage_login_day10",
            context=context,
            language=language,
        )
