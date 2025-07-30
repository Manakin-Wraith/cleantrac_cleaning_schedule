#!/usr/bin/env python3
"""
Immediate Sequence Fix for Production

Run this directly on your production server to fix the TaskInstance sequence issue.
This bypasses the retry logic and directly fixes the sequence.
"""

import os
import sys
import django
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings')

def fix_sequence_now():
    """Immediately fix the TaskInstance sequence"""
    
    print("🔧 IMMEDIATE SEQUENCE FIX")
    print("=" * 50)
    
    try:
        with connection.cursor() as cursor:
            # Step 1: Find the actual maximum ID
            print("📊 Finding maximum TaskInstance ID...")
            cursor.execute("SELECT COALESCE(MAX(id), 0) FROM core_taskinstance;")
            max_id = cursor.fetchone()[0]
            print(f"   Maximum ID found: {max_id}")
            
            # Step 2: Check current sequence value
            print("📊 Checking current sequence value...")
            cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
            current_seq = cursor.fetchone()[0]
            print(f"   Current sequence: {current_seq}")
            
            # Step 3: Calculate next safe ID
            next_safe_id = max_id + 1
            print(f"📊 Next safe ID should be: {next_safe_id}")
            
            # Step 4: Fix the sequence
            print("🔧 Fixing sequence...")
            cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {next_safe_id});")
            
            # Step 5: Verify the fix
            print("✅ Verifying fix...")
            cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
            new_seq = cursor.fetchone()[0]
            print(f"   New sequence value: {new_seq}")
            
            # Step 6: Double-check for conflicts
            print("🔍 Checking for potential conflicts...")
            cursor.execute(f"SELECT COUNT(*) FROM core_taskinstance WHERE id = {new_seq};")
            conflicts = cursor.fetchone()[0]
            
            if conflicts > 0:
                print(f"⚠️  WARNING: ID {new_seq} already exists!")
                print("   Finding next truly safe ID...")
                
                # Find next gap in sequence
                cursor.execute(f"""
                    SELECT MIN(t1.id + 1) as next_id
                    FROM core_taskinstance t1 
                    LEFT JOIN core_taskinstance t2 ON t1.id + 1 = t2.id 
                    WHERE t2.id IS NULL AND t1.id >= {max_id}
                    LIMIT 1;
                """)
                
                result = cursor.fetchone()
                if result and result[0]:
                    truly_safe_id = result[0]
                else:
                    truly_safe_id = max_id + 10  # Fallback with buffer
                
                print(f"   Setting sequence to truly safe ID: {truly_safe_id}")
                cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {truly_safe_id});")
                
                # Final verification
                cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
                final_seq = cursor.fetchone()[0]
                print(f"   Final sequence value: {final_seq}")
            else:
                print(f"✅ No conflicts found. Sequence is properly set to {new_seq}")
            
            print("\n🎯 SEQUENCE FIX COMPLETED!")
            print("   You can now try creating recurring tasks again.")
            print("   The next TaskInstance will get a safe, non-conflicting ID.")
            
    except Exception as e:
        print(f"❌ ERROR during sequence fix: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting immediate sequence fix...")
    
    try:
        django.setup()
        success = fix_sequence_now()
        
        if success:
            print("\n✅ SUCCESS: Sequence fix completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ FAILED: Sequence fix encountered errors!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        sys.exit(1)
