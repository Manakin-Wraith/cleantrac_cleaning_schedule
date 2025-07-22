"""
Management command to perform comprehensive analysis of staff data between schemas.

This command compares all user and staff data between the original (public) schema
and the Cape Station tenant schema to identify any missing or mismatched data.
"""

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Analyze and compare staff data between public and Cape Station schemas'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== COMPREHENSIVE STAFF DATA ANALYSIS ==='))
        
        # Get data from both schemas
        self.stdout.write('\n--- ORIGINAL DATA (Public Schema) ---')
        original_users = self.get_user_data('public')
        self.stdout.write(f'Total users in original: {len(original_users)}')

        self.stdout.write('\n--- CAPE STATION DATA (Tenant Schema) ---')
        tenant_users = self.get_user_data('capestation')
        self.stdout.write(f'Total users in Cape Station: {len(tenant_users)}')

        # Perform detailed comparison
        self.compare_user_data(original_users, tenant_users)
        
        # Show department breakdowns
        self.show_department_breakdown('public', 'ORIGINAL SCHEMA')
        self.show_department_breakdown('capestation', 'CAPE STATION')
        
        # Show detailed staff information
        self.show_detailed_staff_info('public', 'ORIGINAL SCHEMA')
        self.show_detailed_staff_info('capestation', 'CAPE STATION')

        self.stdout.write(self.style.SUCCESS('\n=== ANALYSIS COMPLETE ==='))

    def get_user_data(self, schema_name):
        """Get all user data from specified schema"""
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO {schema_name}')
            
            cursor.execute('''
                SELECT u.id, u.username, u.first_name, u.last_name, u.email, 
                       u.is_staff, u.is_active, u.is_superuser, u.date_joined,
                       up.phone_number, up.department_id, up.role,
                       d.name as department_name
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                ORDER BY u.id
            ''')
            
            return cursor.fetchall()

    def compare_user_data(self, original_users, tenant_users):
        """Compare user data between schemas"""
        self.stdout.write('\n=== DETAILED COMPARISON ===')

        # Create dictionaries for easy comparison
        original_dict = {user[1]: user for user in original_users}  # username as key
        tenant_dict = {user[1]: user for user in tenant_users}

        # Find users in original but not in tenant
        missing_users = []
        for username, user_data in original_dict.items():
            if username not in tenant_dict:
                missing_users.append(user_data)

        if missing_users:
            self.stdout.write(f'\n❌ MISSING USERS IN CAPE STATION ({len(missing_users)}):')
            for user in missing_users:
                dept_name = user[12] or "No Dept"
                role = user[11] or "None"
                self.stdout.write(f'  - {user[1]} ({user[2]} {user[3]}) - {dept_name} - Role: {role} - Staff: {user[5]} - Super: {user[7]}')
        else:
            self.stdout.write('\n✅ All original users are present in Cape Station')

        # Find users with different data
        data_mismatches = []
        for username in original_dict:
            if username in tenant_dict:
                orig = original_dict[username]
                tenant = tenant_dict[username]
                
                # Compare key fields
                mismatches = []
                if orig[2] != tenant[2]: mismatches.append(f'first_name: "{orig[2]}" -> "{tenant[2]}"')
                if orig[3] != tenant[3]: mismatches.append(f'last_name: "{orig[3]}" -> "{tenant[3]}"')
                if orig[4] != tenant[4]: mismatches.append(f'email: "{orig[4]}" -> "{tenant[4]}"')
                if orig[5] != tenant[5]: mismatches.append(f'is_staff: {orig[5]} -> {tenant[5]}')
                if orig[7] != tenant[7]: mismatches.append(f'is_superuser: {orig[7]} -> {tenant[7]}')
                if orig[9] != tenant[9]: mismatches.append(f'phone: "{orig[9]}" -> "{tenant[9]}"')
                if orig[10] != tenant[10]: mismatches.append(f'dept_id: {orig[10]} -> {tenant[10]}')
                if orig[11] != tenant[11]: mismatches.append(f'role: "{orig[11]}" -> "{tenant[11]}"')
                
                if mismatches:
                    data_mismatches.append((username, mismatches))

        if data_mismatches:
            self.stdout.write(f'\n⚠️  DATA MISMATCHES FOUND ({len(data_mismatches)}):')
            for username, mismatches in data_mismatches:
                self.stdout.write(f'  - {username}:')
                for mismatch in mismatches:
                    self.stdout.write(f'    * {mismatch}')
        else:
            self.stdout.write('\n✅ All user data matches between schemas')

    def show_department_breakdown(self, schema_name, title):
        """Show staff breakdown by department"""
        self.stdout.write(f'\n=== {title} STAFF BREAKDOWN ===')
        
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO {schema_name}')
            
            cursor.execute('''
                SELECT d.name, COUNT(u.id) as user_count,
                       COUNT(CASE WHEN u.is_staff = true THEN 1 END) as staff_count,
                       COUNT(CASE WHEN u.is_superuser = true THEN 1 END) as super_count
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                WHERE u.is_active = true
                GROUP BY d.name
                ORDER BY user_count DESC
            ''')
            
            dept_breakdown = cursor.fetchall()
            for dept in dept_breakdown:
                dept_name = dept[0] or 'No Department'
                self.stdout.write(f'  - {dept_name}: {dept[1]} users ({dept[2]} staff, {dept[3]} superusers)')

    def show_detailed_staff_info(self, schema_name, title):
        """Show detailed staff information"""
        self.stdout.write(f'\n=== {title} DETAILED STAFF INFO ===')
        
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO {schema_name}')
            
            # Show superusers
            cursor.execute('''
                SELECT u.username, u.first_name, u.last_name, u.email,
                       up.role, d.name as department_name
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                WHERE u.is_superuser = true AND u.is_active = true
                ORDER BY u.username
            ''')
            
            superusers = cursor.fetchall()
            self.stdout.write(f'\nSUPERUSERS ({len(superusers)}):')
            for user in superusers:
                dept = user[5] or 'No Dept'
                role = user[4] or 'No Role'
                self.stdout.write(f'  - {user[0]} ({user[1]} {user[2]}) - {dept} - {role}')
            
            # Show staff users (non-superuser)
            cursor.execute('''
                SELECT u.username, u.first_name, u.last_name, u.email,
                       up.role, d.name as department_name
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                WHERE u.is_staff = true AND u.is_superuser = false AND u.is_active = true
                ORDER BY d.name, u.username
            ''')
            
            staff_users = cursor.fetchall()
            self.stdout.write(f'\nSTAFF USERS ({len(staff_users)}):')
            current_dept = None
            for user in staff_users:
                dept = user[5] or 'No Dept'
                if dept != current_dept:
                    self.stdout.write(f'\n  {dept}:')
                    current_dept = dept
                role = user[4] or 'No Role'
                self.stdout.write(f'    - {user[0]} ({user[1]} {user[2]}) - {role}')
            
            # Show regular users
            cursor.execute('''
                SELECT u.username, u.first_name, u.last_name, u.email,
                       up.role, d.name as department_name
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                WHERE u.is_staff = false AND u.is_active = true
                ORDER BY d.name, u.username
            ''')
            
            regular_users = cursor.fetchall()
            self.stdout.write(f'\nREGULAR USERS ({len(regular_users)}):')
            current_dept = None
            for user in regular_users[:10]:  # Show first 10 to avoid too much output
                dept = user[5] or 'No Dept'
                if dept != current_dept:
                    self.stdout.write(f'\n  {dept}:')
                    current_dept = dept
                role = user[4] or 'No Role'
                self.stdout.write(f'    - {user[0]} ({user[1]} {user[2]}) - {role}')
            
            if len(regular_users) > 10:
                self.stdout.write(f'    ... and {len(regular_users) - 10} more regular users')

        # Reset search path
        with connection.cursor() as cursor:
            cursor.execute('SET search_path TO public')
