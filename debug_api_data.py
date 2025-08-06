#!/usr/bin/env python
"""
Debug script to check what data exists in the development database
and create sample data if needed for frontend testing.
"""

import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings_local')
django.setup()

from django.contrib.auth.models import User
from core.models import Department, UserProfile, CleaningItem, TaskInstance
from customers.models import Store

def debug_api_data():
    """Check what data exists and create sample data if needed."""
    
    print("🔍 Debugging API data in development environment...")
    
    # Switch to development tenant schema
    try:
        dev_tenant = Store.objects.get(schema_name='dev_store')
        connection.set_schema('dev_store')
        print(f"✅ Connected to development tenant: {dev_tenant.name}")
    except Store.DoesNotExist:
        print("❌ Development tenant not found!")
        return
    
    # Check users
    users = User.objects.all()
    print(f"\n👥 Users ({users.count()}):")
    for user in users:
        profile = getattr(user, 'userprofile', None)
        role = profile.role if profile else 'No profile'
        dept = profile.department.name if profile and profile.department else 'No dept'
        print(f"   - {user.username} ({role}) - {dept}")
    
    # Check departments
    departments = Department.objects.all()
    print(f"\n🏢 Departments ({departments.count()}):")
    for dept in departments:
        print(f"   - {dept.name}")
    
    # Check cleaning items
    cleaning_items = CleaningItem.objects.all()
    print(f"\n🧹 Cleaning Items ({cleaning_items.count()}):")
    for item in cleaning_items:
        print(f"   - {item.name} (Dept: {item.department.name if item.department else 'None'})")
    
    # Check task instances
    task_instances = TaskInstance.objects.all()
    print(f"\n📋 Task Instances ({task_instances.count()}):")
    for task in task_instances[:5]:  # Show first 5
        print(f"   - {task.cleaning_item.name if task.cleaning_item else 'No item'} - {task.status} - {task.due_date}")
    
    if task_instances.count() > 5:
        print(f"   ... and {task_instances.count() - 5} more")
    
    # Create sample data if needed
    if cleaning_items.count() == 0:
        print("\n📝 Creating sample cleaning items...")
        create_sample_cleaning_data()
    elif task_instances.count() == 0:
        print("\n📝 Creating sample task instances...")
        create_sample_task_instances()
    
    print(f"\n🎯 API Endpoints that should work:")
    print(f"   - GET /api/users/me/ (✅ working)")
    print(f"   - GET /api/departments/ ({departments.count()} items)")
    print(f"   - GET /api/cleaningitems/ ({cleaning_items.count()} items)")
    print(f"   - GET /api/taskinstances/ ({task_instances.count()} items)")

def create_sample_cleaning_data():
    """Create sample cleaning items and tasks for frontend testing."""
    
    # Get or create department
    dept = Department.objects.first()
    if not dept:
        dept = Department.objects.create(name='Development Kitchen')
    
    # Create sample cleaning items
    cleaning_items_data = [
        'Clean Kitchen Surfaces',
        'Sanitize Equipment', 
        'Mop Floors',
        'Empty Trash Bins',
        'Check Temperature Logs',
        'Wipe Down Tables',
        'Clean Refrigerator',
        'Sweep Storage Area'
    ]
    
    for item_name in cleaning_items_data:
        item, created = CleaningItem.objects.get_or_create(
            name=item_name,
            defaults={
                'department': dept,
                'frequency': 'daily',
                'method': f'Standard cleaning procedure for {item_name}',
                'equipment': 'Standard cleaning supplies',
                'chemical': 'Approved cleaning chemicals',
            }
        )
        if created:
            print(f"   ✅ Created: {item_name}")
    
    # Create UserProfiles for users that don't have them
    for user in User.objects.all():
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'manager' if user.username == 'admin' else user.username,
                'department': dept,
                'phone': f'555-{user.id:04d}',
                'is_active': True,
            }
        )
        if created:
            print(f"   ✅ Created profile for: {user.username}")
    
    # Create some sample task instances
    from datetime import datetime, timedelta
    import random
    
    cleaning_items = CleaningItem.objects.all()
    admin_profile = UserProfile.objects.get(user__username='admin')
    
    for i in range(10):
        item = random.choice(cleaning_items)
        due_date = datetime.now().date() + timedelta(days=random.randint(0, 7))
        
        task, created = TaskInstance.objects.get_or_create(
            cleaning_item=item,
            due_date=due_date,
            defaults={
                'assigned_to': admin_profile,
                'department': dept,
                'status': random.choice(['pending', 'in_progress', 'completed']),
                'notes': f'Sample task for {item.name}',
            }
        )
        if created:
            print(f"   ✅ Created task: {item.name} - {due_date}")

def create_sample_task_instances():
    """Create sample task instances and user profiles if needed."""
    
    # Get or create department
    dept = Department.objects.first()
    if not dept:
        dept = Department.objects.create(name='Development Kitchen')
    
    # Create UserProfiles for users that don't have them
    for user in User.objects.all():
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'manager' if user.username == 'admin' else user.username,
                'department': dept,
                'phone': f'555-{user.id:04d}',
                'is_active': True,
            }
        )
        if created:
            print(f"   ✅ Created profile for: {user.username}")
    
    # Create some sample task instances
    from datetime import datetime, timedelta
    import random
    
    cleaning_items = CleaningItem.objects.all()
    admin_profile = UserProfile.objects.get(user__username='admin')
    
    for i in range(10):
        item = random.choice(cleaning_items)
        due_date = datetime.now().date() + timedelta(days=random.randint(0, 7))
        
        task, created = TaskInstance.objects.get_or_create(
            cleaning_item=item,
            due_date=due_date,
            defaults={
                'assigned_to': admin_profile,
                'department': dept,
                'status': random.choice(['pending', 'in_progress', 'completed']),
                'notes': f'Sample task for {item.name}',
            }
        )
        if created:
            print(f"   ✅ Created task: {item.name} - {due_date}")

if __name__ == '__main__':
    debug_api_data()
