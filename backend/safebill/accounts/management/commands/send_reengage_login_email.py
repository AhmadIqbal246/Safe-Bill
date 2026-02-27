from django.core.management.base import BaseCommand, CommandParser
from utils.email_service import EmailService


class Command(BaseCommand):
    help = "Send the 'reengage login' day10 email (French) to a target email."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--to",
            dest="to_email",
            required=True,
            help="Recipient email address (e.g., ahmadiqbalhsp@gmail.com)",
        )
        parser.add_argument(
            "--first-name",
            dest="first_name",
            default="",
            help="Optional recipient first name for personalization",
        )

    def handle(self, *args, **options):
        to_email = options["to_email"]
        first_name = options.get("first_name") or "there"

        ok = EmailService.send_reengage_login_email(
            user_email=to_email,
            first_name=first_name,
            language="fr",
        )

        if ok:
            self.stdout.write(self.style.SUCCESS("reengage_login_day10: sent"))
        else:
            self.stdout.write(self.style.ERROR("reengage_login_day10: failed"))
            raise SystemExit(1)


