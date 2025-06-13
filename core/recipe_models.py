from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Department, UserProfile

class Recipe(models.Model):
    """
    Represents a recipe/product that can be produced by a department.
    """
    recipe_id = models.AutoField(primary_key=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='recipes')
    product_code = models.CharField(max_length=50)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    yield_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    yield_unit = models.CharField(max_length=50, default="kg")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_recipes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"
        # Ensure product_code is unique within a department
        unique_together = [('department', 'product_code')]
        ordering = ['department', 'name']

    def __str__(self):
        return f"{self.name} ({self.product_code}) - {self.department.name}"
    
    def calculate_total_cost(self):
        """Calculate the total cost of all ingredients in this recipe"""
        ingredients = self.ingredients.all()
        return sum(ingredient.total_cost for ingredient in ingredients)
    
    def update_unit_cost(self):
        """Update the unit cost based on total cost and yield"""
        total_cost = self.calculate_total_cost()
        if self.yield_quantity and self.yield_quantity > 0:
            self.unit_cost = total_cost / self.yield_quantity
            self.save(update_fields=['unit_cost', 'updated_at'])
        return self.unit_cost


class RecipeIngredient(models.Model):
    """
    Represents an ingredient used in a recipe with its quantity and cost.
    """
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    ingredient_code = models.CharField(max_length=50)
    ingredient_name = models.CharField(max_length=200)
    pack_size = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    unit = models.CharField(max_length=50, default="kg")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        verbose_name = "Recipe Ingredient"
        verbose_name_plural = "Recipe Ingredients"
        ordering = ['recipe', 'ingredient_name']

    def __str__(self):
        return f"{self.ingredient_name} ({self.quantity} {self.unit}) for {self.recipe.name}"
    
    def save(self, *args, **kwargs):
        # Calculate total cost before saving
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)
        # Update the recipe's unit cost
        self.recipe.update_unit_cost()


class RecipeVersion(models.Model):
    """
    Tracks changes to recipes for audit purposes.
    """
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recipe_changes')
    changed_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True, null=True)
    previous_data = models.JSONField()

    class Meta:
        verbose_name = "Recipe Version"
        verbose_name_plural = "Recipe Versions"
        unique_together = [('recipe', 'version_number')]
        ordering = ['-version_number']

    def __str__(self):
        return f"Version {self.version_number} of {self.recipe.name}"


