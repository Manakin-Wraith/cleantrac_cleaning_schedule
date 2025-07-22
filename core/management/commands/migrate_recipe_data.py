"""
Management command to migrate Recipe data from public schema to Cape Station tenant schema.

This command transfers all Recipe, RecipeIngredient, and RecipeVersion data from the 
original database (public schema) to the Cape Station tenant schema.
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.contrib.auth.models import User
from core.models import Department
from core.recipe_models import Recipe, RecipeIngredient, RecipeVersion
import json


class Command(BaseCommand):
    help = 'Migrate Recipe data from public schema to Cape Station tenant schema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually migrating',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed migration progress',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be migrated'))
        
        self.stdout.write(self.style.SUCCESS('Starting Recipe data migration...'))
        
        # Step 1: Migrate Recipes
        recipes_migrated = self.migrate_recipes(dry_run, verbose)
        
        # Step 2: Migrate Recipe Ingredients
        ingredients_migrated = self.migrate_recipe_ingredients(dry_run, verbose)
        
        # Step 3: Migrate Recipe Versions
        versions_migrated = self.migrate_recipe_versions(dry_run, verbose)
        
        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== MIGRATION SUMMARY ==='))
        self.stdout.write(f'Recipes: {recipes_migrated}')
        self.stdout.write(f'Recipe Ingredients: {ingredients_migrated}')
        self.stdout.write(f'Recipe Versions: {versions_migrated}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('This was a DRY RUN - no data was actually migrated'))
        else:
            self.stdout.write(self.style.SUCCESS('Recipe data migration completed successfully!'))

    def migrate_recipes(self, dry_run, verbose):
        """Migrate Recipe records from public to tenant schema"""
        self.stdout.write('\n--- Migrating Recipes ---')
        
        with connection.cursor() as cursor:
            # Get recipes from public schema
            cursor.execute("SET search_path TO public")
            cursor.execute("""
                SELECT recipe_id, department_id, product_code, name, description, 
                       yield_quantity, yield_unit, unit_cost, created_by_id, 
                       created_at, updated_at, is_active
                FROM core_recipe
                ORDER BY recipe_id
            """)
            
            public_recipes = cursor.fetchall()
            self.stdout.write(f'Found {len(public_recipes)} recipes in public schema')
            
            if dry_run:
                for recipe in public_recipes[:5]:  # Show first 5 as sample
                    self.stdout.write(f'  - Would migrate: {recipe[3]} (ID: {recipe[0]})')
                if len(public_recipes) > 5:
                    self.stdout.write(f'  - ... and {len(public_recipes) - 5} more recipes')
                return len(public_recipes)
            
            # Switch to tenant schema and migrate
            cursor.execute("SET search_path TO capestation")
            
            migrated_count = 0
            for recipe_data in public_recipes:
                try:
                    # Map department ID (assuming same department structure)
                    dept_id = recipe_data[1]
                    
                    # Check if department exists in tenant schema
                    cursor.execute("SELECT id FROM core_department WHERE id = %s", [dept_id])
                    if not cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping recipe {recipe_data[3]} - department {dept_id} not found in tenant')
                        continue
                    
                    # Check if recipe already exists
                    cursor.execute("SELECT recipe_id FROM core_recipe WHERE recipe_id = %s", [recipe_data[0]])
                    if cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping recipe {recipe_data[3]} - already exists in tenant')
                        continue
                    
                    # Insert recipe
                    cursor.execute("""
                        INSERT INTO core_recipe 
                        (recipe_id, department_id, product_code, name, description, 
                         yield_quantity, yield_unit, unit_cost, created_by_id, 
                         created_at, updated_at, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, recipe_data)
                    
                    migrated_count += 1
                    if verbose:
                        self.stdout.write(f'  - Migrated: {recipe_data[3]} (ID: {recipe_data[0]})')
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  - Error migrating recipe {recipe_data[3]}: {e}'))
            
            # Reset search path
            cursor.execute("SET search_path TO public")
            
        self.stdout.write(f'Migrated {migrated_count} recipes')
        return migrated_count

    def migrate_recipe_ingredients(self, dry_run, verbose):
        """Migrate RecipeIngredient records from public to tenant schema"""
        self.stdout.write('\n--- Migrating Recipe Ingredients ---')
        
        with connection.cursor() as cursor:
            # Get ingredients from public schema
            cursor.execute("SET search_path TO public")
            cursor.execute("""
                SELECT id, recipe_id, ingredient_code, ingredient_name, pack_size,
                       quantity, unit, unit_cost, total_cost, product_id
                FROM core_recipeingredient
                ORDER BY id
            """)
            
            public_ingredients = cursor.fetchall()
            self.stdout.write(f'Found {len(public_ingredients)} recipe ingredients in public schema')
            
            if dry_run:
                for ingredient in public_ingredients[:5]:  # Show first 5 as sample
                    self.stdout.write(f'  - Would migrate: {ingredient[3]} for recipe {ingredient[1]}')
                if len(public_ingredients) > 5:
                    self.stdout.write(f'  - ... and {len(public_ingredients) - 5} more ingredients')
                return len(public_ingredients)
            
            # Switch to tenant schema and migrate
            cursor.execute("SET search_path TO capestation")
            
            migrated_count = 0
            for ingredient_data in public_ingredients:
                try:
                    # Check if recipe exists in tenant schema
                    cursor.execute("SELECT recipe_id FROM core_recipe WHERE recipe_id = %s", [ingredient_data[1]])
                    if not cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping ingredient {ingredient_data[3]} - recipe {ingredient_data[1]} not found in tenant')
                        continue
                    
                    # Check if ingredient already exists
                    cursor.execute("SELECT id FROM core_recipeingredient WHERE id = %s", [ingredient_data[0]])
                    if cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping ingredient {ingredient_data[3]} - already exists in tenant')
                        continue
                    
                    # Insert ingredient
                    cursor.execute("""
                        INSERT INTO core_recipeingredient 
                        (id, recipe_id, ingredient_code, ingredient_name, pack_size,
                         quantity, unit, unit_cost, total_cost, product_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, ingredient_data)
                    
                    migrated_count += 1
                    if verbose:
                        self.stdout.write(f'  - Migrated: {ingredient_data[3]} for recipe {ingredient_data[1]}')
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  - Error migrating ingredient {ingredient_data[3]}: {e}'))
            
            # Reset search path
            cursor.execute("SET search_path TO public")
            
        self.stdout.write(f'Migrated {migrated_count} recipe ingredients')
        return migrated_count

    def migrate_recipe_versions(self, dry_run, verbose):
        """Migrate RecipeVersion records from public to tenant schema"""
        self.stdout.write('\n--- Migrating Recipe Versions ---')
        
        with connection.cursor() as cursor:
            # Get versions from public schema
            cursor.execute("SET search_path TO public")
            cursor.execute("""
                SELECT id, recipe_id, version_number, changed_by_id, changed_at,
                       change_notes, previous_data
                FROM core_recipeversion
                ORDER BY id
            """)
            
            public_versions = cursor.fetchall()
            self.stdout.write(f'Found {len(public_versions)} recipe versions in public schema')
            
            if dry_run:
                for version in public_versions[:5]:  # Show first 5 as sample
                    self.stdout.write(f'  - Would migrate: Version {version[2]} for recipe {version[1]}')
                if len(public_versions) > 5:
                    self.stdout.write(f'  - ... and {len(public_versions) - 5} more versions')
                return len(public_versions)
            
            # Switch to tenant schema and migrate
            cursor.execute("SET search_path TO capestation")
            
            migrated_count = 0
            for version_data in public_versions:
                try:
                    # Check if recipe exists in tenant schema
                    cursor.execute("SELECT recipe_id FROM core_recipe WHERE recipe_id = %s", [version_data[1]])
                    if not cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping version {version_data[2]} - recipe {version_data[1]} not found in tenant')
                        continue
                    
                    # Check if version already exists
                    cursor.execute("SELECT id FROM core_recipeversion WHERE id = %s", [version_data[0]])
                    if cursor.fetchone():
                        if verbose:
                            self.stdout.write(f'  - Skipping version {version_data[2]} - already exists in tenant')
                        continue
                    
                    # Insert version
                    cursor.execute("""
                        INSERT INTO core_recipeversion 
                        (id, recipe_id, version_number, changed_by_id, changed_at,
                         change_notes, previous_data)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, version_data)
                    
                    migrated_count += 1
                    if verbose:
                        self.stdout.write(f'  - Migrated: Version {version_data[2]} for recipe {version_data[1]}')
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  - Error migrating version {version_data[2]}: {e}'))
            
            # Reset search path
            cursor.execute("SET search_path TO public")
            
        self.stdout.write(f'Migrated {migrated_count} recipe versions')
        return migrated_count
