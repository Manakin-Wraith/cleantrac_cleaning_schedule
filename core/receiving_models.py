from django.db import models
from core.models import Department


class Product(models.Model):
    """Canonical list of products referenced by receiving records.
    Populated from traceability `products` table / products.json. Keeps names & descriptions in one place.
    """

    product_code = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    supplier_code = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["product_code"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return f"{self.product_code} – {self.name}"


class ReceivingRecordManager(models.Manager):
    """All queries for ReceivingRecord should hit the Postgres traceability source DB."""
    def get_queryset(self):
        # Use the read-only replica that actually contains the copied rows
        # The import_receiving_data command copies rows into the "traceability" alias,
        # so the manager should query the same DB. Otherwise admin/API will see no data.
        return super().get_queryset().using("traceability")


class ReceivingRecord(models.Model):
    """Stores inventory (receiving) rows copied from the external import DB.
    Filter by department for dashboards.
    """

    tracking_id = models.CharField(max_length=255, primary_key=True, db_column="tracking_id")
    # Keep legacy field for now (nullable) until fully migrated.
    product_code = models.CharField(max_length=255, blank=True, null=True)
    batch_number = models.CharField(max_length=255)
    supplier_code = models.CharField(max_length=50)
    # duplicate tracking_id field removed – handled above
    quantity_remaining = models.DecimalField(max_digits=10, decimal_places=2, db_column="quantity")
    unit = models.CharField(max_length=20)
    storage_location = models.CharField(max_length=255, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    best_before_date = models.DateField(blank=True, null=True)
    received_date = models.DateTimeField()
    status = models.CharField(max_length=20, db_column="quality_status")
    last_updated = models.DateTimeField(blank=True, null=True, db_column="updated_at")

    # Map to the correct column name in the external table
    department = models.CharField(max_length=100, db_column="department_manager")

    # Use custom manager
    objects = ReceivingRecordManager()

    class Meta:
        db_table = "received_products"  # use the shared table written by Streamlit
        managed = False  # prevent Django migrations from altering the external table
        indexes = [
            models.Index(fields=["product_code"]),
            models.Index(fields=["batch_number"]),
            models.Index(fields=["supplier_code"]),
        ]
        ordering = ["-received_date"]
        verbose_name = "Receiving Record"
        verbose_name_plural = "Receiving Records"
