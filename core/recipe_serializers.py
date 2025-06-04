from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department, Supplier
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord,
    RecipeProductionTask, ProductionIngredientUsage, ProductionOutput
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
    
    class Meta:
        model = ProductionSchedule
        fields = [
            'id', 'recipe_id', 'recipe_details', 'department_id', 'department_name',
            'scheduled_date', 'start_time', 'end_time', 'batch_size',
            'status', 'assigned_staff_ids', 'assigned_staff_details',
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
            'unit_cost': obj.recipe.unit_cost,
            'yield_unit': obj.recipe.yield_unit
        }
    
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
    
    def validate(self, data):
        """Validate that end_time is after start_time if both are provided"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"end_time": "End time must be after start time"})
        
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
    """Serializer for recipe production tasks with scheduling capabilities"""
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
    parent_task_id = serializers.PrimaryKeyRelatedField(
        queryset=RecipeProductionTask.objects.all(),
        source='parent_task',
        write_only=True,
        required=False,
        allow_null=True
    )
    parent_task_details = serializers.SerializerMethodField(read_only=True)
    ingredient_usages = serializers.SerializerMethodField(read_only=True)
    outputs = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = RecipeProductionTask
        fields = [
            'id', 'recipe_id', 'recipe_details', 'department_id', 'department_name',
            'scheduled_start_time', 'scheduled_end_time', 'scheduled_quantity',
            'status', 'assigned_staff_id', 'assigned_staff_details',
            'created_by', 'created_by_username',
            'is_recurring', 'recurrence_type', 'recurrence_pattern',
            'parent_task_id', 'parent_task_details',
            'ingredient_usages', 'outputs',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_recipe_details(self, obj):
        """Get basic recipe details"""
        return {
            'id': obj.recipe.recipe_id,
            'name': obj.recipe.name,
            'product_code': obj.recipe.product_code,
            'unit_cost': obj.recipe.unit_cost,
            'yield_unit': obj.recipe.yield_unit
        }
    
    def get_assigned_staff_details(self, obj):
        """Get details of assigned staff"""
        if not obj.assigned_staff:
            return None
        
        return {
            'id': obj.assigned_staff.id,
            'username': obj.assigned_staff.username,
            'name': f"{obj.assigned_staff.first_name} {obj.assigned_staff.last_name}".strip() or obj.assigned_staff.username
        }
    
    def get_parent_task_details(self, obj):
        """Get parent task details if this is a recurring instance"""
        if not obj.parent_task:
            return None
        
        return {
            'id': obj.parent_task.id,
            'recipe_name': obj.parent_task.recipe.name,
            'scheduled_start_time': obj.parent_task.scheduled_start_time
        }
    
    def get_ingredient_usages(self, obj):
        """Get summary of ingredient usages"""
        return [
            {
                'id': usage.id,
                'ingredient_name': usage.ingredient.ingredient_name,
                'quantity_used': usage.quantity_used,
                'unit': usage.ingredient.unit,
                'batch_code': usage.batch_code
            }
            for usage in obj.ingredient_usages.all()[:5]  # Limit to 5 for performance
        ]
    
    def get_outputs(self, obj):
        """Get summary of production outputs"""
        return [
            {
                'id': output.id,
                'actual_quantity': output.actual_quantity,
                'expected_quantity': output.expected_quantity,
                'yield_percentage': output.yield_percentage,
                'production_date': output.production_date
            }
            for output in obj.outputs.all()[:3]  # Limit to 3 for performance
        ]
    
    def validate(self, data):
        """Validate scheduling and department consistency"""
        # Validate that end_time is after start_time
        start_time = data.get('scheduled_start_time')
        end_time = data.get('scheduled_end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"scheduled_end_time": "End time must be after start time"})
        
        # Validate that recipe and department match
        recipe = data.get('recipe')
        department = data.get('department')
        
        if recipe and department and recipe.department != department:
            raise serializers.ValidationError({"department_id": "Task department must match recipe department"})
        
        # Validate recurrence pattern if is_recurring is True
        is_recurring = data.get('is_recurring', False)
        recurrence_pattern = data.get('recurrence_pattern')
        
        if is_recurring and not recurrence_pattern:
            raise serializers.ValidationError({"recurrence_pattern": "Recurrence pattern is required for recurring tasks"})
        
        return data


class ProductionIngredientUsageSerializer(serializers.ModelSerializer):
    """Serializer for tracking ingredients used in production"""
    production_task_id = serializers.PrimaryKeyRelatedField(
        queryset=RecipeProductionTask.objects.all(),
        source='production_task',
        write_only=True
    )
    production_task_details = serializers.SerializerMethodField(read_only=True)
    ingredient_id = serializers.PrimaryKeyRelatedField(
        queryset=InventoryItem.objects.all(),
        source='ingredient',
        write_only=True
    )
    ingredient_details = serializers.SerializerMethodField(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source='supplier',
        write_only=True
    )
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionIngredientUsage
        fields = [
            'id', 'production_task_id', 'production_task_details',
            'ingredient_id', 'ingredient_details',
            'batch_code', 'expiration_date', 
            'supplier_id', 'supplier_name',
            'quantity_used', 'recorded_by', 'recorded_by_username',
            'recorded_at', 'notes'
        ]
        read_only_fields = ['recorded_at']
    
    def get_production_task_details(self, obj):
        """Get production task details"""
        return {
            'id': obj.production_task.id,
            'recipe_name': obj.production_task.recipe.name,
            'scheduled_start_time': obj.production_task.scheduled_start_time,
            'status': obj.production_task.status
        }
    
    def get_ingredient_details(self, obj):
        """Get ingredient details"""
        return {
            'id': obj.ingredient.id,
            'ingredient_name': obj.ingredient.ingredient_name,
            'unit': obj.ingredient.unit,
            'current_stock': obj.ingredient.current_stock
        }
    
    def validate(self, data):
        """Validate batch code, expiration date, and department consistency"""
        # Validate batch code format
        batch_code = data.get('batch_code', '')
        if not batch_code or len(batch_code.strip()) < 3:
            raise serializers.ValidationError({"batch_code": "Batch code must be at least 3 characters long"})
        
        # Validate expiration date is in the future
        from django.utils import timezone
        expiration_date = data.get('expiration_date')
        if expiration_date and expiration_date < timezone.now().date():
            raise serializers.ValidationError({"expiration_date": "Expiration date cannot be in the past"})
        
        # Validate that ingredient belongs to the same department as the production task
        production_task = data.get('production_task')
        ingredient = data.get('ingredient')
        if production_task and ingredient and ingredient.department != production_task.department:
            raise serializers.ValidationError({"ingredient_id": "Ingredient must belong to the same department as the production task"})
        
        # Check if there's enough inventory
        quantity_used = data.get('quantity_used', 0)
        if ingredient and quantity_used > ingredient.current_stock:
            raise serializers.ValidationError({"quantity_used": f"Not enough inventory. Available: {ingredient.current_stock} {ingredient.unit}"})
        
        return data


class ProductionOutputSerializer(serializers.ModelSerializer):
    """Serializer for recording production outputs and yields"""
    production_task_id = serializers.PrimaryKeyRelatedField(
        queryset=RecipeProductionTask.objects.all(),
        source='production_task',
        write_only=True
    )
    production_task_details = serializers.SerializerMethodField(read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionOutput
        fields = [
            'id', 'production_task_id', 'production_task_details',
            'actual_quantity', 'expected_quantity', 'yield_percentage',
            'quality_rating', 'batch_code',
            'production_date', 'expiry_date',
            'recorded_by', 'recorded_by_username',
            'recorded_at', 'notes'
        ]
        read_only_fields = ['recorded_at', 'yield_percentage']
    
    def get_production_task_details(self, obj):
        """Get production task details"""
        return {
            'id': obj.production_task.id,
            'recipe_name': obj.production_task.recipe.name,
            'recipe_yield_unit': obj.production_task.recipe.yield_unit,
            'scheduled_quantity': obj.production_task.scheduled_quantity,
            'scheduled_start_time': obj.production_task.scheduled_start_time
        }
    
    def validate(self, data):
        """Validate dates and quality rating"""
        # Ensure expiry date is after production date
        production_date = data.get('production_date')
        expiry_date = data.get('expiry_date')
        
        if production_date and expiry_date and expiry_date <= production_date:
            raise serializers.ValidationError({"expiry_date": "Expiry date must be after production date"})
        
        # Validate quality rating range
        quality_rating = data.get('quality_rating')
        if quality_rating is not None and (quality_rating < 1 or quality_rating > 5):
            raise serializers.ValidationError({"quality_rating": "Quality rating must be between 1 and 5"})
        
        # Calculate yield percentage if not provided
        actual_quantity = data.get('actual_quantity')
        expected_quantity = data.get('expected_quantity')
        
        if actual_quantity is not None and expected_quantity is not None and expected_quantity > 0:
            data['yield_percentage'] = (actual_quantity / expected_quantity) * 100
        
        return data
