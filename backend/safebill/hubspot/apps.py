from django.apps import AppConfig


class HubspotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hubspot'
    def ready(self) -> None:
        # Load signals to auto-enqueue updates on status/mediator change
        from . import signals  # noqa: F401
        return None
