#!/usr/bin/env python3
"""
PDF Audit Data Validation Script for Production Server
Run this script to validate enhanced audit data in PDF generation.
"""

import os
import sys
import django
from datetime import datetime, timedelta
import json

# Setup Django environment
sys.path.append('/home/ubuntu/cleantrac_cleaning_schedule')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_cleaning_schedule.settings.production')
django.setup()

from core.models import (
    DocumentTemplate, 
    ThermometerVerificationRecord, 
    TemperatureLog, 
    TaskInstance, 
    RecipeProductionTask,
    Department,
    User
)
from core.document_template_views import generate_document_file

def validate_audit_data():
    """Validate that enhanced audit data is being generated correctly."""
    
    print("🔍 PDF Audit Data Validation")
    print("=" * 50)
    
    # Get Cape Station department
    try:
        department = Department.objects.get(name="Cape Station")
        print(f"✅ Found department: {department.name}")
    except Department.DoesNotExist:
        print("❌ Cape Station department not found")
        return False
    
    # Get a test user (manager)
    try:
        user = User.objects.filter(
            profile__department=department,
            profile__role='manager'
        ).first()
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        print(f"✅ Found test user: {user.username} ({user.get_full_name()})")
    except:
        print("❌ No suitable test user found")
        return False
    
    # Test parameters
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    parameters = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'includeThermometerVerifications': True,
        'includeTemperatureLogs': True,
        'includeCleaningTasks': True,
        'includeRecipeProduction': True,
        'dateFormat': '%Y-%m-%d'
    }
    
    print(f"📅 Date range: {start_date} to {end_date}")
    
    # Test each document type
    document_types = ['verification', 'temperature', 'cleaning', 'recipe']
    
    for doc_type in document_types:
        print(f"\n🧪 Testing {doc_type} document type...")
        
        # Get or create template
        template, created = DocumentTemplate.objects.get_or_create(
            name=f"Test {doc_type.title()} Report",
            template_type=doc_type,
            department=department,
            defaults={
                'description': f'Test template for {doc_type} audit validation',
                'created_by': user
            }
        )
        
        if created:
            print(f"   📝 Created test template: {template.name}")
        else:
            print(f"   📝 Using existing template: {template.name}")
        
        try:
            # Generate document
            file_content, filename, error = generate_document_file(template, parameters, user)
            
            if error:
                print(f"   ❌ Error generating {doc_type}: {error}")
                continue
            
            if not file_content:
                print(f"   ⚠️  No content generated for {doc_type}")
                continue
                
            print(f"   ✅ Generated {doc_type} PDF: {filename}")
            print(f"   📊 File size: {len(file_content)} bytes")
            
            # Validate that it's actually a PDF
            if file_content[:4] == b'%PDF':
                print(f"   ✅ Valid PDF format confirmed")
            else:
                print(f"   ❌ Invalid PDF format")
                
        except Exception as e:
            print(f"   ❌ Exception generating {doc_type}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Check data availability
    print(f"\n📊 Data Availability Check:")
    
    # Check verification records
    verification_count = ThermometerVerificationRecord.objects.filter(
        date_verified__gte=start_date,
        date_verified__lte=end_date,
        thermometer__department=department
    ).count()
    print(f"   🌡️  Verification records: {verification_count}")
    
    # Check temperature logs
    temp_log_count = TemperatureLog.objects.filter(
        log_datetime__date__gte=start_date,
        log_datetime__date__lte=end_date,
        department=department
    ).count()
    print(f"   📊 Temperature logs: {temp_log_count}")
    
    # Check cleaning tasks
    cleaning_task_count = TaskInstance.objects.filter(
        cleaning_item__isnull=False,
        due_date__gte=start_date,
        due_date__lte=end_date,
        department=department
    ).count()
    print(f"   🧹 Cleaning tasks: {cleaning_task_count}")
    
    # Check recipe production tasks
    recipe_task_count = RecipeProductionTask.objects.filter(
        scheduled_date__gte=start_date,
        scheduled_date__lte=end_date,
        department=department
    ).count()
    print(f"   🍳 Recipe tasks: {recipe_task_count}")
    
    print(f"\n✅ Validation complete!")
    print(f"📋 Next steps:")
    print(f"   1. Test PDF generation through the frontend")
    print(f"   2. Use the audit_data_validation_checklist.md to verify all audit fields")
    print(f"   3. Download and inspect generated PDFs for completeness")
    
    return True

if __name__ == "__main__":
    validate_audit_data()
