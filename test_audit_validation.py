# Quick validation script for production server
import os
import django
from datetime import datetime, timedelta

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_cleaning_schedule.settings')
django.setup()

from core.models import DocumentTemplate, Department, User
from core.document_template_views import generate_document_file

print("🔍 Testing Enhanced PDF Audit Data")
print("=" * 40)

# Get department and user
try:
    dept = Department.objects.get(name="Cape Station")
    user = User.objects.filter(profile__department=dept, profile__role='manager').first()
    if not user:
        user = User.objects.filter(is_superuser=True).first()
    
    print(f"✅ Department: {dept.name}")
    print(f"✅ Test User: {user.username} ({user.get_full_name()})")
    
    # Test parameters
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    params = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'includeThermometerVerifications': True,
        'includeTemperatureLogs': True,
        'includeCleaningTasks': True,
        'dateFormat': '%Y-%m-%d'
    }
    
    print(f"📅 Date Range: {start_date} to {end_date}")
    
    # Test cleaning document (most likely to have data)
    template, created = DocumentTemplate.objects.get_or_create(
        name="Test Cleaning Report",
        template_type='cleaning',
        department=dept,
        defaults={'description': 'Test template', 'created_by': user}
    )
    
    print(f"📝 Template: {template.name}")
    
    # Generate PDF
    file_content, filename, error = generate_document_file(template, params, user)
    
    if error:
        print(f"❌ Error: {error}")
    elif file_content:
        print(f"✅ Generated PDF: {filename}")
        print(f"📊 Size: {len(file_content)} bytes")
        print(f"✅ Valid PDF: {file_content[:4] == b'%PDF'}")
        print("🎉 Enhanced audit data generation successful!")
    else:
        print("⚠️ No content generated")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
