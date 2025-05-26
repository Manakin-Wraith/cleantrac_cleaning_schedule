from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureLog
)
from rest_framework.validators import UniqueValidator

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

# Serializer for the built-in User model to be nested in UserProfileSerializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']
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
            'phone_number', 
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
    
    # These fields are intended for UserProfile but are part of this serializer's payload.
    # We will handle them manually in create/update methods.
    # NO 'source' attribute for write operations to avoid DRF conflicts.
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True, required=False)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), 
        write_only=True, 
        allow_null=True, 
        required=False
        # No 'source' here, this field name 'department_id' will be in validated_data
    )
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=20)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile', 
                  'password', 'role', 'department_id', 'phone_number']
        extra_kwargs = {
            'username': {'validators': []}, 
        }


    def create(self, validated_data):
        # Pop profile-specific data that we've defined in this serializer
        profile_role_payload = validated_data.pop('role', None)
        # 'department_id' from validated_data is already a Department instance due to PrimaryKeyRelatedField
        profile_department_instance_payload = validated_data.pop('department_id', None) 
        profile_phone_number_payload = validated_data.pop('phone_number', None)
        
        password = validated_data.pop('password', None)

        # Remaining validated_data is for the User model (username, first_name, last_name)
        # Ensure email is not passed if it's still in validated_data from an old client or default
        validated_data.pop('email', None) # Explicitly remove email before User creation
        user = User.objects.create_user(**validated_data, password=password)
        
        # Get or create the profile
        # The signal should have created it, but this is a fallback.
        user_profile, created_profile = UserProfile.objects.get_or_create(user=user)

        # Update the profile with data from the serializer's payload
        if profile_role_payload is not None:
            user_profile.role = profile_role_payload
        
        if profile_department_instance_payload is not None:
            user_profile.department = profile_department_instance_payload
        elif not user_profile.department: # Only set manager's dept if not provided and profile has no dept
            requesting_user = self.context['request'].user
            if requesting_user.is_authenticated and hasattr(requesting_user, 'profile') and not requesting_user.is_superuser:
                if requesting_user.profile.role == 'manager' and requesting_user.profile.department:
                    user_profile.department = requesting_user.profile.department
        
        if profile_phone_number_payload is not None: 
            user_profile.phone_number = profile_phone_number_payload

        user_profile.save() 
        
        return user

    def update(self, instance, validated_data):
        # instance is the User model instance

        # Pop profile-specific data from validated_data
        profile_role_payload = validated_data.pop('role', None)
        # 'department_id' from validated_data is a Department instance or None
        profile_department_instance_payload = validated_data.pop('department_id', None)
        profile_phone_number_payload = validated_data.pop('phone_number', None)
        
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # Update User fields from the remaining validated_data
        # (e.g., first_name, last_name). Explicitly remove email.
        validated_data.pop('email', None)
        for attr, value in validated_data.items():
            # Ensure we don't try to set the read-only 'profile' field or unknown attrs
            if attr != 'profile' and hasattr(instance, attr):
                setattr(instance, attr, value)
        instance.save() # Save the User instance

        # Now, handle the UserProfile instance
        user_profile = getattr(instance, 'profile', None)
        if not user_profile:
            # This case should ideally be handled by a signal ensuring profile exists
            user_profile = UserProfile.objects.create(user=instance)
            # Consider logging a warning here.

        profile_needs_save = False
        # Check if 'role' was in the original request data to distinguish from 'not provided'
        if 'role' in self.initial_data:
            user_profile.role = profile_role_payload # Assigns the value (could be None if client sent null)
            profile_needs_save = True
        
        # Check if 'department_id' was in the original request data
        if 'department_id' in self.initial_data:
            user_profile.department = profile_department_instance_payload # Assigns Department instance or None
            profile_needs_save = True

        if 'phone_number' in self.initial_data: 
            user_profile.phone_number = profile_phone_number_payload
            profile_needs_save = True

        if profile_needs_save:
            user_profile.save() # Save the UserProfile instance
            
        return instance

# Serializer for the /api/users/me/ endpoint
class CurrentUserSerializer(serializers.ModelSerializer):
    # Nests the UserProfile details. 'profile' is the related_name
    # from UserProfile.user (OneToOneField) back to User.
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'profile']

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

