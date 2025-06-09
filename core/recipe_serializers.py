from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord,
    RecipeProductionTask
)
from .serializers import UserSerializer, DepartmentSerializer


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Serializer for recipe ingredients"""
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )
    
    class Meta:
        model = RecipeIngredient
        fields = [
            'id', 'recipe_id', 'ingredient_code', 'ingredient_name',
            'pack_size', 'quantity', 'unit', 'unit_cost', 'total_cost'
        ]
        read_only_fields = ['total_cost']


class RecipeVersionSerializer(serializers.ModelSerializer):
    """Serializer for recipe version history"""
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )
    recipe_name = serializers.CharField(source='recipe.name', read_only=True)
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = RecipeVersion
        fields = [
            'id', 'recipe_id', 'recipe_name', 'version_number',
            'changed_by', 'changed_by_username', 'changed_at',
            'change_notes', 'previous_data'
        ]
        read_only_fields = ['version_number', 'changed_at']


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for recipes"""
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    total_cost = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'recipe_id', 'department_id', 'department_name', 'product_code',
            'name', 'description', 'yield_quantity', 'yield_unit',
            'unit_cost', 'created_by', 'created_by_username',
            'created_at', 'updated_at', 'is_active', 'ingredients', 'total_cost'
        ]
        read_only_fields = ['created_at', 'updated_at', 'unit_cost']
    
    def get_total_cost(self, obj):
        """Calculate the total cost of all ingredients"""
        return obj.calculate_total_cost()


class RecipeDetailSerializer(RecipeSerializer):
    """Detailed serializer for recipes including version history"""
    versions = RecipeVersionSerializer(many=True, read_only=True)
    
    class Meta(RecipeSerializer.Meta):
        fields = RecipeSerializer.Meta.fields + ['versions']


