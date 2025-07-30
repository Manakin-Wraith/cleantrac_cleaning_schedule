"""Models supporting recurring task scheduling.

Separated into its own module so we can import it lazily from ``core.models``
without disturbing that large file and to keep concerns isolated.

NOTE: After adding this model you must run migrations (``python manage.py makemigrations``)
so Django recognises the new table.
"""

from datetime import timedelta, date

from django.conf import settings
from django.db import models
from django.utils import timezone

from .models import CleaningItem, Department, UserProfile, TaskInstance


class RecurringSchedule(models.Model):
    """Defines a repeating schedule for a cleaning task.

    When a manager creates a recurring task through the UI, an instance of this
    model is saved.  A background job (or on-save signal) can then expand the
    schedule into concrete ``TaskInstance`` rows for each occurrence.
    """

    RECURRENCE_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    ]

    cleaning_item = models.ForeignKey(
        CleaningItem,
        on_delete=models.CASCADE,
        related_name="recurring_schedules",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="recurring_schedules",
    )
    assigned_to = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurring_schedules",
    )

    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField(null=True, blank=True, help_text="Leave blank for no end date (infinite recurrence)")

    recurrence_type = models.CharField(max_length=10, choices=RECURRENCE_CHOICES)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_recurring_schedules",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Recurring Schedule"
        verbose_name_plural = "Recurring Schedules"

    def __str__(self):
        return (
            f"{self.cleaning_item.name} ({self.get_recurrence_type_display()}) "
            f"from {self.start_date.isoformat()}"
        )

    # ---------------------------------------------------------------------
    # Utility helpers
    # ---------------------------------------------------------------------

    def _next_date(self, current: date) -> date:
        """Return the next occurrence date after *current* for this schedule."""
        if self.recurrence_type == "daily":
            return current + timedelta(days=1)
        if self.recurrence_type == "weekly":
            return current + timedelta(weeks=1)
        if self.recurrence_type == "monthly":
            # crude month increment: add 30 days; acceptable for our use-case.
            return current + timedelta(days=30)
        raise ValueError("Unknown recurrence_type")

    def generate_instances(self, days_ahead: int = 30):
        """Create concrete TaskInstances up to *days_ahead* into the future.

        Called by a management command or Celery beat task.
        Avoids duplicating tasks that already exist.
        """
        target_end = timezone.localdate() + timedelta(days=days_ahead)
        current = self.start_date
        if current < timezone.localdate():
            current = timezone.localdate()
        while current <= target_end and (self.end_date is None or current <= self.end_date):
            # Check if a TaskInstance already exists for this date & schedule
            exists = TaskInstance.objects.filter(
                cleaning_item=self.cleaning_item,
                due_date=current,
                department=self.department,
                notes__contains="[RecurringSchedule:%d]" % self.id,
            ).exists()
            if not exists:
                TaskInstance.objects.create(
                    cleaning_item=self.cleaning_item,
                    department=self.department,
                    assigned_to=self.assigned_to,
                    due_date=current,
                    notes=(
                        f"Auto-generated from recurring schedule {self.id}. "
                        f"[RecurringSchedule:{self.id}]"
                    ),
                )
            current = self._next_date(current)
