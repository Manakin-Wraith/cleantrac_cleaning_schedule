from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import (
    Department, DocumentTemplate, ThermometerVerificationRecord,
    Thermometer, GeneratedDocument
)
import os
import json
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Test document template upload and verification data access'

    def add_arguments(self, parser):
        parser.add_argument(
            '--template-path',
            type=str,
            help='Path to the template file to upload',
            default='document_templates/03._Thermometer__verification.xlsx'
        )
        parser.add_argument(
            '--department-id',
            type=int,
            help='Department ID to use for the template',
            default=1
        )

    def handle(self, *args, **options):
        template_path = options['template_path']
        department_id = options['department_id']

        # Check if template file exists
        if not os.path.exists(template_path):
            self.stdout.write(self.style.ERROR(f'Template file not found: {template_path}'))
            return

        try:
            # Get department
            try:
                department = Department.objects.get(id=department_id)
                self.stdout.write(self.style.SUCCESS(f'Using department: {department.name}'))
            except Department.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Department with ID {department_id} not found'))
                return

            # Get admin user
            try:
                admin_user = User.objects.filter(is_superuser=True).first()
                if not admin_user:
                    self.stdout.write(self.style.ERROR('No admin user found'))
                    return
                self.stdout.write(self.style.SUCCESS(f'Using admin user: {admin_user.username}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error getting admin user: {str(e)}'))
                return

            # Test template upload
            self.test_template_upload(template_path, department, admin_user)

            # Test thermometer verification data access
            self.test_verification_data_access(department)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

    def test_template_upload(self, template_path, department, user):
        self.stdout.write(self.style.NOTICE('Testing document template upload...'))

        try:
            # Read template file
            with open(template_path, 'rb') as f:
                file_content = f.read()

            # Create template
            template_name = os.path.basename(template_path)
            template = DocumentTemplate.objects.create(
                name=f'Test Template - {template_name}',
                description='Test template created by management command',
                department=department,
                template_file=SimpleUploadedFile(template_name, file_content),
                template_type='verification',
                created_by=user
            )

            self.stdout.write(self.style.SUCCESS(f'Template created successfully: {template.id}'))

            # Verify template was saved correctly
            saved_template = DocumentTemplate.objects.get(id=template.id)
            self.stdout.write(self.style.SUCCESS(f'Template file path: {saved_template.template_file.path}'))
            
            # Check if file exists on disk
            if os.path.exists(saved_template.template_file.path):
                self.stdout.write(self.style.SUCCESS('Template file exists on disk'))
            else:
                self.stdout.write(self.style.ERROR('Template file does not exist on disk'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error uploading template: {str(e)}'))

    def test_verification_data_access(self, department):
        self.stdout.write(self.style.NOTICE('Testing thermometer verification data access...'))

        # Get thermometers for department
        thermometers = Thermometer.objects.filter(department=department)
        self.stdout.write(self.style.SUCCESS(f'Found {thermometers.count()} thermometers for department'))

        # Get verification records
        verification_records = ThermometerVerificationRecord.objects.filter(
            thermometer__department=department
        ).order_by('-date_verified')[:10]
        
        self.stdout.write(self.style.SUCCESS(f'Found {verification_records.count()} verification records'))

        # Display verification data
        if verification_records.exists():
            self.stdout.write(self.style.NOTICE('Recent verification records:'))
            for record in verification_records:
                self.stdout.write(f'  - {record.date_verified}: {record.thermometer.serial_number} - Verified by: {record.calibrated_by.username if record.calibrated_by else "Unknown"}')
        else:
            self.stdout.write(self.style.WARNING('No verification records found. Creating sample data...'))
            self.create_sample_verification_data(department)

    def create_sample_verification_data(self, department):
        """Create sample thermometer verification data for testing"""
        try:
            # Get admin user
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(self.style.ERROR('No admin user found'))
                return

            # Get or create a thermometer
            thermometer, created = Thermometer.objects.get_or_create(
                department=department,
                defaults={
                    'serial_number': f'TEST-{department.id}-{timezone.now().strftime("%Y%m%d%H%M%S")}',
                    'model_identifier': 'Test Thermometer',
                    'status': 'verified'
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created test thermometer: {thermometer.serial_number}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Using existing thermometer: {thermometer.serial_number}'))

            # Create verification records for the past 5 days
            for i in range(5):
                verification_date = timezone.now().date() - timedelta(days=i)
                record = ThermometerVerificationRecord.objects.create(
                    thermometer=thermometer,
                    date_verified=verification_date,
                    calibrated_instrument_no='TEST-CALIBRATION-INSTRUMENT',
                    reading_after_verification=36.5,
                    calibrated_by=admin_user,
                    notes=f'Test verification record created on {timezone.now()}'
                )
                self.stdout.write(self.style.SUCCESS(f'Created verification record for {verification_date}'))

            self.stdout.write(self.style.SUCCESS('Sample verification data created successfully'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating sample data: {str(e)}'))
