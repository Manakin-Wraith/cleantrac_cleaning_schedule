from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

# Serializer for the built-in User model to be nested in UserProfileSerializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        # If you want to allow updating these fields through UserProfileSerializer,
        # you might need to handle writable nested serializers or provide separate endpoints for User.
        # For read-only, this is fine.

# UserProfileSerializer MUST be defined before serializers that use it, like UserWithProfileSerializer
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Nest User details, read-only for simplicity initially
    
    # This field is for setting the department when creating/updating a UserProfile directly via its own endpoint.
    # It won't be part of the output when UserProfileSerializer is used as read_only (e.g. nested in UserWithProfileSerializer or CurrentUserSerializer).
    department_for_write = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='department',  # This field on the UserProfile model
        write_only=True, 
        allow_null=True,
        required=False # Make it optional for PATCH updates on UserProfile itself
    )
    
    # This field is for reading the department ID. It will be included in read_only contexts.
    department_id = serializers.IntegerField(source='department.id', read_only=True, allow_null=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 
            'department_id',  # This will be the read-only integer ID from department.id
            'department_name', 
            'role',
            'department_for_write' # This field is for write operations on UserProfile endpoint
        ]
        # 'user' field here refers to the nested UserSerializer output for reads.
        # 'department_for_write' is used for writing the department relationship if UserProfile is updated directly.

    def to_representation(self, instance):
        """Modify representation to show department name directly."""
        representation = super().to_representation(instance)
        # Ensure department_name is included even if department is null
        representation['department_name'] = instance.department.name if instance.department else None
        # UserProfile creation logic will typically handle linking to an existing User in the view.
        # If UserProfile is created alongside User, that's a different flow (e.g. User registration endpoint).
        return representation

# Serializer for listing Users with their profile information (e.g., for /api/users/)
class UserWithProfileSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

# Serializer for the /api/users/me/ endpoint
class CurrentUserSerializer(serializers.ModelSerializer):
    # Nests the UserProfile details. 'profile' is the related_name
    # from UserProfile.user (OneToOneField) back to User.
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

class CleaningItemSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='department', 
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = CleaningItem
        fields = [
            'id', 'name', 'department_id', 'department_name', 'frequency', 
            'equipment', 'chemical', 'method', 'created_at', 'updated_at'
        ]

class TaskInstanceSerializer(serializers.ModelSerializer):
    # For reading cleaning_item details
    cleaning_item = CleaningItemSerializer(read_only=True)
    # For writing/linking cleaning_item by ID
    cleaning_item_id_write = serializers.PrimaryKeyRelatedField(
        queryset=CleaningItem.objects.all(), 
        source='cleaning_item', 
        write_only=True,
        label='Cleaning Item ID' # Add label for clarity in browsable API forms
    )
    
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(), # Corrected: Query UserProfile
        source='assigned_to', 
        write_only=True, 
        allow_null=True, 
        required=False
    )
    # Display assigned_to user's username and profile ID for clarity in reads
    assigned_to_details = serializers.SerializerMethodField(read_only=True)

    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department', # Direct FK to Department
        # write_only=True # Keep for read if needed
    )
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = TaskInstance
        fields = [
            'id', 
            'cleaning_item', # Nested details for read
            'cleaning_item_id_write', # ID for write
            'department_id', 'department_name',
            'assigned_to_id', 'assigned_to_details', 
            'due_date', 'start_time', 'end_time', # Added start_time and end_time
            'status', 'notes',
            'created_at', 'updated_at'
        ]
        # Remove read_only_fields for department if it's directly settable via department_id
        # read_only_fields = ['created_at', 'updated_at'] # Default for auto_now fields

    def get_assigned_to_details(self, obj):
        if obj.assigned_to: # obj.assigned_to is a UserProfile instance
            user = obj.assigned_to.user
            full_name = ''
            if hasattr(user, 'get_full_name') and callable(user.get_full_name):
                full_name = user.get_full_name().strip()
            
            if not full_name:
                name_parts = []
                if user.first_name:
                    name_parts.append(user.first_name)
                if user.last_name:
                    name_parts.append(user.last_name)
                full_name = " ".join(name_parts).strip()

            if not full_name:
                full_name = user.username # Fallback to username if no names

            return {
                'id': obj.assigned_to.id,
                'username': user.username, 
                'first_name': user.first_name, # Keep for potential direct use elsewhere
                'last_name': user.last_name,   # Keep for potential direct use elsewhere
                'full_name': full_name,        # Add a reliable full_name
                'department_id': obj.assigned_to.department.id if obj.assigned_to.department else None
            }
        return None

    def validate_start_end_time(self, data):
        """Check that end_time is after start_time if both are provided."""
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and end_time < start_time:
            raise serializers.ValidationError("End time must be after start time.")
        return data

    def validate(self, data):
        # Call custom validation for start/end times
        data = self.validate_start_end_time(data)
        
        # Ensure assigned_to user belongs to the task's department if department is set
        # and assigned_to is also set.
        department = data.get('department') or (self.instance and self.instance.department)
        assigned_to = data.get('assigned_to') or (self.instance and self.instance.assigned_to)

        if department and assigned_to:
            if assigned_to.department != department:
                raise serializers.ValidationError(
                    f"Assigned staff '{assigned_to.user.username}' does not belong to the department '{department.name}'."
                )
        return data

class CompletionLogSerializer(serializers.ModelSerializer):
    task_instance_id = serializers.PrimaryKeyRelatedField(
        queryset=TaskInstance.objects.all(), 
        source='task_instance', 
        write_only=True
    )
    # Display info about the task instance being logged
    task_instance_info = serializers.SerializerMethodField(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='user', 
        write_only=True, 
        allow_null=True # Or default to request.user in view
    )
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = CompletionLog
        fields = [
            'id', 'task_instance_id', 'task_instance_info', 'user_id', 'user_username', 
            'completed_at', 'notes'
        ]

    def get_task_instance_info(self, obj):
        if obj.task_instance:
            return f"{obj.task_instance.cleaning_item.name} due {obj.task_instance.due_date}"
        return None
