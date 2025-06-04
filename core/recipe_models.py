from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
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
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='production_schedules')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='production_schedules')
    scheduled_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    batch_size = models.DecimalField(max_digits=10, decimal_places=2)
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
        item_name = self.recipe.name if self.recipe else self.inventory_item.ingredient_name if self.inventory_item else "Unknown"
        return f"{item_name} waste: {self.quantity} {self.unit} on {self.recorded_at.date()}"


class RecipeProductionTask(models.Model):
    """
    Represents a scheduled production task for a recipe with enhanced scheduling capabilities.
    Supports recurring tasks and detailed status tracking.
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
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='production_tasks')
    recipe_version = models.ForeignKey(RecipeVersion, on_delete=models.SET_NULL, null=True, blank=True, related_name='production_tasks')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='recipe_production_tasks')
    scheduled_start_time = models.DateTimeField()
    scheduled_end_time = models.DateTimeField()
    scheduled_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    assigned_staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_production_tasks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_production_tasks')
    is_recurring = models.BooleanField(default=False)
    recurrence_type = models.CharField(max_length=10, choices=RECURRENCE_TYPE_CHOICES, default='none')
    recurrence_pattern = models.JSONField(null=True, blank=True, help_text="JSON object defining the recurrence pattern")
    parent_task = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_tasks')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
        return f"{self.recipe.name} - {self.scheduled_quantity} {self.recipe.yield_unit} on {self.scheduled_start_time.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        # Ensure end time is after start time
        if self.scheduled_end_time <= self.scheduled_start_time:
            raise ValidationError("End time must be after start time")
        
        # Ensure department matches recipe's department
        if self.recipe.department != self.department:
            raise ValidationError("Task department must match recipe department")
        
        # Validate recurrence pattern if is_recurring is True
        if self.is_recurring and not self.recurrence_pattern:
            raise ValidationError("Recurrence pattern is required for recurring tasks")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def generate_next_occurrence(self):
        """Generate the next occurrence of this task based on recurrence pattern"""
        if not self.is_recurring or not self.recurrence_pattern:
            return None
            
        # Logic to calculate next occurrence based on recurrence_pattern
        # This is a placeholder - actual implementation would depend on the structure of recurrence_pattern
        # and would use datetime calculations based on the pattern
        
        # Example implementation for daily recurrence:
        if self.recurrence_type == 'daily':
            from datetime import timedelta
            
            # Calculate time difference between start and end
            duration = self.scheduled_end_time - self.scheduled_start_time
            
            # Create new start time (1 day after current start)
            new_start = self.scheduled_start_time + timedelta(days=1)
            new_end = new_start + duration
            
            # Create new task
            new_task = RecipeProductionTask(
                recipe=self.recipe,
                recipe_version=self.recipe_version,  # Use the same recipe version
                department=self.department,
                scheduled_start_time=new_start,
                scheduled_end_time=new_end,
                scheduled_quantity=self.scheduled_quantity,
                assigned_staff=self.assigned_staff,
                created_by=self.created_by,
                is_recurring=self.is_recurring,
                recurrence_type=self.recurrence_type,
                recurrence_pattern=self.recurrence_pattern,
                parent_task=self,
                notes=self.notes
            )
            
            return new_task
        
        return None


class ProductionIngredientUsage(models.Model):
    """
    Tracks ingredients used in production tasks with full traceability information.
    Records batch codes, expiration dates, and supplier details for each ingredient used.
    """
    production_task = models.ForeignKey(RecipeProductionTask, on_delete=models.CASCADE, related_name='ingredient_usages')
    ingredient = models.ForeignKey(InventoryItem, on_delete=models.PROTECT, related_name='production_usages')
    batch_code = models.CharField(max_length=100, help_text="Batch or lot code for traceability")
    expiration_date = models.DateField(help_text="Expiration date of the ingredient batch")
    supplier = models.ForeignKey('Supplier', on_delete=models.PROTECT, related_name='ingredient_usages')
    quantity_used = models.DecimalField(max_digits=10, decimal_places=3)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_ingredient_usages')
    recorded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Production Ingredient Usage"
        verbose_name_plural = "Production Ingredient Usages"
        ordering = ['production_task', 'ingredient__ingredient_name']
        indexes = [
            models.Index(fields=['batch_code']),
            models.Index(fields=['expiration_date']),
            models.Index(fields=['supplier']),
        ]

    def __str__(self):
        return f"{self.ingredient.ingredient_name} ({self.quantity_used} {self.ingredient.unit}) for {self.production_task}"
    
    def clean(self):
        # Validate batch code format if needed
        if not self.batch_code or len(self.batch_code.strip()) < 3:
            raise ValidationError("Batch code must be at least 3 characters long")
        
        # Validate expiration date is in the future
        if self.expiration_date < timezone.now().date():
            raise ValidationError("Expiration date cannot be in the past")
        
        # Ensure ingredient belongs to the same department as the production task
        if self.ingredient.department != self.production_task.department:
            raise ValidationError("Ingredient must belong to the same department as the production task")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        
        # Optionally deduct from inventory
        self.deduct_from_inventory()
    
    def deduct_from_inventory(self):
        """Deduct the used quantity from inventory"""
        # Only deduct if the production task is completed or in progress
        if self.production_task.status in ['completed', 'in_progress']:
            # Create inventory transaction record
            # The InventoryTransaction.save() method will handle updating the inventory item's stock level
            InventoryTransaction.objects.create(
                inventory_item=self.ingredient,
                transaction_type='production_use',
                quantity=self.quantity_used,  # Positive value - the save method will handle the deduction
                reference=f"Production: {self.production_task.id}",
                recorded_by=self.recorded_by,
                notes=f"Used in production of {self.production_task.recipe.name}"
            )
            return True
        
        return False


class ProductionOutput(models.Model):
    """
    Records the actual output/yield from a production task.
    Allows comparison between expected and actual yields.
    """
    production_task = models.ForeignKey(RecipeProductionTask, on_delete=models.CASCADE, related_name='outputs')
    actual_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    expected_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    yield_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Calculated as (actual/expected)*100")
    quality_rating = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Quality rating from 1-5")
    batch_code = models.CharField(max_length=100, help_text="Batch code for the produced output")
    production_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField()
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='recorded_outputs')
    recorded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Production Output"
        verbose_name_plural = "Production Outputs"
        ordering = ['-production_date']
        indexes = [
            models.Index(fields=['batch_code']),
            models.Index(fields=['production_date']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.production_task.recipe.name} - {self.actual_quantity} {self.production_task.recipe.yield_unit} on {self.production_date}"
    
    def clean(self):
        # Ensure expiry date is after production date
        if self.expiry_date <= self.production_date:
            raise ValidationError("Expiry date must be after production date")
        
        # Validate quality rating range
        if self.quality_rating is not None and (self.quality_rating < 1 or self.quality_rating > 5):
            raise ValidationError("Quality rating must be between 1 and 5")
    
    def save(self, *args, **kwargs):
        # Calculate yield percentage
        if self.expected_quantity and self.expected_quantity > 0:
            self.yield_percentage = (self.actual_quantity / self.expected_quantity) * 100
        
        self.clean()
        super().save(*args, **kwargs)
        
        # Update production task status if not already completed
        if self.production_task.status != 'completed':
            self.production_task.status = 'completed'
            self.production_task.save(update_fields=['status', 'updated_at'])
        
        # Optionally add to inventory
        self.add_to_inventory()
    
    def add_to_inventory(self):
        """Add the produced output to inventory if applicable"""
        # Check if there's a corresponding inventory item for this recipe
        try:
            inventory_item = InventoryItem.objects.get(recipe=self.production_task.recipe)
            
            # Create inventory transaction to add the produced quantity
            InventoryTransaction.objects.create(
                inventory_item=inventory_item,
                transaction_type='adjustment',  # Using adjustment since it's production
                quantity=self.actual_quantity,  # Positive for addition
                reference=f"Production Output: {self.id}",
                recorded_by=self.recorded_by,
                notes=f"Production output from {self.production_task}"
            )
            
            return True
        except InventoryItem.DoesNotExist:
            # No inventory item exists for this recipe, so nothing to add to inventory
            return False
