"""Health-check command to verify connectivity to the external traceability
(Postgres) database and that the expected number of rows are present in
`received_products`.  Intended for use in CI/CD pipelines and manual
troubleshooting.

Usage::

    python manage.py check_traceability_db [--expected 700]

The command exits with status-code 1 if the query fails or if the row count is
below the expected threshold.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import DatabaseError

from core.receiving_models import ReceivingRecord


class Command(BaseCommand):
    help = "Verify traceability_source DB connectivity and row count."

    def add_arguments(self, parser):
        parser.add_argument(
            "--expected",
            type=int,
            default=1,
            help="Fail if row count is less than this value (default: 1)",
        )

    def handle(self, *args, **options):  # noqa: D401
        expected = options["expected"]
        try:
            count = ReceivingRecord.objects.using("traceability").count()
        except DatabaseError as exc:
            raise CommandError(f"Could not query traceability_source DB: {exc}") from exc

        if count < expected:
            raise CommandError(
                f"Row count {count} is below expected minimum {expected}. Check data import."
            )

        self.stdout.write(self.style.SUCCESS(f"Traceability DB OK – received_products rows: {count}"))
