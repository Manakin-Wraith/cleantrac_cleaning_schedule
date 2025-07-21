"""
Unified Admin Interface with Schema Switcher

This module provides a single Django admin interface that can switch between
tenant data and original (public schema) data using a dropdown selector.
This eliminates the need to navigate between different URLs.
"""

from django.contrib import admin
from django.db import connection
from django.contrib.admin import AdminSite
from django.urls import path
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.admin.views.main import ChangeList
from django.contrib import messages
from .models import (
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureCheckAssignment, TemperatureLog,
    Supplier
)


class UnifiedAdminSite(AdminSite):
    """
    Unified admin site that can switch between tenant and original data schemas.
    """
    site_header = 'CleanTrac Unified Admin'
    site_title = 'Unified Admin'
    index_title = 'Multi-Schema Data Management'
    index_template = 'admin/unified_index.html'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('switch-schema/', self.admin_view(self.switch_schema_view), name='switch_schema'),
            path('data-comparison/', self.admin_view(self.data_comparison_view), name='data_comparison'),
            path('schema-info/', self.admin_view(self.schema_info_view), name='schema_info'),
        ]
        return custom_urls + urls
    
    def switch_schema_view(self, request):
        """Handle schema switching requests."""
        if request.method == 'POST':
            schema_type = request.POST.get('schema_type', 'tenant')
            request.session['admin_schema_type'] = schema_type
            
            if schema_type == 'original':
                messages.success(request, 'Switched to Original Data (Public Schema)')
            else:
                messages.success(request, 'Switched to Tenant Data (Cape Station Schema)')
                
            return redirect('unified_admin:index')
        
        return redirect('unified_admin:index')
    
    def data_comparison_view(self, request):
        """View to compare data between public schema and tenant schemas."""
        with connection.cursor() as cursor:
            # Get data counts from public schema
            cursor.execute("SET search_path TO public")
            
            public_counts = {}
            tables = ['core_userprofile', 'core_taskinstance', 'core_temperaturelog', 
                     'core_supplier', 'core_cleaningitem', 'core_thermometer']
            
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    public_counts[table] = cursor.fetchone()[0]
                except Exception:
                    public_counts[table] = 0
            
            # Get data counts from tenant schema (Cape Station)
            cursor.execute("SET search_path TO capestation")
            
            tenant_counts = {}
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    tenant_counts[table] = cursor.fetchone()[0]
                except Exception:
                    tenant_counts[table] = 0
            
            # Reset to default schema
            cursor.execute("SET search_path TO public")
        
        context = {
            'title': 'Data Comparison',
            'public_counts': public_counts,
            'tenant_counts': tenant_counts,
            'tables': tables,
        }
        
        return render(request, 'admin/data_comparison.html', context)
    
    def schema_info_view(self, request):
        """View to show schema information."""
        with connection.cursor() as cursor:
            # Get current schema
            cursor.execute("SELECT current_schema()")
            current_schema = cursor.fetchone()[0]
            
            # Get available schemas
            cursor.execute("""
                SELECT schema_name 
                FROM information_schema.schemata 
                WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
                ORDER BY schema_name
            """)
            schemas = [row[0] for row in cursor.fetchall()]
        
        context = {
            'title': 'Schema Information',
            'current_schema': current_schema,
            'available_schemas': schemas,
        }
        
        return render(request, 'admin/schema_info.html', context)


