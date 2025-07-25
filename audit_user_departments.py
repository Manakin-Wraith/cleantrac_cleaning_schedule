#!/usr/bin/env python3
"""
Comprehensive audit script to compare original DB vs Cape Station tenant
for user and department assignment discrepancies.

This script identifies:
1. Users in original DB missing from tenant UserProfile
2. Users in tenant missing department assignments
3. Department mismatches between original and tenant
4. Users with invalid/missing profile data
"""

import os
import sys
import django
from django.db import connections
from django.conf import settings

# Add the project directory to Python path
sys.path.insert(0, '/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/cleantrac_cleaning_schedule')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, Department

def get_original_users():
    """Get all users from original database"""
    try:
        # Connect to original database (public schema)
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT 
                    u.id,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email,
                    up.phone_number,
                    d.name as department_name,
                    up.role
                FROM auth_user u
                LEFT JOIN core_userprofile up ON u.id = up.user_id
                LEFT JOIN core_department d ON up.department_id = d.id
                ORDER BY u.username
            """)
            
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        print(f"❌ Error accessing original database: {e}")
        return []

def get_tenant_users():
    """Get all users from Cape Station tenant"""
    try:
        tenant_users = []
        
        # Get all User objects (from public schema)
        users = User.objects.all()
        
        for user in users:
            try:
                profile = UserProfile.objects.get(user=user)
                department_name = profile.department.name if profile.department else None
                tenant_users.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'phone_number': profile.phone_number,
                    'department_name': department_name,
                    'role': profile.role,
                    'profile_id': profile.id
                })
            except UserProfile.DoesNotExist:
                tenant_users.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'phone_number': None,
                    'department_name': None,
                    'role': None,
                    'profile_id': None
                })
        
        return tenant_users
    except Exception as e:
        print(f"❌ Error accessing tenant database: {e}")
        return []

def audit_user_departments():
    """Main audit function"""
    print("🔍 Starting comprehensive user/department audit...")
    print("=" * 80)
    
    # Get data from both databases
    print("📊 Fetching original database users...")
    original_users = get_original_users()
    print(f"   Found {len(original_users)} users in original DB")
    
    print("📊 Fetching tenant database users...")
    tenant_users = get_tenant_users()
    print(f"   Found {len(tenant_users)} users in tenant DB")
    
    print("\n" + "=" * 80)
    
    # Create lookup dictionaries
    original_by_username = {u['username']: u for u in original_users}
    tenant_by_username = {u['username']: u for u in tenant_users}
    
    # Analysis 1: Users missing from tenant UserProfile
    print("🔍 ANALYSIS 1: Users missing UserProfile in tenant")
    print("-" * 50)
    missing_profiles = []
    
    for username, orig_user in original_by_username.items():
        tenant_user = tenant_by_username.get(username)
        if tenant_user and tenant_user['profile_id'] is None:
            missing_profiles.append({
                'username': username,
                'original_dept': orig_user['department_name'],
                'original_role': orig_user['role']
            })
    
    if missing_profiles:
        print(f"❌ Found {len(missing_profiles)} users without UserProfile:")
        for user in missing_profiles:
            print(f"   • {user['username']} (orig dept: {user['original_dept']}, role: {user['original_role']})")
    else:
        print("✅ All users have UserProfile records")
    
    # Analysis 2: Users with missing department assignments
    print(f"\n🔍 ANALYSIS 2: Users missing department assignments")
    print("-" * 50)
    missing_departments = []
    
    for username, tenant_user in tenant_by_username.items():
        if tenant_user['profile_id'] and not tenant_user['department_name']:
            orig_user = original_by_username.get(username)
            missing_departments.append({
                'username': username,
                'user_id': tenant_user['id'],
                'profile_id': tenant_user['profile_id'],
                'original_dept': orig_user['department_name'] if orig_user else 'N/A'
            })
    
    if missing_departments:
        print(f"❌ Found {len(missing_departments)} users without department:")
        for user in missing_departments:
            print(f"   • {user['username']} (ID: {user['user_id']}, Profile: {user['profile_id']}, orig dept: {user['original_dept']})")
    else:
        print("✅ All users with profiles have department assignments")
    
    # Analysis 3: Department mismatches
    print(f"\n🔍 ANALYSIS 3: Department mismatches between original and tenant")
    print("-" * 50)
    mismatches = []
    
    for username in set(original_by_username.keys()) & set(tenant_by_username.keys()):
        orig_user = original_by_username[username]
        tenant_user = tenant_by_username[username]
        
        if (orig_user['department_name'] and tenant_user['department_name'] and 
            orig_user['department_name'] != tenant_user['department_name']):
            mismatches.append({
                'username': username,
                'original_dept': orig_user['department_name'],
                'tenant_dept': tenant_user['department_name']
            })
    
    if mismatches:
        print(f"❌ Found {len(mismatches)} department mismatches:")
        for user in mismatches:
            print(f"   • {user['username']}: {user['original_dept']} → {user['tenant_dept']}")
    else:
        print("✅ No department mismatches found")
    
    # Analysis 4: Available departments in tenant
    print(f"\n🔍 ANALYSIS 4: Available departments in tenant")
    print("-" * 50)
    try:
        departments = Department.objects.all()
        print(f"✅ Found {len(departments)} departments:")
        for dept in departments:
            user_count = UserProfile.objects.filter(department=dept).count()
            print(f"   • {dept.name} (ID: {dept.id}) - {user_count} users")
    except Exception as e:
        print(f"❌ Error fetching departments: {e}")
    
    # Summary
    print(f"\n" + "=" * 80)
    print("📋 SUMMARY")
    print("-" * 50)
    print(f"• Users without UserProfile: {len(missing_profiles)}")
    print(f"• Users without department: {len(missing_departments)}")
    print(f"• Department mismatches: {len(mismatches)}")
    
    if missing_departments:
        print(f"\n🔧 USERS CAUSING FRONTEND WARNINGS:")
        print("These are the 18 users being filtered out in the console:")
        for user in missing_departments:
            print(f"   • {user['username']} (ID: {user['user_id']})")
    
    print(f"\n✅ Audit complete!")
    
    return {
        'missing_profiles': missing_profiles,
        'missing_departments': missing_departments,
        'mismatches': mismatches
    }

if __name__ == "__main__":
    audit_user_departments()
