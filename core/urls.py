from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    health,
    DepartmentViewSet, 
    UserViewSet, 
    UserProfileViewSet, 
    CleaningItemViewSet, 
    TaskInstanceViewSet, 
    CompletionLogViewSet,
    CurrentUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    # Thermometer Verification System ViewSets
    AreaUnitViewSet,
    ThermometerViewSet,
    ThermometerVerificationRecordViewSet,
    ThermometerVerificationAssignmentViewSet,
    TemperatureCheckAssignmentViewSet,
    TemperatureLogViewSet,
    # Document Management ViewSet
    FolderViewSet, DocumentViewSet,
    # Supplier Management ViewSet
    SupplierViewSet,
    ReceivingRecordViewSet
)
from .document_template_views import (
    DocumentTemplateViewSet,
    GeneratedDocumentViewSet
)
# Recipe Management System ViewSets
from .recipe_views import (
    RecipeViewSet,
    RecipeIngredientViewSet,
    ProductionScheduleViewSet,
    ProductionRecordViewSet,
    InventoryItemViewSet,
    InventoryTransactionViewSet,
    WasteRecordViewSet,
    RecipeProductionTaskViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user') # For Django's User model
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'cleaningitems', CleaningItemViewSet, basename='cleaningitem')
router.register(r'taskinstances', TaskInstanceViewSet, basename='taskinstance')
router.register(r'completionlogs', CompletionLogViewSet, basename='completionlog')

# Register Thermometer Verification System ViewSets
router.register(r'area-units', AreaUnitViewSet, basename='areaunit')
router.register(r'thermometers', ThermometerViewSet, basename='thermometer')
router.register(r'thermometer-verification-records', ThermometerVerificationRecordViewSet, basename='thermometerverificationrecord')
router.register(r'thermometer-verification-assignments', ThermometerVerificationAssignmentViewSet, basename='thermometerverificationassignment')
router.register(r'temperature-check-assignments', TemperatureCheckAssignmentViewSet, basename='temperaturecheckassignment')
router.register(r'temperature-logs', TemperatureLogViewSet, basename='temperaturelog')

# Register Document Template Management ViewSets
router.register(r'document-templates', DocumentTemplateViewSet, basename='documenttemplate')
# Register Folders and Documents ViewSets
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'generated-documents', GeneratedDocumentViewSet, basename='generateddocument')

# Register Supplier Management ViewSet
router.register(r'suppliers', SupplierViewSet, basename='supplier')
# Receiving records endpoint
router.register(r'receiving-records', ReceivingRecordViewSet, basename='receivingrecord')

# Register Recipe Management System ViewSets
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'recipe-ingredients', RecipeIngredientViewSet, basename='recipeingredient')
router.register(r'production-schedules', ProductionScheduleViewSet, basename='productionschedule')
router.register(r'production-records', ProductionRecordViewSet, basename='productionrecord')
router.register(r'inventory-items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'inventory-transactions', InventoryTransactionViewSet, basename='inventorytransaction')
router.register(r'waste-records', WasteRecordViewSet, basename='wasterecord')
router.register(r'recipe-production-tasks', RecipeProductionTaskViewSet, basename='recipeproductiontask')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('health/', health, name='health'),
    path('users/me/', CurrentUserView.as_view(), name='current-user'), # Specific path first
    path('auth/password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('', include(router.urls)),                                    # Router paths second
]
