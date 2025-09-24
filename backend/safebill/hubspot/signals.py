import threading
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db import transaction

from disputes.models import Dispute
from .tasks import update_dispute_ticket_task


_local = threading.local()


@receiver(pre_save, sender=Dispute)
def _capture_dispute_previous_state(sender, instance: Dispute, **kwargs):
    if not instance.pk:
        _local.prev = {"status": None, "mediator_id": None}
        return
    try:
        prev = Dispute.objects.only("status", "assigned_mediator_id").get(pk=instance.pk)
        _local.prev = {
            "status": prev.status,
            "mediator_id": prev.assigned_mediator_id,
        }
    except Dispute.DoesNotExist:
        _local.prev = {"status": None, "mediator_id": None}


@receiver(post_save, sender=Dispute)
def _enqueue_ticket_update_on_change(sender, instance: Dispute, created: bool, **kwargs):
    # Fire only on updates when status or mediator changed
    prev = getattr(_local, "prev", {"status": None, "mediator_id": None})
    status_changed = prev.get("status") is not None and prev.get("status") != instance.status
    mediator_changed = prev.get("mediator_id") != instance.assigned_mediator_id

    if created or not (status_changed or mediator_changed):
        return

    def _enqueue():
        try:
            update_dispute_ticket_task.delay(instance.id)
        except Exception:
            pass

    # Ensure the job enqueues after commit to avoid race conditions
    try:
        transaction.on_commit(_enqueue)
    except Exception:
        _enqueue()
