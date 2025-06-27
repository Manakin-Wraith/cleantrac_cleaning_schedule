"""One-off command to convert existing completed tasks to archived.

Usage:
    python manage.py archive_completed_tasks [--dry-run]

If --dry-run is supplied, the command will only report how many tasks would be
updated without making changes.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import TaskInstance
from core.recipe_models import RecipeProductionTask


class Command(BaseCommand):
    help = "Convert tasks with status='completed' to status='archived' and set completed_at if missing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only show the number of records that would be archived without changing them.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        now = timezone.now()

        # Prepare querysets
        cleaning_qs = TaskInstance.objects.filter(status="completed")
        recipe_qs = RecipeProductionTask.objects.filter(status="completed")

        total_cleaning = cleaning_qs.count()
        total_recipe = recipe_qs.count()

        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY-RUN] Would archive %s cleaning tasks and %s recipe tasks." % (total_cleaning, total_recipe)))
            return

        # Update in bulk
        cleaning_updated = cleaning_qs.update(status="archived", completed_at=now)
        recipe_updated = recipe_qs.update(status="archived", completed_at=now)

        self.stdout.write(self.style.SUCCESS("Archived %s cleaning tasks and %s recipe production tasks." % (cleaning_updated, recipe_updated)))
