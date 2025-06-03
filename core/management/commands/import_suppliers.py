import json
import os
from django.core.management.base import BaseCommand
from core.models import Supplier, Department

class Command(BaseCommand):
    help = 'Import suppliers from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')

    def handle(self, *args, **options):
        json_file = options['json_file']
        
        if not os.path.exists(json_file):
            self.stdout.write(self.style.ERROR(f'File not found: {json_file}'))
            return
        
        # Ensure all departments exist
        departments = {
            'BUTCHERY': Department.objects.get_or_create(name='BUTCHERY')[0],
            'BAKERY': Department.objects.get_or_create(name='BAKERY')[0],
            'HMR': Department.objects.get_or_create(name='HMR')[0]
        }
        
        with open(json_file, 'r') as f:
            suppliers_data = json.load(f)
            
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for supplier_data in suppliers_data:
            supplier_code = supplier_data.get('supplier_code')
            supplier_name = supplier_data.get('supplier_name')
            
            if not supplier_code or not supplier_name:
                self.stdout.write(self.style.WARNING(f'Skipping supplier with missing code or name: {supplier_data}'))
                skipped_count += 1
                continue
            
            # Try to find existing supplier by code
            supplier, created = Supplier.objects.get_or_create(
                supplier_code=supplier_code,
                defaults={
                    'supplier_name': supplier_name,
                    'contact_info': supplier_data.get('contact_info', ''),
                    'address': supplier_data.get('address', ''),
                    'country_of_origin': supplier_data.get('country_of_origin', 'South Africa')
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created supplier: {supplier_name} ({supplier_code})')
            else:
                # Update existing supplier
                supplier.supplier_name = supplier_name
                supplier.contact_info = supplier_data.get('contact_info', '')
                supplier.address = supplier_data.get('address', '')
                supplier.country_of_origin = supplier_data.get('country_of_origin', 'South Africa')
                supplier.save()
                updated_count += 1
                self.stdout.write(f'Updated supplier: {supplier_name} ({supplier_code})')
            
            # Add department if specified in JSON
            dept_name = supplier_data.get('department', '').upper()
            if dept_name and dept_name in departments:
                supplier.departments.add(departments[dept_name])
                self.stdout.write(f'  - Added to department: {dept_name}')
                
            # Special handling for department names in supplier names
            supplier_name_upper = supplier_name.upper()
            for dept_key in departments:
                if dept_key in supplier_name_upper and "IN HOUSE" in supplier_name_upper:
                    supplier.departments.add(departments[dept_key])
                    self.stdout.write(f'  - Added to department based on name: {dept_key}')
                
        self.stdout.write(
            self.style.SUCCESS(
                f'Import complete: {created_count} created, {updated_count} updated, {skipped_count} skipped'
            )
        )