class ProductionScheduleSerializer(serializers.ModelSerializer):
    """Serializer for production schedules"""
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )
    recipe_details = serializers.SerializerMethodField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_staff_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_staff',
        many=True,
        write_only=True,
        required=False
    )
    assigned_staff_details = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    # Fields to accept full datetime strings from payload
    scheduled_start_time_payload = serializers.DateTimeField(
        write_only=True,
        required=False,
        allow_null=True,
        source='scheduled_start_time'  # Maps to 'scheduled_start_time' key in input data
    )
    scheduled_end_time_payload = serializers.DateTimeField(
        write_only=True,
        required=False,
        allow_null=True,
        source='scheduled_end_time'  # Maps to 'scheduled_end_time' key in input data
    )

    class Meta:
        model = ProductionSchedule
        fields = [
            'id', 'recipe_id', 'recipe_details', 'department_id', 'department_name',
            'scheduled_date',  # Model's DateField (for output, populated by create/update)
            'start_time',      # Model's TimeField (for output, populated by create/update)
            'end_time',        # Model's TimeField (for output, populated by create/update)
            'batch_size',
            'status', 'assigned_staff_ids', 'assigned_staff_details',
            'notes', 'created_by', 'created_by_username',
            'created_at', 'updated_at',
            # Add the new source fields for input processing
            'scheduled_start_time_payload',
            'scheduled_end_time_payload',
        ]
        read_only_fields = ['created_at', 'updated_at'] # Original read_only_fields

    # Preserving existing get_recipe_details method
    def get_recipe_details(self, obj):
        """Get basic recipe details"""
        if not obj.recipe:
            return None
        return {
            'id': obj.recipe.recipe_id,
            'name': obj.recipe.name,
            'product_code': obj.recipe.product_code,
            'unit_cost': obj.recipe.unit_cost,
            'yield_unit': obj.recipe.yield_unit
        }

    # Preserving existing get_assigned_staff_details method
    def get_assigned_staff_details(self, obj):
        """Get details of assigned staff"""
        return [
            {
                'id': user.id,
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username
            }
            for user in obj.assigned_staff.all()
        ]
        
    def to_representation(self, instance):
        """Add scheduled_start_time and scheduled_end_time to the representation."""
        # Get the default representation
        representation = super().to_representation(instance)
        
        # Only proceed if we have both date and time
        if instance.scheduled_date and instance.start_time:
            # Import datetime and timezone utilities
            from datetime import datetime
            from django.utils import timezone
            import pytz
            
            # Get the timezone from settings or use UTC
            try:
                from django.conf import settings
                tz = pytz.timezone(settings.TIME_ZONE)
                # Get the local timezone for the frontend (assuming SAST/UTC+2)
                local_tz = pytz.timezone('Africa/Johannesburg')  # SAST timezone
            except (ImportError, AttributeError):
                tz = pytz.UTC
                local_tz = pytz.timezone('Africa/Johannesburg')  # SAST timezone
            
            # Create a datetime object by combining date and time
            start_datetime = datetime.combine(instance.scheduled_date, instance.start_time)
            # Make it timezone-aware in the server timezone
            start_datetime = timezone.make_aware(start_datetime, timezone=tz)
            # Convert to the local timezone for the frontend
            local_start_datetime = start_datetime.astimezone(local_tz)
            # Add to representation as ISO format
            representation['scheduled_start_time'] = local_start_datetime.isoformat()
            
            # Do the same for end time if it exists
            if instance.end_time:
                end_datetime = datetime.combine(instance.scheduled_date, instance.end_time)
                end_datetime = timezone.make_aware(end_datetime, timezone=tz)
                local_end_datetime = end_datetime.astimezone(local_tz)
                representation['scheduled_end_time'] = local_end_datetime.isoformat()
        
        return representation

    def create(self, validated_data):
        # Import timezone utilities
        from django.utils import timezone
        import pytz
        
        # Pop the datetime objects that were parsed from the payload via source mapping
        start_dt_obj = validated_data.pop('scheduled_start_time', None)
        end_dt_obj = validated_data.pop('scheduled_end_time', None)
        
        # Get the timezone from settings or use UTC
        try:
            from django.conf import settings
            tz = pytz.timezone(settings.TIME_ZONE)
        except (ImportError, AttributeError):
            tz = pytz.UTC
        
        if start_dt_obj:
            # Make sure datetime is timezone-aware
            if timezone.is_naive(start_dt_obj):
                start_dt_obj = timezone.make_aware(start_dt_obj, timezone=tz)
            
            # Convert to the local timezone for storage
            local_dt = start_dt_obj.astimezone(tz)
            
            # Store the date and time components
            validated_data['scheduled_date'] = local_dt.date()
            validated_data['start_time'] = local_dt.time()
        
        if end_dt_obj:
            # Make sure datetime is timezone-aware
            if timezone.is_naive(end_dt_obj):
                end_dt_obj = timezone.make_aware(end_dt_obj, timezone=tz)
            
            # Convert to the local timezone for storage
            local_dt = end_dt_obj.astimezone(tz)
            
            # Store the time component
            validated_data['end_time'] = local_dt.time()
            
            # If scheduled_date wasn't set by start_dt_obj, set it from end_dt_obj
            if 'scheduled_date' not in validated_data or validated_data.get('scheduled_date') is None:
                if start_dt_obj is None:  # only set if start_dt_obj didn't already set it
                    validated_data['scheduled_date'] = local_dt.date()
        
        # Set created_by to current user if not provided and user is authenticated
        request = self.context.get('request', None)
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if 'created_by' not in validated_data or validated_data.get('created_by') is None:
                validated_data['created_by'] = request.user
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Import timezone utilities
        from django.utils import timezone
        import pytz
        
        start_dt_obj = validated_data.pop('scheduled_start_time', None)
        end_dt_obj = validated_data.pop('scheduled_end_time', None)
        
        # Get the timezone from settings or use UTC
        try:
            from django.conf import settings
            tz = pytz.timezone(settings.TIME_ZONE)
        except (ImportError, AttributeError):
            tz = pytz.UTC
        
        if start_dt_obj:
            # Make sure datetime is timezone-aware
            if timezone.is_naive(start_dt_obj):
                start_dt_obj = timezone.make_aware(start_dt_obj, timezone=tz)
            
            # Convert to the local timezone for storage
            local_dt = start_dt_obj.astimezone(tz)
            
            # Update the instance with date and time components
            instance.scheduled_date = local_dt.date()
            instance.start_time = local_dt.time()
        
        if end_dt_obj:
            # Make sure datetime is timezone-aware
            if timezone.is_naive(end_dt_obj):
                end_dt_obj = timezone.make_aware(end_dt_obj, timezone=tz)
            
            # Convert to the local timezone for storage
            local_dt = end_dt_obj.astimezone(tz)
            
            # Update the instance with time component
            instance.end_time = local_dt.time()
            
            # If scheduled_date wasn't set by start_dt_obj, set it from end_dt_obj
            if start_dt_obj is None:  # only update date from end_dt_obj if start_dt_obj didn't set it
                instance.scheduled_date = local_dt.date()
        
        return super().update(instance, validated_data)

    def validate(self, data):
        """Validate that scheduled_end_time is after scheduled_start_time if both are provided from payload."""
        # Import timezone utilities
        from django.utils import timezone
        import pytz
        
        # Get the timezone from settings or use UTC
        try:
            from django.conf import settings
            tz = pytz.timezone(settings.TIME_ZONE)
        except (ImportError, AttributeError):
            tz = pytz.UTC
        
        # 'data' contains 'scheduled_start_time' and 'scheduled_end_time' as datetime objects
        # if they were in the payload, due to source mapping on DateTimeField.
        start_datetime = data.get('scheduled_start_time')
        end_datetime = data.get('scheduled_end_time')
        
        if start_datetime and end_datetime:
            # Make sure both datetimes are timezone-aware and in the same timezone before comparing
            if timezone.is_naive(start_datetime):
                start_datetime = timezone.make_aware(start_datetime, timezone=tz)
            if timezone.is_naive(end_datetime):
                end_datetime = timezone.make_aware(end_datetime, timezone=tz)
                
            # Convert both to the same timezone for comparison
            start_datetime = start_datetime.astimezone(tz)
            end_datetime = end_datetime.astimezone(tz)
            
            if end_datetime <= start_datetime:
                raise serializers.ValidationError(
                    {"scheduled_end_time": "Scheduled end time must be after scheduled start time."}
                )
        
        # The original validation for model's start_time and end_time fields might still be relevant
        # if these fields could be set directly through other means (not current frontend path).
        model_start_time = data.get('start_time')  # Direct TimeField from model if sent
        model_end_time = data.get('end_time')      # Direct TimeField from model if sent
        
        if model_start_time and model_end_time and model_start_time >= model_end_time:
            # This check is for the case where only time fields are provided for the same day.
            # If full datetimes were provided, the check above is more comprehensive.
            if not (start_datetime and end_datetime):  # Avoid redundant error if already caught
                raise serializers.ValidationError({"end_time": "End time must be after start time (for model time fields on the same day)."})
        
        return data


