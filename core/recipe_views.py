from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.db import transaction
from django.contrib.auth.models import User

from .models import Department
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord,
    RecipeProductionTask, ProductionIngredientUsage, ProductionOutput
)
from .recipe_version_integration import RecipeScalingService, ProductionTaskService
from .recipe_serializers import (
    RecipeSerializer, RecipeDetailSerializer, RecipeIngredientSerializer,
    RecipeVersionSerializer, ProductionScheduleSerializer, ProductionRecordSerializer,
    InventoryItemSerializer, InventoryTransactionSerializer, WasteRecordSerializer,
    RecipeProductionTaskSerializer, ProductionIngredientUsageSerializer, ProductionOutputSerializer
)
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    IsSuperUserWriteOrManagerRead, CanManageRecipes, CanManageInventory,
    CanManageProductionTasks, CanExecuteProductionTasks,
    CanManageProductionSchedule
)


class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipes.
    Managers can create, update, or delete recipes in their department.
    All authenticated users can view recipes in their department.
    """
    serializer_class = RecipeSerializer
    permission_classes = [CanManageRecipes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Recipe.objects.none()

        # Filter by department if specified
        department_id = self.request.query_params.get('department_id')
        is_active = self.request.query_params.get('is_active')
        
        queryset = Recipe.objects.all()
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(department=user_profile.department)
                else:
                    return Recipe.objects.none()
            except:
                return Recipe.objects.none()
        
        return queryset.order_by('department', 'name')

    def perform_create(self, serializer):
        """Set created_by to current user when creating a recipe"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed recipe information including version history"""
        recipe = self.get_object()
        serializer = RecipeDetailSerializer(recipe)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def department_summary(self, request):
        """Get summary of recipes by department"""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Get departments based on user permissions
        if user.is_superuser:
            departments = Department.objects.all()
        else:
            try:
                user_profile = user.profile
                if user_profile.department:
                    departments = Department.objects.filter(id=user_profile.department.id)
                else:
                    return Response({"error": "User has no department assigned"}, status=status.HTTP_403_FORBIDDEN)
            except:
                return Response({"error": "User profile not found"}, status=status.HTTP_403_FORBIDDEN)
        
        summary = []
        for dept in departments:
            recipes = Recipe.objects.filter(department=dept)
            active_recipes = recipes.filter(is_active=True)
            
            dept_summary = {
                'department_id': dept.id,
                'department_name': dept.name,
                'total_recipes': recipes.count(),
                'active_recipes': active_recipes.count(),
                'inactive_recipes': recipes.count() - active_recipes.count()
            }
            summary.append(dept_summary)
        
        return Response(summary)


class RecipeIngredientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipe ingredients.
    Managers can create, update, or delete ingredients in their department's recipes.
    All authenticated users can view ingredients for recipes in their department.
    """
    serializer_class = RecipeIngredientSerializer
    permission_classes = [CanManageRecipes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return RecipeIngredient.objects.none()

        # Filter by recipe if specified
        recipe_id = self.request.query_params.get('recipe_id')
        
        queryset = RecipeIngredient.objects.all()
        
        if recipe_id:
            queryset = queryset.filter(recipe_id=recipe_id)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(recipe__department=user_profile.department)
                else:
                    return RecipeIngredient.objects.none()
            except:
                return RecipeIngredient.objects.none()
        
        return queryset

    def perform_create(self, serializer):
        """Save the ingredient and update the recipe's unit cost"""
        with transaction.atomic():
            ingredient = serializer.save()
            # Update the recipe's unit cost
            ingredient.recipe.update_unit_cost()
            
            # Create a version record for the recipe
            RecipeVersion.objects.create(
                recipe=ingredient.recipe,
                version_number=ingredient.recipe.versions.count() + 1,
                changed_by=self.request.user,
                change_notes=f"Added ingredient: {ingredient.ingredient_name}",
                previous_data={}  # Could store previous recipe state here
            )

    def perform_update(self, serializer):
        """Update the ingredient and update the recipe's unit cost"""
        with transaction.atomic():
            # Get the original ingredient for version tracking
            original_ingredient = self.get_object()
            original_recipe = original_ingredient.recipe
            
            # Save the updated ingredient
            ingredient = serializer.save()
            
            # Update the recipe's unit cost
            ingredient.recipe.update_unit_cost()
            
            # Create a version record for the recipe
            RecipeVersion.objects.create(
                recipe=ingredient.recipe,
                version_number=ingredient.recipe.versions.count() + 1,
                changed_by=self.request.user,
                change_notes=f"Updated ingredient: {ingredient.ingredient_name}",
                previous_data={}  # Could store previous ingredient state here
            )

    def perform_destroy(self, instance):
        """Delete the ingredient and update the recipe's unit cost"""
        with transaction.atomic():
            recipe = instance.recipe
            ingredient_name = instance.ingredient_name
            
            # Delete the ingredient
            instance.delete()
            
            # Update the recipe's unit cost
            recipe.update_unit_cost()
            
            # Create a version record for the recipe
            RecipeVersion.objects.create(
                recipe=recipe,
                version_number=recipe.versions.count() + 1,
                changed_by=self.request.user,
                change_notes=f"Removed ingredient: {ingredient_name}",
                previous_data={}  # Could store previous recipe state here
            )


class ProductionScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production schedules.
    Managers can create, update, or delete production schedules in their department.
    Staff can view and update status of production schedules in their department.
    """
    serializer_class = ProductionScheduleSerializer
    permission_classes = [CanManageProductionSchedule]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ProductionSchedule.objects.none()

        # Filter by department, date range, or status if specified
        department_id = self.request.query_params.get('department_id')
        recipe_id = self.request.query_params.get('recipe_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        status = self.request.query_params.get('status')
        
        queryset = ProductionSchedule.objects.all()
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        if recipe_id:
            queryset = queryset.filter(recipe_id=recipe_id)
            
        if start_date:
            queryset = queryset.filter(scheduled_date__gte=start_date)
            
        if end_date:
            queryset = queryset.filter(scheduled_date__lte=end_date)
            
        if status:
            queryset = queryset.filter(status=status)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(department=user_profile.department)
                else:
                    return ProductionSchedule.objects.none()
            except:
                return ProductionSchedule.objects.none()
        
        return queryset.order_by('scheduled_date', 'start_time')

    def perform_create(self, serializer):
        """Set created_by to current user when creating a production schedule"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get production schedules for today"""
        today = timezone.localdate()
        queryset = self.get_queryset().filter(scheduled_date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming production schedules (next 7 days)"""
        today = timezone.localdate()
        next_week = today + timezone.timedelta(days=7)
        queryset = self.get_queryset().filter(
            scheduled_date__gte=today,
            scheduled_date__lte=next_week
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_staff(self, request, staff_id=None):
        """Get production schedules assigned to a specific staff member"""
        staff_id = request.query_params.get('staff_id')
        if not staff_id:
            return Response({"error": "staff_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            staff = User.objects.get(id=staff_id)
        except User.DoesNotExist:
            return Response({"error": "Staff member not found"}, status=status.HTTP_404_NOT_FOUND)
        
        queryset = self.get_queryset().filter(assigned_staff=staff)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductionRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production records.
    Managers can create, update, or delete production records in their department.
    Staff can create and view production records in their department.
    """
    serializer_class = ProductionRecordSerializer
    permission_classes = [CanManageProductionSchedule]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ProductionRecord.objects.none()

        # Filter by schedule if specified
        schedule_id = self.request.query_params.get('schedule_id')
        
        queryset = ProductionRecord.objects.all()
        
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(schedule__department=user_profile.department)
                else:
                    return ProductionRecord.objects.none()
            except:
                return ProductionRecord.objects.none()
        
        return queryset.order_by('-actual_end_time')

    def perform_create(self, serializer):
        """Set completed_by to current user when creating a production record"""
        # Update the schedule status to completed
        schedule = serializer.validated_data.get('schedule')
        if schedule:
            schedule.status = 'completed'
            schedule.save(update_fields=['status', 'updated_at'])
        
        serializer.save(completed_by=self.request.user)


class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing inventory items.
    Managers can create, update, or delete inventory items in their department.
    All authenticated users can view inventory items in their department.
    """
    serializer_class = InventoryItemSerializer
    permission_classes = [CanManageInventory]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InventoryItem.objects.none()

        # Filter by department if specified
        department_id = self.request.query_params.get('department_id')
        
        queryset = InventoryItem.objects.all()
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(department=user_profile.department)
                else:
                    return InventoryItem.objects.none()
            except:
                return InventoryItem.objects.none()
        
        return queryset.order_by('department', 'ingredient_name')

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get inventory items with stock below reorder level"""
        queryset = self.get_queryset().filter(
            Q(current_stock__lt=Q(reorder_level)) & 
            ~Q(reorder_level=None)
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class InventoryTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing inventory transactions.
    Managers can create, update, or delete inventory transactions in their department.
    Staff can create and view inventory transactions in their department.
    """
    serializer_class = InventoryTransactionSerializer
    permission_classes = [CanManageInventory]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InventoryTransaction.objects.none()

        # Filter by inventory item, transaction type, or date range if specified
        inventory_item_id = self.request.query_params.get('inventory_item_id')
        transaction_type = self.request.query_params.get('transaction_type')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        queryset = InventoryTransaction.objects.all()
        
        if inventory_item_id:
            queryset = queryset.filter(inventory_item_id=inventory_item_id)
            
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
            
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
            
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(inventory_item__department=user_profile.department)
                else:
                    return InventoryTransaction.objects.none()
            except:
                return InventoryTransaction.objects.none()
        
        return queryset.order_by('-transaction_date')

    def perform_create(self, serializer):
        """Set recorded_by to current user when creating an inventory transaction"""
        serializer.save(recorded_by=self.request.user)


class WasteRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing waste records.
    Managers can create, update, or delete waste records in their department.
    Staff can create and view waste records in their department.
    """
    serializer_class = WasteRecordSerializer
    permission_classes = [CanManageInventory]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return WasteRecord.objects.none()

        # Filter by department, recipe, inventory item, or date range if specified
        department_id = self.request.query_params.get('department_id')
        recipe_id = self.request.query_params.get('recipe_id')
        inventory_item_id = self.request.query_params.get('inventory_item_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        reason = self.request.query_params.get('reason')
        
        queryset = WasteRecord.objects.all()
        
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        if recipe_id:
            queryset = queryset.filter(recipe_id=recipe_id)
            
        if inventory_item_id:
            queryset = queryset.filter(inventory_item_id=inventory_item_id)
            
        if start_date:
            queryset = queryset.filter(recorded_at__gte=start_date)
            
        if end_date:
            queryset = queryset.filter(recorded_at__lte=end_date)
            
        if reason:
            queryset = queryset.filter(reason=reason)
            
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(department=user_profile.department)
                else:
                    return WasteRecord.objects.none()
            except:
                return WasteRecord.objects.none()
        
        return queryset.order_by('-recorded_at')

    def perform_create(self, serializer):
        """Set recorded_by to current user when creating a waste record"""
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary_by_department(self, request):
        """Get waste summary by department"""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Get departments based on user permissions
        if user.is_superuser:
            departments = Department.objects.all()
        else:
            try:
                user_profile = user.profile
                if user_profile.department:
                    departments = Department.objects.filter(id=user_profile.department.id)
                else:
                    return Response({"error": "User has no department assigned"}, status=status.HTTP_403_FORBIDDEN)
            except:
                return Response({"error": "User profile not found"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get date range from query params, default to current month
        start_date = request.query_params.get('start_date', timezone.now().replace(day=1).date().isoformat())
        end_date = request.query_params.get('end_date', timezone.now().date().isoformat())
        
        summary = []
        for dept in departments:
            waste_records = WasteRecord.objects.filter(
                department=dept,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date
            )
            
            total_cost = waste_records.aggregate(total=Sum('cost'))['total'] or 0
            total_quantity = waste_records.aggregate(total=Sum('quantity'))['total'] or 0
            
            # Group by reason
            reason_summary = waste_records.values('reason').annotate(
                count=Count('id'),
                total_cost=Sum('cost'),
                total_quantity=Sum('quantity')
            )
            
            dept_summary = {
                'department_id': dept.id,
                'department_name': dept.name,
                'total_waste_cost': total_cost,
                'total_waste_quantity': total_quantity,
                'record_count': waste_records.count(),
                'by_reason': list(reason_summary)
            }
            summary.append(dept_summary)
        
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'departments': summary
        })

class RecipeProductionTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipe production tasks.
    Managers can create, update, or delete production tasks in their department.
    Staff can view and update status of production tasks in their department.
    
    Supports recipe versioning and scaling for different batch sizes.
    """
    serializer_class = RecipeProductionTaskSerializer
    permission_classes = [CanManageProductionTasks]
    
    def get_queryset(self):
        """
        Filter tasks based on user's department and query parameters.
        Supports filtering by date range, status, department, and recipe.
        """
        user = self.request.user
        if not user.is_authenticated:
            return RecipeProductionTask.objects.none()
        
        # Start with all tasks
        queryset = RecipeProductionTask.objects.all()
        
        # Apply filters from query parameters
        department_id = self.request.query_params.get('department_id')
        status = self.request.query_params.get('status')
        recipe_id = self.request.query_params.get('recipe_id')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        assigned_staff_id = self.request.query_params.get('assigned_staff_id')
        is_recurring = self.request.query_params.get('is_recurring')
        
        # Filter by department
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by status
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by recipe
        if recipe_id:
            queryset = queryset.filter(recipe_id=recipe_id)
        
        # Filter by date range
        if start_date:
            queryset = queryset.filter(scheduled_start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(scheduled_start_time__date__lte=end_date)
        
        # Filter by assigned staff
        if assigned_staff_id:
            queryset = queryset.filter(assigned_staff_id=assigned_staff_id)
        
        # Filter by recurrence
        if is_recurring is not None:
            is_recurring_bool = is_recurring.lower() == 'true'
            queryset = queryset.filter(is_recurring=is_recurring_bool)
        
        # Apply department-based filtering for non-superusers
        if not user.is_superuser:
            try:
                user_profile = user.profile
                user_department = user_profile.department
                queryset = queryset.filter(department=user_department)
            except AttributeError:
                return RecipeProductionTask.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user when creating a production task"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get production tasks scheduled for today"""
        today = timezone.localdate()
        queryset = self.get_queryset().filter(
            scheduled_start_time__date=today
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming production tasks (next 7 days)"""
        today = timezone.localdate()
        next_week = today + timezone.timedelta(days=7)
        queryset = self.get_queryset().filter(
            scheduled_start_time__date__gte=today,
            scheduled_start_time__date__lte=next_week
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_staff(self, request, staff_id=None):
        """Get production tasks assigned to a specific staff member"""
        if staff_id is None:
            staff_id = request.query_params.get('staff_id')
            if staff_id is None:
                return Response(
                    {"error": "Staff ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        queryset = self.get_queryset().filter(assigned_staff_id=staff_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue production tasks"""
        now = timezone.now()
        queryset = self.get_queryset().filter(
            scheduled_end_time__lt=now,
            status__in=['scheduled', 'in_progress']
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to the current user"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        queryset = self.get_queryset().filter(assigned_staff=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def by_department(self, request, department_id=None):
        """Get tasks for a specific department"""
        if department_id is None:
            department_id = request.query_params.get('department_id')
            if department_id is None:
                return Response(
                    {"error": "Department ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if user has permission to view this department's tasks
        if not request.user.is_superuser:
            try:
                user_profile = request.user.profile
                if user_profile.department_id != int(department_id):
                    return Response(
                        {"error": "You do not have permission to view tasks in this department"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except:
                return Response(
                    {"error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        queryset = self.get_queryset().filter(department_id=department_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_recurring_instance(self, request, pk=None):
        """Create a new instance of a recurring task"""
        parent_task = self.get_object()
        
        if not parent_task.is_recurring:
            return Response(
                {"error": "This is not a recurring task"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate the next occurrence
        next_instance = parent_task.generate_next_occurrence()
        if not next_instance:
            return Response(
                {"error": "Failed to generate next occurrence"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(next_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def generate_recurring_tasks(self, request):
        """
        Generate upcoming instances of recurring tasks.
        By default, generates tasks for the next 30 days.
        """
        days = int(request.data.get('days', 30))
        if days < 1 or days > 365:
            return Response(
                {"error": "Days parameter must be between 1 and 365"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all recurring tasks
        recurring_tasks = self.get_queryset().filter(
            is_recurring=True,
            parent_task__isnull=True  # Only get parent tasks
        )
        
        created_count = 0
        for task in recurring_tasks:
            # For each recurring task, generate instances for the specified period
            end_date = timezone.now() + timezone.timedelta(days=days)
            current_date = timezone.now()
            
            while current_date < end_date:
                # Try to generate the next occurrence
                next_instance = task.generate_next_occurrence(from_date=current_date)
                if next_instance:
                    created_count += 1
                    # Move to the next potential date
                    if task.recurrence_type == 'daily':
                        current_date += timezone.timedelta(days=1)
                    elif task.recurrence_type == 'weekly':
                        current_date += timezone.timedelta(days=7)
                    elif task.recurrence_type == 'monthly':
                        # Approximate a month
                        current_date += timezone.timedelta(days=30)
                    else:
                        # For custom recurrence, move forward a day at a time
                        current_date += timezone.timedelta(days=1)
                else:
                    # If we couldn't generate an instance, move forward to avoid infinite loop
                    current_date += timezone.timedelta(days=1)
        
        return Response({
            "message": f"Generated {created_count} recurring task instances",
            "count": created_count
        })
    
    @action(detail=True, methods=['get'])
    def ingredient_requirements(self, request, pk=None):
        """
        Calculate ingredient requirements for a production task based on the recipe version and quantity.
        """
        task = self.get_object()
        requirements = RecipeScalingService.calculate_ingredient_requirements(task)
        return Response(requirements)
    
    @action(detail=False, methods=['post'])
    def scale_recipe(self, request):
        """
        Scale a recipe to a target quantity without creating a production task.
        
        Required parameters:
        - recipe_id: ID of the recipe to scale
        - target_quantity: Quantity to produce
        - recipe_version_id: (Optional) Specific version to use, defaults to latest
        """
        recipe_id = request.data.get('recipe_id')
        target_quantity = request.data.get('target_quantity')
        recipe_version_id = request.data.get('recipe_version_id')
        
        if not recipe_id or not target_quantity:
            return Response(
                {'error': 'recipe_id and target_quantity are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recipe = Recipe.objects.get(pk=recipe_id)
            
            # Check if user has permission to access this recipe
            if not request.user.is_superuser:
                user_profile = request.user.profile
                if recipe.department != user_profile.department:
                    return Response(
                        {'error': 'You do not have permission to access this recipe'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Get specific version or latest
            if recipe_version_id:
                recipe_version = RecipeVersion.objects.get(pk=recipe_version_id, recipe=recipe)
            else:
                recipe_version = RecipeVersion.objects.filter(recipe=recipe).order_by('-version_number').first()
                
            if not recipe_version:
                return Response(
                    {'error': 'No recipe version found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Scale the recipe
            scaled_recipe = RecipeScalingService.scale_recipe(recipe_version, target_quantity)
            return Response(scaled_recipe)
            
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except RecipeVersion.DoesNotExist:
            return Response(
                {'error': 'Recipe version not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['post'])
    def create_with_version(self, request):
        """
        Create a production task with a specific recipe version.
        
        If recipe_version_id is not provided, the latest version will be used.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        recipe_version_id = request.data.get('recipe_version_id')
        recipe = serializer.validated_data.get('recipe')
        
        try:
            # Get specific version if provided, otherwise use latest
            recipe_version = None
            if recipe_version_id:
                recipe_version = RecipeVersion.objects.get(pk=recipe_version_id, recipe=recipe)
            else:
                recipe_version = RecipeVersion.objects.filter(recipe=recipe).order_by('-version_number').first()
                
            if not recipe_version:
                return Response(
                    {'error': 'No recipe version found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create the task with the recipe version
            serializer.save(created_by=request.user, recipe_version=recipe_version)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except RecipeVersion.DoesNotExist:
            return Response(
                {'error': 'Recipe version not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProductionIngredientUsageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production ingredient usage.
    Managers can create, update, or delete ingredient usage records in their department.
    Staff can create and view ingredient usage records in their department.
    """
    serializer_class = ProductionIngredientUsageSerializer
    permission_classes = [CanExecuteProductionTasks]
    
    def get_queryset(self):
        """
        Filter ingredient usage records based on user's department and query parameters.
        Supports filtering by production task, ingredient, and supplier.
        """
        user = self.request.user
        if not user.is_authenticated:
            return ProductionIngredientUsage.objects.none()
        
        # Start with all records
        queryset = ProductionIngredientUsage.objects.all()
        
        # Apply filters from query parameters
        production_task_id = self.request.query_params.get('production_task_id')
        ingredient_id = self.request.query_params.get('ingredient_id')
        supplier_id = self.request.query_params.get('supplier_id')
        batch_code = self.request.query_params.get('batch_code')
        
        # Filter by production task
        if production_task_id:
            queryset = queryset.filter(production_task_id=production_task_id)
        
        # Filter by ingredient
        if ingredient_id:
            queryset = queryset.filter(ingredient_id=ingredient_id)
        
        # Filter by supplier
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        
        # Filter by batch code
        if batch_code:
            queryset = queryset.filter(batch_code__icontains=batch_code)
        
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(production_task__department=user_profile.department)
                else:
                    return ProductionIngredientUsage.objects.none()
            except:
                return ProductionIngredientUsage.objects.none()
        
        return queryset.order_by('-recorded_at')
    
    def perform_create(self, serializer):
        """Set recorded_by to current user when creating an ingredient usage record"""
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Get ingredient usage records for a specific production task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {"error": "Task ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(production_task_id=task_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_ingredient(self, request):
        """Get usage records for a specific ingredient"""
        ingredient_id = request.query_params.get('ingredient_id')
        if not ingredient_id:
            return Response(
                {"error": "Ingredient ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(ingredient_id=ingredient_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent ingredient usage records (last 7 days)"""
        days = int(request.query_params.get('days', 7))
        if days < 1 or days > 90:
            return Response(
                {"error": "Days parameter must be between 1 and 90"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = timezone.now() - timezone.timedelta(days=days)
        queryset = self.get_queryset().filter(recorded_at__gte=start_date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductionOutputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production outputs.
    Managers can create, update, or delete production outputs in their department.
    Staff can create and view production outputs in their department.
    """
    serializer_class = ProductionOutputSerializer
    permission_classes = [CanExecuteProductionTasks]
    
    def get_queryset(self):
        """
        Filter production outputs based on user's department and query parameters.
        Supports filtering by production task, date range, and quality rating.
        """
        user = self.request.user
        if not user.is_authenticated:
            return ProductionOutput.objects.none()
        
        # Start with all records
        queryset = ProductionOutput.objects.all()
        
        # Apply filters from query parameters
        production_task_id = self.request.query_params.get('production_task_id')
        min_quality = self.request.query_params.get('min_quality')
        max_quality = self.request.query_params.get('max_quality')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        batch_code = self.request.query_params.get('batch_code')
        
        # Filter by production task
        if production_task_id:
            queryset = queryset.filter(production_task_id=production_task_id)
        
        # Filter by quality rating range
        if min_quality:
            queryset = queryset.filter(quality_rating__gte=min_quality)
        if max_quality:
            queryset = queryset.filter(quality_rating__lte=max_quality)
        
        # Filter by production date range
        if start_date:
            queryset = queryset.filter(production_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(production_date__lte=end_date)
        
        # Filter by batch code
        if batch_code:
            queryset = queryset.filter(batch_code__icontains=batch_code)
        
        # If user is not superuser, restrict to their department
        if not user.is_superuser:
            try:
                user_profile = user.profile
                if user_profile.department:
                    queryset = queryset.filter(production_task__department=user_profile.department)
                else:
                    return ProductionOutput.objects.none()
            except:
                return ProductionOutput.objects.none()
        
        return queryset.order_by('-recorded_at')
    
    def perform_create(self, serializer):
        """Set recorded_by to current user when creating a production output"""
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Get production outputs for a specific task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {"error": "Task ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(production_task_id=task_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent production outputs (last 7 days)"""
        days = int(request.query_params.get('days', 7))
        if days < 1 or days > 90:
            return Response(
                {"error": "Days parameter must be between 1 and 90"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = timezone.now() - timezone.timedelta(days=days)
        queryset = self.get_queryset().filter(recorded_at__gte=start_date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def yield_analysis(self, request):
        """Get yield analysis data for production outputs"""
        # Get date range parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        recipe_id = request.query_params.get('recipe_id')
        
        # Start with filtered queryset
        queryset = self.get_queryset()
        
        # Apply additional filters
        if start_date:
            queryset = queryset.filter(production_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(production_date__lte=end_date)
        if recipe_id:
            queryset = queryset.filter(production_task__recipe_id=recipe_id)
        
        # Calculate yield statistics
        outputs = queryset.all()
        
        if not outputs:
            return Response({
                "message": "No production outputs found for the specified filters",
                "count": 0
            })
        
        total_outputs = len(outputs)
        total_expected = sum(output.expected_quantity for output in outputs)
        total_actual = sum(output.actual_quantity for output in outputs)
        average_yield = sum(output.yield_percentage for output in outputs) / total_outputs if total_outputs > 0 else 0
        
        # Group by recipe for detailed analysis
        recipe_data = {}
        for output in outputs:
            recipe_id = output.production_task.recipe.recipe_id
            recipe_name = output.production_task.recipe.name
            
            if recipe_id not in recipe_data:
                recipe_data[recipe_id] = {
                    'recipe_id': recipe_id,
                    'recipe_name': recipe_name,
                    'count': 0,
                    'total_expected': 0,
                    'total_actual': 0,
                    'average_yield': 0
                }
            
            recipe_data[recipe_id]['count'] += 1
            recipe_data[recipe_id]['total_expected'] += output.expected_quantity
            recipe_data[recipe_id]['total_actual'] += output.actual_quantity
        
        # Calculate average yield for each recipe
        for recipe_id in recipe_data:
            if recipe_data[recipe_id]['total_expected'] > 0:
                recipe_data[recipe_id]['average_yield'] = (
                    recipe_data[recipe_id]['total_actual'] / recipe_data[recipe_id]['total_expected']
                ) * 100
        
        return Response({
            "summary": {
                "total_outputs": total_outputs,
                "total_expected_quantity": total_expected,
                "total_actual_quantity": total_actual,
                "overall_yield_percentage": (total_actual / total_expected) * 100 if total_expected > 0 else 0,
                "average_yield_percentage": average_yield
            },
            "by_recipe": list(recipe_data.values())
        })
