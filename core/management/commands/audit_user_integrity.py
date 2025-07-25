"""
Management command to audit and fix user data integrity issues.

This command helps identify users that exist in task assignments but don't have
valid UserProfile records in the tenant database.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from core.models import UserProfile, TaskInstance, Department
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Audit user data integrity and identify missing UserProfile records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Attempt to fix integrity issues by creating missing UserProfile records',
        )
        parser.add_argument(
            '--department-id',
            type=int,
            help='Default department ID to assign to users without departments',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== USER DATA INTEGRITY AUDIT ==='))
        
        # Get basic counts
        total_users = User.objects.count()
        total_profiles = UserProfile.objects.count()
        
        self.stdout.write(f'Total Users: {total_users}')
        self.stdout.write(f'Total UserProfiles: {total_profiles}')
        self.stdout.write('')
        
        # Find users without profiles
        users_without_profiles = User.objects.filter(profile__isnull=True)
        self.stdout.write(f'Users without UserProfile: {users_without_profiles.count()}')
        
        if users_without_profiles.exists():
            self.stdout.write(self.style.WARNING('Users missing UserProfile records:'))
            for user in users_without_profiles:
                self.stdout.write(f'  - User {user.id}: {user.username} ({user.email})')
        
        # Find profiles without departments
        profiles_without_dept = UserProfile.objects.filter(department__isnull=True)
        self.stdout.write(f'\nUserProfiles without Department: {profiles_without_dept.count()}')
        
        if profiles_without_dept.exists():
            self.stdout.write(self.style.WARNING('UserProfiles missing Department:'))
            for profile in profiles_without_dept:
                self.stdout.write(f'  - Profile {profile.id}: {profile.user.username} (Role: {profile.role})')
        
        # Find task assignments to non-existent users
        self.stdout.write('\n=== TASK ASSIGNMENT INTEGRITY ===')
        
        # Get all unique assigned_to IDs from TaskInstance
        assigned_user_ids = set(
            TaskInstance.objects.exclude(assigned_to__isnull=True)
            .values_list('assigned_to_id', flat=True)
            .distinct()
        )
        
        # Check which ones don't exist
        existing_profile_ids = set(UserProfile.objects.values_list('id', flat=True))
        missing_profile_ids = assigned_user_ids - existing_profile_ids
        
        if missing_profile_ids:
            self.stdout.write(self.style.ERROR(f'Tasks assigned to non-existent UserProfile IDs: {missing_profile_ids}'))
            
            # Show affected tasks
            affected_tasks = TaskInstance.objects.filter(assigned_to_id__in=missing_profile_ids)
            self.stdout.write(f'Affected tasks: {affected_tasks.count()}')
            
            for task in affected_tasks[:10]:  # Show first 10
                self.stdout.write(f'  - Task {task.id}: {task.cleaning_item.name if task.cleaning_item else "No item"} (assigned_to_id: {task.assigned_to_id})')
            
            if affected_tasks.count() > 10:
                self.stdout.write(f'  ... and {affected_tasks.count() - 10} more tasks')
        else:
            self.stdout.write(self.style.SUCCESS('✅ All task assignments reference valid UserProfile IDs'))
        
        # Attempt fixes if requested
        if options['fix']:
            self.stdout.write('\n=== ATTEMPTING FIXES ===')
            
            with transaction.atomic():
                fixed_count = 0
                
                # Fix users without profiles
                if users_without_profiles.exists():
                    default_dept_id = options.get('department_id')
                    default_dept = None
                    
                    if default_dept_id:
                        try:
                            default_dept = Department.objects.get(id=default_dept_id)
                            self.stdout.write(f'Using default department: {default_dept.name}')
                        except Department.DoesNotExist:
                            self.stdout.write(self.style.ERROR(f'Department {default_dept_id} not found'))
                            return
                    else:
                        # Try to find a default department
                        default_dept = Department.objects.first()
                        if default_dept:
                            self.stdout.write(f'Using first available department: {default_dept.name}')
                    
                    if default_dept:
                        for user in users_without_profiles:
                            UserProfile.objects.create(
                                user=user,
                                role='staff',  # Default role
                                department=default_dept
                            )
                            fixed_count += 1
                            self.stdout.write(f'  ✅ Created UserProfile for {user.username}')
                    else:
                        self.stdout.write(self.style.ERROR('No default department available. Use --department-id option.'))
                
                # Fix profiles without departments
                if profiles_without_dept.exists() and default_dept:
                    for profile in profiles_without_dept:
                        profile.department = default_dept
                        profile.save()
                        fixed_count += 1
                        self.stdout.write(f'  ✅ Assigned department to {profile.user.username}')
                
                # Handle tasks with missing user assignments
                if missing_profile_ids:
                    self.stdout.write(self.style.WARNING('Tasks with invalid assignments need manual review'))
                    self.stdout.write('Consider reassigning these tasks to valid users or setting assigned_to=NULL')
                
                self.stdout.write(f'\n✅ Fixed {fixed_count} integrity issues')
        
        else:
            self.stdout.write('\n💡 Run with --fix to attempt automatic repairs')
            self.stdout.write('💡 Use --department-id <ID> to specify default department for new profiles')
        
        self.stdout.write('\n=== AUDIT COMPLETE ===')
