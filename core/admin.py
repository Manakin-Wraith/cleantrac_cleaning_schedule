from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureCheckAssignment, TemperatureLog,
    Folder, Document, DocumentTemplate, GeneratedDocument, Supplier
)
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord
)

# Basic registration
from .receiving_models import ReceivingRecord, Product

admin.site.register(Department)
admin.site.register(CleaningItem)
admin.site.register(TaskInstance)
admin.site.register(CompletionLog)
admin.site.register(Product)

# Thermometer Verification System Admin Registration

class AreaUnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'target_temperature_min', 'target_temperature_max')
    list_filter = ('department',)
    search_fields = ('name', 'department__name')

admin.site.register(AreaUnit, AreaUnitAdmin)

class ThermometerAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'model_identifier', 'department', 'status', 
                   'last_verification_date', 'verification_expiry_date', 'is_verified')
    list_filter = ('department', 'status')
    search_fields = ('serial_number', 'model_identifier', 'department__name')
    readonly_fields = ('is_verified', 'days_until_expiry')
    
    def is_verified(self, obj):
        return obj.is_verified()
    is_verified.boolean = True
    is_verified.short_description = 'Currently Verified'

admin.site.register(Thermometer, ThermometerAdmin)

class ThermometerVerificationRecordAdmin(admin.ModelAdmin):
    list_display = ('thermometer', 'date_verified', 'calibrated_instrument_no', 
                   'reading_after_verification', 'calibrated_by')
    list_filter = ('date_verified', 'thermometer__department')
    search_fields = ('thermometer__serial_number', 'calibrated_instrument_no', 
                    'calibrated_by__username')
    date_hierarchy = 'date_verified'

admin.site.register(ThermometerVerificationRecord, ThermometerVerificationRecordAdmin)

class ThermometerVerificationAssignmentAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'department', 'assigned_date', 'assigned_by', 'is_active')
    list_filter = ('department', 'is_active', 'assigned_date')
    search_fields = ('staff_member__username', 'staff_member__first_name', 
                    'staff_member__last_name', 'department__name')
    date_hierarchy = 'assigned_date'

admin.site.register(ThermometerVerificationAssignment, ThermometerVerificationAssignmentAdmin)

class TemperatureCheckAssignmentAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'department', 'assigned_date', 'time_period', 'assigned_by', 'is_active')
    list_filter = ('department', 'time_period', 'is_active', 'assigned_date')
    search_fields = ('staff_member__username', 'staff_member__first_name', 
                    'staff_member__last_name', 'department__name')
    date_hierarchy = 'assigned_date'

admin.site.register(TemperatureCheckAssignment, TemperatureCheckAssignmentAdmin)

class TemperatureLogAdmin(admin.ModelAdmin):
    list_display = ('area_unit', 'log_datetime', 'temperature_reading', 'time_period', 
                   'logged_by', 'thermometer_used', 'is_within_target_range')
    list_filter = ('time_period', 'area_unit__department', 'log_datetime')
    search_fields = ('area_unit__name', 'logged_by__username', 'thermometer_used__serial_number')
    date_hierarchy = 'log_datetime'
    readonly_fields = ('is_within_target_range',)
    
    def is_within_target_range(self, obj):
        return obj.is_within_target_range()
    is_within_target_range.boolean = True
    is_within_target_range.short_description = 'Within Target Range'

admin.site.register(TemperatureLog, TemperatureLogAdmin)

# Customized admin for UserProfile
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'department', 'role')
    list_filter = ('department', 'role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone_number', 'department__name')

admin.site.register(UserProfile, UserProfileAdmin)

