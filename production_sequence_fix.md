# Production TaskInstance Sequence Fix

## Problem
TaskInstance primary key sequence is out of sync, causing duplicate key errors:
`duplicate key value violates unique constraint 'core_taskinstance_pkey' DETAIL: Key (id)=(284) already exists`

## Solution Options

### Option 1: SSH to Production Server + psql
```bash
# SSH to your production server
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181

# Connect to PostgreSQL (adjust connection details as needed)
sudo -u postgres psql -d cleantrac_db

# Or if using environment variables:
psql $DATABASE_URL
```

### Option 2: Using Django Management Command on Production
```bash
# SSH to production server
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181

# Navigate to your Django project
cd /path/to/cleantrac_cleaning_schedule

# Activate virtual environment
source venv/bin/activate

# Run Django shell
python manage.py shell
```

Then in Django shell:
```python
from django.db import connection
from core.models import TaskInstance

with connection.cursor() as cursor:
    # Check current sequence value
    cursor.execute("SELECT currval('core_taskinstance_id_seq');")
    current_seq = cursor.fetchone()[0]
    print(f"Current sequence value: {current_seq}")
    
    # Check actual highest ID
    cursor.execute("SELECT MAX(id) FROM core_taskinstance;")
    max_id = cursor.fetchone()[0] or 0
    print(f"Actual highest ID: {max_id}")
    
    # Reset sequence
    next_id = max_id + 1
    cursor.execute("SELECT setval('core_taskinstance_id_seq', %s);", [next_id])
    print(f"Sequence reset to: {next_id}")
```

### Option 3: Direct SQL Commands
```sql
-- Check current state
SELECT currval('core_taskinstance_id_seq') as current_seq, 
       MAX(id) as max_id 
FROM core_taskinstance;

-- Reset sequence (replace with actual max_id + 1)
SELECT setval('core_taskinstance_id_seq', (SELECT MAX(id) FROM core_taskinstance) + 1);

-- Verify fix
SELECT currval('core_taskinstance_id_seq') as new_seq;
```

## After Running the Fix

1. **Test recurring task creation** - should work without 500 errors
2. **Verify new tasks get sequential IDs** starting from the reset value
3. **Monitor for any additional sequence issues**

## Prevention

- Avoid manually deleting TaskInstance records during testing
- Use proper test cleanup or database transactions
- Consider implementing soft deletes for better data integrity
