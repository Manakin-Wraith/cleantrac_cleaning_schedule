from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone 
from datetime import date as datetime_date 
from django.db.models import Count
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_GET


from django.views.decorators.http import require_http_methods

@require_http_methods(["GET", "HEAD"])
def health(request):
    """Simple unauthenticated endpoint for load-balancer health checks."""
    return JsonResponse({"status": "ok"}) 

from .models import (
    ReceivingRecord,
    Department, UserProfile, CleaningItem, TaskInstance, CompletionLog, PasswordResetToken,
    AreaUnit, Thermometer, ThermometerVerificationRecord, 
    ThermometerVerificationAssignment, TemperatureCheckAssignment, TemperatureLog,
    Folder, Document, Supplier
)
from .serializers import (
    DepartmentSerializer, UserSerializer, UserProfileSerializer, 
    CleaningItemSerializer, TaskInstanceSerializer, CompletionLogSerializer,
    CurrentUserSerializer, UserWithProfileSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    AreaUnitSerializer, ThermometerSerializer, ThermometerVerificationRecordSerializer,
    ThermometerVerificationAssignmentSerializer, TemperatureCheckAssignmentSerializer, TemperatureLogSerializer,
    FolderSerializer, DocumentSerializer,
    ReceivingRecordSerializer,
    SupplierSerializer
)
from rest_framework.permissions import AllowAny # Corrected: AllowAny from DRF
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    CanLogCompletionAndManagerModify, IsSuperUserForWriteOrAuthenticatedReadOnly,
    UserAndProfileManagementPermissions, CanUpdateTaskStatus,
    IsSuperUserWriteOrManagerRead, IsThermometerVerificationStaff,
    CanManageThermometerAssignments, CanManageTemperatureCheckAssignments, CanLogTemperatures, CanManageTaskInstance
)
from .sms_utils import send_sms # New import
from django.contrib.auth.password_validation import validate_password # For password strength
from django.core.exceptions import ValidationError as DjangoValidationError # For password validation

# Create your views here.

class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsSuperUserWriteOrManagerRead]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Folder.objects.none()
        # All authenticated users can see every folder, regardless of department.
        if user.is_authenticated:
            return Folder.objects.all()
        return Folder.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('department_id'):
            try:
                if request.user.profile.role == 'manager' and request.user.profile.department:
                    data['department_id'] = str(request.user.profile.department.id)
            except AttributeError:
                pass
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        if not serializer.validated_data.get('department') and not user.is_superuser:
            try:
                department = user.profile.department
                if department:
                    serializer.save(department=department)
                    return
            except AttributeError:
                pass
        serializer.save()


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

from .recurrence_models import RecurringSchedule

class TaskInstanceViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_delete(self, request):
        task_ids = request.data.get('ids', [])
        if not isinstance(task_ids, list) or not all(isinstance(item, int) for item in task_ids) or not task_ids:
            return Response({'error': 'A non-empty list of integer task IDs is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        tasks_to_delete_qs = TaskInstance.objects.filter(id__in=task_ids)
        
        permitted_task_ids_to_delete = []
        denied_ids_info = [] # For more detailed feedback if needed

        if user.is_superuser:
            permitted_task_ids_to_delete = [task.id for task in tasks_to_delete_qs]
        else:
            try:
                user_profile = user.profile
                if user_profile.role == UserProfile.ROLE_MANAGER and user_profile.department:
                    for task_id in task_ids: # Iterate over requested IDs to check one by one
                        try:
                            task_instance = TaskInstance.objects.get(id=task_id)
                            if task_instance.department == user_profile.department:
                                permitted_task_ids_to_delete.append(task_instance.id)
                            else:
                                denied_ids_info.append({'id': task_id, 'reason': 'Not in your department'})
                        except TaskInstance.DoesNotExist:
                            denied_ids_info.append({'id': task_id, 'reason': 'Not found'})
                else: 
                    return Response({'error': 'You do not have permission to perform this action (not a manager or no department).'}, status=status.HTTP_403_FORBIDDEN)
            except UserProfile.DoesNotExist:
                return Response({'error': 'User profile not found.'}, status=status.HTTP_403_FORBIDDEN)

        if not permitted_task_ids_to_delete:
            if denied_ids_info:
                 return Response({'message': 'No tasks were deleted. See details for reasons.', 'details': denied_ids_info}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'message': 'No valid tasks found for deletion based on the provided IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count = 0
        try:
            with transaction.atomic():
                actual_deleted_count, _ = TaskInstance.objects.filter(id__in=permitted_task_ids_to_delete).delete()
                deleted_count = actual_deleted_count
        except Exception as e:
            # Log the exception e, e.g., import logging; logging.error(f"Bulk delete error: {e}")
            return Response({'error': f'An error occurred during deletion: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_data = {'message': f'Successfully deleted {deleted_count} tasks.'}
        if denied_ids_info:
            response_data['info'] = f'{len(denied_ids_info)} tasks could not be deleted. See details.'
            response_data['details_denied'] = denied_ids_info
        
        return Response(response_data, status=status.HTTP_200_OK)
    serializer_class = TaskInstanceSerializer
    # Apply general management permission and specific status update permission
    permission_classes = [CanManageTaskInstance, CanUpdateTaskStatus]

    def create(self, request, *args, **kwargs):
        """Override create to support recurring schedules."""
        recurring_flag = request.data.get('recurring') in [True, 'true', 'True', '1', 1]
        recurrence_type = request.data.get('recurrence_type')
        if recurring_flag:
            if recurrence_type not in ['daily', 'weekly', 'monthly']:
                return Response({'error': 'Invalid recurrence_type. Must be daily, weekly, or monthly.'}, status=status.HTTP_400_BAD_REQUEST)

            # Validate cleaning_item
            cleaning_item_id = request.data.get('cleaning_item_id_write') or request.data.get('cleaning_item_id')
            if not cleaning_item_id:
                return Response({'error': 'cleaning_item_id_write is required for recurring tasks.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                cleaning_item = CleaningItem.objects.get(id=cleaning_item_id)
            except CleaningItem.DoesNotExist:
                return Response({'error': 'CleaningItem not found.'}, status=status.HTTP_400_BAD_REQUEST)

            user_profile = request.user.profile
            department = user_profile.department if user_profile.department else cleaning_item.department

            assigned_to_id = request.data.get('assigned_to_id')
            assigned_to = None
            if assigned_to_id:
                try:
                    assigned_to = UserProfile.objects.get(id=assigned_to_id)
                except UserProfile.DoesNotExist:
                    return Response({'error': 'Assigned_to user profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

            # Create schedule
            schedule = RecurringSchedule.objects.create(
                cleaning_item=cleaning_item,
                department=department,
                assigned_to=assigned_to,
                recurrence_type=recurrence_type,
                created_by=request.user,
            )
            # Generate initial instances – daily only one week ahead
            days_ahead = 6 if recurrence_type == 'daily' else 30
            schedule.generate_instances(days_ahead=days_ahead)

            instances = TaskInstance.objects.filter(notes__contains=f"[RecurringSchedule:{schedule.id}]")
            serializer = self.get_serializer(instances, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Fallback to default single task create
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        base_qs = TaskInstance.objects.all()
        if not user.is_superuser:
            # Restrict by department/assignment first as before (we'll reapply filters later)
            try:
                user_profile = user.profile
                if user_profile.role == 'manager' and user_profile.department:
                    base_qs = base_qs.filter(department=user_profile.department)
                elif user_profile.role == 'staff':
                    if user_profile.department:
                        base_qs = base_qs.filter(assigned_to=user_profile, department=user_profile.department)
                    else:
                        base_qs = base_qs.filter(assigned_to=user_profile)
                else:
                    base_qs = TaskInstance.objects.none()
            except UserProfile.DoesNotExist:
                base_qs = TaskInstance.objects.none()
        # Status filter: comma-separated list via ?status=pending,completed
        status_param = self.request.query_params.get('status')
        if status_param is not None:
            status_values = [s.strip() for s in status_param.split(',') if s.strip()]
            if status_values:
                base_qs = base_qs.filter(status__in=status_values)
        else:
            # Default: for staff hide archived unless explicitly requested
            if not user.is_superuser and getattr(user.profile, 'role', None) == 'staff':
                base_qs = base_qs.exclude(status='archived')
        return base_qs
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


# Thermometer Verification System Views

class AreaUnitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing area units where temperature measurements are taken.
    Only managers can create, update, or delete area units in their department.
    """
    serializer_class = AreaUnitSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AreaUnit.objects.none()
        
        if user.is_superuser:
            return AreaUnit.objects.all()
        
        # Filter by user's department
        try:
            if user.profile and user.profile.department:
                return AreaUnit.objects.filter(department=user.profile.department)
            return AreaUnit.objects.none()
        except AttributeError:
            return AreaUnit.objects.none()
    
    def perform_create(self, serializer):
        # Ensure the area unit is created in the user's department
        if not self.request.user.is_superuser and hasattr(self.request.user, 'profile') and self.request.user.profile.department:
            serializer.save(department=self.request.user.profile.department)
        else:
            serializer.save()

class ThermometerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing thermometers.
    Managers can create, update, or delete thermometers in their department.
    Staff assigned to thermometer verification can update thermometer status.
    """
    serializer_class = ThermometerSerializer
    permission_classes = [IsThermometerVerificationStaff]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Thermometer.objects.none()
        
        if user.is_superuser:
            return Thermometer.objects.all()
        
        # Filter by user's department
        try:
            if user.profile and user.profile.department:
                return Thermometer.objects.filter(department=user.profile.department)
            return Thermometer.objects.none()
        except AttributeError:
            return Thermometer.objects.none()
    
    def perform_create(self, serializer):
        # Ensure the thermometer is created in the user's department
        if not self.request.user.is_superuser and hasattr(self.request.user, 'profile') and self.request.user.profile.department:
            serializer.save(department=self.request.user.profile.department)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'], url_path='verified')
    def verified_thermometers(self, request):
        """
        Returns a list of verified thermometers for the user's department.
        """
        queryset = self.get_queryset().filter(status='verified')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='needs-verification')
    def needs_verification(self, request):
        """
        Returns a list of thermometers that need verification for the user's department.
        """
        queryset = self.get_queryset().filter(status='needs_verification')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='verification-expiring-soon')
    def verification_expiring_soon(self, request):
        """
        Returns a list of thermometers with verification expiring within 7 days.
        """
        today = timezone.now().date()
        expiry_threshold = today + timezone.timedelta(days=7)
        
        queryset = self.get_queryset().filter(
            status='verified',
            verification_expiry_date__lte=expiry_threshold,
            verification_expiry_date__gt=today
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ThermometerVerificationRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing thermometer verification records.
    Only staff assigned to thermometer verification or managers can create records.
    """
    serializer_class = ThermometerVerificationRecordSerializer
    permission_classes = [IsThermometerVerificationStaff]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ThermometerVerificationRecord.objects.none()
        
        if user.is_superuser:
            return ThermometerVerificationRecord.objects.all()
        
        # Filter by user's department
        try:
            if user.profile and user.profile.department:
                return ThermometerVerificationRecord.objects.filter(
                    thermometer__department=user.profile.department
                )
            return ThermometerVerificationRecord.objects.none()
        except AttributeError:
            return ThermometerVerificationRecord.objects.none()
    
    def perform_create(self, serializer):
        # Set the calibrated_by field to the current user if not provided
        thermometer = serializer.validated_data.get('thermometer')
        
        # Update the thermometer status and verification dates
        if thermometer:
            thermometer.status = 'verified'
            thermometer.last_verification_date = serializer.validated_data.get('date_verified')
            # Set expiry date to 30 days after verification
            thermometer.verification_expiry_date = serializer.validated_data.get('date_verified') + timezone.timedelta(days=30)
            thermometer.save()
        
        serializer.save(calibrated_by=self.request.user)

class ThermometerVerificationAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing thermometer verification assignments.
    Only managers can create, update, or delete assignments in their department.
    Staff can view their own assignments.
    """
    serializer_class = ThermometerVerificationAssignmentSerializer
    permission_classes = [CanManageThermometerAssignments]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ThermometerVerificationAssignment.objects.none()
        
        if user.is_superuser:
            return ThermometerVerificationAssignment.objects.all()
        
        # Filter by user's role and department
        try:
            if user.profile.role == 'manager' and user.profile.department:
                # Managers can see all assignments in their department
                return ThermometerVerificationAssignment.objects.filter(
                    department=user.profile.department
                )
            elif user.profile.role == 'staff':
                # Staff can only see their own assignments
                return ThermometerVerificationAssignment.objects.filter(
                    staff_member=user
                )
            return ThermometerVerificationAssignment.objects.none()
        except AttributeError:
            return ThermometerVerificationAssignment.objects.none()
    
    def perform_create(self, serializer):
        # Set the assigned_by field to the current user if not provided
        # Ensure the assignment is created in the user's department
        if not self.request.user.is_superuser and hasattr(self.request.user, 'profile') and self.request.user.profile.department:
            serializer.save(
                assigned_by=self.request.user,
                department=self.request.user.profile.department
            )
        else:
            serializer.save(assigned_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='current-assignment')
    def current_assignment(self, request):
        """
        Returns the current active thermometer verification assignment for the user's department.
        """
        try:
            if request.user.profile and request.user.profile.department:
                assignment = ThermometerVerificationAssignment.objects.filter(
                    department=request.user.profile.department,
                    is_active=True
                ).order_by('-assigned_date').first()
                
                if assignment:
                    serializer = self.get_serializer(assignment)
                    return Response(serializer.data)
                else:
                    return Response({"detail": "No active thermometer verification assignment found."}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"detail": "User has no department assigned."}, status=status.HTTP_400_BAD_REQUEST)
        except AttributeError:
            return Response({"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-assignment')
    def my_assignment(self, request):
        """
        Returns the current active thermometer verification assignment for the requesting user.
        """
        try:
            assignment = ThermometerVerificationAssignment.objects.filter(
                staff_member=request.user,
                is_active=True
            ).order_by('-assigned_date').first()
            
            if assignment:
                serializer = self.get_serializer(assignment)
                return Response(serializer.data)
            else:
                return Response({"detail": "You are not currently assigned to thermometer verification duties."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TemperatureCheckAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing temperature check assignments (AM/PM).
    Only managers can create, update, or delete assignments in their department.
    Staff can view their own assignments.
    """
    serializer_class = TemperatureCheckAssignmentSerializer
    permission_classes = [CanManageTemperatureCheckAssignments]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return TemperatureCheckAssignment.objects.none()
        
        if user.is_superuser:
            return TemperatureCheckAssignment.objects.all()
        
        # Filter by user's role and department
        try:
            if user.profile.role == 'manager' and user.profile.department:
                # Managers can see all assignments in their department
                return TemperatureCheckAssignment.objects.filter(
                    department=user.profile.department
                )
            elif user.profile.role == 'staff':
                # Staff can only see their own assignments
                return TemperatureCheckAssignment.objects.filter(
                    staff_member=user
                )
            return TemperatureCheckAssignment.objects.none()
        except AttributeError:
            return TemperatureCheckAssignment.objects.none()
    
    def perform_create(self, serializer):
        # Set the assigned_by field to the current user if not provided
        # Ensure the assignment is created in the user's department
        if not self.request.user.is_superuser and hasattr(self.request.user, 'profile') and self.request.user.profile.department:
            serializer.save(
                assigned_by=self.request.user,
                department=self.request.user.profile.department
            )
        else:
            serializer.save(assigned_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='current-assignments')
    def current_assignments(self, request):
        """
        Returns the current active temperature check assignments for the user's department.
        """
        try:
            if request.user.profile and request.user.profile.department:
                am_assignment = TemperatureCheckAssignment.objects.filter(
                    department=request.user.profile.department,
                    time_period='AM',
                    is_active=True
                ).order_by('-assigned_date').first()
                
                pm_assignment = TemperatureCheckAssignment.objects.filter(
                    department=request.user.profile.department,
                    time_period='PM',
                    is_active=True
                ).order_by('-assigned_date').first()
                
                result = {
                    'am_assignment': self.get_serializer(am_assignment).data if am_assignment else None,
                    'pm_assignment': self.get_serializer(pm_assignment).data if pm_assignment else None
                }
                
                return Response(result)
            else:
                return Response({"detail": "User has no department assigned."}, status=status.HTTP_400_BAD_REQUEST)
        except AttributeError:
            return Response({"detail": "User profile not found."}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-assignments')
    def my_assignments(self, request):
        """
        Returns the current active temperature check assignments for the requesting user.
        """
        try:
            am_assignment = TemperatureCheckAssignment.objects.filter(
                staff_member=request.user,
                time_period='AM',
                is_active=True
            ).order_by('-assigned_date').first()
            
            pm_assignment = TemperatureCheckAssignment.objects.filter(
                staff_member=request.user,
                time_period='PM',
                is_active=True
            ).order_by('-assigned_date').first()
            
            result = {
                'am_assignment': self.get_serializer(am_assignment).data if am_assignment else None,
                'pm_assignment': self.get_serializer(pm_assignment).data if pm_assignment else None
            }
            
            return Response(result)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TemperatureLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing temperature logs.
    Staff can create logs using verified thermometers.
    Managers can view, update, or delete logs in their department.
    """
    serializer_class = TemperatureLogSerializer
    permission_classes = [CanLogTemperatures]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return TemperatureLog.objects.none()
        
        if user.is_superuser:
            return TemperatureLog.objects.all()
        
        # Filter by user's department
        try:
            if user.profile and user.profile.department:
                return TemperatureLog.objects.filter(department=user.profile.department)
            return TemperatureLog.objects.none()
        except AttributeError:
            return TemperatureLog.objects.none()
    
    def perform_create(self, serializer):
        # Set the logged_by field to the current user if not provided
        # Ensure the log is created in the user's department
        if not self.request.user.is_superuser and hasattr(self.request.user, 'profile') and self.request.user.profile.department:
            serializer.save(
                logged_by=self.request.user,
                department=self.request.user.profile.department
            )
        else:
            serializer.save(logged_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='area/(?P<area_unit_id>[^/.]+)')
    def logs_by_area(self, request, area_unit_id=None):
        """
        Returns temperature logs for a specific area unit.
        """
        try:
            area_unit = AreaUnit.objects.get(pk=area_unit_id)
            # Check if user has access to this area unit
            if not request.user.is_superuser and (not hasattr(request.user, 'profile') or 
                                               not request.user.profile.department or 
                                               request.user.profile.department != area_unit.department):
                return Response({"detail": "You do not have permission to view logs for this area."}, status=status.HTTP_403_FORBIDDEN)
            
            queryset = self.get_queryset().filter(area_unit=area_unit)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except AreaUnit.DoesNotExist:
            return Response({"detail": "Area unit not found."}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'], url_path='today')
    def logs_today(self, request):
        """
        Returns temperature logs for the current day.
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(log_datetime__date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path='by-date/(?P<date>\d{4}-\d{2}-\d{2})')
    def logs_by_date(self, request, date=None):
        """
        Returns temperature logs for a specific date.
        Format: YYYY-MM-DD
        """
        try:
            # Parse the date string to a date object
            parsed_date = datetime_date.fromisoformat(date)
            
            # Filter logs by the specified date
            queryset = self.get_queryset().filter(log_datetime__date=parsed_date)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='areas-with-status')
    def areas_with_status(self, request):
        """Get all areas with their logged status for the current day"""
        # Get the current date
        today = timezone.now().date()
        
        # Get the user's department
        user = request.user
        if not hasattr(user, 'profile') or not user.profile.department:
            return Response({"error": "User has no department"}, status=status.HTTP_400_BAD_REQUEST)
        
        department_id = user.profile.department.id
        
        # Get all area units for the department
        area_units = AreaUnit.objects.filter(department_id=department_id)
        
        # Get today's logs for this department
        today_logs = self.get_queryset().filter(
            log_datetime__date=today,
            department_id=department_id
        )
        
        # Create a dictionary to track which areas have been logged for each time period
        logged_areas = {}
        for log in today_logs:
            area_key = f"{log.area_unit_id}_{log.time_period}"
            if area_key not in logged_areas:
                logged_areas[area_key] = {
                    'area_unit_id': log.area_unit_id,
                    'time_period': log.time_period,
                    'temperature_reading': log.temperature_reading,
                    'is_within_range': log.is_within_target_range(),
                    'logged_at': log.log_datetime,
                    'logged_by': log.logged_by.username if log.logged_by else None
                }
        
        # Prepare the response data
        result = []
        for area in area_units:
            area_data = {
                'id': area.id,
                'name': area.name,
                'description': area.description,
                'target_temperature_min': area.target_temperature_min,
                'target_temperature_max': area.target_temperature_max,
                'department_id': area.department_id,
                'department_name': area.department.name,
                'am_logged': f"{area.id}_AM" in logged_areas,
                'pm_logged': f"{area.id}_PM" in logged_areas,
                'am_log_details': logged_areas.get(f"{area.id}_AM"),
                'pm_log_details': logged_areas.get(f"{area.id}_PM")
            }
            result.append(area_data)
            
        return Response(result)

    @action(detail=False, methods=['get'], url_path='manager-summary')
    def manager_summary(self, request):
        """Get a summary of temperature logging status for managers"""
        # Get the user's department
        user = request.user
        if not hasattr(user, 'profile') or not user.profile.department:
            return Response({"error": "User has no department"}, status=status.HTTP_400_BAD_REQUEST)
        
        department_id = user.profile.department.id
        
        # Get today's date
        today = timezone.now().date()
        
        # Get all area units for the department
        area_units = AreaUnit.objects.filter(department_id=department_id)
        
        # Get today's logs for this department
        today_logs = self.get_queryset().filter(
            log_datetime__date=today,
            department_id=department_id
        )
        
        # Prepare summary statistics
        total_areas = area_units.count()
        am_logged_count = len(set([log.area_unit_id for log in today_logs.filter(time_period='AM')]))
        pm_logged_count = len(set([log.area_unit_id for log in today_logs.filter(time_period='PM')]))
        
        # Count areas with temperatures out of range
        am_out_of_range = 0
        pm_out_of_range = 0
        
        for log in today_logs.filter(time_period='AM'):
            # Check if temperature is within target range
            if log.area_unit.target_temperature_min is not None and log.area_unit.target_temperature_max is not None:
                if not (log.area_unit.target_temperature_min <= log.temperature_reading <= log.area_unit.target_temperature_max):
                    am_out_of_range += 1
                
        for log in today_logs.filter(time_period='PM'):
            # Check if temperature is within target range
            if log.area_unit.target_temperature_min is not None and log.area_unit.target_temperature_max is not None:
                if not (log.area_unit.target_temperature_min <= log.temperature_reading <= log.area_unit.target_temperature_max):
                    pm_out_of_range += 1
        
        # Get area details with logged status
        areas_status = []
        for area in area_units:
            am_logs = today_logs.filter(area_unit_id=area.id, time_period='AM')
            pm_logs = today_logs.filter(area_unit_id=area.id, time_period='PM')
            
            am_log = am_logs.first()
            pm_log = pm_logs.first()
            
            # Check if temperatures are within target range
            am_in_range = None
            pm_in_range = None
            
            if am_log and area.target_temperature_min is not None and area.target_temperature_max is not None:
                am_in_range = (area.target_temperature_min <= am_log.temperature_reading <= area.target_temperature_max)
                
            if pm_log and area.target_temperature_min is not None and area.target_temperature_max is not None:
                pm_in_range = (area.target_temperature_min <= pm_log.temperature_reading <= area.target_temperature_max)
            
            area_data = {
                'id': area.id,
                'name': area.name,
                'description': area.description,
                'target_min': area.target_temperature_min,
                'target_max': area.target_temperature_max,
                'am_logged': am_logs.exists(),
                'pm_logged': pm_logs.exists(),
                'am_temperature': am_log.temperature_reading if am_log else None,
                'pm_temperature': pm_log.temperature_reading if pm_log else None,
                'am_in_range': am_in_range,
                'pm_in_range': pm_in_range,
                'am_logged_by': am_log.logged_by.username if am_log and am_log.logged_by else None,
                'pm_logged_by': pm_log.logged_by.username if pm_log and pm_log.logged_by else None,
                'am_logged_at': am_log.log_datetime if am_log else None,
                'pm_logged_at': pm_log.log_datetime if pm_log else None,
            }
            areas_status.append(area_data)
        
        # Prepare the response
        result = {
            'summary': {
                'total_areas': total_areas,
                'am_logged_count': am_logged_count,
                'pm_logged_count': pm_logged_count,
                'am_completion_percentage': round((am_logged_count / total_areas) * 100) if total_areas > 0 else 0,
                'pm_completion_percentage': round((pm_logged_count / total_areas) * 100) if total_areas > 0 else 0,
                'am_out_of_range_count': am_out_of_range,
                'pm_out_of_range_count': pm_out_of_range,
            },
            'areas': areas_status
        }
        
        return Response(result)

from django.http import StreamingHttpResponse
from zipfile import ZipFile, ZIP_DEFLATED
from io import BytesIO

class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing documents. Managers can upload/delete within their department; all authenticated users can view."""
    serializer_class = DocumentSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = Document.objects.all()
        # Optional filter by folder via query param
        folder_id = self.request.query_params.get('folder_id')
        if folder_id:
            qs = qs.filter(folder_id=folder_id)
        return qs

    def perform_create(self, serializer):
        # Automatically set department from manager profile if not provided
        user = self.request.user
        department = None
        if not user.is_superuser and hasattr(user, 'profile') and user.profile.department:
            department = user.profile.department
        serializer.save(uploaded_by=user, department=department or serializer.validated_data.get('department'))

    @action(detail=False, methods=['post'], url_path='bulk-download')
    def bulk_download(self, request):
        """Combine requested document files into a single ZIP and stream it back."""
        ids = request.data.get('ids', [])
        if not isinstance(ids, list) or not ids:
            return Response({'detail': 'No document ids provided'}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(id__in=ids)
        if not qs.exists():
            return Response({'detail': 'No documents found'}, status=status.HTTP_404_NOT_FOUND)

        zip_buffer = BytesIO()
        with ZipFile(zip_buffer, 'w', ZIP_DEFLATED) as zf:
            for doc in qs:
                doc.file.open('rb')
                data = doc.file.read()
                doc.file.close()
                filename = doc.file.name.split('/', 1)[-1]
                zf.writestr(filename, data)
        zip_buffer.seek(0)
        resp = StreamingHttpResponse(zip_buffer, content_type='application/zip')
        resp['Content-Disposition'] = 'attachment; filename="documents.zip"'
        return resp

    @action(detail=False, methods=['post'], url_path='bulk_upload')
    def bulk_upload(self, request):
        folder_id = request.data.get('folder_id')
        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'No files provided.'}, status=status.HTTP_400_BAD_REQUEST)
        meta_json = request.data.get('meta')
        meta = {}
        if meta_json:
            import json
            try:
                meta = json.loads(meta_json)
            except json.JSONDecodeError:
                return Response({'error': 'Invalid meta JSON.'}, status=status.HTTP_400_BAD_REQUEST)
        created_docs = []
        with transaction.atomic():
            for f in files:
                data = {
                    'title': meta.get(f.name, {}).get('title', f.name),
                    'description': meta.get(f.name, {}).get('description', ''),
                    'file': f,  # Include file in serializer validation data
                }
                # Auto-assign department from user profile if available
                try:
                    department = request.user.profile.department
                    if department:
                        data['department_id'] = department.id
                except AttributeError:
                    pass
                if folder_id:
                    data['folder_id'] = folder_id
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save(uploaded_by=request.user)
                created_docs.append(serializer.data)
        return Response(created_docs, status=status.HTTP_201_CREATED)


class ReceivingRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to receiving records with department filtering."""
    serializer_class = ReceivingRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Always read receiving records from the read-only traceability DB.

        Superusers get the full list; regular users get rows filtered to their
        department (case-insensitive substring match on ``storage_location``).
        If the user has no department or the profile is missing, return an
        empty queryset to avoid leaking data.
        """
        user = self.request.user
        # Base queryset always comes from the traceability database
        base_qs = ReceivingRecord.objects.using("traceability")

        if not user.is_authenticated:
            return base_qs.none()

        if user.is_superuser:
            return base_qs.all()

        try:
            dept = user.profile.department.name  # type: ignore[attr-defined]
        except (AttributeError, UserProfile.DoesNotExist):
            return base_qs.none()

        # Limit to rows that mention the department name in storage_location
        return base_qs.filter(storage_location__icontains=dept)


class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing suppliers.
    Only managers can create, update, or delete suppliers in their department.
    All authenticated users can view suppliers in their department.
    """
    serializer_class = SupplierSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Supplier.objects.all()
        elif hasattr(user, 'profile') and user.profile.department:
            # Filter suppliers that have the user's department
            return Supplier.objects.filter(departments=user.profile.department)
        return Supplier.objects.none()
    
    def perform_create(self, serializer):
        # Save the supplier first
        supplier = serializer.save()
        
        # If no departments were specified, add the user's department
        if not supplier.departments.exists() and hasattr(self.request.user, 'profile'):
            if self.request.user.profile.department:
                supplier.departments.add(self.request.user.profile.department)
                
    def perform_update(self, serializer):
        # Save the supplier
        supplier = serializer.save()
        
        # If no departments were specified, ensure the user's department is included
        if not supplier.departments.exists() and hasattr(self.request.user, 'profile'):
            if self.request.user.profile.department:
                supplier.departments.add(self.request.user.profile.department)
    def create(self, request, *args, **kwargs):
        print("\n==== SUPPLIER CREATE REQUEST =====")
        print("Raw request data:", request.data)
        print("Content type:", request.content_type)
        print("Request method:", request.method)
        print("Request user:", request.user)
        print("User department:", request.user.profile.department if hasattr(request.user, 'profile') else None)
        
        # Check if department_id is in the request data
        department_id = request.data.get('department_id')
        print("Department ID in request:", department_id)
        print("Type of department_id:", type(department_id))
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            # Return detailed error response
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'errors': serializer.errors,
                'request_data': request.data,
                'message': 'Validation failed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        print("Serializer is valid. Validated data:", serializer.validated_data)
        return super().create(request, *args, **kwargs)


# Management Commands related views (if any in future)
