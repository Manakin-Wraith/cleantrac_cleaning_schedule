# Recipe Production Scheduling Implementation Checklist

This document outlines the detailed implementation plan for the Recipe Production Scheduling module in the CleanTrac system. The implementation follows a structured approach, addressing backend, frontend, and integration components.

## I. Backend Implementation

### A. Data Models (core/models.py)
- [x] **RecipeProductionTask Model**
  - [x] Define fields: recipe (FK), department (FK), scheduled_start_time, scheduled_end_time, scheduled_quantity, status, assigned_staff (FK), created_by (FK), is_recurring, recurrence_pattern
  - [x] Implement status choices (Scheduled, In Progress, Completed)
  - [x] Add department-scoped filtering
  - [x] Create helper methods for recurring task generation

- [x] **ProductionIngredientUsage Model**
  - [x] Define fields: production_task (FK), ingredient (FK), batch_code, expiration_date, supplier (FK), quantity_used, recorded_by (FK)
  - [x] Add validation for batch codes and expiration dates
  - [x] Implement inventory deduction on save

- [x] **ProductionOutput Model**
  - [x] Define fields: production_task (FK), actual_quantity, expected_quantity, yield_percentage, quality_rating, batch_code, production_date, expiry_date, recorded_by (FK)
  - [x] Add validation for dates and quality ratings
  - [x] Implement yield percentage calculation for actual quantity

### B. Serializers (core/recipe_serializers.py)
- [x] **RecipeProductionTaskSerializer**
  - [x] Create serializer with read/write fields
  - [x] Add validation for scheduling conflicts
  - [x] Implement nested serialization for related objects

- [x] **ProductionIngredientUsageSerializer**
  - [x] Create serializer with appropriate fields
  - [x] Add validation for batch codes and ingredient availability
  - [x] Implement inventory integration

- [x] **ProductionOutputSerializer**
  - [x] Create serializer with appropriate fields
  - [x] Add yield calculation logic
  - [x] Implement validation for dates and quality rating

### C. ViewSets and Permissions (core/recipe_views.py, core/permissions.py)
- [x] **RecipeProductionTaskViewSet**
  - [x] Implement CRUD operations with department-scoped permissions
  - [x] Add filtering by date range, status, and department
  - [x] Implement recurring task creation logic

- [x] **ProductionIngredientUsageViewSet**
  - [x] Implement CRUD operations with appropriate permissions
  - [x] Add filtering by production task

- [x] **ProductionOutputViewSet**
  - [x] Implement CRUD operations with appropriate permissions
  - [x] Add filtering by production task

- [x] **Create Permission Classes**
  - [x] `CanManageProductionTasks` for manager-specific operations
  - [x] `CanExecuteProductionTasks` for staff execution permissions

### D. API Endpoints (core/urls.py)
- [x] Register `/api/production-tasks/` endpoint
- [x] Register `/api/production-ingredients/` endpoint
- [x] Register `/api/production-outputs/` endpoint
- [x] Create custom endpoints:
  - [x] `/api/production-tasks/recurring/` for recurring task management
  - [x] `/api/production-tasks/my-tasks/` for staff-assigned tasks
  - [x] `/api/production-tasks/by_department/` for department-specific views

### E. Integration Services
- [ ] **Inventory Integration**
  - [ ] Create service for checking ingredient availability
  - [ ] Implement inventory deduction on task completion
  - [ ] Add alerts for low inventory levels

- [x] **Recipe Integration**
  - [x] Connect production tasks to recipe versions
  - [x] Calculate ingredient requirements based on production quantity
  - [x] Implement scaling logic for different batch sizes
  - [x] Create service for fetching recipe details
  - [ ] Add expected yield calculation

### F. Frontend Components
- [x] Frontend Design Document (`production_task_dashboard_design.md`)
- [x] Frontend Wireframes Document (`production_task_dashboard_wireframes.md`)
- [ ] **Production Task Dashboard**
  - [x] ~~Create `ProductionDashboardPage.jsx` (Container page for calendar and future components)~~ (Replaced by role-specific dashboards)
  - [x] Create `ManagerProductionDashboardPage.jsx` using `TaskSchedulerCalendar` with mock data and event handlers
  - [x] Create `StaffProductionDashboardPage.jsx` using `TaskSchedulerCalendar` with mock data and event handlers
  - [x] ~~Create task calendar view (Initial component `ProductionCalendarView.jsx` created)~~ (Replaced by `TaskSchedulerCalendar`)
  - [x] Implement task detail view with ingredient and output tracking (Initial `TaskDetailModal.jsx` with Details, Ingredients, Output & History tabs populated)
  - [ ] Implement Task Detail Modal Actions:
    - [x] "Edit Task" button opens `EditTaskModal.jsx` (Initial `EditTaskModal.jsx` created and integrated, prop name corrected)
    - [x] "Change Status" functionality (Initial `ChangeStatusModal.jsx` created and integrated)
    - [x] "Print Task Sheet" functionality (Initial `TaskSheetPrintView.jsx` created and integrated with `react-to-print`)
  - [x] Add drag-and-drop scheduling interface (Implemented in `TaskSchedulerCalendar` and integrated into Manager/Staff dashboards with mock handlers)

- [ ] **Staff Task Interface**
  - [ ] Create mobile-friendly task execution view
  - [ ] Implement barcode scanning for ingredient usage
  - [ ] Add step-by-step production guidance

