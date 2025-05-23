from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsSuperUser(BasePermission):
    """Allows access only to superusers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

class IsManager(BasePermission):
    """Allows access only to users with the 'manager' role."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'manager'
        except AttributeError: # Handles cases like no profile (though our signals should prevent this for active users)
            return False

class IsStaff(BasePermission):
    """Allows access only to users with the 'staff' role."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'staff'
        except AttributeError:
            return False

class IsManagerForWriteOrAuthenticatedReadOnly(BasePermission):
    """Allows read-only access to any authenticated user, but write access only to managers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS: # GET, HEAD, OPTIONS
            return True # Department filtering is handled by get_queryset
        
        # For write methods (POST, PUT, PATCH, DELETE), check if user is a manager
        try:
            return request.user.profile.role == 'manager'
        except AttributeError:
            return False

    def has_object_permission(self, request, view, obj):
        """
        Object-level permission to only allow managers of the object's department to edit.
        This assumes the object has a 'department' attribute or a way to reach it.
        """
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True # Viewing permission already handled by get_queryset and has_permission

        # Write permissions.
        try:
            user_is_manager = request.user.profile.role == 'manager'
            user_department = request.user.profile.department

            if not user_is_manager or not user_department:
                return False # Not a manager or no department assigned to manager

            # Check if the manager's department matches the object's department
            # This needs to be flexible based on how 'obj' relates to a department.
            # For CleaningItem, obj.department should work.
            # For TaskInstance, obj.cleaning_item.department.
            # For CompletionLog, obj.task_instance.cleaning_item.department.
            obj_department = None
            if hasattr(obj, 'department'):
                obj_department = obj.department
            elif hasattr(obj, 'cleaning_item') and hasattr(obj.cleaning_item, 'department'):
                obj_department = obj.cleaning_item.department
            elif hasattr(obj, 'task_instance') and hasattr(obj.task_instance, 'cleaning_item') and hasattr(obj.task_instance.cleaning_item, 'department'):
                obj_department = obj.task_instance.cleaning_item.department
            
            return obj_department == user_department

        except AttributeError:
            return False # User has no profile, or object structure is unexpected

class IsSuperUserForWriteOrAuthenticatedReadOnly(BasePermission):
    """
    Allows read-only access to any authenticated user,
    but write access (POST, PUT, PATCH, DELETE) only to superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS: # GET, HEAD, OPTIONS
            return True
        
        # For write methods, check if user is a superuser
        return request.user.is_superuser
    
    def has_object_permission(self, request, view, obj):
        # Object-level check for superuser on write, or allow if read-only
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_superuser


class IsSuperUserWriteOrManagerRead(BasePermission):
    """
    Allows write access only to superusers.
    Allows read access to superusers and managers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in SAFE_METHODS:
            # Allow read for superuser or manager
            return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.role == 'manager')
        
        # For unsafe methods (POST, PUT, DELETE), only superuser
        return request.user.is_superuser


