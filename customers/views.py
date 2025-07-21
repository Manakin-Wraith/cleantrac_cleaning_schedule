from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.db import connection
from django_tenants.utils import schema_context
from .models import Store, StoreDomain
from django.contrib.auth.models import User


@staff_member_required
def tenant_dashboard(request):
    """
    Multi-tenant dashboard showing all tenants and their status.
    """
    tenants = Store.objects.all().order_by('name')
    tenant_data = []
    
    for tenant in tenants:
        try:
            with schema_context(tenant.schema_name):
                from core.models import TaskInstance, TemperatureLog, CleaningItem, Department
                from core.receiving_models import ReceivingRecord
                
                data = {
                    'tenant': tenant,
                    'domains': tenant.domains.all(),
                    'primary_domain': tenant.domains.filter(is_primary=True).first(),
                    'users': User.objects.count(),
                    'departments': Department.objects.count(),
                    'tasks': TaskInstance.objects.count(),
                    'temp_logs': TemperatureLog.objects.count(),
                    'receiving_records': ReceivingRecord.objects.count(),
                    'cleaning_items': CleaningItem.objects.count(),
                    'status': 'active' if User.objects.exists() else 'empty'
                }
                tenant_data.append(data)
        except Exception as e:
            tenant_data.append({
                'tenant': tenant,
                'domains': tenant.domains.all(),
                'primary_domain': None,
                'error': str(e),
                'status': 'error'
            })
    
    context = {
        'tenant_data': tenant_data,
        'total_tenants': len(tenants),
        'active_tenants': len([t for t in tenant_data if t.get('status') == 'active']),
    }
    
    return render(request, 'admin/tenant_dashboard.html', context)


@staff_member_required
def tenant_detail(request, tenant_id):
    """
    Detailed view of a specific tenant with comprehensive data overview.
    """
    tenant = get_object_or_404(Store, pk=tenant_id)
    
    try:
        with schema_context(tenant.schema_name):
            from core.models import (
                TaskInstance, TemperatureLog, CleaningItem, Department, 
                UserProfile, Thermometer, ThermometerVerificationRecord
            )
            from core.receiving_models import ReceivingRecord, Product
            from django.contrib.auth.models import User
            
            # Get comprehensive data
            users = User.objects.select_related('profile').all()
            departments = Department.objects.all()
            
            data = {
                'tenant': tenant,
                'domains': tenant.domains.all(),
                'users': users,
                'user_count': users.count(),
                'departments': departments,
                'department_count': departments.count(),
                'tasks': TaskInstance.objects.count(),
                'completed_tasks': TaskInstance.objects.filter(status='completed').count(),
                'pending_tasks': TaskInstance.objects.filter(status='pending').count(),
                'temp_logs': TemperatureLog.objects.count(),
                'receiving_records': ReceivingRecord.objects.count(),
                'products': Product.objects.count(),
                'cleaning_items': CleaningItem.objects.count(),
                'thermometers': Thermometer.objects.count(),
                'verification_records': ThermometerVerificationRecord.objects.count(),
                'recent_tasks': TaskInstance.objects.select_related(
                    'cleaning_item', 'assigned_to__user', 'department'
                ).order_by('-created_at')[:10],
                'recent_temp_logs': TemperatureLog.objects.select_related(
                    'area_unit', 'logged_by', 'thermometer_used'
                ).order_by('-log_datetime')[:10],
            }
            
            # Calculate completion rate
            total_tasks = data['tasks']
            completed_tasks = data['completed_tasks']
            data['completion_rate'] = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
    except Exception as e:
        data = {
            'tenant': tenant,
            'domains': tenant.domains.all(),
            'error': str(e)
        }
    
    return render(request, 'admin/tenant_detail.html', {'data': data})


@staff_member_required
def switch_tenant_context(request):
    """
    API endpoint to switch tenant context for admin operations.
    """
    if request.method == 'POST':
        tenant_id = request.POST.get('tenant_id')
        if tenant_id:
            try:
                tenant = Store.objects.get(pk=tenant_id)
                request.session['current_tenant'] = {
                    'id': tenant.pk,
                    'name': tenant.name,
                    'schema_name': tenant.schema_name
                }
                messages.success(request, f'Switched to tenant: {tenant.name}')
                return JsonResponse({'success': True, 'tenant_name': tenant.name})
            except Store.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Tenant not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@staff_member_required
def tenant_health_check(request, tenant_id):
    """
    Health check for a specific tenant - verify data integrity and system status.
    """
    tenant = get_object_or_404(Store, pk=tenant_id)
    health_status = {
        'tenant': tenant.name,
        'schema': tenant.schema_name,
        'checks': [],
        'overall_status': 'healthy'
    }
    
    try:
        with schema_context(tenant.schema_name):
            from core.models import Department, UserProfile, TaskInstance
            from core.receiving_models import ReceivingRecord
            from django.contrib.auth.models import User
            
            # Check 1: Users and Profiles
            users = User.objects.count()
            profiles = UserProfile.objects.count()
            user_check = {
                'name': 'User Profiles',
                'status': 'pass' if users == profiles else 'warning',
                'message': f'{users} users, {profiles} profiles',
                'details': 'All users should have profiles' if users == profiles else f'{users - profiles} users missing profiles'
            }
            health_status['checks'].append(user_check)
            
            # Check 2: Departments
            dept_count = Department.objects.count()
            dept_check = {
                'name': 'Departments',
                'status': 'pass' if dept_count > 0 else 'fail',
                'message': f'{dept_count} departments configured',
                'details': 'Departments are required for proper system operation'
            }
            health_status['checks'].append(dept_check)
            
            # Check 3: Critical Data
            receiving_count = ReceivingRecord.objects.count()
            task_count = TaskInstance.objects.count()
            data_check = {
                'name': 'Critical Data',
                'status': 'pass' if receiving_count > 0 and task_count > 0 else 'warning',
                'message': f'{receiving_count} receiving records, {task_count} tasks',
                'details': 'Core business data is present'
            }
            health_status['checks'].append(data_check)
            
            # Check 4: Domains
            domain_count = tenant.domains.count()
            primary_domains = tenant.domains.filter(is_primary=True).count()
            domain_check = {
                'name': 'Domain Configuration',
                'status': 'pass' if domain_count > 0 and primary_domains == 1 else 'warning',
                'message': f'{domain_count} domains, {primary_domains} primary',
                'details': 'Should have at least one domain with exactly one primary'
            }
            health_status['checks'].append(domain_check)
            
            # Determine overall status
            if any(check['status'] == 'fail' for check in health_status['checks']):
                health_status['overall_status'] = 'unhealthy'
            elif any(check['status'] == 'warning' for check in health_status['checks']):
                health_status['overall_status'] = 'warning'
                
    except Exception as e:
        health_status['checks'].append({
            'name': 'System Access',
            'status': 'fail',
            'message': 'Cannot access tenant data',
            'details': str(e)
        })
        health_status['overall_status'] = 'unhealthy'
    
    return JsonResponse(health_status)
