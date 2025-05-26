from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone 
from datetime import date as datetime_date 
from django.db.models import Count 

from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog, PasswordResetToken
from .serializers import (
    DepartmentSerializer, UserSerializer, UserProfileSerializer, 
    CleaningItemSerializer, TaskInstanceSerializer, CompletionLogSerializer,
    CurrentUserSerializer, UserWithProfileSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from rest_framework.permissions import AllowAny # Corrected: AllowAny from DRF
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    CanLogCompletionAndManagerModify, IsSuperUserForWriteOrAuthenticatedReadOnly,
    UserAndProfileManagementPermissions, CanUpdateTaskStatus,
    IsSuperUserWriteOrManagerRead
)
from .sms_utils import send_sms # New import
from django.contrib.auth.password_validation import validate_password # For password strength
from django.core.exceptions import ValidationError as DjangoValidationError # For password validation

# Create your views here.

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsSuperUserWriteOrManagerRead]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Department.objects.none()

        if user.is_superuser:
            return Department.objects.all()
        
        # For managers, only show their own department
        # The IsSuperUserWriteOrManagerRead permission already ensures only superusers or managers can list.
        try:
            if user.profile and user.profile.role == 'manager' and user.profile.department:
                return Department.objects.filter(pk=user.profile.department.pk)
        except UserProfile.DoesNotExist:
            # If manager has no profile, or no department assigned, they see none by this logic.
            # The permission class would likely deny them anyway if they don't meet its criteria.
            return Department.objects.none()
        
        # Fallback for other authenticated users (e.g., staff) - should be empty due to permission class
        # but as a safeguard or if permissions change:
        return Department.objects.none() 

    @action(detail=True, methods=['get'], url_path='status-summary')
    def status_summary(self, request, pk=None):
        department = self.get_object()
        target_date_str = request.query_params.get('date', None)

        if target_date_str:
            try:
                target_date = datetime_date.fromisoformat(target_date_str)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.localdate()

        # Get all task instances for this department due on the target_date
        # TaskInstance -> CleaningItem -> Department
        tasks_for_day = TaskInstance.objects.filter(
            cleaning_item__department=department,
            due_date=target_date
        )

        status_counts = tasks_for_day.values('status').annotate(count=Count('status'))
        
        summary = {
            'department_id': department.id,
            'department_name': department.name,
            'summary_date': target_date.isoformat(),
            'total_tasks': tasks_for_day.count(),
            'pending': 0,
            'in_progress': 0,
            'completed': 0,
            'missed': 0
        }

        for s_count in status_counts:
            if s_count['status'] == 'Pending':
                summary['pending'] = s_count['count']
            elif s_count['status'] == 'In Progress':
                summary['in_progress'] = s_count['count']
            elif s_count['status'] == 'Completed':
                summary['completed'] = s_count['count']
            elif s_count['status'] == 'Missed':
                summary['missed'] = s_count['count']
        
        if summary['total_tasks'] > 0:
            summary['completion_percentage'] = round((summary['completed'] / summary['total_tasks']) * 100, 2)
        else:
            summary['completion_percentage'] = 0 # Or 100 if no tasks means all done, depends on definition

        return Response(summary)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserWithProfileSerializer
    # permission_classes = [permissions.IsAuthenticated] # Old permission
    permission_classes = [UserAndProfileManagementPermissions] # Apply RBAC permission

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()

        # Check for specific query parameters for filtering staff by department
        department_id = self.request.query_params.get('department_id')
        role = self.request.query_params.get('role') # e.g., 'staff'

        queryset = User.objects.all()

        if department_id:
            queryset = queryset.filter(profile__department_id=department_id)
        
        if role:
            queryset = queryset.filter(profile__role=role)

        # If department_id or role was provided, we assume the request is specific enough
        # and the permission_classes will handle whether the requesting user *can* make this query.
        # If no specific filters are provided via query params, then apply general visibility rules.
        if department_id or role:
            # At this point, queryset is filtered by department_id and/or role if they were provided.
            # The UserAndProfileManagementPermissions should ensure that only authorized users (e.g., managers of that department or superusers)
            # can actually get these results. For instance, a staff member from another department shouldn't be able to query for staff in department X.
            # If current user is not superuser, and is a manager, they should only be able to query their own department staff.
            if not user.is_superuser:
                try:
                    manager_profile = user.profile
                    if manager_profile.role == 'manager':
                        if department_id and int(department_id) != manager_profile.department_id:
                            # Manager is trying to query staff outside their department
                            return User.objects.none()
                        # If department_id wasn't provided but role was, implicitly filter by manager's department for safety
                        elif not department_id and manager_profile.department_id:
                             queryset = queryset.filter(profile__department_id=manager_profile.department_id)
                    else: # Staff user making a specific query
                        # Staff can only query for themselves, even with params, unless further rules are added
                        return User.objects.filter(pk=user.pk) 
                except UserProfile.DoesNotExist:
                    return User.objects.none()
            return queryset.distinct() # Ensure distinct users if multiple filters are applied

        # Fallback to original role-based visibility if no specific query params are used
        if user.is_superuser:
            return User.objects.all().distinct()
        
        try:
            user_profile = user.profile # Assumes related_name='profile'
            if user_profile.role == 'manager' and user_profile.department:
                # Managers see users in their department
                return User.objects.filter(profile__department=user_profile.department).distinct()
            else:
                # Staff (or managers without a department) see only themselves
                return User.objects.filter(pk=user.pk).distinct()
        except UserProfile.DoesNotExist:
            # If no profile, default to seeing only self
            return User.objects.filter(pk=user.pk).distinct()

    def perform_create(self, serializer):
        # The UserWithProfileSerializer.create() method now handles all the necessary logic
        # for creating the User, UserProfile, setting the password, and assigning department/role.
        # It has access to the request context via self.context['request'].
        serializer.save()

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    # permission_classes = [permissions.IsAuthenticated] # Old permission
    permission_classes = [UserAndProfileManagementPermissions] # Apply RBAC permission

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return UserProfile.objects.none()

        if user.is_superuser:
            return UserProfile.objects.all()
        
        try:
            user_profile = user.profile
            if user_profile.role == 'manager' and user_profile.department:
                # Managers see profiles of users in their department
                return UserProfile.objects.filter(department=user_profile.department)
            else:
                # Staff (or managers without a department) see only their own profile
                return UserProfile.objects.filter(user=user)
        except UserProfile.DoesNotExist:
            return UserProfile.objects.none() # If requesting user has no profile, they see no profiles

    def perform_create(self, serializer):
        # Generally, UserProfiles are created by signals when a User is created.
        # This endpoint would primarily be for updating.
        # If we allow creation here, ensure department and role logic is consistent.
        user = self.request.user
        profile_user = serializer.validated_data.get('user')

        if user.is_authenticated and not user.is_superuser:
            try:
                manager_profile = user.profile
                if manager_profile.role == 'manager' and manager_profile.department:
                    # Manager is creating/associating a profile.
                    # Ensure the profile is for a user in their department, or assign department.
                    serializer.save(department=manager_profile.department) # Assign department
                    return
            except UserProfile.DoesNotExist:
                pass # Manager has no profile, proceed with default save
        
        # Default save if not a manager or other conditions not met
        serializer.save()

