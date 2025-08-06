#!/usr/bin/env python3
"""
Test script to isolate Django import issues
"""
import sys
import os

print("=== Django Import Test ===")
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")

# Add project path
project_path = '/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/cleantrac_cleaning_schedule'
if project_path not in sys.path:
    sys.path.insert(0, project_path)
    print(f"✅ Added project path: {project_path}")

# Test individual imports
try:
    import dj_database_url
    print("✅ dj_database_url imported successfully")
except ImportError as e:
    print(f"❌ dj_database_url import failed: {e}")
    sys.exit(1)

try:
    import django
    print(f"✅ Django imported successfully (version: {django.get_version()})")
except ImportError as e:
    print(f"❌ Django import failed: {e}")
    sys.exit(1)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings_local')
print("✅ Django settings module set")

# Test Django setup
try:
    django.setup()
    print("✅ Django setup completed successfully")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test Django components
try:
    from django.db import connection
    print("✅ Django database connection imported")
except ImportError as e:
    print(f"❌ Django database connection import failed: {e}")

try:
    from django_tenants.utils import schema_context
    print("✅ Django tenants imported")
except ImportError as e:
    print(f"❌ Django tenants import failed: {e}")

try:
    from customers.models import Store, StoreDomain
    print("✅ Customer models imported")
except ImportError as e:
    print(f"❌ Customer models import failed: {e}")

print("=== All tests completed successfully! ===")
