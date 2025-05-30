import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import ThermometerVerificationAssignment, TemperatureCheckAssignment
from django.utils import timezone

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrates existing ThermometerVerificationAssignment records to the new split model structure'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the migration in dry-run mode without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry-run', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('Running in DRY RUN mode - no changes will be made'))
        
        # Get all active thermometer verification assignments
        verification_assignments = ThermometerVerificationAssignment.objects.filter(is_active=True)
        
        self.stdout.write(f'Found {verification_assignments.count()} active thermometer verification assignments')
        
        # Keep track of statistics
        stats = {
            'total': verification_assignments.count(),
            'am_created': 0,
            'pm_created': 0,
            'both_created': 0,
            'errors': 0
        }
        
        for assignment in verification_assignments:
            try:
                # Skip if the assignment doesn't have time_period (already migrated)
                if not hasattr(assignment, 'time_period'):
                    self.stdout.write(f'Assignment {assignment.id} has no time_period field, skipping')
                    continue
                
                time_period = getattr(assignment, 'time_period', None)
                
                if not time_period:
                    self.stdout.write(f'Assignment {assignment.id} has no time period value, skipping')
                    continue
                
                self.stdout.write(f'Processing assignment {assignment.id} with time period {time_period}')
                
                if not dry_run:
                    with transaction.atomic():
                        # Create temperature check assignment(s) based on time period
                        if time_period == 'AM' or time_period == 'BOTH':
                            # Create AM assignment
                            TemperatureCheckAssignment.objects.create(
                                staff_member=assignment.staff_member,
                                department=assignment.department,
                                assigned_date=assignment.assigned_date,
                                time_period='AM',
                                is_active=assignment.is_active,
                                notes=f"Migrated from thermometer verification assignment #{assignment.id}"
                            )
                            stats['am_created'] += 1
                            self.stdout.write(self.style.SUCCESS(f'Created AM temperature check assignment for {assignment.staff_member.username}'))
                        
                        if time_period == 'PM' or time_period == 'BOTH':
                            # Create PM assignment
                            TemperatureCheckAssignment.objects.create(
                                staff_member=assignment.staff_member,
                                department=assignment.department,
                                assigned_date=assignment.assigned_date,
                                time_period='PM',
                                is_active=assignment.is_active,
                                notes=f"Migrated from thermometer verification assignment #{assignment.id}"
                            )
                            stats['pm_created'] += 1
                            self.stdout.write(self.style.SUCCESS(f'Created PM temperature check assignment for {assignment.staff_member.username}'))
                        
                        if time_period == 'BOTH':
                            stats['both_created'] += 1
                
            except Exception as e:
                stats['errors'] += 1
                logger.error(f"Error processing assignment {assignment.id}: {str(e)}")
                self.stdout.write(self.style.ERROR(f'Error processing assignment {assignment.id}: {str(e)}'))
        
        # Print summary statistics
        self.stdout.write("\n----- Migration Summary -----")
        self.stdout.write(f"Total assignments processed: {stats['total']}")
        self.stdout.write(f"AM assignments created: {stats['am_created']}")
        self.stdout.write(f"PM assignments created: {stats['pm_created']}")
        self.stdout.write(f"Assignments with both AM/PM: {stats['both_created']}")
        self.stdout.write(f"Errors encountered: {stats['errors']}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nThis was a DRY RUN - no changes were made to the database'))
            self.stdout.write(self.style.WARNING('Run without --dry-run to apply changes'))
        else:
            self.stdout.write(self.style.SUCCESS('\nMigration completed successfully!'))
