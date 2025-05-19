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
    ]
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='cleaning_items')
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    equipment = models.TextField(blank=True, null=True)
    chemical = models.TextField(blank=True, null=True)
    method = models.TextField()
    # default_assigned_staff can be complex due to department constraints, consider handling in logic or a simplified approach for now.
    # For simplicity, we might assign staff directly to TaskInstances.
    # If needed: default_assigned_staff = models.ManyToManyField(User, blank=True, related_name='default_cleaning_assignments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.department.name})"

class TaskInstance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('missed', 'Missed'), # Added for tasks not done by due date
    ]
    cleaning_item = models.ForeignKey(CleaningItem, on_delete=models.CASCADE, related_name='task_instances')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    # The department for a TaskInstance should ideally be derived from cleaning_item.department to ensure consistency.
    # department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='department_tasks') 
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    # supervisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_tasks', limit_choices_to={'profile__role': 'manager'})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def department(self):
        return self.cleaning_item.department

    def __str__(self):
        return f"{self.cleaning_item.name} - {self.due_date} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        # Basic overdue logic, can be enhanced with a scheduled task
        if self.status == 'pending' and self.due_date < timezone.now().date():
            self.status = 'overdue'
        super().save(*args, **kwargs)

class CompletionLog(models.Model):
    task_instance = models.ForeignKey(TaskInstance, on_delete=models.CASCADE, related_name='completion_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who marked the task as completed")
    completed_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Log for {self.task_instance} by {self.user.username if self.user else 'Unknown'} at {self.completed_at.strftime('%Y-%m-%d %H:%M')}"

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
