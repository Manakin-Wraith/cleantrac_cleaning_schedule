from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} ({self.department.name if self.department else 'No Department'})"

class CleaningItem(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('adhoc', 'Ad-hoc'), # Added for flexibility
        # Ensuring frontend options are covered if they differ
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
        ('as_needed', 'As Needed'),
    ]
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='cleaning_items')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES) # Max length updated
    equipment = models.TextField(blank=True, null=True)
    chemical = models.TextField(blank=True, null=True)
    method = models.TextField()
    default_assigned_staff = models.ManyToManyField(
        User, 
        blank=True, 
        related_name='default_cleaning_items',
        help_text="Default staff typically assigned to this cleaning item."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.department.name}) - {self.get_frequency_display()}"

class TaskInstance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('pending_review', 'Pending Review'),
        ('completed', 'Completed'),
        ('missed', 'Missed'), 
        ('requires_attention', 'Requires Attention'),
    ]

    cleaning_item = models.ForeignKey(CleaningItem, on_delete=models.CASCADE, related_name='task_instances')
    assigned_to = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    # Make department nullable temporarily for migration, ensure application logic sets it.
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='department_tasks', null=True, blank=True) 
    
    due_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True) # For specific start time on the due_date
    end_time = models.TimeField(null=True, blank=True)   # For specific end time on the due_date

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        time_str = f" at {self.start_time.strftime('%H:%M')}" if self.start_time else ""
        assignee_str = f" to {self.assigned_to.user.username}" if self.assigned_to else " (Unassigned)"
        return f"{self.cleaning_item.name} on {self.due_date}{time_str} - {self.get_status_display()}{assignee_str}"

    class Meta:
        ordering = ['due_date', 'start_time']
        verbose_name = "Task Instance"
        verbose_name_plural = "Task Instances"

class CompletionLog(models.Model):
    task_instance = models.ForeignKey(TaskInstance, on_delete=models.CASCADE, related_name='completion_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who marked the task as completed")
    completed_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Log for {self.task_instance} by {self.user.username if self.user else 'Unknown'} at {self.completed_at.strftime('%Y-%m-%d %H:%M')}"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=6, unique=True) # For a 6-digit code
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.id: # On creation
            # Generate a 6-digit token
            import uuid
            self.token = str(uuid.uuid4().int)[:6] # Simple way to get 6 digits; ensure uniqueness in practice
            # Set expiry time (e.g., 15 minutes from creation)
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(minutes=15) 
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Password reset token for {self.user.username}"

# To make UserProfile creation automatic when a User is created, we can use signals.
# This is optional but good practice.
# In core/signals.py (new file):
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.contrib.auth.models import User
# from .models import UserProfile
#
# @receiver(post_save, sender=User)
# def create_or_update_user_profile(sender, instance, created, **kwargs):
#     if created:
#         UserProfile.objects.create(user=instance)
#     # instance.profile.save() # If you have logic to update profile on user save

# Then in core/apps.py:
# from django.apps import AppConfig
#
# class CoreConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'core'
#
#     def ready(self): # new
#         import core.signals # new
