import csv
import json
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from core.models import Department
from core.recipe_models import Recipe, RecipeIngredient, RecipeVersion

class Command(BaseCommand):
    help = 'Import recipes from CSV and JSON files'

    def add_arguments(self, parser):
        parser.add_argument('--csv', type=str, help='Path to CSV file')
        parser.add_argument('--json', type=str, help='Path to JSON file')
        parser.add_argument('--admin-username', type=str, default='admin', help='Username of admin user to set as creator')

    def handle(self, *args, **options):
        csv_path = options.get('csv')
        json_path = options.get('json')
        admin_username = options.get('admin_username')

        # Default paths if not provided
        if not csv_path:
            csv_path = os.path.join('docs', 'RECIPES_COST.csv')
        if not json_path:
            json_path = os.path.join('docs', 'recipe_table.json')

        # Get admin user for attribution
        try:
            admin_user = User.objects.get(username=admin_username)
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(f"User {admin_username} not found. Using first superuser."))
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(self.style.ERROR("No admin user found. Please create one first."))
                return

        # Ensure all departments exist
        self.ensure_departments_exist()

        # Process JSON file first as it's more structured
        if os.path.exists(json_path):
            self.import_from_json(json_path, admin_user)
        else:
            self.stdout.write(self.style.WARNING(f"JSON file not found at {json_path}"))

        # Then process CSV file to supplement or update data
        if os.path.exists(csv_path):
            self.import_from_csv(csv_path, admin_user)
        else:
            self.stdout.write(self.style.WARNING(f"CSV file not found at {csv_path}"))

        self.stdout.write(self.style.SUCCESS('Recipe import completed successfully'))

    def ensure_departments_exist(self):
        """Ensure all required departments exist in the database"""
        departments = ['BAKERY', 'BUTCHERY', 'HMR']
        for dept_name in departments:
            dept, created = Department.objects.get_or_create(name=dept_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created department: {dept_name}"))
            else:
                self.stdout.write(f"Department already exists: {dept_name}")

    @transaction.atomic
    def import_from_json(self, json_path, admin_user):
        """Import recipes from JSON file"""
        self.stdout.write(f"Importing recipes from JSON: {json_path}")
        
        try:
            with open(json_path, 'r') as file:
                recipes_data = json.load(file)
                
            recipe_count = 0
            ingredient_count = 0
            
            for recipe_data in recipes_data:
                department_name = recipe_data.get('department')
                product_code = recipe_data.get('product_code')
                description = recipe_data.get('description')
                cost_excl = recipe_data.get('cost_excl_per_each_kg')
                ingredients = recipe_data.get('ingredients', [])
                
                # Skip if missing essential data
                if not all([department_name, product_code, description]):
                    self.stdout.write(self.style.WARNING(f"Skipping recipe with incomplete data: {recipe_data}"))
                    continue
                
                # Get department
                try:
                    department = Department.objects.get(name=department_name)
                except Department.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Department not found: {department_name}, creating it"))
                    department = Department.objects.create(name=department_name)
                
                # Convert cost to Decimal
                try:
                    unit_cost = Decimal(cost_excl) if cost_excl else None
                except InvalidOperation:
                    self.stdout.write(self.style.WARNING(f"Invalid cost value: {cost_excl} for {description}"))
                    unit_cost = None
                
                # Calculate yield from ingredients if available
                total_weight = Decimal('0')
                for ingredient in ingredients:
                    weight = ingredient.get('weight', '0')
                    try:
                        if weight and weight.strip():
                            total_weight += Decimal(weight)
                    except InvalidOperation:
                        pass
                
                # Create or update recipe
                recipe, created = Recipe.objects.update_or_create(
                    department=department,
                    product_code=product_code,
                    defaults={
                        'name': description,
                        'description': f"Imported from JSON: {description}",
                        'yield_quantity': total_weight if total_weight > 0 else Decimal('1'),
                        'unit_cost': unit_cost,
                        'created_by': admin_user,
                        'is_active': True
                    }
                )
                
                if created:
                    self.stdout.write(f"Created recipe: {recipe}")
                    recipe_count += 1
                else:
                    self.stdout.write(f"Updated recipe: {recipe}")
                
                # Create recipe version for audit trail
                RecipeVersion.objects.create(
                    recipe=recipe,
                    version_number=1 if created else recipe.versions.count() + 1,
                    changed_by=admin_user,
                    change_notes="Initial import from JSON" if created else "Updated from JSON import",
                    previous_data={}  # Empty for initial import
                )
                
                # Process ingredients
                for ingredient_data in ingredients:
                    prod_code = ingredient_data.get('prod_code')
                    ing_description = ingredient_data.get('description')
                    pack_size = ingredient_data.get('pack_size')
                    weight = ingredient_data.get('weight', '0')
                    cost = ingredient_data.get('cost', '0')
                    recipe_use = ingredient_data.get('recipe_use', weight)
                    total_cost = ingredient_data.get('total_cost', '0')
                    
                    # Skip if missing essential data
                    if not ing_description:
                        continue
                    
                    # Convert numeric values
                    try:
                        quantity = Decimal(recipe_use) if recipe_use else Decimal('0')
                        unit_cost_val = Decimal(cost) if cost else Decimal('0')
                        total_cost_val = Decimal(total_cost) if total_cost else (quantity * unit_cost_val)
                    except InvalidOperation:
                        self.stdout.write(self.style.WARNING(f"Invalid numeric value for ingredient: {ing_description}"))
                        continue
                    
                    # Create or update ingredient
                    ingredient, ing_created = RecipeIngredient.objects.update_or_create(
                        recipe=recipe,
                        ingredient_code=prod_code or '',
                        ingredient_name=ing_description,
                        defaults={
                            'pack_size': pack_size or '',
                            'quantity': quantity,
                            'unit': 'kg',  # Default unit
                            'unit_cost': unit_cost_val,
                            'total_cost': total_cost_val
                        }
                    )
                    
                    if ing_created:
                        ingredient_count += 1
                
                # Update recipe unit cost based on ingredients
                recipe.update_unit_cost()
            
            self.stdout.write(self.style.SUCCESS(f"Imported {recipe_count} recipes and {ingredient_count} ingredients from JSON"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error importing from JSON: {str(e)}"))
            raise

    @transaction.atomic
    def import_from_csv(self, csv_path, admin_user):
        """Import recipes from CSV file"""
        self.stdout.write(f"Importing recipes from CSV: {csv_path}")
        
        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as file:
                csv_reader = csv.reader(file)
                
                current_department = None
                current_recipe = None
                current_product_code = None
                current_description = None
                current_cost_excl = None
                
                recipe_count = 0
                ingredient_count = 0
                
                for row in csv_reader:
                    if not row or len(row) < 2:
                        continue
                    
                    # Check if this is a department/recipe header row
                    if row[0] and row[1] and row[1] == 'Prod Code' and len(row) > 2 and row[2]:
                        current_department = row[0]
                        continue
                    
                    # Check if this is a recipe row
                    if row[0] and row[1] and row[2] == 'Description' and len(row) > 9:
                        # This is a header row for ingredients, skip
                        continue
                    
                    # Check if this is a recipe definition row
                    if row[0] and row[1] and len(row) > 9 and row[9]:
                        current_department = row[0]
                        current_product_code = row[1]
                        current_description = row[2]
                        current_cost_excl = row[9]
                        
                        # Get department
                        try:
                            department = Department.objects.get(name=current_department)
                        except Department.DoesNotExist:
                            self.stdout.write(self.style.WARNING(f"Department not found: {current_department}, creating it"))
                            department = Department.objects.create(name=current_department)
                        
                        # Convert cost to Decimal
                        try:
                            unit_cost = Decimal(current_cost_excl) if current_cost_excl else None
                        except InvalidOperation:
                            unit_cost = None
                        
                        # Create or update recipe
                        if current_product_code and current_description:
                            current_recipe, created = Recipe.objects.update_or_create(
                                department=department,
                                product_code=current_product_code,
                                defaults={
                                    'name': current_description,
                                    'description': f"Imported from CSV: {current_description}",
                                    'yield_quantity': Decimal('1'),  # Default, will update later
                                    'unit_cost': unit_cost,
                                    'created_by': admin_user,
                                    'is_active': True
                                }
                            )
                            
                            if created:
                                self.stdout.write(f"Created recipe from CSV: {current_recipe}")
                                recipe_count += 1
                                
                                # Create recipe version for audit trail
                                RecipeVersion.objects.create(
                                    recipe=current_recipe,
                                    version_number=1,
                                    changed_by=admin_user,
                                    change_notes="Initial import from CSV",
                                    previous_data={}  # Empty for initial import
                                )
                            else:
                                self.stdout.write(f"Updated recipe from CSV: {current_recipe}")
                        
                        continue
                    
                    # Check if this is an ingredient row
                    if current_recipe and row[0] == current_department and row[2] and len(row) > 7:
                        prod_code = row[2]
                        ing_description = row[3]
                        pack_size = row[4]
                        weight = row[5]
                        cost = row[6]
                        recipe_use = row[7]
                        total_cost = row[8] if len(row) > 8 else ''
                        
                        # Skip if missing essential data
                        if not ing_description:
                            continue
                        
                        # Convert numeric values
                        try:
                            quantity = Decimal(recipe_use) if recipe_use else Decimal('0')
                            unit_cost_val = Decimal(cost) if cost else Decimal('0')
                            total_cost_val = Decimal(total_cost) if total_cost else (quantity * unit_cost_val)
                        except InvalidOperation:
                            self.stdout.write(self.style.WARNING(f"Invalid numeric value for ingredient: {ing_description}"))
                            continue
                        
                        # Create or update ingredient
                        ingredient, ing_created = RecipeIngredient.objects.update_or_create(
                            recipe=current_recipe,
                            ingredient_code=prod_code or '',
                            ingredient_name=ing_description,
                            defaults={
                                'pack_size': pack_size or '',
                                'quantity': quantity,
                                'unit': 'kg',  # Default unit
                                'unit_cost': unit_cost_val,
                                'total_cost': total_cost_val
                            }
                        )
                        
                        if ing_created:
                            ingredient_count += 1
                    
                    # Check for yield information
                    if current_recipe and row[0] == current_department and row[4] and row[4].strip().lower() == 'yield':
                        try:
                            yield_value = Decimal(row[6]) if row[6] else Decimal('0')
                            if yield_value > 0:
                                current_recipe.yield_quantity = yield_value
                                current_recipe.save(update_fields=['yield_quantity'])
                        except (InvalidOperation, IndexError):
                            pass
                
                # Update all recipe costs
                for recipe in Recipe.objects.all():
                    recipe.update_unit_cost()
                
                self.stdout.write(self.style.SUCCESS(f"Imported/updated {recipe_count} recipes and {ingredient_count} ingredients from CSV"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error importing from CSV: {str(e)}"))
            raise
