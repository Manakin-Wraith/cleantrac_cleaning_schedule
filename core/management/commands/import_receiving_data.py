"""Management command to sync inventory rows from the temporary
`import_receiving` DB into the local ReceivingRecord table.

Usage:
    python manage.py import_receiving_data [--truncate]

If --truncate is supplied, existing ReceivingRecord rows will be deleted
before importing.
"""

from typing import List

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from core.import_models import ImportReceivedProduct, ImportProduct
from core.models import Department
from core.receiving_models import ReceivingRecord, Product


class Command(BaseCommand):
    help = "Import inventory rows from temp DB into ReceivingRecord"

    def add_arguments(self, parser):
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="Delete all existing ReceivingRecord rows before importing.",
        )

    def handle(self, *args, **options):
        truncate: bool = options["truncate"]

        if truncate:
            self.stdout.write("Truncating existing ReceivingRecord table …")
            ReceivingRecord.objects.all().delete()

        self.stdout.write("Fetching received product rows from traceability_source …")
        received_qs = (
            ImportReceivedProduct.objects.using("traceability_source")
            .select_related(None)
            .order_by("received_date")
        )

        batch_size = 500
        to_create: List[ReceivingRecord] = []
        count = 0

        for idx, rp in enumerate(received_qs.iterator(chunk_size=batch_size), start=1):
            # Lookup product in source to obtain metadata & department
            try:
                src_product = ImportProduct.objects.using("traceability_source").get(
                    product_code=rp.product_code
                )
                dept_name = src_product.department or "UNKNOWN"
            except ImportProduct.DoesNotExist:
                src_product = None
                dept_name = "UNKNOWN"

            # Ensure Product exists (name/description optional)
            product_obj, _ = Product.objects.get_or_create(
                product_code=rp.product_code,
                defaults={
                    "name": (src_product.product_name if src_product else "Unknown"),
                    "description": (src_product.description if src_product else ""),
                    "supplier_code": rp.supplier_code,
                },
            )
            department, _ = Department.objects.get_or_create(name=dept_name)

            if ReceivingRecord.objects.filter(pk=idx).exists():
                # Update scenario – keep it simple: skip existing to avoid heavy updates.
                self.stderr.write(f"Skipped inventory {idx} (already present).")
                continue

            to_create.append(
                ReceivingRecord(
                    inventory_id=idx,
                    product_code=rp.product_code,
                    product=product_obj,
                    batch_number=rp.batch_number,
                    supplier_code=rp.supplier_code,
                    tracking_id=rp.tracking_id,
                    quantity_remaining=rp.quantity,
                    unit=rp.unit,
                    storage_location=rp.storage_location,
                    expiry_date=rp.expiry_date,
                    best_before_date=rp.best_before_date,
                                            # Ensure timezone-aware datetimes to avoid UTC shift issues
                        received_date=timezone.make_aware(rp.received_date) if timezone.is_naive(rp.received_date) else rp.received_date,
                    status=rp.quality_status,
                    last_updated=rp.updated_at,
                    department=department,
                )
            )

            if len(to_create) >= batch_size:
                ReceivingRecord.objects.bulk_create(to_create, ignore_conflicts=True)
                count += len(to_create)
                to_create.clear()
                self.stdout.write(f"Imported {count} rows …")

        # Final flush
        if to_create:
            ReceivingRecord.objects.bulk_create(to_create, ignore_conflicts=True)
            count += len(to_create)

        self.stdout.write(self.style.SUCCESS(f"Done. Total rows imported: {count}"))
