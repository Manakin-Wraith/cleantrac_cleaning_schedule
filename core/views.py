from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Department, UserProfile, CleaningItem, TaskInstance, CompletionLog
from .serializers import (
    DepartmentSerializer, UserSerializer, UserProfileSerializer, 
    CleaningItemSerializer, TaskInstanceSerializer, CompletionLogSerializer,
    CurrentUserSerializer
)
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    CanLogCompletionAndManagerModify, IsSuperUserForWriteOrAuthenticatedReadOnly,
    UserAndProfileManagementPermissions
)
# Create your views here.

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all() # All authenticated users can list departments for now
    serializer_class = DepartmentSerializer
    # permission_classes = [permissions.IsAuthenticated] # Old permission
    permission_classes = [IsSuperUserForWriteOrAuthenticatedReadOnly] # Apply RBAC permission

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    # permission_classes = [permissions.IsAuthenticated] # Old permission
    permission_classes = [UserAndProfileManagementPermissions] # Apply RBAC permission

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()

        if user.is_superuser:
            return User.objects.all()
        
        try:
            user_profile = user.profile # Assumes related_name='profile'
            if user_profile.role == 'manager' and user_profile.department:
                # Managers see users in their department
                return User.objects.filter(profile__department=user_profile.department)
            else:
                # Staff (or managers without a department) see only themselves
                return User.objects.filter(pk=user.pk)
        except UserProfile.DoesNotExist:
            # If no profile, default to seeing only self (applies to superuser if they lack a profile too, but they pass earlier)
            return User.objects.filter(pk=user.pk)

    def perform_create(self, serializer):
        user = self.request.user
        # If a manager creates a user, associate the new user's profile with the manager's department.
        # More complex role assignment logic can be added with RBAC.
        new_user = serializer.save()
        try:
            if user.is_authenticated and not user.is_superuser and user.profile.role == 'manager' and user.profile.department:
                # Ensure the new user also gets a profile (signal should handle this)
                # And assign new user's profile to the manager's department if it exists
                if hasattr(new_user, 'profile'):
                    new_user.profile.department = user.profile.department
                    new_user.profile.save()
                else:
                    # This case implies the signal might not have run or profile is not yet created.
                    # For robustness, one might create UserProfile here if it doesn't exist.
                    UserProfile.objects.create(user=new_user, department=user.profile.department, role='staff') # Default to staff

        except UserProfile.DoesNotExist:
            # Manager creating user has no profile, this is an edge case. Default to no department for new user.
            pass 

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
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly] # Apply RBAC permission

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TaskInstance.objects.all()
        try:
            user_profile = user.profile
            if user_profile.department:
                # Filter TaskInstances whose related CleaningItem belongs to the user's department
                return TaskInstance.objects.filter(cleaning_item__department=user_profile.department)
        except UserProfile.DoesNotExist:
            pass
        return TaskInstance.objects.none()

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

    def perform_create(self, serializer):
        # Default the 'user' for the log to the request user if not provided
        if 'user' not in serializer.validated_data or serializer.validated_data['user'] is None:
            if self.request.user.is_authenticated:
                serializer.save(user=self.request.user)
            else:
                # Handle cases where user is not authenticated, if logs can be anonymous (e.g. raise error or save with user=None)
                serializer.save() # This might fail if user is required and not nullable
        else:
            serializer.save()

# View for /api/users/me/
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
