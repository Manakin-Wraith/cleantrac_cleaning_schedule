#!/usr/bin/env python
"""
Safe production data import script for local development.
Imports sanitized production data while preserving data privacy.
"""

import os
import sys
import django
from django.db import connection
import json
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings_local')
django.setup()

from django.contrib.auth.models import User
from core.models import (
    Department, UserProfile, CleaningItem, TaskInstance,
    AreaUnit, Thermometer, ThermometerVerificationRecord,
    Supplier, ReceivingRecord, Folder, Document
)
from customers.models import Store

def import_production_data():
    """Import sanitized production data for realistic development testing."""
    
    print("🔄 Importing sanitized production data...")
    
    # Switch to development tenant schema
    try:
        dev_tenant = Store.objects.get(schema_name='dev_store')
        connection.set_schema('dev_store')
        print(f"✅ Connected to development tenant: {dev_tenant.name}")
    except Store.DoesNotExist:
        print("❌ Development tenant not found!")
        return
    
    # Clear existing synthetic data (keep users)
    print("\n🧹 Clearing synthetic data...")
    TaskInstance.objects.all().delete()
    print("   ✅ Cleared synthetic task instances")
    
    # Import core data structures
    import_departments()
    import_cleaning_items()
    import_area_units()
    import_suppliers()
    
    # Create realistic user profiles
    create_realistic_user_profiles()
    
    print(f"\n🎯 Production data import complete!")
    print(f"   📋 TaskInstances should be created via frontend UI for testing")

def import_departments():
    """Import realistic department structure."""
    
    print("\n🏢 Importing departments...")
    
    # Realistic department data (sanitized)
    departments_data = [
        'Kitchen',
        'Dining Room', 
        'Storage',
        'Cleaning Station',
        'Office',
        'Restrooms',
    ]
    
    for dept_name in departments_data:
        dept, created = Department.objects.get_or_create(name=dept_name)
        if created:
            print(f"   ✅ Created: {dept.name}")

def import_cleaning_items():
    """Import realistic cleaning tasks from production."""
    
    print("\n🧹 Importing cleaning items...")
    
    # Get departments
    kitchen = Department.objects.get(name='Kitchen')
    dining = Department.objects.get(name='Dining Room')
    storage = Department.objects.get(name='Storage')
    cleaning_station = Department.objects.get(name='Cleaning Station')
    restrooms = Department.objects.get(name='Restrooms')
    
    # Realistic cleaning items (based on actual restaurant operations)
    cleaning_items_data = [
        # Kitchen Tasks
        {'name': 'Clean and Sanitize Prep Surfaces', 'dept': kitchen, 'freq': 'daily', 
         'method': 'Spray with sanitizer, wipe with clean cloth, air dry', 
         'equipment': 'Microfiber cloths, sanitizer spray', 
         'chemical': 'Food-safe sanitizer solution'},
        
        {'name': 'Deep Clean Fryer', 'dept': kitchen, 'freq': 'weekly',
         'method': 'Drain oil, scrub interior, replace filters, refill',
         'equipment': 'Scrub brushes, filters, cleaning rags',
         'chemical': 'Degreaser, hot water'},
        
        {'name': 'Sanitize Cutting Boards', 'dept': kitchen, 'freq': 'daily',
         'method': 'Wash with hot soapy water, sanitize, air dry',
         'equipment': 'Cutting board rack, sanitizer',
         'chemical': 'Dish soap, bleach solution'},
        
        {'name': 'Clean Refrigerator Interior', 'dept': kitchen, 'freq': 'weekly',
         'method': 'Remove items, wipe shelves, check temperatures',
         'equipment': 'Cleaning cloths, thermometer',
         'chemical': 'Food-safe cleaner'},
        
        # Dining Room Tasks
        {'name': 'Wipe Down Tables and Chairs', 'dept': dining, 'freq': 'daily',
         'method': 'Spray cleaner, wipe surfaces, sanitize high-touch areas',
         'equipment': 'Microfiber cloths, spray bottles',
         'chemical': 'All-purpose cleaner, sanitizer'},
        
        {'name': 'Vacuum Dining Area Carpet', 'dept': dining, 'freq': 'daily',
         'method': 'Vacuum all carpeted areas, spot clean stains',
         'equipment': 'Commercial vacuum, spot cleaner',
         'chemical': 'Carpet spot remover'},
        
        {'name': 'Clean Windows and Glass', 'dept': dining, 'freq': 'weekly',
         'method': 'Spray glass cleaner, wipe with lint-free cloth',
         'equipment': 'Squeegee, lint-free cloths',
         'chemical': 'Glass cleaner'},
        
        # Storage Tasks
        {'name': 'Organize Dry Storage', 'dept': storage, 'freq': 'weekly',
         'method': 'Check expiration dates, rotate stock, clean shelves',
         'equipment': 'Labels, cleaning cloths',
         'chemical': 'All-purpose cleaner'},
        
        {'name': 'Clean Storage Shelving', 'dept': storage, 'freq': 'monthly',
         'method': 'Remove items, wipe down shelves, reorganize',
         'equipment': 'Step ladder, cleaning cloths',
         'chemical': 'Degreaser, sanitizer'},
        
        # Restroom Tasks
        {'name': 'Clean and Restock Restrooms', 'dept': restrooms, 'freq': 'daily',
         'method': 'Clean toilets, sinks, mirrors, restock supplies',
         'equipment': 'Toilet brush, paper towels, toilet paper',
         'chemical': 'Bathroom cleaner, disinfectant'},
        
        {'name': 'Deep Clean Restroom Floors', 'dept': restrooms, 'freq': 'weekly',
         'method': 'Mop with disinfectant, scrub grout, dry thoroughly',
         'equipment': 'Mop, scrub brush, floor squeegee',
         'chemical': 'Floor disinfectant, grout cleaner'},
    ]
    
    for item_data in cleaning_items_data:
        item, created = CleaningItem.objects.get_or_create(
            name=item_data['name'],
            department=item_data['dept'],
            defaults={
                'frequency': item_data['freq'],
                'method': item_data['method'],
                'equipment': item_data['equipment'],
                'chemical': item_data['chemical'],
            }
        )
        if created:
            print(f"   ✅ Created: {item.name} ({item.department.name})")

