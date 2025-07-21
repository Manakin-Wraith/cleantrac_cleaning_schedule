from django.contrib import admin
from django_tenants.utils import schema_context
from .models import Store, StoreDomain


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    """
    Clean, Django-native admin for Store (Tenant) management.
    """
    list_display = ('name', 'schema_name', 'get_primary_domain', 'get_user_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'schema_name')
    readonly_fields = ('schema_name', 'created_at')
    
    def get_primary_domain(self, obj):
        """Display primary domain"""
        primary = obj.domains.filter(is_primary=True).first()
        return primary.domain if primary else "No domain"
    get_primary_domain.short_description = 'Primary Domain'
    
    def get_user_count(self, obj):
        """Get user count for this tenant"""
        try:
            with schema_context(obj.schema_name):
                from django.contrib.auth.models import User
                return User.objects.count()
        except Exception:
            return 0
    get_user_count.short_description = 'Users'


@admin.register(StoreDomain)
class StoreDomainAdmin(admin.ModelAdmin):
    """
    Clean admin for managing tenant domains.
    """
    list_display = ('domain', 'tenant', 'is_primary')
    list_filter = ('is_primary',)
    search_fields = ('domain', 'tenant__name')
    
    def get_tenant_name(self, obj):
        return obj.tenant.name if obj.tenant else '-'
    get_tenant_name.short_description = 'Tenant'


# Keep the site header customization but make it clean
admin.site.site_header = "CleanTrac Administration"
admin.site.site_title = "CleanTrac Admin"
admin.site.index_title = "Welcome to CleanTrac Administration"