class SchemaAwareModelAdmin(admin.ModelAdmin):
    """
    Base admin class that switches schema context based on session preference.
    """
    change_list_template = 'admin/change_list_unified.html'
    
    def get_queryset(self, request):
        """Override to query from the selected schema."""
        schema_type = request.session.get('admin_schema_type', 'tenant')
        
        with connection.cursor() as cursor:
            if schema_type == 'original':
                cursor.execute("SET search_path TO public")
            else:
                cursor.execute("SET search_path TO capestation")
        
        return super().get_queryset(request)
    
    def changelist_view(self, request, extra_context=None):
        """Add schema context to changelist view."""
        extra_context = extra_context or {}
        schema_type = request.session.get('admin_schema_type', 'tenant')
        extra_context['current_schema_type'] = schema_type
        extra_context['schema_display'] = 'Original Data' if schema_type == 'original' else 'Cape Station Data'
        return super().changelist_view(request, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add schema context to change view."""
        extra_context = extra_context or {}
        schema_type = request.session.get('admin_schema_type', 'tenant')
        extra_context['current_schema_type'] = schema_type
        extra_context['schema_display'] = 'Original Data' if schema_type == 'original' else 'Cape Station Data'
        return super().change_view(request, object_id, form_url, extra_context)
    
    def has_add_permission(self, request):
        """Disable adding for original schema."""
        schema_type = request.session.get('admin_schema_type', 'tenant')
        if schema_type == 'original':
            return False
        return super().has_add_permission(request)
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but disable changes for original schema."""
        schema_type = request.session.get('admin_schema_type', 'tenant')
        if schema_type == 'original':
            return request.user.has_perm(f'{self.model._meta.app_label}.view_{self.model._meta.model_name}')
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        """Disable deletion for original schema."""
        schema_type = request.session.get('admin_schema_type', 'tenant')
        if schema_type == 'original':
            return False
        return super().has_delete_permission(request, obj)


# Admin classes for each model
class UnifiedUserProfileAdmin(SchemaAwareModelAdmin):
    """Admin for UserProfile data with schema switching."""
    list_display = ('user', 'phone_number', 'department', 'role')
    list_filter = ('department', 'role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone_number')


class UnifiedTaskInstanceAdmin(SchemaAwareModelAdmin):
    """Admin for TaskInstance data with schema switching."""
    list_display = ('cleaning_item', 'department', 'assigned_to', 'due_date', 'status', 'created_at')
    list_filter = ('department', 'status', 'due_date')
    search_fields = ('cleaning_item__name', 'assigned_to__user__username', 'department__name')


class UnifiedTemperatureLogAdmin(SchemaAwareModelAdmin):
    """Admin for TemperatureLog data with schema switching."""
    list_display = ('area_unit', 'log_datetime', 'temperature_reading', 'time_period', 'logged_by')
    list_filter = ('time_period', 'area_unit__department', 'log_datetime')
    search_fields = ('area_unit__name', 'logged_by__username')


class UnifiedSupplierAdmin(SchemaAwareModelAdmin):
    """Admin for Supplier data with schema switching."""
    list_display = ('supplier_code', 'supplier_name', 'country_of_origin', 'created_at')
    list_filter = ('country_of_origin', 'created_at')
    search_fields = ('supplier_code', 'supplier_name', 'contact_info')


class UnifiedCleaningItemAdmin(SchemaAwareModelAdmin):
    """Admin for CleaningItem data with schema switching."""
    list_display = ('name', 'department', 'frequency', 'method', 'created_at')
    list_filter = ('department', 'frequency')
    search_fields = ('name', 'method', 'department__name')


class UnifiedThermometerAdmin(SchemaAwareModelAdmin):
    """Admin for Thermometer data with schema switching."""
    list_display = ('serial_number', 'model_identifier', 'department', 'status')
    list_filter = ('department', 'status')
    search_fields = ('serial_number', 'model_identifier', 'department__name')


class UnifiedDepartmentAdmin(SchemaAwareModelAdmin):
    """Admin for Department data with schema switching."""
    list_display = ('name',)
    search_fields = ('name',)


# Create the unified admin site instance
unified_admin_site = UnifiedAdminSite(name='unified_admin')

# Register models with the unified admin site
unified_admin_site.register(UserProfile, UnifiedUserProfileAdmin)
unified_admin_site.register(TaskInstance, UnifiedTaskInstanceAdmin)
unified_admin_site.register(TemperatureLog, UnifiedTemperatureLogAdmin)
unified_admin_site.register(Supplier, UnifiedSupplierAdmin)
unified_admin_site.register(CleaningItem, UnifiedCleaningItemAdmin)
unified_admin_site.register(Thermometer, UnifiedThermometerAdmin)
unified_admin_site.register(Department, UnifiedDepartmentAdmin)
unified_admin_site.register(CompletionLog)
unified_admin_site.register(AreaUnit)
unified_admin_site.register(ThermometerVerificationRecord)
unified_admin_site.register(ThermometerVerificationAssignment)
unified_admin_site.register(TemperatureCheckAssignment)
