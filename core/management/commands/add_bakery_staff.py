from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import Department, UserProfile

class Command(BaseCommand):
    help = 'Adds a manager and staff members to the Bakery department.'

    def handle(self, *args, **options):
        bakery_department_name = "Bakery"
        manager_username = "monica" # Usernames are typically lowercase
        staff_usernames = ["swazi", "princess", "phumla", "max", "tami", "qhawe", "lutho", "skwash", "phelisa", "zikhona", "cebisa"]
        default_password = "changeme123" # IMPORTANT: Advise to change this immediately

        try:
            department = Department.objects.get(name=bakery_department_name)
            self.stdout.write(self.style.SUCCESS(f'Found department: "{department.name}"'))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department "{bakery_department_name}" not found. Please run the import_bakery_schedule command first.'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred while fetching department: {e}'))
            return

        # Add/Update Manager
        self.stdout.write(f'Processing manager: {manager_username}')
        manager_user, user_created = User.objects.get_or_create(
            username=manager_username,
            defaults={'first_name': 'Monica', 'email': f'{manager_username}@example.com'} # Add email for uniqueness if needed
        )
        if user_created:
            manager_user.set_password(default_password)
            manager_user.save()
            self.stdout.write(self.style.WARNING(f'Created user "{manager_username}" with default password "{default_password}". Please change it.'))
        
        profile, profile_created = UserProfile.objects.update_or_create(
            user=manager_user,
            defaults={'department': department, 'role': 'manager'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Created profile for manager "{manager_username}" and assigned to Bakery.'))
        else:
            if profile.department != department or profile.role != 'manager':
                 profile.department = department
                 profile.role = 'manager'
                 profile.save()
                 self.stdout.write(self.style.SUCCESS(f'Updated profile for manager "{manager_username}" to Bakery and manager role.'))
            else:
                self.stdout.write(self.style.WARNING(f'Profile for manager "{manager_username}" already up-to-date.'))

        # Add/Update Staff
        for staff_username_original in staff_usernames:
            staff_username = staff_username_original.lower() # Ensure lowercase for username
            self.stdout.write(f'Processing staff: {staff_username}')
            staff_user, user_created = User.objects.get_or_create(
                username=staff_username,
                defaults={'first_name': staff_username_original, 'email': f'{staff_username}@example.com'}
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
                self.stdout.write(self.style.SUCCESS(f'Created profile for staff "{staff_username}" and assigned to Bakery.'))
            else:
                if staff_profile.department != department or staff_profile.role != 'staff':
                    staff_profile.department = department
                    staff_profile.role = 'staff'
                    staff_profile.save()
                    self.stdout.write(self.style.SUCCESS(f'Updated profile for staff "{staff_username}" to Bakery and staff role.'))
                else:
                    self.stdout.write(self.style.WARNING(f'Profile for staff "{staff_username}" already up-to-date.'))

        self.stdout.write(self.style.SUCCESS('Bakery staff and manager processing complete.'))
