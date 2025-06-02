import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from datetime import datetime, timedelta

from core.models import DocumentTemplate, Department, TemperatureLog
from core.document_template_views import generate_document_file


class Command(BaseCommand):
    help = 'Test generating an HMR Temperature checklist document from a template'

    def add_arguments(self, parser):
        parser.add_argument(
            '--template-path',
            type=str,
            help='Path to the template file',
            default='docs/Food_Safety_File/05.HMR Temperature checklist.xlsx'
        )
        parser.add_argument(
            '--department',
            type=str,
            help='Department name',
            default='HMR'
        )
        parser.add_argument(
            '--days',
            type=int,
            help='Number of days to include in the report',
            default=7
        )
        parser.add_argument(
            '--output-path',
            type=str,
            help='Path to save the generated document',
            default='media/generated_documents/hmr_temperature_checklist_test.xlsx'
        )

    def handle(self, *args, **options):
        template_path = options['template_path']
        department_name = options['department']
        days = options['days']
        output_path = options['output_path']

        # Ensure the template file exists
        if not os.path.exists(template_path):
            self.stdout.write(self.style.ERROR(f'Template file not found: {template_path}'))
            return

        # Get the department
        try:
            department = Department.objects.get(name=department_name)
        except Department.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Department not found: {department_name}'))
            return

        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='test_admin',
            defaults={'is_staff': True, 'is_superuser': True}
        )
        if created:
            user.set_password('password')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created test user: {user.username}'))

        # Get or create a document template
        template, created = DocumentTemplate.objects.get_or_create(
            name=f'{department_name} Temperature Checklist',
            defaults={
                'description': f'Temperature checklist template for {department_name}',
                'department': department,
                'template_type': 'temperature',
                'created_by': user
            }
        )

        if created:
            # Save the template file
            with open(template_path, 'rb') as f:
                template.template_file.save(
                    os.path.basename(template_path),
                    f,
                    save=True
                )
            self.stdout.write(self.style.SUCCESS(f'Created document template: {template.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Using existing document template: {template.name}'))

        # Set date range for the report
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        # Generate parameters for document generation
        parameters = {
            'startDate': start_date.strftime('%Y-%m-%d'),
            'endDate': end_date.strftime('%Y-%m-%d'),
            'includeTemperatureLogs': True
        }

        # Check if there are any temperature logs in the date range
        logs_count = TemperatureLog.objects.filter(
            log_datetime__date__gte=start_date,
            log_datetime__date__lte=end_date,
            department=department
        ).count()

        if logs_count == 0:
            self.stdout.write(self.style.WARNING(
                f'No temperature logs found for {department_name} between {start_date} and {end_date}. '
                f'The generated document may be empty.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Found {logs_count} temperature logs for {department_name} between {start_date} and {end_date}.'
            ))

        # Generate the document
        file_content, filename, error = generate_document_file(template, parameters, user)

        if error:
            self.stdout.write(self.style.ERROR(f'Error generating document: {error}'))
            return

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save the generated document
        with open(output_path, 'wb') as f:
            f.write(file_content)

        self.stdout.write(self.style.SUCCESS(f'Successfully generated document: {output_path}'))
        self.stdout.write(self.style.SUCCESS(f'Original filename: {filename}'))