class CleaningItemViewSet(viewsets.ModelViewSet):
    serializer_class = CleaningItemSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly] # Apply new RBAC permission

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return CleaningItem.objects.all()
        try:
            user_profile = user.profile # Assumes related_name='profile' on UserProfile.user
            if user_profile.department:
                return CleaningItem.objects.filter(department=user_profile.department)
        except UserProfile.DoesNotExist:
            # No profile, should not happen for regular users if signals are working
            pass # Fall through to return empty queryset
        return CleaningItem.objects.none() # Default to empty if no department or profile

class TaskInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = TaskInstanceSerializer
    permission_classes = [CanUpdateTaskStatus] # Apply new status update permission

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TaskInstance.objects.all()
        try:
            user_profile = user.profile
            if user_profile.role == 'manager' and user_profile.department:
                # Managers see tasks directly associated with their department
                return TaskInstance.objects.filter(department=user_profile.department)
            elif user_profile.role == 'staff':
                # Staff see tasks assigned to them within their department
                if user_profile.department:
                    return TaskInstance.objects.filter(assigned_to=user_profile, department=user_profile.department)
                else:
                    # Staff without a department (should ideally not happen for active staff)
                    return TaskInstance.objects.filter(assigned_to=user_profile) # Or none()
        except UserProfile.DoesNotExist:
            pass # Fall through to return empty queryset
        return TaskInstance.objects.none() # Default to empty if no applicable conditions met

    def perform_create(self, serializer):
        # If a manager is creating a task, automatically set the task's department to the manager's department
        user_profile = self.request.user.profile
        if user_profile.role == 'manager' and user_profile.department:
            serializer.save(department=user_profile.department)
        else:
            # Handle cases where creator is not a manager or has no department, if applicable
            # This might raise an error or require department to be explicitly passed if not a manager
            # For now, assume serializer might get department from request data or it's optional
            # Or, ensure 'department' is a required field in the serializer if not auto-set.
            # The serializer currently has 'department_id' as a writable field.
            serializer.save()

