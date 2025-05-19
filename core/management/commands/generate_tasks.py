from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from core.models import CleaningItem, TaskInstance, Department

class Command(BaseCommand):
    help = 'Generates task instances based on cleaning item frequencies for all departments.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting task generation...'))
        
        today = timezone.localdate()
        created_count = 0

        for department in Department.objects.all():
            self.stdout.write(self.style.HTTP_INFO(f'Processing department: {department.name}'))
            department_created_count = 0
            # Iterate through relevant cleaning items for the current department
            for item in CleaningItem.objects.filter(department=department).exclude(frequency='As Needed'):
                should_create = False
                new_due_date = None

                if item.frequency == 'Daily':
                    if not TaskInstance.objects.filter(cleaning_item=item, due_date=today).exists():
                        should_create = True
                        new_due_date = today
                
                elif item.frequency == 'Weekly':
                    start_of_week = today - timedelta(days=today.weekday()) # Monday
                    end_of_week = start_of_week + timedelta(days=6) # Sunday
                    if not TaskInstance.objects.filter(cleaning_item=item, due_date__range=[start_of_week, end_of_week]).exists():
                        should_create = True
                        new_due_date = end_of_week # Due end of the current week

                elif item.frequency == 'Monthly':
                    start_of_month = today.replace(day=1)
                    if today.month == 12:
                        end_of_month = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                    else:
                        end_of_month = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
                    
                    if not TaskInstance.objects.filter(cleaning_item=item, due_date__range=[start_of_month, end_of_month]).exists():
                        should_create = True
                        new_due_date = end_of_month # Due end of the current month

                if should_create and new_due_date:
                    TaskInstance.objects.create(
                        cleaning_item=item,
                        due_date=new_due_date,
                        status='Pending'
                        # assigned_to will be None by default
                        # department is implicitly set via cleaning_item's department
                    )
                    created_count += 1
                    department_created_count +=1
                    self.stdout.write(self.style.SUCCESS(f'  Created task for "{item.name}" due {new_due_date}'))
            
            if department_created_count == 0:
                self.stdout.write(self.style.WARNING(f'  No new tasks generated for {department.name} for {today}.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'  Generated {department_created_count} tasks for {department.name} for {today}.'))


        if created_count == 0:
            self.stdout.write(self.style.WARNING(f'No new tasks generated for any department for {today}.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully generated a total of {created_count} new tasks across all departments.'))
