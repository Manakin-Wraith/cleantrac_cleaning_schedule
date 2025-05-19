from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, 
    UserViewSet, 
    UserProfileViewSet, 
    CleaningItemViewSet, 
    TaskInstanceViewSet, 
    CompletionLogViewSet,
    CurrentUserView
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user') # For Django's User model
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'cleaningitems', CleaningItemViewSet, basename='cleaningitem')
router.register(r'taskinstances', TaskInstanceViewSet, basename='taskinstance')
router.register(r'completionlogs', CompletionLogViewSet, basename='completionlog')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
]
