"""
Scalable Multi-Tenant Admin System for CleanTrac
Designed for managing hundreds of tenants from a central dashboard
"""

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib import messages
from django_tenants.utils import tenant_context, get_tenant_model
from customers.models import Store, StoreDomain
from core.models import UserProfile, TaskInstance, Department
from django.contrib.auth.models import User
from django.db import connection
import json


class ScalableTenantAdminSite(AdminSite):
    """
    Scalable admin site for managing many tenants from central location
    """
    site_header = "CleanTrac Central Administration"
    site_title = "CleanTrac Admin"
    index_title = "Multi-Tenant Management Dashboard"
    
    def index(self, request, extra_context=None):
        """Override index to redirect to tenant overview for public schema"""
        current_schema = getattr(connection, 'schema_name', 'public')
        
        if current_schema == 'public':
            # Redirect to tenant overview for central admin
            return HttpResponseRedirect(reverse('admin:tenant_overview'))
        else:
            # Use default admin index for tenant schemas
            return super().index(request, extra_context)
    
    def get_urls(self):
        """Add custom URLs for tenant management"""
        urls = super().get_urls()
        custom_urls = [
            path('tenant-overview/', self.admin_view(self.tenant_overview_view), name='tenant_overview'),
            path('tenant/<int:tenant_id>/dashboard/', self.admin_view(self.tenant_dashboard_view), name='tenant_dashboard'),
            path('tenant/<int:tenant_id>/navigate/', self.admin_view(self.navigate_to_tenant), name='navigate_to_tenant'),
            path('tenant/create/', self.admin_view(self.create_tenant_view), name='create_tenant'),
            path('tenant/<int:tenant_id>/stats/', self.admin_view(self.tenant_stats_api), name='tenant_stats'),
        ]
        return custom_urls + urls
    
    def each_context(self, request):
        """Add tenant context to every admin page"""
        context = super().each_context(request)
        
        # Get current schema info
        current_schema = getattr(connection, 'schema_name', 'public')
        
        # Central admin context
        context.update({
            'is_central_admin': current_schema == 'public',
            'current_schema': current_schema,
            'total_tenants': Store.objects.count() if current_schema == 'public' else 0,
            'show_tenant_overview': current_schema == 'public',
        })
        
        return context
    
    def tenant_overview_view(self, request):
        """Central dashboard showing all tenants with management options"""
        # Allow tenant overview from main admin domain
        # Schema restriction removed to fix access issues
        
        # Get all tenants with their stats
        tenants_data = []
        all_tenants = Store.objects.all().order_by('name')
        
        for tenant in all_tenants:
            try:
                # Get tenant domains
                domains = list(tenant.domains.all())
                receiving_domain = None
                manager_domain = None
                
                for domain in domains:
                    if domain.domain.startswith('receiving.'):
                        receiving_domain = domain.domain
                    elif '.manager.' in domain.domain:
                        manager_domain = domain.domain
                
                # Get tenant stats
                with tenant_context(tenant):
                    stats = {
                        'users': User.objects.count(),
                        'profiles': UserProfile.objects.count(),
                        'tasks': TaskInstance.objects.count(),
                        'departments': Department.objects.count(),
                        'active_tasks': TaskInstance.objects.filter(status='pending').count(),
                        'completed_tasks': TaskInstance.objects.filter(status='completed').count(),
                    }
                    
                    # Get recent activity (last 5 tasks)
                    recent_tasks = TaskInstance.objects.order_by('-created_at')[:5]
                    recent_activity = []
                    for task in recent_tasks:
                        assigned_to = 'Unassigned'
                        if task.assigned_to:
                            assigned_to = task.assigned_to.user.username
                        recent_activity.append({
                            'item': task.cleaning_item.name if task.cleaning_item else 'Unknown',
                            'assigned_to': assigned_to,
                            'due_date': task.due_date,
                            'status': task.status,
                            'created_at': task.created_at
                        })
                
                tenants_data.append({
                    'tenant': tenant,
                    'stats': stats,
                    'recent_activity': recent_activity,
                    'receiving_domain': receiving_domain,
                    'manager_domain': manager_domain,
                    'all_domains': [d.domain for d in domains],
                    'status': 'active' if stats['users'] > 0 else 'inactive'
                })
                
            except Exception as e:
                tenants_data.append({
                    'tenant': tenant,
                    'error': str(e),
                    'receiving_domain': None,
                    'manager_domain': None,
                    'all_domains': [d.domain for d in tenant.domains.all()],
                    'status': 'error'
                })
        
        context = {
            'title': 'Tenant Overview Dashboard',
            'tenants_data': tenants_data,
            'total_tenants': len(tenants_data),
            'active_tenants': len([t for t in tenants_data if t.get('status') == 'active']),
            'inactive_tenants': len([t for t in tenants_data if t.get('status') == 'inactive']),
            'error_tenants': len([t for t in tenants_data if t.get('status') == 'error']),
        }
        
        return render(request, 'admin/tenant_overview.html', context)
    
    def tenant_dashboard_view(self, request, tenant_id):
        """Detailed view of a specific tenant"""
        try:
            tenant = Store.objects.get(id=tenant_id)
            
            with tenant_context(tenant):
                # Get detailed tenant information
                users = User.objects.all()
                profiles = UserProfile.objects.all()
                departments = Department.objects.all()
                tasks = TaskInstance.objects.all()
                
                # Department breakdown
                dept_stats = {}
                for dept in departments:
                    dept_users = profiles.filter(department=dept).count()
                    dept_tasks = tasks.filter(assigned_to__department=dept).count()
                    dept_stats[dept.name] = {
                        'users': dept_users,
                        'tasks': dept_tasks
                    }
                
                # Recent activity (last 10 tasks)
                recent_tasks = tasks.order_by('-created_at')[:10]
                
                context = {
                    'title': f'{tenant.name} - Detailed Dashboard',
                    'tenant': tenant,
                    'users': users,
                    'profiles': profiles,
                    'departments': departments,
                    'tasks': tasks,
                    'dept_stats': dept_stats,
                    'recent_tasks': recent_tasks,
                    'domains': tenant.domains.all(),
                }
                
                return render(request, 'admin/tenant_detail_dashboard.html', context)
                
        except Store.DoesNotExist:
            messages.error(request, f"Tenant with ID {tenant_id} not found")
            return redirect('/admin/tenant-overview/')
    
    def navigate_to_tenant(self, request, tenant_id):
        """Navigate to tenant's Django admin (raw data access)"""
        try:
            tenant = Store.objects.get(id=tenant_id)
            
            # Find any tenant domain for Django admin access
            tenant_domain = None
            for domain in tenant.domains.all():
                # Prefer manager domain, but any will work for Django admin
                if '.manager.' in domain.domain or 'receiving.' in domain.domain:
                    tenant_domain = domain.domain
                    break
            
            if tenant_domain:
                # Redirect to tenant's Django admin (same /admin/ path, different domain)
                return HttpResponseRedirect(f'https://{tenant_domain}/admin/')
            else:
                messages.error(request, f"No domain found for {tenant.name}")
                return redirect('/admin/tenant-overview/')
                
        except Store.DoesNotExist:
            messages.error(request, f"Tenant with ID {tenant_id} not found")
            return redirect('/admin/tenant-overview/')
    
    def create_tenant_view(self, request):
        """Form to create new tenant with proper domain structure"""
        if request.method == 'POST':
            tenant_name = request.POST.get('tenant_name', '').strip()
            tenant_slug = request.POST.get('tenant_slug', '').strip().lower()
            
            if not tenant_name or not tenant_slug:
                messages.error(request, "Tenant name and slug are required")
                return render(request, 'admin/create_tenant.html')
            
            try:
                # Create tenant
                tenant = Store.objects.create(
                    name=tenant_name,
                    schema_name=tenant_slug,
                    paid_until='2025-12-31',  # Set appropriate date
                    on_trial=False
                )
                
                # Create domains
                receiving_domain = f'receiving.{tenant_slug}.cleentrac.com'
                manager_domain = f'{tenant_slug}.manager.cleentrac.com'
                
                StoreDomain.objects.create(
                    domain=receiving_domain,
                    tenant=tenant,
                    is_primary=False
                )
                
                StoreDomain.objects.create(
                    domain=manager_domain,
                    tenant=tenant,
                    is_primary=True
                )
                
                messages.success(request, f"Tenant '{tenant_name}' created successfully with domains: {receiving_domain}, {manager_domain}")
                return redirect('/admin/tenant-overview/')
                
            except Exception as e:
                messages.error(request, f"Error creating tenant: {str(e)}")
        
        return render(request, 'admin/create_tenant.html')
    
    def tenant_stats_api(self, request, tenant_id):
        """API endpoint for real-time tenant stats"""
        try:
            tenant = Store.objects.get(id=tenant_id)
            
            with tenant_context(tenant):
                stats = {
                    'users': User.objects.count(),
                    'profiles': UserProfile.objects.count(),
                    'tasks': TaskInstance.objects.count(),
                    'departments': Department.objects.count(),
                    'active_tasks': TaskInstance.objects.filter(status='pending').count(),
                    'completed_tasks': TaskInstance.objects.filter(status='completed').count(),
                }
            
            return JsonResponse({
                'success': True,
                'tenant_name': tenant.name,
                'stats': stats
            })
            
        except Store.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tenant not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)


