# Generated by Django 5.2.1 on 2025-05-23 14:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_cleaningitem_default_assigned_staff_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="phone_number",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