class ProductionSchedule(models.Model):
    """
    Represents a scheduled production of a recipe.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('L', 'Litre'),
        ('ea', 'Each'),
        ('case', 'Case'),
    ]
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='production_schedules')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='production_schedules')
    scheduled_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    batch_size = models.DecimalField(max_digits=10, decimal_places=2)
    batch_unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='kg', help_text="Unit for batch_size (kg, L, ea, case)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    assigned_staff = models.ManyToManyField(User, related_name='assigned_productions', blank=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Production Schedule"
        verbose_name_plural = "Production Schedules"
        ordering = ['scheduled_date', 'start_time']

    def __str__(self):
        time_str = f" at {self.start_time.strftime('%H:%M')}" if self.start_time else ""
        return f"{self.recipe.name} on {self.scheduled_date}{time_str} - {self.get_status_display()}"


class ProductionRecord(models.Model):
    """
    Records the actual production details after completion.
    """
    QUALITY_CHOICES = [
        ('pass', 'Pass'),
        ('fail', 'Fail'),
        ('partial', 'Partial Pass'),
    ]
    
    schedule = models.OneToOneField(ProductionSchedule, on_delete=models.CASCADE, related_name='production_record')
    actual_start_time = models.DateTimeField()
    actual_end_time = models.DateTimeField()
    actual_yield = models.DecimalField(max_digits=10, decimal_places=2)
    quality_check = models.CharField(max_length=10, choices=QUALITY_CHOICES)
    quality_notes = models.TextField(blank=True, null=True)
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='completed_productions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Production Record"
        verbose_name_plural = "Production Records"
        ordering = ['-actual_end_time']

    def __str__(self):
        return f"Production of {self.schedule.recipe.name} completed on {self.actual_end_time.date()}"


class InventoryItem(models.Model):
    """
    Tracks inventory of ingredients used in recipes.
    """
    ingredient_code = models.CharField(max_length=50)
    ingredient_name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='inventory_items')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, default="kg")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Inventory Item"
        verbose_name_plural = "Inventory Items"
        unique_together = [('ingredient_code', 'department')]
        ordering = ['department', 'ingredient_name']

    def __str__(self):
        return f"{self.ingredient_name} ({self.current_stock} {self.unit}) - {self.department.name}"


class InventoryTransaction(models.Model):
    """
    Records changes to inventory levels.
    """
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('production_use', 'Production Use'),
        ('adjustment', 'Adjustment'),
        ('waste', 'Waste'),
    ]
    
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(default=timezone.now)
    reference = models.CharField(max_length=200, blank=True, null=True, help_text="Reference to production schedule or purchase order")
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='inventory_transactions')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Inventory Transaction"
        verbose_name_plural = "Inventory Transactions"
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.get_transaction_type_display()} of {self.quantity} {self.inventory_item.unit} {self.inventory_item.ingredient_name} on {self.transaction_date}"

    def save(self, *args, **kwargs):
        # Update inventory item stock level
        if self.transaction_type == 'purchase':
            self.inventory_item.current_stock += self.quantity
        elif self.transaction_type in ['production_use', 'waste']:
            self.inventory_item.current_stock -= self.quantity
        elif self.transaction_type == 'adjustment':
            # For adjustments, quantity can be positive or negative
            self.inventory_item.current_stock += self.quantity
        
        self.inventory_item.save()
        super().save(*args, **kwargs)


class WasteRecord(models.Model):
    """
    Tracks waste from production or expired inventory.
    """
    WASTE_REASONS = [
        ('production_error', 'Production Error'),
        ('expired', 'Expired'),
        ('damaged', 'Damaged'),
        ('quality_issue', 'Quality Issue'),
        ('other', 'Other'),
    ]
    
    recipe = models.ForeignKey(Recipe, on_delete=models.SET_NULL, null=True, blank=True, related_name='waste_records')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='waste_records')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='waste_records')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, default="kg")
    reason = models.CharField(max_length=20, choices=WASTE_REASONS)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_waste')
    recorded_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Waste Record"
        verbose_name_plural = "Waste Records"
        ordering = ['-recorded_at']

    def __str__(self):
        waste_source = self.recipe.name if self.recipe else self.inventory_item.ingredient_name
        return f"{self.quantity} {self.unit} of {waste_source} - {self.reason}"


class RecipeProductionTask(models.Model):
    """
    Represents a specific task in the production workflow for a recipe.
    Tasks can be assigned to staff members and tracked through the production process.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('pending_review', 'Pending Review'),
        ('on_hold', 'On Hold'),
    ]
    
    RECURRENCE_TYPE_CHOICES = [
        ('none', 'No Recurrence'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]
    
    # Fields from the original migration
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='production_tasks')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='recipe_production_tasks')
    scheduled_start_time = models.DateTimeField()
    scheduled_end_time = models.DateTimeField()
    scheduled_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    is_recurring = models.BooleanField(default=False)
    recurrence_type = models.CharField(max_length=10, choices=RECURRENCE_TYPE_CHOICES, default='none')
    recurrence_pattern = models.JSONField(null=True, blank=True, help_text="JSON object defining the recurrence pattern")
    notes = models.TextField(blank=True, null=True)
    assigned_staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_production_tasks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_production_tasks')
    parent_task = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # New fields for enhanced functionality
    task_type = models.CharField(max_length=20, choices=[
        ('prep', 'Preparation'),
        ('production', 'Production'),
        ('post_production', 'Post-Production'),
        ('quality_check', 'Quality Check'),
        ('packaging', 'Packaging'),
        ('cleanup', 'Cleanup'),
    ], default='production')
    description = models.TextField(default='Production task', help_text='Description of the production task')
    duration_minutes = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated duration in minutes")
    
    class Meta:
        verbose_name = "Recipe Production Task"
        verbose_name_plural = "Recipe Production Tasks"
        ordering = ['scheduled_start_time']
        indexes = [
            models.Index(fields=['department', 'status']),
            models.Index(fields=['assigned_staff']),
            models.Index(fields=['scheduled_start_time']),
        ]
    
    def __str__(self):
        return f"{self.get_task_type_display()} for {self.recipe.name} on {self.scheduled_start_time.date()}"
