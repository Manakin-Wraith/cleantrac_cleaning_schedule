"""
Temperature Check Assignments Migration Script for Cape Station Tenant

This script migrates TemperatureCheckAssignment data from the public schema 
to the Cape Station tenant schema, ensuring proper tenant context.

Usage:
    python manage.py tenant_command fix_temperature_assignments --schema=capestation
"""

import logging
from django.core.management.base import BaseCommand
from django.db import transaction, connection
from core.models import TemperatureCheckAssignment, Department
from django.contrib.auth.models import User
from django.utils import timezone

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fixes TemperatureCheckAssignment data in Cape Station tenant schema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes to see what would be migrated',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output during migration',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        if dry_run:
            self.stdout.write("🧪 Running in DRY RUN mode - no changes will be made")
        
        self.stdout.write("🌡️ Starting Temperature Check Assignment Migration")
        
        # Check current schema context
        with connection.cursor() as cursor:
            cursor.execute('SHOW search_path')
            search_path = cursor.fetchone()[0]
            self.stdout.write(f"📍 Current search_path: {search_path}")
            
            if 'capestation' not in search_path:
                self.stdout.write(
                    self.style.ERROR("❌ Not running in tenant context! Use: python manage.py tenant_command fix_temperature_assignments --schema=capestation")
                )
                return
        
        try:
            with transaction.atomic():
                # Get original assignments from public schema
                original_assignments = self._get_original_assignments()
                self.stdout.write(f"📊 Found {len(original_assignments)} temperature assignments in original schema")
                
                # Check current tenant assignments
                current_count = TemperatureCheckAssignment.objects.count()
                self.stdout.write(f"📊 Current Cape Station assignments: {current_count}")
                
                migrated_count = 0
                skipped_count = 0
                error_count = 0
                
                for assignment_data in original_assignments:
                    try:
                        if self._assignment_exists(assignment_data):
                            if verbose:
                                self.stdout.write(f"⏭️ Assignment for {assignment_data['staff_username']} on {assignment_data['assigned_date']} {assignment_data['time_period']} already exists, skipping")
                            skipped_count += 1
                            continue
                        
                        if not dry_run:
                            self._create_assignment(assignment_data, verbose)
                        
                        migrated_count += 1
                        
                        if verbose:
                            self.stdout.write(f"✅ Migrated assignment: {assignment_data['staff_username']} on {assignment_data['assigned_date']} {assignment_data['time_period']}")
                    
                    except Exception as e:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(f"❌ Error migrating assignment {assignment_data.get('id', 'unknown')}: {str(e)}")
                        )
                        if verbose:
                            logger.exception(f"Error migrating assignment {assignment_data}")
                
                # Final verification
                final_count = TemperatureCheckAssignment.objects.count()
                
                self.stdout.write("\n" + "="*50)
                self.stdout.write("📊 MIGRATION STATISTICS")
                self.stdout.write("="*50)
                self.stdout.write(f"📋 Original assignments found: {len(original_assignments)}")
                self.stdout.write(f"📋 Tenant assignments before: {current_count}")
                self.stdout.write(f"📋 Tenant assignments after: {final_count}")
                self.stdout.write(f"✅ Successfully migrated: {migrated_count}")
                self.stdout.write(f"⏭️ Skipped (already exist): {skipped_count}")
                self.stdout.write(f"❌ Errors encountered: {error_count}")
                self.stdout.write("="*50)
                
                if migrated_count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ Successfully migrated {migrated_count} temperature check assignments!")
                    )
                elif skipped_count > 0:
                    self.stdout.write(f"ℹ️ All {skipped_count} assignments already existed in tenant.")
                else:
                    self.stdout.write("ℹ️ No assignments needed migration.")
                
                if dry_run:
                    self.stdout.write("🧪 Dry run complete - no changes committed")
                    # Rollback the transaction in dry run mode
                    transaction.set_rollback(True)
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Migration failed: {str(e)}")
            )
            logger.exception("Temperature assignments migration failed")
            raise

    def _get_original_assignments(self):
        """Get temperature assignments from public schema"""
        assignments = []
        
        with connection.cursor() as cursor:
            # Switch to public schema temporarily
            cursor.execute('SET search_path TO public')
            
            cursor.execute("""
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
            """)
            
            rows = cursor.fetchall()
            
            for row in rows:
                assignments.append({
                    'id': row[0],
                    'assigned_date': row[1],
                    'time_period': row[2],
                    'department_id': row[3],
                    'staff_member_id': row[4],
                    'assigned_by_id': row[5],
                    'is_active': row[6],
                    'notes': row[7],
                    'created_at': row[8],
                    'updated_at': row[9],
                    'staff_username': row[10],
                    'staff_first_name': row[11],
                    'staff_last_name': row[12],
                    'assigned_by_username': row[13],
                })
            
            # Switch back to tenant schema
            cursor.execute('SET search_path TO capestation, public')
        
        return assignments

    def _assignment_exists(self, assignment_data):
        """Check if assignment already exists in tenant schema"""
        return TemperatureCheckAssignment.objects.filter(
            assigned_date=assignment_data['assigned_date'],
            time_period=assignment_data['time_period'],
            staff_member_id=assignment_data['staff_member_id']
        ).exists()

    def _create_assignment(self, assignment_data, verbose=False):
        """Create temperature check assignment in tenant schema"""
        
        # Verify department exists
        try:
            department = Department.objects.get(id=assignment_data['department_id'])
        except Department.DoesNotExist:
            raise Exception(f"Department {assignment_data['department_id']} not found in tenant")
        
        # Verify staff member exists
        try:
            staff_member = User.objects.get(id=assignment_data['staff_member_id'])
        except User.DoesNotExist:
            raise Exception(f"Staff member {assignment_data['staff_member_id']} not found in tenant")
        
        # Verify assigned_by user exists
        try:
            assigned_by = User.objects.get(id=assignment_data['assigned_by_id'])
        except User.DoesNotExist:
            raise Exception(f"Assigned by user {assignment_data['assigned_by_id']} not found in tenant")
        
        # Create the assignment
        assignment = TemperatureCheckAssignment.objects.create(
            assigned_date=assignment_data['assigned_date'],
            time_period=assignment_data['time_period'],
            department=department,
            staff_member=staff_member,
            assigned_by=assigned_by,
            is_active=assignment_data['is_active'],
            notes=assignment_data['notes'] or '',
            created_at=assignment_data['created_at'],
            updated_at=assignment_data['updated_at']
        )
        
        if verbose:
            self.stdout.write(f"📝 Created assignment ID {assignment.id}")
        
        return assignment
