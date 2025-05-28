from django.core.management.base import BaseCommand
from core.models import Department, CleaningItem

class Command(BaseCommand):
    help = 'Verifies and displays a few cleaning items for the HMR department.'

    def handle(self, *args, **options):
        hmr_department_name = "HMR"
        try:
            department = Department.objects.get(name=hmr_department_name)
            self.stdout.write(self.style.SUCCESS(f'Found department: "{department.name}"'))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department "{hmr_department_name}" not found.'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred while fetching department: {e}'))
            return

        cleaning_items = CleaningItem.objects.filter(department=department).order_by('name')[:5] # Get first 5 items

        if not cleaning_items.exists():
            self.stdout.write(self.style.WARNING(f'No cleaning items found for the "{hmr_department_name}" department.'))
            return

        self.stdout.write(self.style.SUCCESS(f'\nFirst 5 cleaning items for "{hmr_department_name}":'))
        for item in cleaning_items:
            self.stdout.write(
                f'  - Name: {item.name}\n' \
                f'    Frequency: {item.get_frequency_display()}\n' \
                f'    Equipment: {item.equipment}\n' \
                f'    Chemical: {item.chemical}\n' \
                f'    Method: {item.method}\n'
            )

        total_items = CleaningItem.objects.filter(department=department).count()
        self.stdout.write(self.style.SUCCESS(f'\nTotal cleaning items for HMR: {total_items}'))

        # Assuming the CSV had 37 items based on the import script output
        if total_items == 37:
            self.stdout.write(self.style.SUCCESS('Data verification successful: Correct number of items imported for HMR.'))
        else:
            self.stdout.write(self.style.WARNING(f'Data verification discrepancy for HMR: Expected 37 items, found {total_items}.'))
