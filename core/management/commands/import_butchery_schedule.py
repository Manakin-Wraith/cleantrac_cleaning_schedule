import csv
import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from core.models import Department, CleaningItem


class Command(BaseCommand):
    """Import Butchery cleaning schedule from CSV into CleaningItem records.

    The command will:
    1. Ensure a `Butchery` Department exists (create if missing).
    2. Read the `BUTCHERY_CLEANING_SCHEDULE.csv` located in the `docs` directory.
    3. For each row create or update a corresponding `CleaningItem` bound to the Butchery department.
       Frequency values are mapped to `CleaningItem.FREQUENCY_CHOICES` with sensible fall-backs.
    """

    help = "Imports Butchery cleaning schedule CSV into the database."

    CSV_FILENAME = "BUTCHERY_CLEANING_SCHEDULE.csv"
    DEPARTMENT_NAME = "Butchery"

    def handle(self, *args, **options):
        # ------------------------------------------------------------------
        # 1. Ensure Department exists
        # ------------------------------------------------------------------
        department, created = Department.objects.get_or_create(name=self.DEPARTMENT_NAME)
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created department "{self.DEPARTMENT_NAME}"'))
        else:
            self.stdout.write(self.style.WARNING(f'Department "{self.DEPARTMENT_NAME}" already exists'))

        # ------------------------------------------------------------------
        # 2. Locate CSV file
        # ------------------------------------------------------------------
        csv_path = os.path.join(settings.BASE_DIR, 'docs', self.CSV_FILENAME)
        if not os.path.exists(csv_path):
            raise CommandError(f'CSV file not found: {csv_path}')

        self.stdout.write(f'Importing cleaning schedule from {csv_path} ...')

        # ------------------------------------------------------------------
        # 3. Read CSV & upsert CleaningItem records
        # ------------------------------------------------------------------
        created_count = 0
        updated_count = 0
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            # The first line may include a trailing comma → strip it.
            header = csvfile.readline().strip().rstrip(',').split(',')
            reader = csv.DictReader(csvfile, fieldnames=header)

            for line_no, row in enumerate(reader, start=2):  # header is line 1
                item_name = row.get('ITEM', '').strip()
                if not item_name:
                    self.stdout.write(self.style.WARNING(f'Skipping row {line_no}: ITEM is empty'))
                    continue

                # ------------------------------------------------------------------
                # Frequency mapping logic (reuse from bakery import)
                # ------------------------------------------------------------------
                raw_freq = row.get('CLEANING FREQUENCY', '').strip()
                freq = self._map_frequency(raw_freq)

                equipment = row.get('CLEANING EQUIPMENT', '').strip()
                chemical = row.get('CLEANING CHEMICAL', '').strip()
                method = row.get('METHOD', '').strip().rstrip('-').strip()

                obj, was_created = CleaningItem.objects.update_or_create(
                    name=item_name,
                    department=department,
                    defaults={
                        'frequency': freq,
                        'equipment': equipment,
                        'chemical': chemical,
                        'method': method,
                    },
                )
                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        # ------------------------------------------------------------------
        # 4. Summary output
        # ------------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS('Import completed successfully'))
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} new items'))
        self.stdout.write(self.style.SUCCESS(f'Updated {updated_count} existing items'))

    # ------------------------------------------------------------------
    # Helper Methods
    # ------------------------------------------------------------------
    def _map_frequency(self, raw: str) -> str:
        """Convert free-text frequency into one of CleaningItem.FREQUENCY_CHOICES keys."""
        if not raw:
            return 'as_needed'
        raw_lower = raw.lower()
        if 'daily' in raw_lower:
            return 'daily'
        if 'weekly' in raw_lower:
            return 'weekly'
        if 'monthly' in raw_lower:
            return 'monthly'
        if 'quarterly' in raw_lower:
            return 'quarterly'
        if 'annually' in raw_lower or 'annual' in raw_lower:
            return 'annually'
        if 'as needed' in raw_lower or 'visibly soiled' in raw_lower:
            return 'as_needed'
        # Default
        return 'as_needed'
