# Robust ID Management Solutions for TaskInstance

## Problem Analysis
The current ID collision issue stems from:
1. Multiple models (TaskInstance, RecurringSchedule) using auto-increment IDs
2. Potential race conditions between frontend requests
3. Sequence getting out of sync when records are deleted
4. No robust error handling for ID conflicts

## Solution Options (Ranked by Robustness)

### Option 1: UUID Primary Keys (Most Robust)
**Pros:**
- Eliminates sequence conflicts entirely
- Globally unique, no collisions possible
- Works across distributed systems
- No database sequence management needed

**Implementation:**
```python
# models.py
import uuid
from django.db import models

class TaskInstance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ... other fields

class RecurringSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ... other fields
```

**Migration Required:** Yes, but can be done incrementally

### Option 2: Transaction-Based Creation with Retry Logic
**Pros:**
- Keeps existing integer IDs
- Handles conflicts gracefully
- Atomic operations

**Implementation:**
```python
from django.db import transaction
import time
import random

def create_task_with_retry(task_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                return TaskInstance.objects.create(**task_data)
        except IntegrityError as e:
            if 'duplicate key' in str(e) and attempt < max_retries - 1:
                # Exponential backoff with jitter
                delay = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
                continue
            raise
    raise Exception(f"Failed to create task after {max_retries} attempts")
```

### Option 3: Database-Level Sequence Management
**Pros:**
- Automatic sequence management
- Database handles conflicts
- Minimal code changes

**Implementation:**
```python
# Custom manager with automatic sequence fixing
class TaskInstanceManager(models.Manager):
    def create(self, **kwargs):
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                return super().create(**kwargs)
            except IntegrityError as e:
                if 'duplicate key' in str(e) and attempt < max_attempts - 1:
                    # Auto-fix sequence
                    self._fix_sequence()
                    continue
                raise
    
    def _fix_sequence(self):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT setval('core_taskinstance_id_seq', 
                             (SELECT MAX(id) + 1 FROM core_taskinstance));
            """)

class TaskInstance(models.Model):
    objects = TaskInstanceManager()
    # ... fields
```

### Option 4: Frontend State Management
**Pros:**
- Addresses potential frontend issues
- Prevents duplicate submissions

**Implementation:**
```javascript
// Frontend: Prevent duplicate submissions
let isCreatingTask = false;

async function createTaskInstance(taskData) {
    if (isCreatingTask) {
        console.log('Task creation already in progress');
        return;
    }
    
    isCreatingTask = true;
    try {
        // Remove any existing ID from taskData
        const cleanTaskData = { ...taskData };
        delete cleanTaskData.id;
        
        const response = await fetch('/api/taskinstances/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanTaskData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } finally {
        isCreatingTask = false;
    }
}
```

## Recommended Approach: Hybrid Solution

### Phase 1: Immediate Fix (Transaction + Retry)
```python
# views.py - Enhanced create method
def create(self, request, *args, **kwargs):
    recurring_flag = request.data.get('recurring') in [True, 'true', 'True', '1', 1]
    
    if recurring_flag:
        return self._create_recurring_task_robust(request)
    else:
        return self._create_single_task_robust(request)

def _create_single_task_robust(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Retry logic for single task
    task_instance = self._create_with_retry(
        lambda: serializer.save()
    )
    
    return Response(
        self.get_serializer(task_instance).data,
        status=status.HTTP_201_CREATED
    )

def _create_recurring_task_robust(self, request):
    # Extract and validate data
    task_data = self._extract_task_data(request)
    
    # Create with transaction and retry
    try:
        with transaction.atomic():
            # Create first instance with retry
            first_instance = self._create_with_retry(
                lambda: TaskInstance.objects.create(**task_data)
            )
            
            # Create schedule
            schedule = RecurringSchedule.objects.create(
                cleaning_item=task_data['cleaning_item'],
                department=task_data['department'],
                assigned_to=task_data['assigned_to'],
                recurrence_type=request.data.get('recurrence_type'),
                start_time=task_data['start_time'],
                end_time=task_data['end_time'],
                created_by=request.user,
            )
            
            return Response({
                'task_instance': TaskInstanceSerializer(first_instance).data,
                'recurring_schedule': RecurringScheduleSerializer(schedule).data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'error': 'Failed to create recurring task',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _create_with_retry(self, create_func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return create_func()
        except IntegrityError as e:
            if 'duplicate key' in str(e) and attempt < max_retries - 1:
                # Auto-fix sequence on conflict
                self._fix_sequence()
                time.sleep(0.1 * (attempt + 1))  # Small delay
                continue
            raise
    raise Exception(f"Failed after {max_retries} attempts")

def _fix_sequence(self):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT setval('core_taskinstance_id_seq', 
                         (SELECT COALESCE(MAX(id), 0) + 1 FROM core_taskinstance));
        """)
```

### Phase 2: Long-term (Consider UUIDs)
For future versions, consider migrating to UUIDs for truly robust ID management.

## Testing Strategy
1. **Load Testing**: Multiple concurrent task creations
2. **Chaos Testing**: Simulate database connection issues
3. **Integration Testing**: Frontend + Backend together
4. **Sequence Testing**: Delete records and verify sequence handling

## Monitoring & Alerting
- Log all ID conflicts and auto-fixes
- Monitor sequence drift
- Alert on repeated failures
- Track retry success rates
