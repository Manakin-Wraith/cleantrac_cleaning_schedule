from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import TaskInstance
from django.db.models import Q

class Command(BaseCommand):
    help = 'Updates the status of overdue tasks to "Missed".'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting task status update process...'))
        
        today = timezone.localdate()
        updated_count = 0

        # Find tasks that are overdue and not yet completed
        # Overdue means due_date is before today
        # Not completed means status is 'Pending' or 'In Progress'
        overdue_tasks = TaskInstance.objects.filter(
            Q(status='Pending') | Q(status='In Progress'),
            due_date__lt=today
        )

        if not overdue_tasks.exists():
            self.stdout.write(self.style.WARNING('No overdue tasks found to update.'))
        else:
            for task in overdue_tasks:
                old_status = task.status
                task.status = 'Missed'
                task.save()
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Updated task "{task.cleaning_item.name}" (ID: {task.id}) from "{old_status}" to "Missed". Due: {task.due_date}'
                ))

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} tasks to "Missed".'))
