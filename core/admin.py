from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog

# Basic registration
admin.site.register(Department)
admin.site.register(CleaningItem)
admin.site.register(TaskInstance)
admin.site.register(CompletionLog)

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

# You can create more customized ModelAdmin classes for other models as needed
# For example, for TaskInstance:
# class TaskInstanceAdmin(admin.ModelAdmin):
#     list_display = ('cleaning_item', 'due_date', 'assigned_to', 'status', 'department')
#     list_filter = ('status', 'due_date', 'cleaning_item__department')
#     search_fields = ('cleaning_item__name', 'assigned_to__username')
#     date_hierarchy = 'due_date'
#
# admin.site.register(TaskInstance, TaskInstanceAdmin)
