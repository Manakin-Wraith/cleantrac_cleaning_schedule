# Data migration to backfill supplier relationships for existing recipe ingredients
from django.db import migrations


def backfill_supplier_relationships(apps, schema_editor):
    """
    Backfill supplier relationships for existing RecipeIngredient records.
    Logic:
    1. For ingredients with linked products, use product's supplier_code to find supplier
    2. For ingredients without products, try to match ingredient_code to product_code
    3. Log any ingredients that can't be matched
    """
    RecipeIngredient = apps.get_model('core', 'RecipeIngredient')
    Product = apps.get_model('core', 'Product')
    Supplier = apps.get_model('core', 'Supplier')
    
    updated_count = 0
    unmatched_count = 0
    
    for ingredient in RecipeIngredient.objects.all():
        supplier = None
        
        # Method 1: Use linked product's supplier_code
        if ingredient.product and ingredient.product.supplier_code:
            try:
                supplier = Supplier.objects.get(supplier_code=ingredient.product.supplier_code)
            except Supplier.DoesNotExist:
                pass
        
        # Method 2: Try to match ingredient_code to product_code
        if not supplier:
            try:
                product = Product.objects.get(product_code=ingredient.ingredient_code)
                if product.supplier_code:
                    supplier = Supplier.objects.get(supplier_code=product.supplier_code)
            except (Product.DoesNotExist, Supplier.DoesNotExist):
                pass
        
        # Update ingredient with found supplier
        if supplier:
            ingredient.supplier = supplier
            ingredient.save(update_fields=['supplier'])
            updated_count += 1
        else:
            unmatched_count += 1
    
    print(f"Backfill complete: {updated_count} ingredients updated, {unmatched_count} unmatched")


def reverse_backfill(apps, schema_editor):
    """
    Reverse migration: clear all supplier relationships
    """
    RecipeIngredient = apps.get_model('core', 'RecipeIngredient')
    RecipeIngredient.objects.update(supplier=None)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0036_add_supplier_to_recipe_ingredient'),
    ]

    operations = [
        migrations.RunPython(
            backfill_supplier_relationships,
            reverse_backfill,
        ),
    ]
