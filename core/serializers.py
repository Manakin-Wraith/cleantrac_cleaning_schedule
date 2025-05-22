from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog
from rest_framework.validators import UniqueValidator

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
    profile = UserProfileSerializer(read_only=True) # Keep this for reading existing profile info

    # Fields for creating/updating User
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    # email, first_name, last_name are already on User model and will be handled by default

    # Used for validating uniqueness of email across all User instances
    # This ensures that no two users can have the same email address.
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())] # Corrected usage
    )
    # 'role' and 'department_id' are write-only fields that will be used to create/update the UserProfile.
    # The 'source' attribute tells DRF where to conceptually map these fields from/to the profile.
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, source='profile.role', write_only=True, required=False)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        source='profile.department',  # This tells DRF to use this for the 'department' field on the profile
        write_only=True, 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = User
        # Include 'password', 'role', 'department_id' for write operations.
        # 'profile' is read-only and shows the nested structure.
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 
                  'password', 'role', 'department_id']
        extra_kwargs = {
            'username': {'validators': []}, # Remove unique validator if updates might send existing username
        }


    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})  # Pop the entire profile dict
        password = validated_data.pop('password', None)

        user = User.objects.create_user(**validated_data, password=password)
        
        # Now, handle the profile data
        profile_role = profile_data.get('role')
        profile_department_obj = profile_data.get('department') # This should be a Department instance

        # Get the profile expected to be created by a signal
        try:
            user_profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            # Fallback: If signal didn't run or failed, create the profile.
            # This helps ensure a profile always exists, but log this situation if it occurs.
            # Consider logging a warning here if this block is hit often.
            user_profile = UserProfile.objects.create(user=user)

        # Update the profile with data from the serializer
        if profile_role:
            user_profile.role = profile_role
        
        requesting_user = self.context['request'].user
        
        # Set department on the profile
        if profile_department_obj:
            user_profile.department = profile_department_obj
        elif not user_profile.department: # Only set manager's dept if profile doesn't have one yet
            if requesting_user.is_authenticated and hasattr(requesting_user, 'profile') and not requesting_user.is_superuser:
                if requesting_user.profile.role == 'manager' and requesting_user.profile.department:
                    user_profile.department = requesting_user.profile.department
        
        user_profile.save() # Save the changes to the profile
        
        return user

    def update(self, instance, validated_data):
        # Extract profile-specific fields if they are part of validated_data
        profile_role = validated_data.pop('role', None)
        profile_department = validated_data.pop('department_id', None)
        
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password) # Hash password

        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update UserProfile fields
        profile_updated = False
        if hasattr(instance, 'profile'):
            if profile_role is not None:
                instance.profile.role = profile_role
                profile_updated = True
            if profile_department is not None:
                instance.profile.department = profile_department
                profile_updated = True
            if profile_updated:
                instance.profile.save()
        elif profile_role or profile_department: # Profile doesn't exist, but data for it was provided
            # Edge case: User exists but profile somehow doesn't. Create it.
            new_profile_data = {}
            if profile_role: new_profile_data['role'] = profile_role
            if profile_department: new_profile_data['department'] = profile_department
            UserProfile.objects.create(user=instance, **new_profile_data)
            
        return instance

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
    
    # Add default_assigned_staff field
    default_assigned_staff = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), # Query against the User model
        many=True,                  # Expect a list of IDs
        required=False,             # Make the field optional
        allow_null=True,            # Allow null to be sent (or an empty list)
        # source='default_assigned_staff' # Source is implied by field name
    )
    # For read operations, to show details of assigned staff (optional, can be complex)
    # default_assigned_staff_details = UserSerializer(source='default_assigned_staff', many=True, read_only=True)

    class Meta:
        model = CleaningItem
        fields = [
            'id', 'name', 'department_id', 'department_name', 'frequency', 
            'equipment', 'chemical', 'method', 
            'default_assigned_staff', # Add to fields list
            # 'default_assigned_staff_details', # Add if you implement the read_only details serializer
            'created_at', 'updated_at'
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
