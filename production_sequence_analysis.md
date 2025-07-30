# Production Sequence Analysis & Fix

## The Problem
The sequence is incrementing (285 → 286 → 287) but still hitting existing records. This means there are TaskInstance records with IDs higher than where we reset the sequence.

## Run This on Production Server

### Step 1: SSH to Production
```bash
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181
cd /var/www/cleantrac_cleaning_schedule
source venv/bin/activate
```

### Step 2: Analyze the Current State
```bash
python manage.py shell
```

Then run this Python code:
```python
from django.db import connection
from core.models import TaskInstance

# Check current state
with connection.cursor() as cursor:
    # Find actual max ID
    cursor.execute("SELECT MAX(id) FROM core_taskinstance;")
    max_id = cursor.fetchone()[0]
    print(f"Max TaskInstance ID: {max_id}")
    
    # Check current sequence
    cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
    current_seq = cursor.fetchone()[0]
    print(f"Current sequence: {current_seq}")
    
    # Check for conflicts around current sequence
    for i in range(current_seq - 5, current_seq + 10):
        cursor.execute(f"SELECT COUNT(*) FROM core_taskinstance WHERE id = {i};")
        count = cursor.fetchone()[0]
        if count > 0:
            print(f"ID {i} EXISTS in database")
        else:
            print(f"ID {i} is available")
```

### Step 3: Fix the Sequence Properly
```python
# Find the next safe ID after the maximum
with connection.cursor() as cursor:
    cursor.execute("SELECT MAX(id) FROM core_taskinstance;")
    max_id = cursor.fetchone()[0]
    next_safe_id = max_id + 1
    
    print(f"Setting sequence to {next_safe_id}")
    cursor.execute(f"SELECT setval('core_taskinstance_id_seq', {next_safe_id});")
    
    # Verify
    cursor.execute("SELECT last_value FROM core_taskinstance_id_seq;")
    new_seq = cursor.fetchone()[0]
    print(f"Sequence now set to: {new_seq}")
    
    # Double-check no conflicts
    cursor.execute(f"SELECT COUNT(*) FROM core_taskinstance WHERE id = {new_seq};")
    conflict = cursor.fetchone()[0]
    print(f"Conflicts with next ID: {conflict} (should be 0)")
```

## Expected Output
You should see something like:
```
Max TaskInstance ID: 892
Current sequence: 287
ID 285 EXISTS in database
ID 286 EXISTS in database  
ID 287 EXISTS in database
...
Setting sequence to 893
Sequence now set to: 893
Conflicts with next ID: 0
```

This will show us exactly what IDs exist and where the sequence should be set.

## Alternative: Quick SQL Fix
If you prefer direct SQL:
```sql
-- Find max ID and set sequence
SELECT setval('core_taskinstance_id_seq', (SELECT MAX(id) + 1 FROM core_taskinstance));

-- Verify
SELECT last_value FROM core_taskinstance_id_seq;
SELECT MAX(id) FROM core_taskinstance;
```