class CompletionLogViewSet(viewsets.ModelViewSet):
    # queryset = CompletionLog.objects.all() # We'll override get_queryset
    serializer_class = CompletionLogSerializer
    # permission_classes = [permissions.IsAuthenticated] # Old permission
    permission_classes = [CanLogCompletionAndManagerModify] # Apply RBAC permission

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return CompletionLog.objects.all()
        try:
            user_profile = user.profile
            if user_profile.department:
                # Filter CompletionLogs whose related TaskInstance's CleaningItem belongs to the user's department
                return CompletionLog.objects.filter(task_instance__cleaning_item__department=user_profile.department)
        except UserProfile.DoesNotExist:
            pass
        return CompletionLog.objects.none()

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Superusers can do anything.
        Managers can create/read/update/delete logs for their department's tasks.
        Staff can create/read logs for tasks they are assigned to or have completed.
        Staff can update/delete logs they created.
        """
        if self.action in ['list', 'retrieve']:
            # Allow broader read access, specific filtering done in get_queryset
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [IsStaffUser] # Any staff can create a log
        elif self.action in ['update', 'partial_update', 'destroy']:
            # More complex: IsOwnerOrManagerOrSuperUser (custom permission needed)
            # For now, let's restrict to SuperUser or simplify
            permission_classes = [IsSuperUser] # Simplified for now
        else:
            permission_classes = [IsSuperUser] # Default deny
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return CompletionLog.objects.all().order_by('-completed_at')
        elif hasattr(user, 'profile') and user.profile.role == UserProfile.ROLE_MANAGER:
            # Managers see logs for tasks in their department
            manager_department = user.profile.department
            if manager_department:
                return CompletionLog.objects.filter(task_instance__cleaning_item__department=manager_department).order_by('-completed_at')
            return CompletionLog.objects.none() # Manager not assigned to a department
        elif hasattr(user, 'profile') and user.profile.role == UserProfile.ROLE_STAFF:
            # Staff see logs they created or for tasks they are assigned to
            # This might require more complex Q objects if 'assigned to' is a direct field on TaskInstance
            # For now, let's assume they can see logs they created.
            return CompletionLog.objects.filter(user=user).order_by('-completed_at')
        return CompletionLog.objects.none()

    def perform_create(self, serializer):
        # Automatically set the user to the request.user if not provided
        if 'user_id' not in serializer.validated_data or not serializer.validated_data.get('user'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny] # Anyone can request a password reset

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                user = User.objects.get(username=username)
                if hasattr(user, 'profile') and user.profile.phone_number:
                    # Invalidate old tokens for this user
                    PasswordResetToken.objects.filter(user=user).delete()
                    
                    reset_token = PasswordResetToken.objects.create(user=user)
                    
                    message = f"Your password reset code for CleanTrac is: {reset_token.token}. This code expires in 15 minutes."
                    sms_sent = send_sms(user.profile.phone_number, message)
                    
                    if sms_sent:
                        return Response({"message": "If your account exists and has a registered phone number, a password reset code has been sent."}, status=status.HTTP_200_OK)
                    else:
                        # Log this failure, but still return a generic message to the user
                        print(f"SMS sending failed for user {username} during password reset request.")
                        return Response({"message": "If your account exists and has a registered phone number, a password reset code has been sent."}, status=status.HTTP_200_OK)
                else:
                    # User exists but no phone number, or no profile. Still return generic message.
                    print(f"Password reset attempted for user {username} with no phone/profile.")
                    return Response({"message": "If your account exists and has a registered phone number, a password reset code has been sent."}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # User does not exist. Return a generic message to avoid revealing user existence.
                print(f"Password reset attempted for non-existent user {username}.")
                return Response({"message": "If your account exists and has a registered phone number, a password reset code has been sent."}, status=status.HTTP_200_OK)
        
        # If serializer is not valid, or any other unhandled case
        # It's often better to return a generic message here too for security, 
        # but for debugging, returning serializer.errors might be useful initially.
        # For production, consider logging errors and returning a generic success-like message.
        # print(f"Password reset request validation errors: {serializer.errors}")
        return Response({"message": "If your account exists and has a registered phone number, a password reset code has been sent."}, status=status.HTTP_200_OK)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) # Alternative for debugging

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny] # Anyone can attempt to confirm a password reset

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            token_str = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                user = User.objects.get(username=username)
                reset_token = PasswordResetToken.objects.get(user=user, token=token_str)

                if reset_token.is_expired:
                    return Response({"error": "Token has expired."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate new password strength (optional, but good practice)
                try:
                    validate_password(new_password, user=user)
                except DjangoValidationError as e:
                    return Response({"new_password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

                user.set_password(new_password)
                user.save()
                
                # Invalidate the token after successful use
                reset_token.delete()
                
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            
            except User.DoesNotExist:
                return Response({"error": "Invalid user or token."}, status=status.HTTP_400_BAD_REQUEST)
            except PasswordResetToken.DoesNotExist:
                return Response({"error": "Invalid user or token."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e: # Catch any other potential errors
                print(f"Error during password reset confirmation: {str(e)}")
                return Response({"error": "An unexpected error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user, context={'request': request})
        return Response(serializer.data)


# Management Commands related views (if any in future)
