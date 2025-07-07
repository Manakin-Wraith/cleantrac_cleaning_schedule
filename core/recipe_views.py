from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.db import transaction
from django.contrib.auth.models import User
from datetime import timedelta

from .models import Department
from .recipe_models import (
    Recipe, RecipeIngredient, RecipeVersion, ProductionSchedule, RecipeProductionTask,
    ProductionRecord, InventoryItem, InventoryTransaction, WasteRecord
)
from .recipe_serializers import (
    RecipeSerializer, RecipeDetailSerializer, RecipeIngredientSerializer,
    RecipeVersionSerializer, ProductionScheduleSerializer, ProductionRecordSerializer,
    InventoryItemSerializer, InventoryTransactionSerializer, WasteRecordSerializer,
    RecipeProductionTaskSerializer
)
from .permissions import (
    IsManagerForWriteOrAuthenticatedReadOnly, IsSuperUser, 
    IsSuperUserWriteOrManagerRead, CanManageRecipes, CanManageInventory,
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
    """
    serializer_class = RecipeProductionTaskSerializer
    permission_classes = [CanManageProductionSchedule]

    # ------------------------------------------------------------------
    # Override create to support recurring scheduling
    # ------------------------------------------------------------------
    def create(self, request, *args, **kwargs):
        is_recurring_flag = request.data.get('is_recurring') in [True, 'true', 'True', '1', 1]
        recurrence_type = request.data.get('recurrence_type')

        if is_recurring_flag:
            if recurrence_type not in ['daily', 'weekly', 'monthly']:
                return Response({'error': 'Invalid recurrence_type. Must be daily, weekly, or monthly.'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # Save parent recurring task
            parent_task = serializer.save(created_by=request.user)

            # Ensure recurring flags are saved, even if serializer omitted them
            parent_task.is_recurring = True
            parent_task.recurrence_type = recurrence_type
            parent_task.save(update_fields=["is_recurring", "recurrence_type"])

            # Determine horizon for child generation
            days_ahead = 6 if recurrence_type == 'daily' else 30
            self._generate_child_tasks(parent_task, days_ahead)

            queryset = RecipeProductionTask.objects.filter(Q(id=parent_task.id) | Q(parent_task=parent_task))
            output_serializer = self.get_serializer(queryset, many=True)
            headers = self.get_success_headers(serializer.data)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        # Non-recurring fallback
        return super().create(request, *args, **kwargs)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _generate_child_tasks(self, parent_task, days_ahead):
        """Generate child RecipeProductionTask rows up to *days_ahead* days in advance."""
        delta_map = {
            'daily': timedelta(days=1),
            'weekly': timedelta(weeks=1),
            'monthly': timedelta(days=30),  # simple month approximation
        }
        delta = delta_map.get(parent_task.recurrence_type)
        if not delta:
            return

        current_start = parent_task.scheduled_start_time + delta
        current_end = parent_task.scheduled_end_time + delta if parent_task.scheduled_end_time else None
        target_end_date = parent_task.scheduled_start_time + timedelta(days=days_ahead)

        while current_start.date() <= target_end_date.date():
            if not RecipeProductionTask.objects.filter(parent_task=parent_task, scheduled_start_time=current_start).exists():
                RecipeProductionTask.objects.create(
                    recipe=parent_task.recipe,
                    department=parent_task.department,
                    scheduled_start_time=current_start,
                    scheduled_end_time=current_end,
                    scheduled_quantity=parent_task.scheduled_quantity,
                    status='scheduled',
                    is_recurring=False,
                    recurrence_type=parent_task.recurrence_type,
                    notes=f"Auto-generated child of task {parent_task.id}",
                    assigned_staff=parent_task.assigned_staff,
                    created_by=parent_task.created_by,
                    parent_task=parent_task,
                    task_type=getattr(parent_task, 'task_type', 'prep'),
                    duration_minutes=getattr(parent_task, 'duration_minutes', None),
                )
            current_start += delta
            if current_end:
                current_end += delta
    
    def get_queryset(self):
        """Return recipe production tasks filtered by role and query params."""
        user = self.request.user
        if not user.is_authenticated:
            return RecipeProductionTask.objects.none()

        qs = RecipeProductionTask.objects.all()

        # Role/department scoping (non-superusers)
        if not user.is_superuser:
            try:
                profile = user.profile
                if profile.role == 'manager' and profile.department:
                    qs = qs.filter(department=profile.department)
                elif profile.role == 'staff' and profile.department:
                    # Staff should only see tasks that are assigned specifically to them within their department
                    qs = qs.filter(department=profile.department, assigned_staff=user)
                else:
                    return RecipeProductionTask.objects.none()
            except UserProfile.DoesNotExist:
                return RecipeProductionTask.objects.none()

        params = self.request.query_params

        # Status filtering (comma-separated)
        status_param = params.get('status')
        if status_param is not None:
            statuses = [s.strip() for s in status_param.split(',') if s.strip()]
            if statuses:
                qs = qs.filter(status__in=statuses)
        else:
            # Default for staff: hide archived
            if not user.is_superuser and getattr(user.profile, 'role', None) == 'staff':
                qs = qs.exclude(status='archived')

        # Additional filters
        if dept_id := params.get('department_id'):
            qs = qs.filter(department_id=dept_id)
        if recipe_id := params.get('recipe_id'):
            qs = qs.filter(recipe_id=recipe_id)
        if date_exact := params.get('date'):
            qs = qs.filter(scheduled_start_time__date=date_exact)
        if start_date := params.get('start_date'):
            qs = qs.filter(scheduled_start_time__date__gte=start_date)
        if end_date := params.get('end_date'):
            qs = qs.filter(scheduled_start_time__date__lte=end_date)
        if staff_id := params.get('assigned_staff_id'):
            qs = qs.filter(assigned_staff_id=staff_id)
        if recur_param := params.get('is_recurring'):
            qs = qs.filter(is_recurring=(recur_param.lower() == 'true'))

        return qs.order_by('scheduled_start_time')

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
