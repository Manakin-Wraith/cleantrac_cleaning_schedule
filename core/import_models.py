from django.db import models


class ImportProduct(models.Model):
    """Read-only mapping of the `products` table in the temporary `import_receiving` DB."""

    # Columns taken directly from the source table.
    product_code = models.CharField(max_length=50, primary_key=True)
    product_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    department = models.CharField(max_length=50, null=True, blank=True)
    sub_department = models.CharField(max_length=50, null=True, blank=True)
    product_type = models.CharField(max_length=100, null=True, blank=True)
    supplier_code = models.CharField(max_length=50, null=True, blank=True)
    supplier_product_code = models.CharField(max_length=50, null=True, blank=True)
    id = models.IntegerField()  # original surrogate key, not used as PK here

    class Meta:
        managed = False
        db_table = "products"
        app_label = "core"


class ImportReceivedProduct(models.Model):
    """Read-only mapping of the `received_products` table in the traceability source DB."""

    tracking_id = models.CharField(max_length=255, primary_key=True)
    product_code = models.CharField(max_length=255)
    supplier_code = models.CharField(max_length=50)
    batch_number = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    received_date = models.DateTimeField()
    expiry_date = models.DateField(null=True, blank=True)
    best_before_date = models.DateField(null=True, blank=True)
    temperature_received = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_required = models.BooleanField(default=False)
    storage_location = models.CharField(max_length=255, null=True, blank=True)
    received_by = models.CharField(max_length=100, null=True, blank=True)
    department_manager = models.CharField(max_length=100, null=True, blank=True)
    quality_status = models.CharField(max_length=50)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    supplier_invoice_number = models.CharField(max_length=100, null=True, blank=True)
    supplier_invoice_date = models.DateField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "received_products"
        app_label = "core"


class ImportInventory(models.Model):
    """Read-only mapping of the `inventory` table in the temporary `import_receiving` DB."""

    inventory_id = models.IntegerField(primary_key=True)
    product_id = models.IntegerField()
    product_code = models.CharField(max_length=255)
    batch_number = models.CharField(max_length=255)
    supplier_code = models.CharField(max_length=50)
    tracking_id = models.CharField(max_length=255, null=True, blank=True)
    quantity_remaining = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    storage_location = models.CharField(max_length=255, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    best_before_date = models.DateField(null=True, blank=True)
    received_date = models.DateTimeField()
    status = models.CharField(max_length=20)
    last_updated = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "inventory"
        app_label = "core"
