#!/usr/bin/env python
"""
Script to fix TaskInstance sequence synchronization issue.
Run this with: python manage.py shell < fix_sequence.py
"""

from django.db import connection
from core.models import TaskInstance

def fix_taskinstance_sequence():
    """Fix the TaskInstance primary key sequence synchronization."""
    
    with connection.cursor() as cursor:
        # Check current sequence value
        cursor.execute("SELECT currval('core_taskinstance_id_seq');")
        current_seq = cursor.fetchone()[0]
        print(f"Current sequence value: {current_seq}")
        
        # Check actual highest ID in the table
        cursor.execute("SELECT MAX(id) FROM core_taskinstance;")
        max_id_result = cursor.fetchone()[0]
        max_id = max_id_result if max_id_result is not None else 0
        print(f"Actual highest ID in table: {max_id}")
        
        # Calculate what the sequence should be
        next_id = max_id + 1
        print(f"Setting sequence to: {next_id}")
        
        # Reset the sequence to the correct value
        cursor.execute(
            "SELECT setval('core_taskinstance_id_seq', %s);", 
            [next_id]
        )
        
        # Verify the fix
        cursor.execute("SELECT currval('core_taskinstance_id_seq');")
        new_seq = cursor.fetchone()[0]
        print(f"New sequence value: {new_seq}")
        
        print("✅ Sequence fix completed successfully!")
        print(f"Next TaskInstance will have ID: {new_seq}")

if __name__ == "__main__":
    fix_taskinstance_sequence()
