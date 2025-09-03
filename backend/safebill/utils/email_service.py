"""
Centralized email service utility for SafeBill application.
Provides consistent email sending functionality with HTML templates.
"""

import logging
from typing import List, Optional, Dict, Any
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
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

            # Render HTML template
            html_content = render_to_string(f"emails/{template_name}.html", context)

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
                "X-Mailer": "SafeBill Email Service",
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = "Verify Your Email - SafeBill"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="email_verification",
            context=context,
        )

    @staticmethod
    def send_password_reset_email(
        user_email: str, user_name: str, reset_url: str, reset_code: str = None
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = "Reset Your Password - SafeBill"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="password_reset",
            context=context,
        )

    @staticmethod
    def send_welcome_email(
        user_email: str, user_name: str, user_type: str = "user"
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
        }

        subject = "Welcome to SafeBill!"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="welcome",
            context=context,
        )

    @staticmethod
    def send_notification_email(
        user_email: str,
        user_name: str,
        notification_title: str,
        notification_message: str,
        action_url: Optional[str] = None,
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = f"{notification_title} - SafeBill"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="notification",
            context=context,
        )

    @staticmethod
    def send_quote_chat_notification(
        seller_email: str,
        seller_name: str,
        buyer_name: str,
        buyer_email: str,
        project_name: str,
        message_preview: str,
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
        }

        subject = f"New Business Opportunity - Message from {buyer_name}"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[seller_email],
            template_name="quote_chat_notification",
            context=context,
        )

    @staticmethod
    def send_quote_request_email(
        professional_email: str,
        from_email: str,
        subject: str,
        body: str,
        professional_id: str,
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
        }

        return EmailService.send_email(
            subject=subject,
            recipient_list=[professional_email],
            template_name="quote_request",
            context=context,
        )

    @staticmethod
    def send_quote_request_confirmation(
        sender_email: str, subject: str, professional_id: str, to_email: str
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
        }

        subject = "Quote Request Sent Successfully"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[sender_email],
            template_name="quote_request_confirmation",
            context=context,
        )

    @staticmethod
    def send_project_invitation_email(
        client_email: str, project_name: str, invitation_url: str, invitation_token: str
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

        context = {
            "project_name": project_name,
            "invitation_url": invitation_url,
            "invitation_token": invitation_token,
            "frontend_url": frontend_url,
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = (
            f"You've been invited to join the '{project_name}' " f"project on SafeBill"
        )

        return EmailService.send_email(
            subject=subject,
            recipient_list=[client_email],
            template_name="project_invitation",
            context=context,
            fail_silently=True,  # Don't fail if email can't be sent
        )

    @staticmethod
    def send_client_payment_success_email(
        user_email: str,
        user_name: str,
        project_name: str,
        amount: str,
        dashboard_url: Optional[str] = None,
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = f"Payment Successful - {project_name}"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="payment_success_client",
            context=context,
        )

    @staticmethod
    def send_client_payment_failed_email(
        user_email: str,
        user_name: str,
        project_name: str,
        amount: str,
        retry_url: Optional[str] = None,
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
            "site_name": "SafeBill",
            "support_email": settings.DEFAULT_FROM_EMAIL,
        }

        subject = f"Payment Failed - {project_name}"

        return EmailService.send_email(
            subject=subject,
            recipient_list=[user_email],
            template_name="payment_failed_client",
            context=context,
        )