- [ ] **Reporting and Analytics**
  - [ ] Create yield analysis dashboard
  - [ ] Implement production efficiency reports
  - [ ] Add ingredient usage tracking and waste analysis

### G. Testing and Documentation
- [ ] **Unit Tests**
  - [ ] Write tests for RecipeProductionTask model and serializer
  - [ ] Write tests for ProductionIngredientUsage model and serializer
  - [ ] Write tests for ProductionOutput model and serializer
  - [ ] Write tests for all ViewSets and permission classes

- [ ] **Integration Tests**
  - [ ] Test inventory integration
  - [ ] Test recurring task generation
  - [ ] Test department-scoped permissions

- [ ] **Documentation**
  - [ ] Create API documentation
  - [ ] Write user guide for production scheduling
  - [ ] Document integration points with other modules

## II. Frontend Implementation

### A. State Management and Services
- [ ] **Production Task Service**
  - [ ] Create API client for production tasks
  - [ ] Implement CRUD operations
  - [ ] Add recurring task management functions

- [ ] **Production Execution Service**
  - [ ] Create API client for ingredient usage and output
  - [ ] Implement batch code validation
  - [ ] Add yield calculation functions

### B. Manager Components

- [ ] **ManagerProductionSchedulePage.jsx**
  - [ ] Create page component with calendar view
  - [ ] Implement department filtering
  - [ ] Add navigation and date selection

- [ ] **ProductionCalendar.jsx**
  - [ ] Integrate React Big Calendar
  - [ ] Implement drag-and-drop for task rescheduling
  - [ ] Add custom event rendering for status indicators

- [ ] **ProductionTaskFormModal.jsx**
  - [ ] Create form for adding/editing production tasks
  - [ ] Implement recipe selection with quantity input
  - [ ] Add recurring task configuration
  - [ ] Implement validation and error handling

- [ ] **RecurringTaskTemplateManager.jsx**
  - [ ] Create interface for managing recurring task templates
  - [ ] Implement recurrence pattern configuration
  - [ ] Add template preview functionality

- [ ] **ProductionDashboard.jsx**
  - [ ] Create KPI dashboard for managers
  - [ ] Implement yield variance tracking
  - [ ] Add completion rate statistics
  - [ ] Create exportable reports

### C. Staff Components

- [ ] **StaffProductionTasksPage.jsx**
  - [ ] Create page component with assigned tasks list
  - [ ] Implement filtering by date and status
  - [ ] Add task detail view

- [ ] **ProductionExecutionForm.jsx**
  - [ ] Create multi-step form for production execution
  - [ ] Implement ingredient verification step
  - [ ] Add process execution step
  - [ ] Create output recording step
  - [ ] Implement validation and error handling

- [ ] **BatchCodeEntryComponent.jsx**
  - [ ] Create component for batch code entry
  - [ ] Implement validation against supplier records
  - [ ] Add expiration date verification

- [ ] **YieldCalculationComponent.jsx**
  - [ ] Create component for yield calculation
  - [ ] Implement variance highlighting
  - [ ] Add notes for yield discrepancies

### D. Shared Components

- [ ] **ProductionTaskCard.jsx**
  - [ ] Create card component for displaying task details
  - [ ] Implement status indicators
  - [ ] Add action buttons based on user role

- [ ] **RecipeSelectionComponent.jsx**
  - [ ] Create component for recipe selection
  - [ ] Implement search and filtering
  - [ ] Add recipe preview

- [ ] **IngredientAvailabilityIndicator.jsx**
  - [ ] Create component for showing ingredient availability
  - [ ] Implement visual indicators for shortages
  - [ ] Add tooltips with detailed information

### E. Navigation and Integration

- [ ] **Update Sidebar.jsx**
  - [ ] Add Production Schedule link for managers
  - [ ] Add Production Tasks link for staff
  - [ ] Implement role-based visibility

- [ ] **Update App.jsx**
  - [ ] Add routes for new production pages
  - [ ] Implement role-based access control

## III. Testing and Quality Assurance

### A. Backend Testing
- [ ] Write unit tests for models
- [ ] Write unit tests for serializers
- [ ] Write unit tests for viewsets
- [ ] Write integration tests for API endpoints

### B. Frontend Testing
- [ ] Write unit tests for components
- [ ] Write integration tests for pages
- [ ] Perform cross-browser testing
- [ ] Test responsive design for mobile/tablet

### C. User Acceptance Testing
- [ ] Create test scenarios for managers
- [ ] Create test scenarios for staff
- [ ] Document test results and feedback
- [ ] Implement necessary adjustments

## IV. Documentation and Deployment

### A. User Documentation
- [x] Create manager guide for production scheduling
- [x] Create staff guide for production execution
- [x] Document KPI dashboard interpretation
- [ ] Create staff guide for production execution
- [ ] Document KPI dashboard interpretation

### B. Technical Documentation
- [ ] Update API documentation
- [ ] Document data models and relationships
- [ ] Create integration guide for future extensions

### C. Deployment
- [ ] Prepare database migrations
- [ ] Update build configuration
- [ ] Deploy to staging environment
- [ ] Perform final testing
- [ ] Deploy to production

## V. Post-Implementation

### A. Monitoring and Optimization
- [ ] Set up performance monitoring
- [ ] Analyze usage patterns
- [ ] Optimize database queries
- [ ] Implement caching where appropriate

### B. Feature Extensions
- [ ] Implement barcode scanning for batch codes
- [ ] Add advanced reporting features
- [ ] Develop production forecasting tools
- [ ] Integrate with quality control system
