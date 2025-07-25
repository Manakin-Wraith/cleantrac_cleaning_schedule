#!/usr/bin/env python3
"""
Server-side script to identify users without department assignments.
Run this on the server where PostgreSQL is properly configured.

Usage on server:
python manage.py shell < server_audit_users.py
"""

from django.contrib.auth.models import User
from core.models import UserProfile, Department

print('🔍 Auditing users without department assignments...')
print('=' * 60)

# Get all users without department assignments
users_without_dept = []
users_without_profile = []
all_users = User.objects.all()

print(f'📊 Total users in system: {all_users.count()}')

for user in all_users:
    try:
        profile = UserProfile.objects.get(user=user)
        if not profile.department:
            users_without_dept.append({
                'id': user.id,
                'username': user.username,
                'profile_id': profile.id,
                'role': profile.role,
                'first_name': user.first_name,
                'last_name': user.last_name
            })
    except UserProfile.DoesNotExist:
        users_without_profile.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name
        })

print(f'\n❌ Users without UserProfile: {len(users_without_profile)}')
for user in users_without_profile:
    print(f'   • {user["username"]} (ID: {user["id"]}) - {user["first_name"]} {user["last_name"]}')

print(f'\n❌ Users with profile but no department: {len(users_without_dept)}')
for user in users_without_dept:
    print(f'   • {user["username"]} (ID: {user["id"]}, Profile: {user["profile_id"]}, Role: {user["role"]}) - {user["first_name"]} {user["last_name"]}')

print(f'\n🏢 Available departments:')
departments = Department.objects.all()
for dept in departments:
    user_count = UserProfile.objects.filter(department=dept).count()
    print(f'   • {dept.name} (ID: {dept.id}) - {user_count} users')

print(f'\n📋 SUMMARY:')
print(f'• Total users: {all_users.count()}')
print(f'• Users without profile: {len(users_without_profile)}')
print(f'• Users without department: {len(users_without_dept)}')
print(f'• Total problematic users: {len(users_without_profile) + len(users_without_dept)}')

print(f'\n🔧 These are the users causing the frontend console warnings!')
print('They are being filtered out to prevent assignment errors.')

# Show which users CAN be assigned (have profile + department)
valid_users = []
for user in all_users:
    try:
        profile = UserProfile.objects.get(user=user)
        if profile.department:
            valid_users.append(user.username)
    except UserProfile.DoesNotExist:
        pass

print(f'\n✅ Valid assignable users: {len(valid_users)}')
print('Valid users:', ', '.join(sorted(valid_users)[:10]) + ('...' if len(valid_users) > 10 else ''))
