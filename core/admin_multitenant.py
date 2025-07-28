"""
Multi-Tenant Django Admin Dashboard
Provides unified interface to manage all tenants and switch between schemas
"""

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.db import connection
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django_tenants.utils import tenant_context, get_tenant_model
from customers.models import Store, StoreDomain
from core.models import UserProfile, TaskInstance, Department
from django.contrib.auth.models import User


class MultiTenantAdminSite(AdminSite):
    """
    Custom admin site with multi-tenant awareness and tenant switching
    """
    site_header = "CleanTrac Multi-Tenant Administration"
    site_title = "CleanTrac Admin"
    index_title = "Multi-Tenant Database Management"
    
    def get_urls(self):
        """Add custom URLs for tenant management"""
        urls = super().get_urls()
        custom_urls = [
            path('tenant-dashboard/', self.admin_view(self.tenant_dashboard_view), name='tenant_dashboard'),
            path('switch-tenant/<str:schema_name>/', self.admin_view(self.switch_tenant_view), name='switch_tenant'),
            path('tenant-data/<str:schema_name>/', self.admin_view(self.tenant_data_view), name='tenant_data'),
        ]
        return custom_urls + urls
    
    def each_context(self, request):
        """Add tenant context to every admin page"""
        context = super().each_context(request)
        
        # Get current schema/tenant info
        current_schema = getattr(connection, 'schema_name', 'unknown')
        
        # Get all available tenants
        try:
            all_tenants = Store.objects.all()
            tenant_list = []
            for tenant in all_tenants:
                domains = [d.domain for d in tenant.domains.all()]
                tenant_list.append({
                    'schema_name': tenant.schema_name,
                    'name': tenant.name,
                    'domains': domains,
                    'is_current': tenant.schema_name == current_schema
                })
        except:
            tenant_list = []
        
        # Determine tenant display info
        if current_schema == 'public':
            tenant_info = {
                'name': 'PUBLIC SCHEMA',
                'description': 'System Administration & Tenant Management',
                'color': '#dc3545',  # Red
                'warning': True,
                'icon': '🔧'
            }
        else:
            try:
                current_tenant = Store.objects.get(schema_name=current_schema)
                tenant_info = {
                    'name': current_tenant.name.upper(),
                    'description': f'{current_tenant.name} Tenant Data',
                    'color': '#28a745',  # Green
                    'warning': False,
                    'icon': '🏢'
                }
            except:
                tenant_info = {
                    'name': current_schema.upper(),
                    'description': f'{current_schema.title()} Tenant',
                    'color': '#007bff',  # Blue
                    'warning': False,
                    'icon': '🏪'
                }
        
        # Get tenant stats if in tenant schema
        tenant_stats = {}
        if current_schema != 'public':
            try:
                tenant_stats = {
                    'users': User.objects.count(),
                    'profiles': UserProfile.objects.count(),
                    'tasks': TaskInstance.objects.count(),
                    'departments': Department.objects.count(),
                }
            except:
                tenant_stats = {}
        
        context.update({
            'tenant_info': tenant_info,
            'current_schema': current_schema,
            'all_tenants': tenant_list,
            'tenant_stats': tenant_stats,
            'show_tenant_dashboard': True,
        })
        
        return context
    
    def tenant_dashboard_view(self, request):
        """Dashboard showing all tenants and their stats"""
        current_schema = getattr(connection, 'schema_name', 'public')
        
        # Get all tenants with their stats
        tenants_data = []
        all_tenants = Store.objects.all()
        
        for tenant in all_tenants:
            try:
                with tenant_context(tenant):
                    stats = {
                        'users': User.objects.count(),
                        'profiles': UserProfile.objects.count(),
                        'tasks': TaskInstance.objects.count(),
                        'departments': Department.objects.count(),
                    }
                    
                    # Get recent activity
                    recent_tasks = TaskInstance.objects.order_by('-created_at')[:3]
                    recent_activity = []
                    for task in recent_tasks:
                        assigned_to = 'Unassigned'
                        if task.assigned_to:
                            assigned_to = task.assigned_to.user.username
                        recent_activity.append({
                            'item': task.cleaning_item.name if task.cleaning_item else 'Unknown',
                            'assigned_to': assigned_to,
                            'due_date': task.due_date,
                            'status': task.status
                        })
                    
                    domains = [d.domain for d in tenant.domains.all()]
                    
                    tenants_data.append({
                        'tenant': tenant,
                        'stats': stats,
                        'recent_activity': recent_activity,
                        'domains': domains,
                        'is_current': tenant.schema_name == current_schema
                    })
            except Exception as e:
                tenants_data.append({
                    'tenant': tenant,
                    'error': str(e),
                    'domains': [d.domain for d in tenant.domains.all()],
                    'is_current': tenant.schema_name == current_schema
                })
        
        context = {
            'title': 'Multi-Tenant Dashboard',
            'tenants_data': tenants_data,
            'current_schema': current_schema,
        }
        
        return render(request, 'admin/tenant_dashboard.html', context)
    
    def switch_tenant_view(self, request, schema_name):
        """Switch to a specific tenant schema"""
        try:
            if schema_name == 'public':
                # Redirect to public admin
                return redirect('/admin/')
            else:
                # Get tenant and redirect to its primary domain
                tenant = Store.objects.get(schema_name=schema_name)
                primary_domain = tenant.domains.filter(is_primary=True).first()
                if primary_domain:
                    return redirect(f'http://{primary_domain.domain}/admin/')
                else:
                    # Fallback to first domain
                    first_domain = tenant.domains.first()
                    if first_domain:
                        return redirect(f'http://{first_domain.domain}/admin/')
        except Exception as e:
            pass
        
        return redirect('/admin/')
    
    def tenant_data_view(self, request, schema_name):
        """Get tenant data via AJAX"""
        try:
            if schema_name == 'public':
                data = {
                    'schema': 'public',
                    'tenants': Store.objects.count(),
                    'domains': StoreDomain.objects.count(),
                }
            else:
                tenant = Store.objects.get(schema_name=schema_name)
                with tenant_context(tenant):
                    data = {
                        'schema': schema_name,
                        'name': tenant.name,
                        'users': User.objects.count(),
                        'profiles': UserProfile.objects.count(),
                        'tasks': TaskInstance.objects.count(),
                        'departments': Department.objects.count(),
                    }
            
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


# Create the multi-tenant admin site
multitenant_admin = MultiTenantAdminSite(name='multitenant_admin')

# Register all models to the multi-tenant admin
from django.apps import apps

# Get all models and register them
for model in apps.get_models():
    if model._meta.app_label in ['core', 'customers', 'auth']:
        try:
            multitenant_admin.register(model)
        except admin.sites.AlreadyRegistered:
            pass