# Create the scalable admin site
scalable_admin = ScalableTenantAdminSite(name='scalable_admin')

# Register specific models we need
from django.contrib.auth.models import User, Group
from customers.models import Store, StoreDomain

# Register core models
try:
    scalable_admin.register(User)
    scalable_admin.register(Group)
except admin.sites.AlreadyRegistered:
    pass

# Custom admin for Store with enhanced functionality
class StoreAdmin(admin.ModelAdmin):
    """Enhanced admin for Store model with tenant stats"""
    list_display = ['name', 'schema_name', 'created_at', 'get_domains', 'get_user_count', 'get_task_count']
    list_filter = ['created_at']
    search_fields = ['name', 'schema_name']
    readonly_fields = ['created_at']
    
    def get_domains(self, obj):
        try:
            domains = obj.domains.all()
            return format_html('<br>'.join([d.domain for d in domains]))
        except:
            return 'Error loading domains'
    get_domains.short_description = 'Domains'
    
    def get_user_count(self, obj):
        try:
            with tenant_context(obj):
                from django.contrib.auth.models import User
                count = User.objects.count()
                return format_html(f'<span style="color: green;">{count}</span>')
        except Exception as e:
            return format_html('<span style="color: red;">Error</span>')
    get_user_count.short_description = 'Users'
    
    def get_task_count(self, obj):
        try:
            with tenant_context(obj):
                from core.models import TaskInstance
                count = TaskInstance.objects.count()
                return format_html(f'<span style="color: blue;">{count}</span>')
        except Exception as e:
            return format_html('<span style="color: red;">Error</span>')
    get_task_count.short_description = 'Tasks'

# Note: Store and StoreDomain models are NOT registered with scalable_admin
# to prevent sidebar links that cause 500 errors. All tenant management
# is handled through the custom tenant overview dashboard instead.
