# Check Server Logs for Recurring Task Debug Info

## Where to Look for Debug Output

The debug logs I added will appear in your Django server logs, not the frontend console.

### Option 1: Check Django Server Logs via SSH
```bash
# SSH to production server
ssh -i ~/.ssh/cleantrac.pem ubuntu@13.60.56.181

# Check Django/Gunicorn logs
sudo journalctl -u gunicorn -f

# Or check specific log files
tail -f /var/log/gunicorn/error.log
tail -f /var/log/gunicorn/access.log
```

### Option 2: Check Django Debug Output
```bash
# If running Django development server
python manage.py runserver

# Debug output will appear in terminal
```

## What to Look For

When you create a recurring task, you should see:
```
[DEBUG] Request data keys: ['due_date', 'start_time', 'end_time', 'status', 'cleaning_item_id_write', 'department_id', 'notes', 'recurring', 'recurrence_type', 'assigned_to_id']
```

If there's an ID field:
```
[DEBUG] WARNING: Request contains 'id' field: 286
```

If task_data somehow contains an ID:
```
[DEBUG] ERROR: task_data contains 'id' field: 286
```

## Current Status

- ✅ Frontend payload looks correct (no 'id' field)
- ❌ Still getting 500 error with ID collision
- 🔍 Need to check server logs for debug output

## Next Actions

1. Check server logs during recurring task creation
2. Look for the debug output to identify the root cause
3. The error might be happening in a different part of the code
