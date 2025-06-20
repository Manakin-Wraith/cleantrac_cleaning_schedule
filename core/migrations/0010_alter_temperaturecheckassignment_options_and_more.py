# Generated by Django 5.2.1 on 2025-05-27 06:06

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_temperaturecheckassignment"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="temperaturecheckassignment",
            options={
                "ordering": ["-date", "department"],
                "verbose_name": "Temperature Check Assignment",
                "verbose_name_plural": "Temperature Check Assignments",
            },
        ),
        migrations.RenameField(
            model_name="temperaturecheckassignment",
            old_name="assignment_date",
            new_name="date",
        ),
        migrations.AlterUniqueTogether(
            name="temperaturecheckassignment",
            unique_together={("date", "department")},
        ),
        migrations.AddField(
            model_name="temperaturecheckassignment",
            name="am_assigned_staff",
            field=models.ForeignKey(
                blank=True,
                help_text="Staff member assigned for AM temperature checks.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="am_temperature_assignments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="temperaturecheckassignment",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                help_text="User who created this assignment.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_temperature_assignments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="temperaturecheckassignment",
            name="pm_assigned_staff",
            field=models.ForeignKey(
                blank=True,
                help_text="Staff member assigned for PM temperature checks.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pm_temperature_assignments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="temperaturecheckassignment",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                help_text="User who last updated this assignment.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="updated_temperature_assignments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RemoveField(
            model_name="temperaturecheckassignment",
            name="am_staff",
        ),
        migrations.RemoveField(
            model_name="temperaturecheckassignment",
            name="assigned_by",
        ),
        migrations.RemoveField(
            model_name="temperaturecheckassignment",
            name="pm_staff",
        ),
    ]
