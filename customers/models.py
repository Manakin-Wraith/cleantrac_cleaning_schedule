from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Store(TenantMixin):
    """
    Tenant model representing a CleanTrac store/organization.
    Each store gets its own isolated database schema.
    """
    name = models.CharField(max_length=255, help_text="Display name for the store/organization")
    schema_name = models.CharField(max_length=63, unique=True, help_text="Database schema name (must be valid PostgreSQL identifier)")
    
    # Automatically create and drop schemas
    auto_create_schema = True
    auto_drop_schema = False  # Safety: don't auto-drop schemas
    
    created_on = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Store (Tenant)"
        verbose_name_plural = "Stores (Tenants)"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.schema_name})"
    
    def save(self, *args, **kwargs):
        """Ensure schema_name is valid PostgreSQL identifier"""
        if not self.schema_name:
            # Auto-generate schema name from store name
            self.schema_name = self.name.lower().replace(' ', '_').replace('-', '_')
            # Remove any non-alphanumeric characters except underscores
            import re
            self.schema_name = re.sub(r'[^a-z0-9_]', '', self.schema_name)
            # Ensure it starts with a letter
            if self.schema_name and not self.schema_name[0].isalpha():
                self.schema_name = f"store_{self.schema_name}"
        
        super().save(*args, **kwargs)


class StoreDomain(DomainMixin):
    """
    Domain model linking domains/subdomains to specific stores (tenants).
    Each store can have multiple domains, but only one primary domain.
    """
    tenant = models.ForeignKey(Store, related_name='domains', on_delete=models.CASCADE)
    
    class Meta:
        verbose_name = "Store Domain"
        verbose_name_plural = "Store Domains"
        ordering = ['domain']
    
    def __str__(self):
        primary_indicator = " (Primary)" if self.is_primary else ""
        return f"{self.domain} → {self.tenant.name}{primary_indicator}"


class StoreSignup(models.Model):
    """
    Model for tracking store signup requests and onboarding process.
    """
    store_name = models.CharField(max_length=255)
    admin_email = models.EmailField()
    admin_first_name = models.CharField(max_length=100)
    admin_last_name = models.CharField(max_length=100)
    requested_domain = models.CharField(max_length=253, help_text="Requested subdomain (e.g., 'mystore' for mystore.cleentrac.com)")
    
    # Status tracking
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved - Setting Up'),
        ('active', 'Active'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Associated store (once created)
    store = models.OneToOneField(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='signup')
    
    # Notes
    notes = models.TextField(blank=True, help_text="Internal notes about this signup request")
    
    class Meta:
        verbose_name = "Store Signup Request"
        verbose_name_plural = "Store Signup Requests"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.store_name} ({self.admin_email}) - {self.get_status_display()}"
