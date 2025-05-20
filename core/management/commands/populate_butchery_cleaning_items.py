import csv
from django.core.management.base import BaseCommand
from django.conf import settings
import os
from core.models import Department, CleaningItem

class Command(BaseCommand):
    help = 'Populates CleaningItems for the Butchery department from a CSV file.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate Butchery cleaning items...'))

        # Get the Butchery department
        try:
            butchery_department = Department.objects.get(name='Butchery')
            self.stdout.write(self.style.SUCCESS(f'Found department: {butchery_department.name}'))
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR('Department "Butchery" not found. Please run populate_butchery_staff first.'))
            return

        # Path to the CSV file
        # Assuming the docs directory is at the project root level alongside 'core', 'frontend' etc.
        csv_file_path = os.path.join(settings.BASE_DIR, 'docs', 'BUTCHERY_CLEANING_SCHEDULE - Sheet1.csv')

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'CSV file not found at: {csv_file_path}'))
            self.stdout.write(self.style.WARNING(f'BASE_DIR is: {settings.BASE_DIR}'))
            return

        # Define a mapping for frequency values
        def get_frequency_key(csv_frequency_value):
            val = csv_frequency_value.lower()
            if 'daily' in val:
                return 'daily'
            elif 'weekly' in val:
                return 'weekly'
            elif 'monthly' in val:
                return 'monthly'
            # Add more mappings if needed
            else:
                self.stdout.write(self.style.WARNING(f'Unknown frequency "{csv_frequency_value}", defaulting to adhoc.'))
                return 'adhoc' # Default if no specific match

        items_created_count = 0
        items_updated_count = 0

        try:
            with open(csv_file_path, mode='r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    item_name = row.get('ITEM', '').strip()
                    frequency_csv = row.get('CLEANING FREQUENCY', '').strip()
                    equipment = row.get('CLEANING EQUIPMENT', '').strip()
                    chemical = row.get('CLEANING CHEMICAL', '').strip()
                    method = row.get('METHOD', '').strip()

                    if not item_name:
                        self.stdout.write(self.style.WARNING('Skipping row with no ITEM name.'))
                        continue
                    
                    frequency_key = get_frequency_key(frequency_csv)

                    cleaning_item, created = CleaningItem.objects.get_or_create(
                        name=item_name,
                        department=butchery_department,
                        defaults={
                            'frequency': frequency_key,
                            'equipment': equipment,
                            'chemical': chemical,
                            'method': method
                        }
                    )

                    if created:
                        items_created_count += 1
                        self.stdout.write(self.style.SUCCESS(f'Created cleaning item: {item_name}'))
                    else:
                        # Update existing item if details differ
                        updated_fields = False
                        if cleaning_item.frequency != frequency_key:
                            cleaning_item.frequency = frequency_key
                            updated_fields = True
                        if cleaning_item.equipment != equipment:
                            cleaning_item.equipment = equipment
                            updated_fields = True
                        if cleaning_item.chemical != chemical:
                            cleaning_item.chemical = chemical
                            updated_fields = True
                        if cleaning_item.method != method:
                            cleaning_item.method = method
                            updated_fields = True
                        
                        if updated_fields:
                            cleaning_item.save()
                            items_updated_count += 1
                            self.stdout.write(self.style.SUCCESS(f'Updated cleaning item: {item_name}'))
                        else:
                            self.stdout.write(self.style.WARNING(f'Cleaning item already exists and is up to date: {item_name}'))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Could not find the CSV file at {csv_file_path}'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Butchery cleaning items population complete. {items_created_count} created, {items_updated_count} updated.'))