class ProductionRecordSerializer(serializers.ModelSerializer):
    """Serializer for production records"""
    schedule_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductionSchedule.objects.all(),
        source='schedule',
        write_only=True
    )
    schedule_details = serializers.SerializerMethodField(read_only=True)
    completed_by_username = serializers.CharField(source='completed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionRecord
        fields = [
            'id', 'schedule_id', 'schedule_details',
            'actual_start_time', 'actual_end_time', 'actual_yield',
            'quality_check', 'quality_notes',
            'completed_by', 'completed_by_username', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_schedule_details(self, obj):
        """Get production schedule details"""
        return {
            'id': obj.schedule.id,
            'recipe_name': obj.schedule.recipe.name,
            'recipe_id': obj.schedule.recipe.recipe_id,
            'scheduled_date': obj.schedule.scheduled_date,
            'batch_size': obj.schedule.batch_size,
            'department': obj.schedule.department.name
        }
    
    def validate(self, data):
        """Validate that actual_end_time is after actual_start_time"""
        start_time = data.get('actual_start_time')
        end_time = data.get('actual_end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"actual_end_time": "End time must be after start time"})
        
        return data


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for inventory items"""
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'ingredient_code', 'ingredient_name',
            'department_id', 'department_name',
            'current_stock', 'unit', 'unit_cost',
            'reorder_level', 'last_updated'
        ]
        read_only_fields = ['last_updated']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    """Serializer for inventory transactions"""
    inventory_item_id = serializers.PrimaryKeyRelatedField(
        queryset=InventoryItem.objects.all(),
        source='inventory_item',
        write_only=True
    )
    inventory_item_details = serializers.SerializerMethodField(read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'inventory_item_id', 'inventory_item_details',
            'transaction_type', 'quantity', 'transaction_date',
            'reference', 'recorded_by', 'recorded_by_username',
            'notes', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_inventory_item_details(self, obj):
        """Get inventory item details"""
        return {
            'id': obj.inventory_item.id,
            'ingredient_code': obj.inventory_item.ingredient_code,
            'ingredient_name': obj.inventory_item.ingredient_name,
            'unit': obj.inventory_item.unit,
            'department': obj.inventory_item.department.name
        }


class WasteRecordSerializer(serializers.ModelSerializer):
    """Serializer for waste records"""
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True,
        required=False,
        allow_null=True
    )
    recipe_name = serializers.CharField(source='recipe.name', read_only=True, allow_null=True)
    inventory_item_id = serializers.PrimaryKeyRelatedField(
        queryset=InventoryItem.objects.all(),
        source='inventory_item',
        write_only=True,
        required=False,
        allow_null=True
    )
    inventory_item_name = serializers.CharField(source='inventory_item.ingredient_name', read_only=True, allow_null=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = WasteRecord
        fields = [
            'id', 'recipe_id', 'recipe_name',
            'inventory_item_id', 'inventory_item_name',
            'department_id', 'department_name',
            'quantity', 'unit', 'reason', 'cost',
            'recorded_by', 'recorded_by_username',
            'recorded_at', 'notes'
        ]
        read_only_fields = ['recorded_at']
    
    def validate(self, data):
        """Validate that either recipe or inventory_item is provided, but not both"""
        recipe = data.get('recipe')
        inventory_item = data.get('inventory_item')
        
        if not recipe and not inventory_item:
            raise serializers.ValidationError(
                {"non_field_errors": "Either recipe or inventory item must be provided"}
            )
        
        if recipe and inventory_item:
            raise serializers.ValidationError(
                {"non_field_errors": "Cannot specify both recipe and inventory item"}
            )
        
        return data


class RecipeProductionTaskSerializer(serializers.ModelSerializer):
    """Serializer for recipe production tasks"""
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )
    recipe_details = serializers.SerializerMethodField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_staff_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_staff',
        write_only=True,
        required=False,
        allow_null=True
    )
    assigned_staff_details = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recurrence_type_display = serializers.CharField(source='get_recurrence_type_display', read_only=True)
    parent_task_id = serializers.PrimaryKeyRelatedField(
        queryset=RecipeProductionTask.objects.all(),
        source='parent_task',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = RecipeProductionTask
        fields = [
            'id', 'recipe_id', 'recipe_details', 'department_id', 'department_name',
            'scheduled_start_time', 'scheduled_end_time', 'scheduled_quantity',
            'task_type', 'task_type_display', 'description',
            'status', 'status_display', 'assigned_staff_id', 'assigned_staff_details',
            'is_recurring', 'recurrence_type', 'recurrence_type_display', 'recurrence_pattern',
            'parent_task_id', 'duration_minutes',
            'notes', 'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_recipe_details(self, obj):
        """Get basic recipe details"""
        return {
            'id': obj.recipe.recipe_id,
            'name': obj.recipe.name,
            'product_code': obj.recipe.product_code,
            'yield_quantity': obj.recipe.yield_quantity,
            'yield_unit': obj.recipe.yield_unit
        }
    
    def get_assigned_staff_details(self, obj):
        """Get details of assigned staff"""
        staff_details = []
        for staff in obj.assigned_staff.all():
            staff_details.append({
                'id': staff.id,
                'username': staff.username,
                'first_name': staff.first_name,
                'last_name': staff.last_name,
                'title': f"{staff.first_name} {staff.last_name}".strip() or staff.username
            })
        return staff_details
        
    def to_representation(self, instance):
        """Add scheduled_start_time and scheduled_end_time to the representation."""
        # Get the default representation
        representation = super().to_representation(instance)
        
        # Only proceed if we have both date and time
        if instance.scheduled_date and instance.start_time:
            # Import datetime and timezone utilities
            from datetime import datetime, time
            from django.utils import timezone
            import pytz
            
            # Get the timezone from settings or use UTC
            try:
                from django.conf import settings
                tz = pytz.timezone(settings.TIME_ZONE)
            except (ImportError, AttributeError):
                tz = pytz.UTC
            
            # Create a datetime object by combining date and time
            start_datetime = datetime.combine(instance.scheduled_date, instance.start_time)
            # Make it timezone-aware
            start_datetime = timezone.make_aware(start_datetime, timezone=tz)
            # Add to representation as ISO format
            representation['scheduled_start_time'] = start_datetime.isoformat()
            
            # Do the same for end time if it exists
            if instance.end_time:
                end_datetime = datetime.combine(instance.scheduled_date, instance.end_time)
                end_datetime = timezone.make_aware(end_datetime, timezone=tz)
                representation['scheduled_end_time'] = end_datetime.isoformat()
        
        return representation
    
    def validate(self, data):
        """Validate that scheduled_end_time is after scheduled_start_time"""
        start_time = data.get('scheduled_start_time')
        end_time = data.get('scheduled_end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError("End time must be after start time")
            
        return data
