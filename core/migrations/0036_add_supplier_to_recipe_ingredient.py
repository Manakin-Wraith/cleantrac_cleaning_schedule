# Generated manually for Recipe Traceability enhancement
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0035_add_recipe_template_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipeingredient',
            name='supplier',
            field=models.ForeignKey(
                blank=True,
                help_text='Direct supplier for this ingredient for traceability purposes',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='recipe_ingredients',
                to='core.supplier'
            ),
        ),
    ]
