import csv
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
from core.models import Department, CleaningItem

class Command(BaseCommand):
    help = 'Adds the Bakery department and imports its cleaning schedule from a CSV file.'

    def handle(self, *args, **options):
        # 1. Add "Bakery" department
        bakery_department_name = "Bakery"
        department, created = Department.objects.get_or_create(name=bakery_department_name)
        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created department "{bakery_department_name}"'))
        else:
            self.stdout.write(self.style.WARNING(f'Department "{bakery_department_name}" already exists.'))

        # 2. Define CSV file path
        # Assuming the CSV is in the 'docs' folder at the project root
        csv_file_path = os.path.join(settings.BASE_DIR, 'docs', 'Bakery_cleaning_schedule - Sheet1.csv')

        if not os.path.exists(csv_file_path):
            raise CommandError(f'CSV file not found at {csv_file_path}')

        self.stdout.write(f'Importing cleaning schedule from {csv_file_path}...') 

        # 3. Read CSV and create CleaningItem instances
        try:
            with open(csv_file_path, mode='r', encoding='utf-8') as file:
                # Adjust for the header having a trailing comma
                header = file.readline().strip().rstrip(',').split(',') 
                reader = csv.DictReader(file, fieldnames=header)
                
                items_created_count = 0
                items_updated_count = 0

                for row_number, row in enumerate(reader, start=2): # start=2 because header is line 1
                    item_name = row.get('ITEM', '').strip()
                    frequency_raw = row.get('FREQUENCY OF CLEANING', '').strip()
                    equipment = row.get('CLEANING EQUIPMENT', '').strip()
                    chemical = row.get('CLEANING CHEMICAL', '').strip()
                    method = row.get('METHOD', '').strip()

                    if not item_name:
                        self.stdout.write(self.style.WARNING(f'Skipping row {row_number} due to missing ITEM name.'))
                        continue
                    
                    # Handle potential trailing hyphen in the last column if it's method
                    if method.endswith('-'):
                        method = method[:-1].strip()

                    # Map frequency
                    frequency_cleaned = frequency_raw.split(' ')[0].lower()
                    valid_frequencies = [choice[0] for choice in CleaningItem.FREQUENCY_CHOICES]
                    if frequency_cleaned not in valid_frequencies:
                        # Fallback or default if mapping is not direct
                        # For "Daily or when visibly soiled", we want 'daily'
                        if "daily" in frequency_raw.lower():
                            frequency_cleaned = 'daily'
                        elif "weekly" in frequency_raw.lower():
                            frequency_cleaned = 'weekly'
                        elif "monthly" in frequency_raw.lower():
                            frequency_cleaned = 'monthly'
                        elif "as needed" in frequency_raw.lower() or "visibly soiled" in frequency_raw.lower():
                            frequency_cleaned = 'as_needed'
                        else:
                            self.stdout.write(self.style.WARNING(f'Could not map frequency "{frequency_raw}" for item "{item_name}". Using "as_needed" as default.'))
                            frequency_cleaned = 'as_needed' # Default fallback

                    # Create or update CleaningItem
                    obj, item_created = CleaningItem.objects.update_or_create(
                        name=item_name,
                        department=department,
                        defaults={
                            'frequency': frequency_cleaned,
                            'equipment': equipment,
                            'chemical': chemical,
                            'method': method
                        }
                    )

                    if item_created:
                        items_created_count += 1
                    else:
                        items_updated_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'Successfully processed CSV file.'))
            self.stdout.write(self.style.SUCCESS(f'{items_created_count} new cleaning items created for Bakery.'))
            self.stdout.write(self.style.SUCCESS(f'{items_updated_count} existing cleaning items updated for Bakery.'))

        except FileNotFoundError:
            raise CommandError(f'Error: The file {csv_file_path} was not found.')
        except Exception as e:
            raise CommandError(f'An error occurred: {e}')

        self.stdout.write(self.style.SUCCESS('Bakery cleaning schedule import process completed.'))