# Define an inline admin descriptor for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('phone_number', 'department', 'role')

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'first_name', 'last_name', 'is_staff', 'get_phone_number', 'get_role', 'get_department')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (('Personal info'), {'fields': ('first_name', 'last_name')}),
        (('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    search_fields = ('username', 'first_name', 'last_name', 'profile__phone_number')

    def get_phone_number(self, obj):
        return obj.profile.phone_number if hasattr(obj, 'profile') else None
    get_phone_number.short_description = 'Phone Number'

    def get_role(self, obj):
        return obj.profile.get_role_display() if hasattr(obj, 'profile') else None
    get_role.short_description = 'Role'

    def get_department(self, obj):
        return obj.profile.department.name if hasattr(obj, 'profile') and obj.profile.department else None
    get_department.short_description = 'Department'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Document Template Management Admin Registration

class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'template_type', 'created_by', 'created_at', 'updated_at')
    list_filter = ('department', 'template_type', 'created_at')
    search_fields = ('name', 'description', 'department__name', 'created_by__username')
    date_hierarchy = 'created_at'

admin.site.register(DocumentTemplate, DocumentTemplateAdmin)

class GeneratedDocumentAdmin(admin.ModelAdmin):
    list_display = ('template', 'department', 'generated_by', 'status', 'created_at')
    list_filter = ('department', 'status', 'created_at')
    search_fields = ('template__name', 'department__name', 'generated_by__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('parameters',)

admin.site.register(GeneratedDocument, GeneratedDocumentAdmin)

@admin.register(ReceivingRecord)
class ReceivingRecordAdmin(admin.ModelAdmin):
    list_display = (
        "inventory_id",
        "product_code",
        "batch_number",
        "supplier_code",
        "quantity_remaining",
        "unit",
        "department",
        "received_date",
        "status",
    )
    list_filter = ("department", "status", "supplier_code")
    search_fields = ("product_code", "batch_number", "supplier_code", "tracking_id")

# Register Folder and Document models
admin.site.register(Folder)
admin.site.register(Document)

# Supplier Admin Registration
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('supplier_code', 'supplier_name', 'get_departments', 'country_of_origin', 'created_at', 'updated_at')
    list_filter = ('departments', 'country_of_origin', 'created_at')
    search_fields = ('supplier_code', 'supplier_name', 'contact_info', 'address', 'country_of_origin')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    def get_departments(self, obj):
        return ", ".join([d.name for d in obj.departments.all()])
    get_departments.short_description = 'Departments'

admin.site.register(Supplier, SupplierAdmin)

# Recipe Management System Admin Registration
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('product_code', 'name', 'department', 'yield_quantity', 'yield_unit', 'unit_cost', 'is_active', 'created_at')
    list_filter = ('department', 'is_active', 'created_at')
    search_fields = ('product_code', 'name', 'description')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')

admin.site.register(Recipe, RecipeAdmin)

class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = ('recipe', 'ingredient_code', 'ingredient_name', 'quantity', 'unit', 'unit_cost', 'total_cost')
    list_filter = ('recipe__department',)
    search_fields = ('recipe__name', 'ingredient_code', 'ingredient_name')

admin.site.register(RecipeIngredient, RecipeIngredientAdmin)

class RecipeVersionAdmin(admin.ModelAdmin):
    list_display = ('recipe', 'version_number', 'changed_by', 'changed_at')
    list_filter = ('recipe__department', 'changed_at')
    search_fields = ('recipe__name', 'change_notes')
    date_hierarchy = 'changed_at'
    readonly_fields = ('previous_data',)

admin.site.register(RecipeVersion, RecipeVersionAdmin)

class ProductionScheduleAdmin(admin.ModelAdmin):
    list_display = ('recipe', 'department', 'scheduled_date', 'status', 'batch_size', 'created_by')
    list_filter = ('department', 'status', 'scheduled_date')
    search_fields = ('recipe__name', 'notes')
    date_hierarchy = 'scheduled_date'
    filter_horizontal = ('assigned_staff',)

admin.site.register(ProductionSchedule, ProductionScheduleAdmin)

class ProductionRecordAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'actual_start_time', 'actual_end_time', 'actual_yield', 'quality_check', 'completed_by')
    list_filter = ('quality_check', 'actual_start_time')
    search_fields = ('schedule__recipe__name', 'quality_notes')
    date_hierarchy = 'actual_start_time'

admin.site.register(ProductionRecord, ProductionRecordAdmin)

class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('ingredient_code', 'ingredient_name', 'department', 'current_stock', 'unit', 'unit_cost', 'last_updated')
    list_filter = ('department', 'last_updated')
    search_fields = ('ingredient_code', 'ingredient_name')
    date_hierarchy = 'last_updated'

admin.site.register(InventoryItem, InventoryItemAdmin)

class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('inventory_item', 'transaction_type', 'quantity', 'transaction_date', 'recorded_by')
    list_filter = ('transaction_type', 'transaction_date', 'inventory_item__department')
    search_fields = ('inventory_item__ingredient_name', 'reference', 'notes')
    date_hierarchy = 'transaction_date'

admin.site.register(InventoryTransaction, InventoryTransactionAdmin)

class WasteRecordAdmin(admin.ModelAdmin):
    list_display = ('department', 'recipe', 'inventory_item', 'quantity', 'unit', 'reason', 'cost', 'recorded_at')
    list_filter = ('department', 'reason', 'recorded_at')
    search_fields = ('recipe__name', 'inventory_item__ingredient_name', 'notes')
    date_hierarchy = 'recorded_at'

admin.site.register(WasteRecord, WasteRecordAdmin)

# You can create more customized ModelAdmin classes for other models as needed
# For example, for TaskInstance:
# class TaskInstanceAdmin(admin.ModelAdmin):
#     list_display = ('cleaning_item', 'due_date', 'assigned_to', 'status', 'department')
#     list_filter = ('status', 'due_date', 'cleaning_item__department')
#     search_fields = ('cleaning_item__name', 'assigned_to__username')
#     date_hierarchy = 'due_date'
#
# admin.site.register(TaskInstance, TaskInstanceAdmin)
