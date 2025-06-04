from decimal import Decimal
import math
from django.db import transaction
from .recipe_models import RecipeVersion, RecipeIngredient, RecipeProductionTask

class RecipeScalingService:
    """Service for scaling recipes to different batch sizes."""
    
    @staticmethod
    def scale_recipe(recipe_version, target_quantity):
        """
        Scale a recipe to a target quantity.
        
        Args:
            recipe_version: The RecipeVersion to scale
            target_quantity: The target quantity to produce
            
        Returns:
            Dictionary of scaled ingredients with quantities
        """
        original_quantity = recipe_version.yield_quantity
        scaling_factor = Decimal(target_quantity) / Decimal(original_quantity)
        
        scaled_ingredients = {}
        for ingredient in recipe_version.ingredients.all():
            original_qty = ingredient.quantity
            scaled_qty = original_qty * scaling_factor
            
            # Apply rounding rules based on ingredient type
            if hasattr(ingredient.ingredient, 'requires_whole_units') and ingredient.ingredient.requires_whole_units:
                scaled_qty = math.ceil(scaled_qty)  # Round up for whole units
                
            scaled_ingredients[ingredient.ingredient.name] = {
                'id': ingredient.ingredient.id,
                'quantity': scaled_qty,
                'unit': ingredient.unit,
                'original_quantity': original_qty
            }
            
        return {
            'scaling_factor': scaling_factor,
            'original_quantity': original_quantity,
            'target_quantity': target_quantity,
            'ingredients': scaled_ingredients
        }
    
    @staticmethod
    def calculate_ingredient_requirements(production_task):
        """
        Calculate ingredient requirements for a production task based on the recipe and quantity.
        
        Args:
            production_task: The RecipeProductionTask to calculate ingredients for
            
        Returns:
            Dictionary of required ingredients with quantities
        """
        recipe = production_task.recipe
        target_quantity = production_task.quantity
        
        # Get the latest recipe version or a specific version if stored
        recipe_version = None
        if hasattr(production_task, 'recipe_version') and production_task.recipe_version:
            recipe_version = production_task.recipe_version
        else:
            # Get the latest version
            recipe_version = RecipeVersion.objects.filter(recipe=recipe).order_by('-created_at').first()
        
        if not recipe_version:
            return {'error': 'No recipe version found'}
        
        # Scale the recipe
        return RecipeScalingService.scale_recipe(recipe_version, target_quantity)
    
    @staticmethod
    def update_production_task_with_version(production_task, recipe_version=None):
        """
        Update a production task with a specific recipe version.
        If no version is provided, use the latest version.
        
        Args:
            production_task: The RecipeProductionTask to update
            recipe_version: Optional specific RecipeVersion to use
            
        Returns:
            Updated production task
        """
        if not recipe_version:
            recipe_version = RecipeVersion.objects.filter(
                recipe=production_task.recipe
            ).order_by('-created_at').first()
        
        if recipe_version:
            production_task.recipe_version = recipe_version
            production_task.save(update_fields=['recipe_version'])
        
        return production_task


class ProductionTaskService:
    """Service for managing production tasks."""
    
    @staticmethod
    def create_production_task_with_version(recipe, quantity, **kwargs):
        """
        Create a production task with the latest recipe version.
        
        Args:
            recipe: The Recipe to create a task for
            quantity: The quantity to produce
            **kwargs: Additional fields for the production task
            
        Returns:
            New production task
        """
        with transaction.atomic():
            # Get the latest recipe version
            recipe_version = RecipeVersion.objects.filter(
                recipe=recipe
            ).order_by('-created_at').first()
            
            if not recipe_version:
                raise ValueError("No recipe version found for this recipe")
            
            # Create the production task
            task = RecipeProductionTask.objects.create(
                recipe=recipe,
                recipe_version=recipe_version,
                quantity=quantity,
                **kwargs
            )
            
            return task
