from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import Department, UserProfile

class Command(BaseCommand):
    help = 'Adds a manager and staff members to the HMR department.'

    def handle(self, *args, **options):
        hmr_department_name = "HMR"
        manager_username = "monica" # Usernames are typically lowercase
        staff_usernames_hmr = ["Ntombi", "Zintle", "Zuzu", "Nomhle", "Bulana", "Nonnie", "Faniswa", "Nolubabalo", "Agie", "Nandipha", "Khanyisa"]
        default_password = "changeme123" # IMPORTANT: Advise to change this immediately

        try:
            department, dept_created = Department.objects.get_or_create(name=hmr_department_name)
            if dept_created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created department: "{department.name}"'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Found department: "{department.name}"'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred while fetching/creating department: {e}'))
            return

        # Add/Update Manager
        self.stdout.write(f'Processing manager: {manager_username} for HMR department')
        manager_user, user_created = User.objects.get_or_create(
            username=manager_username,
            defaults={'first_name': 'Monica', 'email': f'{manager_username}@example.com'} # Add email for uniqueness if needed
        )
        if user_created:
            manager_user.set_password(default_password)
            manager_user.save()
            self.stdout.write(self.style.WARNING(f'Created user "{manager_username}" with default password "{default_password}". Please change it.'))
        
        # A manager can be associated with multiple departments if UserProfile.department is removed or handled differently.
        # For now, UserProfile has a ForeignKey to a single Department.
        # If Monica is already a manager in another department, this will reassign her to HMR.
        # This might not be the desired behavior if a manager can oversee multiple departments.
        # For this script, we'll assume a manager is primarily associated with one department via UserProfile for simplicity,
        # or that Monica's primary department for this context is HMR.
        profile, profile_created = UserProfile.objects.update_or_create(
            user=manager_user,
            defaults={'department': department, 'role': 'manager'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Created profile for manager "{manager_username}" and assigned to HMR.'))
        else:
            if profile.department != department or profile.role != 'manager':
                 profile.department = department
                 profile.role = 'manager'
                 profile.save()
                 self.stdout.write(self.style.SUCCESS(f'Updated profile for manager "{manager_username}" to HMR and manager role.'))
            else:
                self.stdout.write(self.style.WARNING(f'Profile for manager "{manager_username}" already up-to-date for HMR.'))


        # Add/Update Staff
        for staff_name_original in staff_usernames_hmr:
            staff_username = staff_name_original.lower() # Ensure lowercase for username
            self.stdout.write(f'Processing staff: {staff_username} for HMR department')
            staff_user, user_created = User.objects.get_or_create(
                username=staff_username,
                defaults={'first_name': staff_name_original, 'email': f'{staff_username}@example.com'}
            )
            if user_created:
                staff_user.set_password(default_password)
                staff_user.save()
                self.stdout.write(self.style.WARNING(f'Created user "{staff_username}" with default password "{default_password}". Please change it.'))
            
            staff_profile, staff_profile_created = UserProfile.objects.update_or_create(
                user=staff_user,
                defaults={'department': department, 'role': 'staff'}
            )
            if staff_profile_created:
                self.stdout.write(self.style.SUCCESS(f'Created profile for staff "{staff_username}" and assigned to HMR.'))
            else:
                if staff_profile.department != department or staff_profile.role != 'staff':
                    staff_profile.department = department
                    staff_profile.role = 'staff'
                    staff_profile.save()
                    self.stdout.write(self.style.SUCCESS(f'Updated profile for staff "{staff_username}" to HMR and staff role.'))
                else:
                    self.stdout.write(self.style.WARNING(f'Profile for staff "{staff_username}" already up-to-date for HMR.'))

        self.stdout.write(self.style.SUCCESS('HMR staff and manager processing complete.'))
