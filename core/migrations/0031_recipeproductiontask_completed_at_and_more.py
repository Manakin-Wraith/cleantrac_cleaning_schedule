# Generated by Django 5.2.1 on 2025-06-27 07:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_recurringschedule"),
    ]

    operations = [
        migrations.AddField(
            model_name="recipeproductiontask",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="taskinstance",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="recipeproductiontask",
            name="status",
            field=models.CharField(
                choices=[
                    ("scheduled", "Scheduled"),
                    ("in_progress", "In Progress"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                    ("pending_review", "Pending Review"),
                    ("on_hold", "On Hold"),
                    ("archived", "Archived"),
                ],
                default="scheduled",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="taskinstance",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("in_progress", "In Progress"),
                    ("pending_review", "Pending Review"),
                    ("completed", "Completed"),
                    ("missed", "Missed"),
                    ("requires_attention", "Requires Attention"),
                    ("archived", "Archived"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
