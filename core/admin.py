from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureCheckAssignment, TemperatureLog,
    DocumentTemplate, GeneratedDocument
)

# Basic registration
admin.site.register(Department)
admin.site.register(CleaningItem)
admin.site.register(TaskInstance)
admin.site.register(CompletionLog)

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

# You can create more customized ModelAdmin classes for other models as needed
# For example, for TaskInstance:
# class TaskInstanceAdmin(admin.ModelAdmin):
#     list_display = ('cleaning_item', 'due_date', 'assigned_to', 'status', 'department')
#     list_filter = ('status', 'due_date', 'cleaning_item__department')
#     search_fields = ('cleaning_item__name', 'assigned_to__username')
#     date_hierarchy = 'due_date'
#
# admin.site.register(TaskInstance, TaskInstanceAdmin)
