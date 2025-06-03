from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord
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
