"""
Django management command to investigate and migrate thermometer verification assignment data
from the original schema to the Cape Station tenant schema.
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from core.models import ThermometerVerificationAssignment, UserProfile, Department
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Investigate and migrate thermometer verification assignment data from original to Cape Station tenant'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually migrating',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if data already exists in tenant',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write(self.style.SUCCESS('=== Thermometer Verification Assignment Data Migration ==='))
        
        # Step 1: Check original schema data
        self.stdout.write('\n1. Checking original schema (public) for thermometer verification assignments...')
        original_data = self.get_original_data()
        
        if not original_data:
            self.stdout.write(self.style.WARNING('No thermometer verification assignments found in original schema.'))
            return
            
        self.stdout.write(f'Found {len(original_data)} thermometer verification assignments in original schema.')
        
        # Step 2: Check current tenant data
        self.stdout.write('\n2. Checking Cape Station tenant schema for existing data...')
        tenant_data = self.get_tenant_data()
        self.stdout.write(f'Found {len(tenant_data)} thermometer verification assignments in Cape Station tenant.')
        
        # Step 3: Analyze differences
        self.stdout.write('\n3. Analyzing data differences...')
        missing_assignments = self.analyze_differences(original_data, tenant_data)
        
        if not missing_assignments and not force:
            self.stdout.write(self.style.SUCCESS('All thermometer verification assignments are already present in Cape Station tenant.'))
            return
            
        # Step 4: Display migration plan
        self.stdout.write(f'\n4. Migration plan: {len(missing_assignments)} assignments to migrate')
        for assignment in missing_assignments:
            staff_info = self.get_staff_info(assignment['staff_id'])
            dept_info = self.get_department_info(assignment['department_id'])
            self.stdout.write(f'   - Staff: {staff_info} | Dept: {dept_info} | Date: {assignment["assigned_date"]} | Active: {assignment["is_active"]}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY RUN] No actual migration performed.'))
            return
            
        # Step 5: Perform migration
        self.stdout.write('\n5. Performing migration...')
        migrated_count = self.migrate_assignments(missing_assignments, force)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Migration completed! {migrated_count} thermometer verification assignments migrated to Cape Station tenant.'))

    def get_original_data(self):
        """Get thermometer verification assignments from original (public) schema"""
        with connection.cursor() as cursor:
            try:
                cursor.execute('SET search_path TO public;')
                cursor.execute('''
                    SELECT id, staff_id, department_id, assigned_date, is_active 
                    FROM core_thermometerverificationassignment 
                    ORDER BY id;
                ''')
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error accessing original schema: {e}'))
                return []

    def get_tenant_data(self):
        """Get thermometer verification assignments from Cape Station tenant schema"""
        try:
            assignments = ThermometerVerificationAssignment.objects.all().values(
                'id', 'staff_id', 'department_id', 'assigned_date', 'is_active'
            )
            return list(assignments)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error accessing tenant schema: {e}'))
            return []

    def analyze_differences(self, original_data, tenant_data):
        """Compare original and tenant data to find missing assignments"""
        tenant_keys = set()
        for assignment in tenant_data:
            key = (assignment['staff_id'], assignment['department_id'], str(assignment['assigned_date']))
            tenant_keys.add(key)
        
        missing_assignments = []
        for assignment in original_data:
            key = (assignment['staff_id'], assignment['department_id'], str(assignment['assigned_date']))
            if key not in tenant_keys:
                missing_assignments.append(assignment)
        
        return missing_assignments

    def get_staff_info(self, staff_id):
        """Get staff information for display"""
        try:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path TO public;')
                cursor.execute('SELECT username, first_name, last_name FROM auth_user WHERE id = %s;', [staff_id])
                row = cursor.fetchone()
                if row:
                    username, first_name, last_name = row
                    return f"{username} ({first_name} {last_name})" if first_name or last_name else username
                return f"User ID {staff_id}"
        except:
            return f"User ID {staff_id}"

    def get_department_info(self, department_id):
        """Get department information for display"""
        try:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path TO public;')
                cursor.execute('SELECT name FROM core_department WHERE id = %s;', [department_id])
                row = cursor.fetchone()
                if row:
                    return row[0]
                return f"Dept ID {department_id}"
        except:
            return f"Dept ID {department_id}"

    def migrate_assignments(self, missing_assignments, force):
        """Migrate missing thermometer verification assignments to tenant"""
        migrated_count = 0
        
        with transaction.atomic():
            for assignment in missing_assignments:
                try:
                    # Check if staff and department exist in tenant
                    staff_exists = User.objects.filter(id=assignment['staff_id']).exists()
                    department_exists = Department.objects.filter(id=assignment['department_id']).exists()
                    
                    if not staff_exists:
                        self.stdout.write(self.style.WARNING(f'   Skipping assignment - Staff ID {assignment["staff_id"]} not found in tenant'))
                        continue
                        
                    if not department_exists:
                        self.stdout.write(self.style.WARNING(f'   Skipping assignment - Department ID {assignment["department_id"]} not found in tenant'))
                        continue
                    
                    # Create the assignment in tenant
                    ThermometerVerificationAssignment.objects.create(
                        staff_id=assignment['staff_id'],
                        department_id=assignment['department_id'],
                        assigned_date=assignment['assigned_date'],
                        is_active=assignment['is_active']
                    )
                    
                    staff_info = self.get_staff_info(assignment['staff_id'])
                    dept_info = self.get_department_info(assignment['department_id'])
                    self.stdout.write(f'   ✅ Migrated: {staff_info} | {dept_info} | {assignment["assigned_date"]}')
                    migrated_count += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'   ❌ Failed to migrate assignment: {e}'))
        
        return migrated_count
