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


class ReceivingRecord(models.Model):
    """Stores inventory (receiving) rows copied from the external import DB.
    Filter by department for dashboards.
    """

    inventory_id = models.IntegerField(primary_key=True)
    # Keep legacy field for now (nullable) until fully migrated.
    product_code = models.CharField(max_length=255, blank=True, null=True)
    # New normalized relation
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="receiving_records", null=True, blank=True)
    batch_number = models.CharField(max_length=255)
    supplier_code = models.CharField(max_length=50)
    tracking_id = models.CharField(max_length=255, blank=True, null=True)
    quantity_remaining = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    storage_location = models.CharField(max_length=255, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    best_before_date = models.DateField(blank=True, null=True)
    received_date = models.DateTimeField()
    status = models.CharField(max_length=20)
    last_updated = models.DateTimeField(blank=True, null=True)

    department = models.ForeignKey(Department, on_delete=models.PROTECT)

    class Meta:
        indexes = [
            models.Index(fields=["product_code"]),
            models.Index(fields=["product"]),
            models.Index(fields=["batch_number"]),
            models.Index(fields=["supplier_code"]),
            models.Index(fields=["department"]),
        ]
        ordering = ["-received_date"]
        verbose_name = "Receiving Record"
        verbose_name_plural = "Receiving Records"
