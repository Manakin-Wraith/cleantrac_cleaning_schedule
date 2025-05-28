from django.core.management.base import BaseCommand
from core.models import Department, CleaningItem

class Command(BaseCommand):
    help = 'Verifies and displays a few cleaning items for the Bakery department.'

    def handle(self, *args, **options):
        bakery_department_name = "Bakery"
        try:
            department = Department.objects.get(name=bakery_department_name)
            self.stdout.write(self.style.SUCCESS(f'Found department: "{department.name}"'))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department "{bakery_department_name}" not found.'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred while fetching department: {e}'))
            return

        cleaning_items = CleaningItem.objects.filter(department=department).order_by('name')[:5] # Get first 5 items

        if not cleaning_items.exists():
            self.stdout.write(self.style.WARNING(f'No cleaning items found for the "{bakery_department_name}" department.'))
            return

        self.stdout.write(self.style.SUCCESS(f'\nFirst 5 cleaning items for "{bakery_department_name}":'))
        for item in cleaning_items:
            self.stdout.write(
                f'  - Name: {item.name}\n' \
                f'    Frequency: {item.get_frequency_display()}\n' \
                f'    Equipment: {item.equipment}\n' \
                f'    Chemical: {item.chemical}\n' \
                f'    Method: {item.method}\n'
            )

        total_items = CleaningItem.objects.filter(department=department).count()
        self.stdout.write(self.style.SUCCESS(f'\nTotal cleaning items for Bakery: {total_items}'))

        if total_items == 40:
            self.stdout.write(self.style.SUCCESS('Data verification successful: Correct number of items imported.'))
        else:
            self.stdout.write(self.style.WARNING(f'Data verification discrepancy: Expected 40 items, found {total_items}.'))
