"""Models supporting recurring task scheduling.

Separated into its own module so we can import it lazily from ``core.models``
without disturbing that large file and to keep concerns isolated.

NOTE: After adding this model you must run migrations (``python manage.py makemigrations``)
so Django recognises the new table.
"""

from datetime import timedelta, date

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
import logging

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
        Uses proper transaction handling to prevent duplicate key violations.
        """
        logger = logging.getLogger(__name__)
        
        # DEBUG: Add detailed logging
        logger.info(f"[DEBUG] generate_instances called for schedule {self.id}")
        logger.info(f"[DEBUG] start_date: {self.start_date}")
        logger.info(f"[DEBUG] end_date: {self.end_date}")
        logger.info(f"[DEBUG] recurrence_type: {self.recurrence_type}")
        logger.info(f"[DEBUG] days_ahead: {days_ahead}")
        logger.info(f"[DEBUG] timezone.localdate(): {timezone.localdate()}")
        
        target_end = timezone.localdate() + timedelta(days=days_ahead)
        logger.info(f"[DEBUG] target_end: {target_end}")
        
        current = self.start_date
        logger.info(f"[DEBUG] initial current: {current}")
        
        if current < timezone.localdate():
            current = timezone.localdate()
            logger.info(f"[DEBUG] adjusted current to today: {current}")
        
        created_count = 0
        logger.info(f"[DEBUG] Starting while loop. current <= target_end: {current <= target_end}")
        logger.info(f"[DEBUG] end_date condition: {self.end_date is None or current <= self.end_date}")
        
        while current <= target_end and (self.end_date is None or current <= self.end_date):
            logger.info(f"[DEBUG] Processing date: {current}")
            try:
                with transaction.atomic():
                    # Check if a TaskInstance already exists for this date & schedule
                    exists = TaskInstance.objects.filter(
                        cleaning_item=self.cleaning_item,
                        due_date=current,
                        department=self.department,
                        notes__contains="[RecurringSchedule:%d]" % self.id,
                    ).exists()
                    
                    if not exists:
                        # Use get_or_create to handle race conditions and duplicate prevention
                        task_instance, created = TaskInstance.objects.get_or_create(
                            cleaning_item=self.cleaning_item,
                            due_date=current,
                            department=self.department,
                            assigned_to=self.assigned_to,
                            defaults={
                                'notes': (
                                    f"Auto-generated from recurring schedule {self.id}. "
                                    f"[RecurringSchedule:{self.id}]"
                                ),
                                'status': 'pending',  # Explicitly set status
                            }
                        )
                        if created:
                            created_count += 1
                            logger.info(f"Created TaskInstance {task_instance.id} for {current}")
                        else:
                            logger.debug(f"TaskInstance already exists for {current}")
                            
            except Exception as e:
                logger.error(f"Error creating TaskInstance for {current}: {str(e)}")
                # Continue with next date instead of failing completely
                pass
                
            current = self._next_date(current)
        
        logger.info(f"Generated {created_count} task instances for recurring schedule {self.id}")
        return created_count
