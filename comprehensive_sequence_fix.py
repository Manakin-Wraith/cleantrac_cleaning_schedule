#!/usr/bin/env python3
"""
Comprehensive PostgreSQL Sequence Fix for TaskInstance

This script will:
1. Find the actual maximum ID in the TaskInstance table
2. Check the current sequence value
3. Reset the sequence to the correct next value
4. Verify the fix worked
"""

import os
import sys
import django
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings')
django.setup()

from core.models import TaskInstance

def fix_taskinstance_sequence():
    """Comprehensively fix the TaskInstance sequence"""
    
    print("🔍 Analyzing TaskInstance sequence issue...")
    
    # Step 1: Find the actual maximum ID
    with connection.cursor() as cursor:
        cursor.execute("SELECT MAX(id) FROM core_taskinstance;")
        max_id = cursor.fetchone()[0]
        print(f"📊 Maximum TaskInstance ID in database: {max_id}")
        
        # Step 2: Check current sequence value
        cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
        current_seq = cursor.fetchone()[0]
        print(f"📊 Current sequence value: {current_seq}")
        
        # Step 3: Check if sequence is behind max ID
        if current_seq <= max_id:
            next_seq_value = max_id + 1
            print(f"⚠️  Sequence is behind! Need to set to: {next_seq_value}")
            
            # Reset the sequence
            cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {next_seq_value});")
            print(f"✅ Sequence reset to: {next_seq_value}")
            
        else:
            print(f"✅ Sequence is already ahead of max ID")
        
        # Step 4: Verify the fix
        cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
        new_seq = cursor.fetchone()[0]
        print(f"📊 New sequence value: {new_seq}")
        
        # Step 5: Test that next ID would be safe
        cursor.execute(f"SELECT COUNT(*) FROM core_taskinstance WHERE id = {new_seq};")
        conflict_count = cursor.fetchone()[0]
        
        if conflict_count > 0:
            print(f"❌ ERROR: ID {new_seq} already exists! Need to increment further.")
            # Find next safe ID
            cursor.execute(f"SELECT MIN(t1.id + 1) FROM core_taskinstance t1 LEFT JOIN core_taskinstance t2 ON t1.id + 1 = t2.id WHERE t2.id IS NULL AND t1.id >= {max_id};")
            next_safe_id = cursor.fetchone()[0]
            if next_safe_id:
                cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {next_safe_id});")
                print(f"✅ Sequence set to next safe ID: {next_safe_id}")
            else:
                safe_id = max_id + 1
                cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {safe_id});")
                print(f"✅ Sequence set to safe fallback: {safe_id}")
        else:
            print(f"✅ Next ID {new_seq} is safe to use")
    
    print("\n🎯 Sequence fix completed!")
    print("Now try creating a recurring task again.")

if __name__ == "__main__":
    fix_taskinstance_sequence()
