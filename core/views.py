from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone 
from datetime import date as datetime_date 
from django.db.models import Count 

from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog, PasswordResetToken, \
    AreaUnit, Thermometer, ThermometerVerificationRecord, ThermometerVerificationAssignment, TemperatureLog, \
    WeeklyTemperatureReview, DailyCleaningRecord
from .serializers import (
    DepartmentSerializer, UserSerializer, UserProfileSerializer, 
    CleaningItemSerializer, TaskInstanceSerializer, CompletionLogSerializer,
    CurrentUserSerializer, UserWithProfileSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    AreaUnitSerializer, ThermometerSerializer, ThermometerVerificationRecordSerializer,
    ThermometerVerificationAssignmentSerializer, TemperatureLogSerializer,
    WeeklyTemperatureReviewSerializer, DailyCleaningRecordSerializer
)
from rest_framework.permissions import AllowAny # Corrected: AllowAny from DRF
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    CanLogCompletionAndManagerModify, IsSuperUserForWriteOrAuthenticatedReadOnly,
    UserAndProfileManagementPermissions, CanUpdateTaskStatus,
    IsSuperUserWriteOrManagerRead, IsThermometerVerificationStaff,
    CanManageThermometerAssignments, CanLogTemperatures
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

# Food Safety File Viewsets
class WeeklyTemperatureReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows weekly temperature reviews to be viewed or edited.
    """
    queryset = WeeklyTemperatureReview.objects.all().order_by('-week_start_date')
    serializer_class = WeeklyTemperatureReviewSerializer
    permission_classes = [permissions.IsAuthenticated] # Basic permission, can be refined

    def perform_create(self, serializer):
        # Automatically set the reviewed_by field to the current user
        serializer.save(reviewed_by=self.request.user)

    def get_queryset(self):
        """
        Optionally restricts the returned reviews to a given user,
        by filtering against a `department` query parameter in the URL.
        Allows filtering by department for managers or general overview.
        """
        queryset = WeeklyTemperatureReview.objects.all().order_by('-week_start_date')
        department_id = self.request.query_params.get('department_id')
        if department_id is not None:
            queryset = queryset.filter(department_id=department_id)
        
        # Further filtering based on user role could be added here
        # For example, if a staff user should only see their department's reviews
        # user = self.request.user
        # if hasattr(user, 'userprofile') and user.userprofile.role == 'staff':
        #     queryset = queryset.filter(department=user.userprofile.department)
            
        return queryset

class DailyCleaningRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows daily cleaning records to be viewed or edited.
    """
    queryset = DailyCleaningRecord.objects.all().order_by('-date_recorded')
    serializer_class = DailyCleaningRecordSerializer
    permission_classes = [permissions.IsAuthenticated] # Basic permission, can be refined

    def perform_create(self, serializer):
        # Automatically set the completed_by field to the current user
        serializer.save(completed_by=self.request.user)

    def get_queryset(self):
        """
        Optionally restricts the returned cleaning records.
        Allows filtering by cleaning_item_id or department_id.
        """
        queryset = DailyCleaningRecord.objects.all().order_by('-date_recorded', 'cleaning_item__name')
        # user = self.request.user # Not used yet, but available
        
        cleaning_item_id = self.request.query_params.get('cleaning_item_id')
        if cleaning_item_id is not None:
            queryset = queryset.filter(cleaning_item_id=cleaning_item_id)

        department_id = self.request.query_params.get('department_id')
        if department_id is not None:
            queryset = queryset.filter(cleaning_item__department_id=department_id)

        # Example: If staff should only see records they completed or for their department
        # if hasattr(user, 'userprofile') and user.userprofile.role == 'staff':
        #    queryset = queryset.filter(
        #        Q(completed_by=user) | Q(cleaning_item__department=user.userprofile.department)
        #    ).distinct()
            
        return queryset

# Management Commands related views (if any in future)
