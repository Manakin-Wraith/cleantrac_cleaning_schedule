from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db import connection
from django_tenants.utils import schema_context
from .models import Store, StoreDomain


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    """
    Enhanced admin for Store (Tenant) management with clear naming and data insights.
    """
    list_display = (
        'name', 
        'schema_name', 
        'get_domains', 
        'get_user_count',
        'get_data_summary',
        'created_at'
    )
    list_filter = ('created_at',)
    search_fields = ('name', 'schema_name')
    readonly_fields = (
        'schema_name', 
        'created_at', 
        'get_user_count', 
        'get_data_summary',
        'get_domains_detail'
    )
    
    fieldsets = (
        ('Tenant Information', {
            'fields': ('name', 'schema_name', 'created_at')
        }),
        ('Data Summary', {
            'fields': ('get_user_count', 'get_data_summary'),
            'classes': ('collapse',)
        }),
        ('Domains', {
            'fields': ('get_domains_detail',),
            'classes': ('collapse',)
        })
    )
    
    def get_domains(self, obj):
        """Display associated domains in list view"""
        domains = obj.domains.all()
        if not domains:
            return format_html('<span style="color: red;">No domains</span>')
        
        domain_list = []
        for domain in domains:
            style = "font-weight: bold;" if domain.is_primary else ""
            domain_list.append(f'<span style="{style}">{domain.domain}</span>')
        
        return format_html(' | '.join(domain_list))
    get_domains.short_description = 'Domains'
    get_domains.admin_order_field = 'domains__domain'
    
    def get_domains_detail(self, obj):
        """Detailed domain information for detail view"""
        domains = obj.domains.all()
        if not domains:
            return format_html('<p style="color: red;">No domains configured</p>')
        
        domain_info = []
        for domain in domains:
            primary_badge = '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">PRIMARY</span>' if domain.is_primary else ''
            domain_info.append(f'<li><strong>{domain.domain}</strong> {primary_badge}</li>')
        
        return format_html('<ul>{}</ul>'.format(''.join(domain_info)))
    get_domains_detail.short_description = 'Domain Details'
    
    def get_user_count(self, obj):
        """Get user count for this tenant"""
        try:
            with schema_context(obj.schema_name):
                from django.contrib.auth.models import User
                count = User.objects.count()
                return format_html('<span style="font-weight: bold; color: #007cba;">{} users</span>', count)
        except Exception as e:
            return format_html('<span style="color: red;">Error: {}</span>', str(e))
    get_user_count.short_description = 'Users'
    
    def get_data_summary(self, obj):
        """Get data summary for this tenant"""
        try:
            with schema_context(obj.schema_name):
                from django.contrib.auth.models import User
                from core.models import TaskInstance, TemperatureLog, CleaningItem
                from core.receiving_models import ReceivingRecord
                
                data = {
                    'Users': User.objects.count(),
                    'Tasks': TaskInstance.objects.count(),
                    'Temp Logs': TemperatureLog.objects.count(),
                    'Receiving': ReceivingRecord.objects.count(),
                    'Cleaning Items': CleaningItem.objects.count(),
                }
                
                summary_parts = []
                for key, value in data.items():
                    color = "#28a745" if value > 0 else "#dc3545"
                    summary_parts.append(f'<span style="color: {color}; font-weight: bold;">{key}: {value}</span>')
                
                return format_html(' | '.join(summary_parts))
        except Exception as e:
            return format_html('<span style="color: red;">Error loading data: {}</span>', str(e))
    get_data_summary.short_description = 'Data Summary'
    
    def has_delete_permission(self, request, obj=None):
        """Prevent accidental tenant deletion"""
        return request.user.is_superuser
    
    def save_model(self, request, obj, form, change):
        """Ensure proper tenant creation"""
        if not change:  # New tenant
            # Auto-generate schema name if not provided
            if not obj.schema_name:
                obj.schema_name = obj.name.lower().replace(' ', '_').replace('-', '_')
        super().save_model(request, obj, form, change)


@admin.register(StoreDomain)
class StoreDomainAdmin(admin.ModelAdmin):
    """
    Admin for managing tenant domains with clear tenant association.
    """
    list_display = (
        'domain', 
        'get_tenant_name',
        'is_primary', 
        'get_tenant_schema',
        'get_domain_status'
    )
    list_filter = ('is_primary', 'tenant__name')
    search_fields = ('domain', 'tenant__name', 'tenant__schema_name')
    raw_id_fields = ('tenant',)
    
    fieldsets = (
        ('Domain Configuration', {
            'fields': ('domain', 'tenant', 'is_primary')
        }),
        ('Tenant Information', {
            'fields': ('get_tenant_info',),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ('get_tenant_info',)
    
    def get_tenant_name(self, obj):
        """Display tenant name with link"""
        if obj.tenant:
            url = reverse('admin:customers_store_change', args=[obj.tenant.pk])
            return format_html('<a href="{}" style="font-weight: bold;">{}</a>', url, obj.tenant.name)
        return '-'
    get_tenant_name.short_description = 'Tenant'
    get_tenant_name.admin_order_field = 'tenant__name'
    
    def get_tenant_schema(self, obj):
        """Display tenant schema name"""
        if obj.tenant:
            return format_html('<code style="background: #f8f9fa; padding: 2px 4px;">{}</code>', obj.tenant.schema_name)
        return '-'
    get_tenant_schema.short_description = 'Schema'
    
    def get_domain_status(self, obj):
        """Show domain status with visual indicators"""
        if obj.is_primary:
            return format_html('<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">PRIMARY</span>')
        else:
            return format_html('<span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">SECONDARY</span>')
    get_domain_status.short_description = 'Status'
    
    def get_tenant_info(self, obj):
        """Detailed tenant information"""
        if not obj.tenant:
            return 'No tenant associated'
        
        try:
            with schema_context(obj.tenant.schema_name):
                from django.contrib.auth.models import User
                user_count = User.objects.count()
                
            info = f"""
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <h4 style="margin-top: 0;">{obj.tenant.name}</h4>
                <p><strong>Schema:</strong> <code>{obj.tenant.schema_name}</code></p>
                <p><strong>Users:</strong> {user_count}</p>
                <p><strong>Created:</strong> {obj.tenant.created_on}</p>
            </div>
            """
            return format_html(info)
        except Exception as e:
            return format_html('<span style="color: red;">Error loading tenant info: {}</span>', str(e))
    get_tenant_info.short_description = 'Tenant Details'


# Customize admin site header and title for multi-tenant clarity
admin.site.site_header = "CleanTrac Multi-Tenant Administration"
admin.site.site_title = "CleanTrac Admin"
admin.site.index_title = "Multi-Tenant Management Dashboard"
