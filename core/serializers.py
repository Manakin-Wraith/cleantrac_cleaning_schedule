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
    cleaning_item_id = serializers.PrimaryKeyRelatedField(
        queryset=CleaningItem.objects.all(), 
        source='cleaning_item', 
        write_only=True
    )
    cleaning_item_name = serializers.CharField(source='cleaning_item.name', read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='assigned_to', 
        write_only=True, 
        allow_null=True, 
        required=False # Allow unassigned tasks
    )
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    department_name = serializers.CharField(source='department.name', read_only=True) # From @property

    class Meta:
        model = TaskInstance
        fields = [
            'id', 'cleaning_item_id', 'cleaning_item_name', 'department_name',
            'assigned_to_id', 'assigned_to_username', 'due_date', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['department_name'] # Department is derived from CleaningItem

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
