"""
Django management command to migrate TemperatureCheckAssignment data 
from public schema to Cape Station tenant schema.

This addresses missing temperature assignment data in the Cape Station tenant
that exists in the original public schema.
"""

import logging
from django_tenants.management.commands import TenantCommand
from django.db import transaction, connection
from core.models import TemperatureCheckAssignment, Department
from django.contrib.auth.models import User
from django.utils import timezone

logger = logging.getLogger(__name__)

class Command(TenantCommand):
    help = 'Migrates TemperatureCheckAssignment data from public schema to Cape Station tenant schema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the migration in dry-run mode without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Enable verbose output',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        verbose = options.get('verbose', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🧪 Running in DRY RUN mode - no changes will be made'))
        
        self.stdout.write(self.style.SUCCESS('🌡️ Starting Temperature Check Assignment Migration'))
        
        # Statistics tracking
        stats = {
            'original_count': 0,
            'tenant_count_before': 0,
            'migrated': 0,
            'skipped': 0,
            'errors': 0
        }
        
        try:
            with transaction.atomic():
                # Get original data from public schema
                original_assignments = self._get_original_assignments()
                stats['original_count'] = len(original_assignments)
                
                # Get current tenant data count
                stats['tenant_count_before'] = TemperatureCheckAssignment.objects.count()
                
                self.stdout.write(f'📊 Found {stats["original_count"]} temperature assignments in original schema')
                self.stdout.write(f'📊 Current Cape Station assignments: {stats["tenant_count_before"]}')
                
                if stats['original_count'] == 0:
                    self.stdout.write(self.style.WARNING('⚠️ No original temperature assignments found'))
                    return
                
                # Process each original assignment
                for assignment_data in original_assignments:
                    try:
                        result = self._migrate_assignment(assignment_data, dry_run, verbose)
                        if result == 'migrated':
                            stats['migrated'] += 1
                        elif result == 'skipped':
                            stats['skipped'] += 1
                    except Exception as e:
                        stats['errors'] += 1
                        self.stdout.write(
                            self.style.ERROR(f'❌ Error migrating assignment {assignment_data["id"]}: {str(e)}')
                        )
                        if verbose:
                            logger.exception(f'Error migrating temperature assignment {assignment_data["id"]}')
                
                # Final statistics
                self._print_final_stats(stats, dry_run)
                
                if dry_run:
                    # Rollback transaction in dry-run mode
                    transaction.set_rollback(True)
                    self.stdout.write(self.style.WARNING('🧪 Dry run complete - no changes committed'))
                else:
                    self.stdout.write(self.style.SUCCESS('✅ Migration completed successfully'))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'💥 Migration failed: {str(e)}'))
            logger.exception('Temperature assignment migration failed')
            raise

    def _get_original_assignments(self):
        """Fetch temperature check assignments from public schema"""
        with connection.cursor() as cursor:
            cursor.execute('SET search_path TO public')
            cursor.execute('''
                SELECT 
                    tca.id,
                    tca.assigned_date,
                    tca.time_period,
                    tca.department_id,
                    tca.staff_member_id,
                    tca.assigned_by_id,
                    tca.is_active,
                    tca.notes,
                    tca.created_at,
                    tca.updated_at,
                    u.username as staff_username,
                    u.first_name as staff_first_name,
                    u.last_name as staff_last_name,
                    ab.username as assigned_by_username
                FROM core_temperaturecheckassignment tca
                LEFT JOIN auth_user u ON tca.staff_member_id = u.id
                LEFT JOIN auth_user ab ON tca.assigned_by_id = ab.id
                ORDER BY tca.id
            ''')
            
            columns = [desc[0] for desc in cursor.description]
            assignments = []
            
            for row in cursor.fetchall():
                assignment_dict = dict(zip(columns, row))
                assignments.append(assignment_dict)
            
            return assignments

    def _migrate_assignment(self, assignment_data, dry_run=False, verbose=False):
        """Migrate a single temperature check assignment"""
        
        # Check if assignment already exists in tenant
        existing = TemperatureCheckAssignment.objects.filter(
            assigned_date=assignment_data['assigned_date'],
            time_period=assignment_data['time_period'],
            staff_member_id=assignment_data['staff_member_id'],
            department_id=assignment_data['department_id']
        ).first()
        
        if existing:
            if verbose:
                self.stdout.write(f'⏭️ Assignment for {assignment_data["staff_username"]} on {assignment_data["assigned_date"]} {assignment_data["time_period"]} already exists, skipping')
            return 'skipped'
        
        # Verify department exists in tenant
        try:
            department = Department.objects.get(id=assignment_data['department_id'])
        except Department.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Department ID {assignment_data["department_id"]} not found in tenant')
            )
            return 'error'
        
        # Verify staff member exists (auth_user is in public schema, so we check UserProfile)
        from core.models import UserProfile
        try:
            user_profile = UserProfile.objects.get(user_id=assignment_data['staff_member_id'])
        except UserProfile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ UserProfile for staff ID {assignment_data["staff_member_id"]} not found in tenant')
            )
            return 'error'
        
        # Verify assigned_by user exists
        try:
            assigned_by_profile = UserProfile.objects.get(user_id=assignment_data['assigned_by_id'])
        except UserProfile.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ UserProfile for assigned_by ID {assignment_data["assigned_by_id"]} not found in tenant')
            )
            return 'error'
        
        if verbose:
            self.stdout.write(f'📋 Migrating assignment: {assignment_data["staff_username"]} ({assignment_data["staff_first_name"]} {assignment_data["staff_last_name"]})')
            self.stdout.write(f'   📅 Date: {assignment_data["assigned_date"]}, Period: {assignment_data["time_period"]}')
            self.stdout.write(f'   🏢 Department: {department.name}')
            self.stdout.write(f'   👤 Assigned by: {assignment_data["assigned_by_username"]}')
        
        if not dry_run:
            # Create the assignment in tenant schema
            TemperatureCheckAssignment.objects.create(
                assigned_date=assignment_data['assigned_date'],
                time_period=assignment_data['time_period'],
                department_id=assignment_data['department_id'],
                staff_member_id=assignment_data['staff_member_id'],
                assigned_by_id=assignment_data['assigned_by_id'],
                is_active=assignment_data['is_active'],
                notes=assignment_data['notes'] or '',
                created_at=assignment_data['created_at'],
                updated_at=assignment_data['updated_at']
            )
        
        return 'migrated'

    def _print_final_stats(self, stats, dry_run):
        """Print final migration statistics"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('📊 MIGRATION STATISTICS'))
        self.stdout.write('='*50)
        
        self.stdout.write(f'📋 Original assignments found: {stats["original_count"]}')
        self.stdout.write(f'📋 Tenant assignments before: {stats["tenant_count_before"]}')
        self.stdout.write(f'✅ Successfully migrated: {stats["migrated"]}')
        self.stdout.write(f'⏭️ Skipped (already exist): {stats["skipped"]}')
        self.stdout.write(f'❌ Errors encountered: {stats["errors"]}')
        
        if not dry_run:
            final_count = TemperatureCheckAssignment.objects.count()
            self.stdout.write(f'📋 Final tenant assignments: {final_count}')
            self.stdout.write(f'📈 Net increase: {final_count - stats["tenant_count_before"]}')
        
        self.stdout.write('='*50)
        
        if stats['migrated'] > 0:
            self.stdout.write(self.style.SUCCESS(f'🎉 Migration successful! {stats["migrated"]} temperature assignments migrated.'))
        elif stats['skipped'] > 0:
            self.stdout.write(self.style.WARNING(f'ℹ️ All {stats["skipped"]} assignments already existed in tenant.'))
        else:
            self.stdout.write(self.style.WARNING('⚠️ No assignments were migrated.'))
