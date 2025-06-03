#!/usr/bin/env python
"""
Script to import recipe ingredients from the provided JSON file into the database.
This script reads recipe_table.json and creates RecipeIngredient records for each recipe.
"""

import os
import sys
import json
import django
from decimal import Decimal

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleantrac_project.settings')
django.setup()

from core.recipe_models import Recipe, RecipeIngredient
from django.db import transaction

def import_recipe_ingredients():
    """Import recipe ingredients from JSON file"""
    # Path to the JSON file
    json_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                 'docs', 'recipe_table.json')
    
    if not os.path.exists(json_file_path):
        print(f"Error: File not found: {json_file_path}")
        return
    
    # Load the JSON data
    with open(json_file_path, 'r') as file:
        recipes_data = json.load(file)
    
    print(f"Loaded {len(recipes_data)} recipes from JSON file")
    
    # Counter for statistics
    recipes_processed = 0
    ingredients_created = 0
    recipes_not_found = 0
    
    # Process each recipe
    for recipe_data in recipes_data:
        department_name = recipe_data.get('department')
        product_code = recipe_data.get('product_code')
        
        # Try to find the recipe in the database
        try:
            recipe = Recipe.objects.get(product_code=product_code)
            
            # Delete existing ingredients to avoid duplicates
            recipe.ingredients.all().delete()
            
            # Process each ingredient
            for ingredient_data in recipe_data.get('ingredients', []):
                # Create a new RecipeIngredient
                try:
                    # Convert string values to Decimal where needed
                    quantity = Decimal(ingredient_data.get('recipe_use', '0')) if ingredient_data.get('recipe_use') else Decimal('0')
                    unit_cost = Decimal(ingredient_data.get('cost', '0')) if ingredient_data.get('cost') else Decimal('0')
                    total_cost = Decimal(ingredient_data.get('total_cost', '0')) if ingredient_data.get('total_cost') else Decimal('0')
                    
                    # Create the ingredient
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient_code=ingredient_data.get('prod_code', ''),
                        ingredient_name=ingredient_data.get('description', ''),
                        pack_size=ingredient_data.get('pack_size', ''),
                        quantity=quantity,
                        unit=ingredient_data.get('weight', '').replace(str(quantity), '').strip() or 'kg',  # Extract unit or default to kg
                        unit_cost=unit_cost,
                        total_cost=total_cost
                    )
                    ingredients_created += 1
                except Exception as e:
                    print(f"Error creating ingredient for recipe {product_code}: {e}")
            
            # Update the recipe's unit cost
            recipe.update_unit_cost()
            recipes_processed += 1
            
        except Recipe.DoesNotExist:
            print(f"Recipe not found: {product_code} - {recipe_data.get('description')}")
            recipes_not_found += 1
    
    print(f"Import complete. Processed {recipes_processed} recipes, created {ingredients_created} ingredients.")
    print(f"Recipes not found: {recipes_not_found}")

if __name__ == "__main__":
    with transaction.atomic():
        import_recipe_ingredients()