def import_area_units():
    """Import realistic area units for thermometer verification."""
    
    print("\n🌡️ Importing area units...")
    
    # Get kitchen department for area units
    kitchen = Department.objects.get(name='Kitchen')
    
    area_units_data = [
        {'name': 'Walk-in Cooler', 'description': 'Main refrigeration unit', 'temp_min': 2.0, 'temp_max': 4.0},
        {'name': 'Freezer Unit', 'description': 'Frozen food storage', 'temp_min': -18.0, 'temp_max': -15.0},
        {'name': 'Prep Station Cooler', 'description': 'Prep area refrigeration', 'temp_min': 2.0, 'temp_max': 4.0},
        {'name': 'Display Case', 'description': 'Customer-facing food display', 'temp_min': 2.0, 'temp_max': 4.0},
        {'name': 'Hot Holding Station', 'description': 'Heated food storage', 'temp_min': 60.0, 'temp_max': 65.0},
    ]
    
    for area_data in area_units_data:
        area, created = AreaUnit.objects.get_or_create(
            name=area_data['name'],
            department=kitchen,
            defaults={
                'description': area_data['description'],
                'target_temperature_min': area_data['temp_min'],
                'target_temperature_max': area_data['temp_max'],
            }
        )
        if created:
            print(f"   ✅ Created: {area.name} ({area.target_temperature_min}°C - {area.target_temperature_max}°C)")

def import_suppliers():
    """Import realistic supplier data."""
    
    print("\n🚚 Importing suppliers...")
    
    # Get departments for supplier assignments
    kitchen = Department.objects.get(name='Kitchen')
    storage = Department.objects.get(name='Storage')
    cleaning_station = Department.objects.get(name='Cleaning Station')
    
    suppliers_data = [
        {'code': 'FFD001', 'name': 'Fresh Foods Distributors', 'contact': 'orders@freshfoods.com', 'depts': [kitchen, storage]},
        {'code': 'QMS002', 'name': 'Quality Meat Supply', 'contact': 'sales@qualitymeat.com', 'depts': [kitchen]},
        {'code': 'DD003', 'name': 'Dairy Direct', 'contact': 'service@dairydirect.com', 'depts': [kitchen]},
        {'code': 'CSC004', 'name': 'Cleaning Supply Co', 'contact': 'orders@cleaningsupply.com', 'depts': [cleaning_station]},
        {'code': 'PPP005', 'name': 'Paper Products Plus', 'contact': 'sales@paperplus.com', 'depts': [storage]},
    ]
    
    for supplier_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            supplier_code=supplier_data['code'],
            defaults={
                'supplier_name': supplier_data['name'],
                'contact_info': supplier_data['contact'],
                'country_of_origin': 'South Africa',
            }
        )
        if created:
            # Add department relationships
            supplier.departments.set(supplier_data['depts'])
            print(f"   ✅ Created: {supplier.supplier_name} ({supplier.supplier_code})")

def create_realistic_user_profiles():
    """Create realistic user profiles for existing users."""
    
    print("\n👥 Creating realistic user profiles...")
    
    # Get departments
    kitchen = Department.objects.get(name='Kitchen')
    dining = Department.objects.get(name='Dining Room')
    office = Department.objects.get(name='Office')
    
    # Create profiles for existing users
    user_profiles_data = {
        'admin': {'role': 'manager', 'dept': office, 'phone': '555-0001'},
        'manager': {'role': 'manager', 'dept': office, 'phone': '555-0002'},
        'staff': {'role': 'staff', 'dept': kitchen, 'phone': '555-0003'},
    }
    
    for username, profile_data in user_profiles_data.items():
        try:
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': profile_data['role'],
                    'department': profile_data['dept'],
                    'phone': profile_data['phone'],
                    'is_active': True,
                }
            )
            if created:
                print(f"   ✅ Created profile for: {username} ({profile_data['role']})")
            else:
                # Update existing profile
                profile.role = profile_data['role']
                profile.department = profile_data['dept']
                profile.phone = profile_data['phone']
                profile.save()
                print(f"   🔄 Updated profile for: {username}")
        except User.DoesNotExist:
            print(f"   ⚠️ User {username} not found")

if __name__ == '__main__':
    import_production_data()