class UserAndProfileManagementPermissions(BasePermission):
    """
    Custom permissions for User and UserProfile viewsets.
    - Superusers: Full CRUD.
    - Managers: CRUD on users/profiles in their department. Can create. Cannot delete self.
    - Staff: Update self. Read-only on self (via get_queryset). No create/delete.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS: # GET, HEAD, OPTIONS for list view
            return True

        # POST (create) permissions
        if request.method == 'POST':
            if request.user.is_superuser:
                return True
            try:
                return request.user.profile.role == 'manager'
            except AttributeError: # No profile
                return False
        
        # For other methods like PUT, PATCH, DELETE on the list endpoint (less common for ViewSets but covered)
        # Default to superuser or manager for general write ops not on an object yet.
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role == 'manager'
        except AttributeError:
            return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superuser can do anything to any object
        if request.user.is_superuser:
            return True

        # Determine if the object is User or UserProfile for field access
        is_user_object = obj.__class__.__name__ == 'User'
        is_profile_object = obj.__class__.__name__ == 'UserProfile'

        # Safe methods (GET, HEAD, OPTIONS) are allowed if has_permission passed and queryset filtered
        if request.method in SAFE_METHODS:
            return True

        # PUT, PATCH (Update) permissions
        if request.method in ['PUT', 'PATCH']:
            # User can update themselves
            if is_user_object and obj == request.user:
                return True
            if is_profile_object and obj.user == request.user:
                return True
            
            # Manager can update users/profiles in their department
            try:
                if request.user.profile.role == 'manager' and request.user.profile.department:
                    if is_user_object and hasattr(obj, 'profile') and obj.profile.department == request.user.profile.department:
                        return True
                    if is_profile_object and obj.department == request.user.profile.department:
                        return True
            except AttributeError: # request.user has no profile or obj structure issue
                return False
            return False # Default deny for update if no specific rule matched

        # DELETE permissions
        if request.method == 'DELETE':
            # Managers can delete users/profiles in their department, but not themselves
            try:
                if request.user.profile.role == 'manager' and request.user.profile.department:
                    if is_user_object and hasattr(obj, 'profile') and obj.profile.department == request.user.profile.department and obj != request.user:
                        return True
                    if is_profile_object and obj.department == request.user.profile.department and obj.user != request.user:
                        return True
            except AttributeError:
                return False
            return False # Default deny for delete; staff cannot delete, manager cannot delete self without superuser
        
        return False # Default deny for any other unhandled method or condition

class CanUpdateTaskStatus(BasePermission):
    """
    Custom permission to control task status updates based on user role and workflow.
    - Staff can move tasks from 'pending' or 'in_progress' to 'pending_review'.
    - Managers can move tasks from 'pending_review' to 'completed', and generally manage other statuses
      within their department.
    """
    message = 'You do not have permission to set this task status.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # obj is the TaskInstance
        if not request.user.is_authenticated:
            return False

        # Allow read-only for any authenticated user (department filtering by queryset)
        if request.method in SAFE_METHODS:
            return True

        # For write methods, specifically PATCH for status updates
        if request.method == 'PATCH':
            try:
                user_profile = request.user.profile
                user_role = user_profile.role
                user_department = user_profile.department
            except AttributeError:
                self.message = 'User profile not found.'
                return False # User has no profile

            # Determine object's department
            obj_department = obj.department # Assuming TaskInstance has direct department FK
            if not obj_department:
                # Fallback if TaskInstance.department is not set (should be avoided by application logic)
                # or if linking via cleaning_item.department is preferred.
                if hasattr(obj, 'cleaning_item') and obj.cleaning_item and hasattr(obj.cleaning_item, 'department'):
                    obj_department = obj.cleaning_item.department
                else:
                    self.message = 'Task department could not be determined.'
                    return False
            
            # Managers must belong to the same department as the task for any status change
            if user_role == 'manager' and user_department != obj_department:
                self.message = 'Managers can only update tasks within their own department.'
                return False

            # Staff must be assigned to the task or the task must be in their department
            # (and they are the one making the change)
            if user_role == 'staff':
                if obj.assigned_to != user_profile and user_department != obj_department:
                    self.message = 'Staff can only update tasks assigned to them or within their department.'
                    return False

            current_status = obj.status
            new_status = request.data.get('status')

            if not new_status: # If status is not part of the update, allow (e.g., updating notes)
                return True 

            if user_role == 'staff':
                allowed_transitions_staff = {
                    'pending': ['pending_review', 'in_progress'],
                    'in_progress': ['pending_review'],
                }
                if current_status in allowed_transitions_staff and new_status in allowed_transitions_staff[current_status]:
                    return True
                else:
                    self.message = f"Staff cannot change status from '{current_status}' to '{new_status}'. Allowed: 'pending'/'in_progress' -> 'pending_review'."
                    return False
            
            elif user_role == 'manager':
                # Managers have more flexibility but within their department (checked above)
                allowed_transitions_manager = {
                    'pending': ['in_progress', 'pending_review', 'completed', 'missed', 'requires_attention'],
                    'in_progress': ['pending_review', 'completed', 'missed', 'requires_attention'],
                    'pending_review': ['completed', 'in_progress', 'requires_attention'], # Can send back if needed
                    'requires_attention': ['pending', 'in_progress'], # Can reset
                    'missed': ['pending'] # Can reset
                    # 'completed' status is final for this example unless reopened
                }
                if current_status in allowed_transitions_manager and new_status in allowed_transitions_manager[current_status]:
                    return True
                # Allow manager to complete from any non-completed state, if not explicitly listed above for safety
                if new_status == 'completed' and current_status != 'completed': 
                    return True
                else:
                    self.message = f"Manager action for status from '{current_status}' to '{new_status}' is not permitted by defined workflow or is redundant."
                    return False
            
            return False # Default deny if no role matches or other condition unhandled
        
        # For other write methods like PUT or DELETE, if you want to restrict them based on status:
        # if request.method == 'PUT': # Full update
        #     # Potentially disallow PUT if task is completed, etc.
        #     pass 
        # if request.method == 'DELETE':
        #     # Potentially disallow DELETE if task is completed, etc.
        #     pass

        return True # Allow other write methods if not PATCH, or further restrict if needed.

class CanLogCompletionAndManagerModify(BasePermission):
    """
    Allows authenticated users to create (POST) CompletionLogs (with further checks often in perform_create).
    Allows authenticated users read-only access (GET, HEAD, OPTIONS).
    Allows only managers of the relevant department to update/delete (PUT, PATCH, DELETE).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS: # GET, HEAD, OPTIONS
            return True # Department filtering is by get_queryset
        
        if request.method == 'POST': # Staff or Manager can attempt to create
            return True
        
        # For PUT, PATCH, DELETE, check if user is a manager at the view level
        try:
            return request.user.profile.role == 'manager'
        except AttributeError:
            return False

    def has_object_permission(self, request, view, obj):
        """
        Object-level permission.
        - Read is fine for anyone authenticated who passed get_queryset.
        - Write (PUT, PATCH, DELETE) only for managers of the object's department.
        - POST is not handled by has_object_permission as object doesn't exist yet.
        """
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        # For PUT, PATCH, DELETE (write permissions on existing object)
        # Ensure user is a manager and their department matches the object's department.
        try:
            user_is_manager = request.user.profile.role == 'manager'
            user_department = request.user.profile.department

            if not user_is_manager or not user_department:
                return False # Not a manager or no department assigned to manager

            obj_department = None
            # For CompletionLog, obj.task_instance.cleaning_item.department
            if hasattr(obj, 'task_instance') and \
               hasattr(obj.task_instance, 'cleaning_item') and \
               hasattr(obj.task_instance.cleaning_item, 'department'):
                obj_department = obj.task_instance.cleaning_item.department
            
            return obj_department == user_department
        except AttributeError:
            return False # User has no profile, or object structure is unexpected
