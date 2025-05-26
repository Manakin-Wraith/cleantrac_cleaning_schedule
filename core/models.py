from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

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

# Thermometer Verification System Models

class AreaUnit(models.Model):
    """Represents a specific area or unit where temperature is measured"""
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='area_units')
    description = models.TextField(blank=True, null=True)
    target_temperature_min = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    target_temperature_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.department.name})"

class Thermometer(models.Model):
    """Represents a physical thermometer used for temperature measurements"""
    STATUS_CHOICES = [
        ('verified', 'Verified'),
        ('needs_verification', 'Needs Verification'),
        ('out_of_service', 'Out of Service'),
    ]
    
    serial_number = models.CharField(max_length=100, unique=True)
    model_identifier = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='thermometers')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='needs_verification')
    last_verification_date = models.DateField(null=True, blank=True)
    verification_expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.serial_number} ({self.model_identifier}) - {self.get_status_display()}"
    
    def is_verified(self):
        """Check if thermometer is verified and not expired"""
        if self.status != 'verified':
            return False
        if not self.verification_expiry_date:
            return True
        return self.verification_expiry_date >= timezone.now().date()
    
    def days_until_expiry(self):
        """Return days until verification expires, or None if no expiry or already expired"""
        if not self.verification_expiry_date or not self.is_verified():
            return None
        delta = self.verification_expiry_date - timezone.now().date()
        return delta.days if delta.days > 0 else 0

class ThermometerVerificationRecord(models.Model):
    """Records each verification event for a thermometer"""
    thermometer = models.ForeignKey(Thermometer, on_delete=models.CASCADE, related_name='verification_records')
    date_verified = models.DateField()
    calibrated_instrument_no = models.CharField(max_length=100)
    reading_after_verification = models.DecimalField(max_digits=5, decimal_places=2)
    calibrated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='thermometer_verifications')
    manager_signature = models.TextField(null=True, blank=True)  # Base64 encoded signature
    corrective_action = models.TextField(null=True, blank=True)
    photo_evidence = models.ImageField(upload_to='thermometer_verifications/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Verification of {self.thermometer.serial_number} on {self.date_verified}"
    
    def save(self, *args, **kwargs):
        """Update thermometer status on verification"""
        super().save(*args, **kwargs)
        
        # Update the thermometer's verification status
        self.thermometer.status = 'verified'
        self.thermometer.last_verification_date = self.date_verified
        
        # Set expiry date (3 months from verification by default)
        expiry_date = self.date_verified + timedelta(days=90)  # 3 months
        self.thermometer.verification_expiry_date = expiry_date
        
        self.thermometer.save()

class ThermometerVerificationAssignment(models.Model):
    """Tracks which staff member is responsible for thermometer verification"""
    staff_member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='thermometer_verification_assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='thermometer_verification_assignments')
    assigned_date = models.DateField(default=timezone.now)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='thermometer_assignments_made')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Thermometer Verification Assignment"
        verbose_name_plural = "Thermometer Verification Assignments"
    
    def __str__(self):
        return f"{self.staff_member.username} assigned to {self.department.name} thermometer verification"
    
    def save(self, *args, **kwargs):
        """Ensure only one active assignment per department"""
        if self.is_active:
            # Deactivate any other active assignments for this department
            ThermometerVerificationAssignment.objects.filter(
                department=self.department,
                is_active=True
            ).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

class TemperatureLog(models.Model):
    """Records temperature readings for specific areas/units"""
    TIME_PERIOD_CHOICES = [
        ('AM', 'Morning'),
        ('PM', 'Afternoon'),
    ]
    
    area_unit = models.ForeignKey(AreaUnit, on_delete=models.CASCADE, related_name='temperature_logs')
    log_datetime = models.DateTimeField(default=timezone.now)
    temperature_reading = models.DecimalField(max_digits=5, decimal_places=2)
    time_period = models.CharField(max_length=2, choices=TIME_PERIOD_CHOICES)
    corrective_action = models.TextField(null=True, blank=True)
    photo = models.ImageField(upload_to='temperature_logs/', null=True, blank=True)
    logged_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='temperature_logs')
    thermometer_used = models.ForeignKey(Thermometer, on_delete=models.CASCADE, related_name='temperature_logs')
    verification_record_at_time_of_log = models.ForeignKey(
        ThermometerVerificationRecord, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='temperature_logs'
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='temperature_logs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Temperature Log"
        verbose_name_plural = "Temperature Logs"
        ordering = ['-log_datetime']
    
    def __str__(self):
        return f"{self.area_unit.name} - {self.temperature_reading}°C on {self.log_datetime.strftime('%Y-%m-%d %H:%M')} ({self.time_period})"
    
    def is_within_target_range(self):
        """Check if temperature is within target range for the area unit"""
        if self.area_unit.target_temperature_min is None or self.area_unit.target_temperature_max is None:
            return None  # Can't determine if targets aren't set
        
        return (self.area_unit.target_temperature_min <= self.temperature_reading <= 
                self.area_unit.target_temperature_max)

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
