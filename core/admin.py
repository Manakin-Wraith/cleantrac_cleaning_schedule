from django.contrib import admin
from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog

# Basic registration
admin.site.register(Department)
admin.site.register(CleaningItem)
admin.site.register(TaskInstance)
admin.site.register(CompletionLog)

# More customized admin for UserProfile (optional, can be enhanced later)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'role')
    list_filter = ('department', 'role')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'department__name')

admin.site.register(UserProfile, UserProfileAdmin)

# You can create more customized ModelAdmin classes for other models as needed
# For example, for TaskInstance:
# class TaskInstanceAdmin(admin.ModelAdmin):
#     list_display = ('cleaning_item', 'due_date', 'assigned_to', 'status', 'department')
#     list_filter = ('status', 'due_date', 'cleaning_item__department')
#     search_fields = ('cleaning_item__name', 'assigned_to__username')
#     date_hierarchy = 'due_date'
#
# admin.site.register(TaskInstance, TaskInstanceAdmin)
