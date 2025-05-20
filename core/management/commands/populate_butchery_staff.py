from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Department, UserProfile

class Command(BaseCommand):
    help = 'Populates the database with staff for the Butchery department and assigns Clive Ezaya as manager.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate Butchery staff...'))

        # Get or create the Butchery department
        butchery_department, created = Department.objects.get_or_create(name='Butchery')
        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created department: {butchery_department.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Department already exists: {butchery_department.name}'))

        staff_names = [
            "Sipho", "Asavela", "Sinazo", "Lukhanyo", "Wendy", "Sinako", 
            "Thato", "Athi", "Fatima", "Ayabulela", "Thandaswa", "Pamela", 
            "Nosiviwe", "Thandiwe"
        ]
        
        manager_full_name = "Clive Ezaya"
        manager_first_name = "Clive"
        manager_last_name = "Ezaya"
        manager_username = "clive.ezaya"

        default_password = 'password123' # Advise users to change this

        # Create or update Manager
        manager_user, user_created = User.objects.get_or_create(
            username=manager_username,
            defaults={'first_name': manager_first_name, 'last_name': manager_last_name, 'email': f'{manager_username}@example.com'}
        )
        if user_created:
            manager_user.set_password(default_password)
            manager_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created manager user: {manager_user.username}'))
        else:
            # Optionally update names if user already exists but details might have changed
            manager_user.first_name = manager_first_name
            manager_user.last_name = manager_last_name
            manager_user.save()
            self.stdout.write(self.style.WARNING(f'Manager user already exists: {manager_user.username}'))

        profile, profile_created = UserProfile.objects.get_or_create(
            user=manager_user,
            defaults={'department': butchery_department, 'role': 'manager'}
        )
        if profile_created:
            self.stdout.write(self.style.SUCCESS(f'Assigned {manager_user.username} to {butchery_department.name} as Manager'))
        else:
            # Ensure role and department are correct if profile existed
            profile.department = butchery_department
            profile.role = 'manager'
            profile.save()
            self.stdout.write(self.style.WARNING(f'Profile for {manager_user.username} already exists, updated role/department if necessary.'))


        # Create or update Staff members
        for name in staff_names:
            username = name.lower()
            first_name = name

            user, user_created = User.objects.get_or_create(
                username=username,
                defaults={'first_name': first_name, 'email': f'{username}@example.com'}
            )
            if user_created:
                user.set_password(default_password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created staff user: {user.username}'))
            else:
                user.first_name = first_name # Update first name if user existed
                user.save()
                self.stdout.write(self.style.WARNING(f'Staff user already exists: {user.username}'))

            staff_profile, staff_profile_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'department': butchery_department, 'role': 'staff'}
            )
            if staff_profile_created:
                self.stdout.write(self.style.SUCCESS(f'Assigned {user.username} to {butchery_department.name} as Staff'))
            else:
                # Ensure role and department are correct if profile existed
                staff_profile.department = butchery_department
                staff_profile.role = 'staff'
                staff_profile.save()
                self.stdout.write(self.style.WARNING(f'Profile for {user.username} already exists, updated role/department if necessary.'))

        self.stdout.write(self.style.SUCCESS('Butchery staff population complete. Default password for new users is \"password123\".'))
