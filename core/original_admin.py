"""
Original Database Admin Interface

This module provides Django admin interfaces for accessing the original (public schema) 
core data that was migrated from the Streamlit application. This gives administrators
access to the source data alongside tenant-specific data.
"""

from django.contrib import admin
from django.db import connection
from django.contrib.admin import AdminSite
from django.urls import path
from django.shortcuts import render
from django.http import JsonResponse
from .models import (
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureCheckAssignment, TemperatureLog,
    Supplier
)


class OriginalDatabaseAdminSite(AdminSite):
    """
    Custom admin site for accessing original database (public schema) data.
    This provides a separate admin interface specifically for the source data.
    """
    site_header = 'CleanTrac Original Database Admin'
    site_title = 'Original Database Admin'
    index_title = 'Original Database Management'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('data-comparison/', self.admin_view(self.data_comparison_view), name='data_comparison'),
            path('schema-info/', self.admin_view(self.schema_info_view), name='schema_info'),
        ]
        return custom_urls + urls
    
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
                    count = cursor.fetchone()[0]
                    public_counts[table] = count
                except Exception as e:
                    public_counts[table] = f"Error: {str(e)}"
            
            # Get tenant schema data counts
            cursor.execute("SET search_path TO capestation, public")
            tenant_counts = {}
            
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    tenant_counts[table] = count
                except Exception as e:
                    tenant_counts[table] = f"Error: {str(e)}"
        
        context = {
            'title': 'Data Comparison: Public Schema vs Cape Station Tenant',
            'public_counts': public_counts,
            'tenant_counts': tenant_counts,
        }
        return render(request, 'admin/original_admin/data_comparison.html', context)
    
    def schema_info_view(self, request):
        """View to show schema information and available tables."""
        with connection.cursor() as cursor:
            # Get public schema tables
            cursor.execute("""
                SELECT table_name, table_type 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'core_%'
                ORDER BY table_name
            """)
            public_tables = cursor.fetchall()
            
            # Get tenant schema tables
            cursor.execute("""
                SELECT table_name, table_type 
                FROM information_schema.tables 
                WHERE table_schema = 'capestation' 
                AND table_name LIKE 'core_%'
                ORDER BY table_name
            """)
            tenant_tables = cursor.fetchall()
        
        context = {
            'title': 'Schema Information',
            'public_tables': public_tables,
            'tenant_tables': tenant_tables,
        }
        return render(request, 'admin/original_admin/schema_info.html', context)


# Create the original database admin site instance
original_admin_site = OriginalDatabaseAdminSite(name='original_admin')


class OriginalDataModelAdmin(admin.ModelAdmin):
    """
    Base admin class for original database models.
    Forces queries to use the public schema to access original data.
    """
    
    def get_queryset(self, request):
        """Override to query from public schema."""
        qs = super().get_queryset(request)
        # Force the query to use public schema
        with connection.cursor() as cursor:
            cursor.execute("SET search_path TO public")
        return qs
    
    def save_model(self, request, obj, form, change):
        """Override to save to public schema (read-only for safety)."""
        # Make this read-only to prevent accidental modifications
        pass
    
    def delete_model(self, request, obj):
        """Override to prevent deletion from public schema."""
        # Make this read-only to prevent accidental deletions
        pass
    
    def has_add_permission(self, request):
        """Disable adding new records to original database."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but disable changes to original database."""
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Disable deletion from original database."""
        return False


class OriginalUserProfileAdmin(OriginalDataModelAdmin):
    """Admin for original UserProfile data."""
    list_display = ('user', 'phone_number', 'department', 'role')
    list_filter = ('department', 'role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone_number')
    readonly_fields = [f.name for f in UserProfile._meta.fields]


class OriginalTaskInstanceAdmin(OriginalDataModelAdmin):
    """Admin for original TaskInstance data."""
    list_display = ('cleaning_item', 'department', 'assigned_to', 'due_date', 'status', 'created_at')
    list_filter = ('department', 'status', 'due_date')
    search_fields = ('cleaning_item__name', 'assigned_to__username', 'department__name')
    readonly_fields = [f.name for f in TaskInstance._meta.fields]


class OriginalTemperatureLogAdmin(OriginalDataModelAdmin):
    """Admin for original TemperatureLog data."""
    list_display = ('area_unit', 'log_datetime', 'temperature_reading', 'time_period', 'logged_by')
    list_filter = ('time_period', 'area_unit__department', 'log_datetime')
    search_fields = ('area_unit__name', 'logged_by__username')
    readonly_fields = [f.name for f in TemperatureLog._meta.fields]


class OriginalSupplierAdmin(OriginalDataModelAdmin):
    """Admin for original Supplier data."""
    list_display = ('supplier_code', 'supplier_name', 'country_of_origin', 'created_at')
    list_filter = ('country_of_origin', 'created_at')
    search_fields = ('supplier_code', 'supplier_name', 'contact_info')
    readonly_fields = [f.name for f in Supplier._meta.fields]


class OriginalCleaningItemAdmin(OriginalDataModelAdmin):
    """Admin for original CleaningItem data."""
    list_display = ('name', 'department', 'frequency', 'method', 'created_at')
    list_filter = ('department', 'frequency')
    search_fields = ('name', 'method', 'department__name')
    readonly_fields = [f.name for f in CleaningItem._meta.fields]


class OriginalThermometerAdmin(OriginalDataModelAdmin):
    """Admin for original Thermometer data."""
    list_display = ('serial_number', 'model_identifier', 'department', 'status')
    list_filter = ('department', 'status')
    search_fields = ('serial_number', 'model_identifier', 'department__name')
    readonly_fields = [f.name for f in Thermometer._meta.fields]


# Register models with the original admin site
original_admin_site.register(UserProfile, OriginalUserProfileAdmin)
original_admin_site.register(TaskInstance, OriginalTaskInstanceAdmin)
original_admin_site.register(TemperatureLog, OriginalTemperatureLogAdmin)
original_admin_site.register(Supplier, OriginalSupplierAdmin)
original_admin_site.register(CleaningItem, OriginalCleaningItemAdmin)
original_admin_site.register(Thermometer, OriginalThermometerAdmin)
original_admin_site.register(Department)
original_admin_site.register(AreaUnit)
original_admin_site.register(ThermometerVerificationRecord)
original_admin_site.register(ThermometerVerificationAssignment)
original_admin_site.register(TemperatureCheckAssignment)