class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
            if not hasattr(user, 'profile') or not user.profile.phone_number:
                raise serializers.ValidationError("User does not have a phone number registered.")
        except User.DoesNotExist:
            # Do not reveal if the user exists or not for security reasons
            # Instead, we'll act as if it's processing but won't send an SMS
            # The view will handle this gracefully.
            pass
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    token = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    def validate_token(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("Token must be a 6-digit number.")
        return value

    # You can add more complex password validation if needed using Django's password validators
    # For example, in the view or by overriding validate_new_password
    # from django.contrib.auth.password_validation import validate_password
    # def validate_new_password(self, value):
    #     try:
    #         validate_password(value)
    #     except serializers.ValidationError as e:
    #         raise serializers.ValidationError(list(e.messages))

# Thermometer Verification System Serializers

class AreaUnitSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = AreaUnit
        fields = [
            'id', 'name', 'description', 'department_id', 'department_name',
            'target_temperature_min', 'target_temperature_max',
            'created_at', 'updated_at'
        ]

class ThermometerSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Thermometer
        fields = [
            'id', 'serial_number', 'model_identifier', 'department_id', 'department_name',
            'status', 'last_verification_date', 'verification_expiry_date',
            'is_verified', 'days_until_expiry', 'created_at', 'updated_at'
        ]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['is_verified'] = instance.is_verified()
        representation['days_until_expiry'] = instance.days_until_expiry()
        return representation

class ThermometerVerificationRecordSerializer(serializers.ModelSerializer):
    thermometer_id = serializers.PrimaryKeyRelatedField(
        queryset=Thermometer.objects.all(),
        source='thermometer',
        write_only=True
    )
    thermometer_serial = serializers.CharField(source='thermometer.serial_number', read_only=True)
    thermometer_model = serializers.CharField(source='thermometer.model_identifier', read_only=True)
    calibrated_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='calibrated_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    calibrated_by_username = serializers.CharField(source='calibrated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ThermometerVerificationRecord
        fields = [
            'id', 'thermometer_id', 'thermometer_serial', 'thermometer_model',
            'date_verified', 'calibrated_instrument_no', 'reading_after_verification',
            'calibrated_by_id', 'calibrated_by_username', 'manager_signature',
            'corrective_action', 'photo_evidence', 'created_at'
        ]
    
    def create(self, validated_data):
        # If calibrated_by is not provided, use the current user
        if 'calibrated_by' not in validated_data or validated_data['calibrated_by'] is None:
            validated_data['calibrated_by'] = self.context['request'].user
        return super().create(validated_data)

class ThermometerVerificationAssignmentSerializer(serializers.ModelSerializer):
    staff_member_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='staff_member',
        write_only=True
    )
    staff_member_username = serializers.CharField(source='staff_member.username', read_only=True)
    staff_member_name = serializers.SerializerMethodField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ThermometerVerificationAssignment
        fields = [
            'id', 'staff_member_id', 'staff_member_username', 'staff_member_name',
            'department_id', 'department_name', 'assigned_date',
            'assigned_by_id', 'assigned_by_username', 'is_active',
            'notes', 'created_at', 'updated_at'
        ]
    
    def get_staff_member_name(self, obj):
        if obj.staff_member.first_name and obj.staff_member.last_name:
            return f"{obj.staff_member.first_name} {obj.staff_member.last_name}"
        return obj.staff_member.username
    
    def create(self, validated_data):
        # If assigned_by is not provided, use the current user
        if 'assigned_by' not in validated_data or validated_data['assigned_by'] is None:
            validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)

class TemperatureLogSerializer(serializers.ModelSerializer):
    area_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=AreaUnit.objects.all(),
        source='area_unit',
        write_only=True
    )
    area_unit_name = serializers.CharField(source='area_unit.name', read_only=True)
    thermometer_used_id = serializers.PrimaryKeyRelatedField(
        queryset=Thermometer.objects.all(),
        source='thermometer_used',
        write_only=True
    )
    thermometer_serial = serializers.CharField(source='thermometer_used.serial_number', read_only=True)
    verification_record_id = serializers.PrimaryKeyRelatedField(
        queryset=ThermometerVerificationRecord.objects.all(),
        source='verification_record_at_time_of_log',
        write_only=True,
        required=False,
        allow_null=True
    )
    logged_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='logged_by',
        write_only=True,
        required=False,
        allow_null=True
    )
    logged_by_username = serializers.CharField(source='logged_by.username', read_only=True, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_within_target_range = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = TemperatureLog
        fields = [
            'id', 'area_unit_id', 'area_unit_name', 'log_datetime',
            'temperature_reading', 'time_period', 'corrective_action', 'photo',
            'logged_by_id', 'logged_by_username', 'thermometer_used_id', 'thermometer_serial',
            'verification_record_id', 'department_id', 'department_name',
            'is_within_target_range', 'created_at', 'updated_at'
        ]
    
    def get_is_within_target_range(self, obj):
        result = obj.is_within_target_range()
        if result is None:
            return None
        return result
    
    def create(self, validated_data):
        # If logged_by is not provided, use the current user
        if 'logged_by' not in validated_data or validated_data['logged_by'] is None:
            validated_data['logged_by'] = self.context['request'].user
        
        # If verification_record_at_time_of_log is not provided, get the most recent one for the thermometer
        if 'verification_record_at_time_of_log' not in validated_data or validated_data['verification_record_at_time_of_log'] is None:
            thermometer = validated_data.get('thermometer_used')
            if thermometer and thermometer.is_verified():
                latest_verification = ThermometerVerificationRecord.objects.filter(
                    thermometer=thermometer
                ).order_by('-date_verified').first()
                if latest_verification:
                    validated_data['verification_record_at_time_of_log'] = latest_verification
        
        return super().create(validated_data)
    
    def validate(self, data):
        # Ensure the thermometer is verified
        thermometer = data.get('thermometer_used')
        if thermometer and not thermometer.is_verified():
            raise serializers.ValidationError({
                'thermometer_used_id': 'This thermometer is not verified or has expired verification.'
            })
        
        # Ensure the area_unit and thermometer belong to the same department
        area_unit = data.get('area_unit')
        department = data.get('department')
        if area_unit and area_unit.department != department:
            raise serializers.ValidationError({
                'area_unit_id': 'The area unit must belong to the specified department.'
            })
        
        if thermometer and thermometer.department != department:
            raise serializers.ValidationError({
                'thermometer_used_id': 'The thermometer must belong to the specified department.'
            })
        
        return data
