# Recipe Production Scheduling Implementation Checklist

## I. Backend Implementation

### Models and Database
- [x] Recipe model (already implemented)
- [x] RecipeIngredient model (already implemented)
- [x] ProductionSchedule model (already implemented)
- [x] ProductionRecord model (already implemented)
- [x] RecipeProductionTask model (for tracking production workflow steps)
  - [x] Define fields (task_type, status, scheduled_start_time, scheduled_end_time, notes, etc.)
  - [x] Create migrations
  - [x] Add support for recurrence and parent-child task relationships
- [ ] ProductionCheckpoint model (for tracking specific stages in production)
  - [ ] Define fields (checkpoint_type, completed, completion_time, notes, etc.)
  - [ ] Create migrations

### API Endpoints
- [x] Recipe CRUD endpoints (already implemented)
- [x] ProductionSchedule CRUD endpoints (already implemented)
- [x] ProductionRecord CRUD endpoints (already implemented)
- [x] RecipeProductionTask endpoints
  - [x] List/Create/Retrieve/Update/Delete endpoints
  - [x] Filtering by date, staff, status, department, recipe, and recurrence
  - [x] Custom actions for today's and upcoming tasks
- [ ] ProductionCheckpoint endpoints
  - [ ] List/Create/Retrieve/Update/Delete endpoints
  - [ ] Bulk update endpoint for completing multiple checkpoints

### Permissions
- [x] CanManageRecipes permission (already implemented)
- [x] CanManageProductionSchedule permission (already implemented)
- [x] CanUpdateProductionTask permission
  - [x] Allow staff to update their assigned tasks
  - [x] Allow managers to update any task

## II. Frontend Implementation

### Calendar and Scheduling Components
- [x] ProductionSchedulerCalendar component
  - [x] Adapt TaskSchedulerCalendar for recipe production
  - [x] Custom event rendering for production tasks
  - [x] Resource view for staff assignment
  - [x] Timeline view for production schedule
  - [x] Implement controlled view management (initialView prop, onViewChange, datesSet) - *Key props removed for stability*
  - [x] Ensure stable view switching without flickering - *Achieved by removing key props and stabilizing useEffect dependencies*
  - [x] Refine calendar state management in ProductionSchedulerPage (view, date, data fetching) - *Stabilized data fetching on date/view changes*
- [x] Recipe Drag-and-Drop Functionality
  - [x] Enhanced `handleEventReceive` to extract complete recipe information
  - [x] Improved staff assignment from drop location
  - [x] Added accurate time range extraction from drop location
  - [x] Implemented comprehensive task data creation for modal
- [x] ProductionAssignmentModal component
  - [x] Recipe selection
  - [x] Quantity input
  - [x] Staff assignment
  - [x] Date and time selection
  - [x] Notes field
  - [x] Recurrence options
  - [x] Enhanced modal data population from drag-and-drop events
  - [x] Fixed form submission data format to match backend expectations
  - [x] Resolved React hydration error with nested heading elements
  - [x] Improved modal design consistency and accessibility
  - [x] **Edit Production Task Modal**
    - [x] Resolve persistent HTML heading nesting warning (`h2 > h2 > h6`) in `ProductionScheduleFormModal.jsx`.
    - [x] Ensure "Update Schedule" button correctly submits changes (PUT request).
    - [x] Verify all form fields populate correctly from existing task data.
    - [x] Verify "Status" dropdown includes "Scheduled" and selects correctly.
    - [x] Resolve any "controlled vs. uncontrolled input" warnings.
    - [x] Resolve any "out-of-range value" warnings for select components.

### Production Workflow Components
- [x] ProductionTaskDetailModal component
  - [x] Display recipe details
  - [x] Show production steps
  - [x] Status update controls
  - [x] Notes and feedback input
  - [x] Workflow stepper for task progression
- [ ] ProductionProcessTracker component
  - [ ] Step-by-step workflow visualization
  - [ ] Checkpoint completion tracking
  - [ ] Time tracking for each step
  - [ ] Quality control inputs

### Staff Dashboard Components
- [x] Production tasks integrated in ProductionSchedulerPage
  - [x] Calendar view of assigned production tasks
  - [x] Filtering by date, status, department, recipe
  - [x] Quick status update via modals
  - [x] Improved calendar refresh logic after saving production tasks
  - [x] Enhanced task visibility across all calendar views
- [x] ProductionScheduleList component
  - [x] List view of production tasks with comprehensive information
  - [x] Enhanced display of recipe name, batch size, and assigned staff
  - [x] Improved date and time display with visual hierarchy
  - [x] Status indicators with color-coded chips
  - [x] Action buttons for task management
- [ ] ProductionTaskSheetPrintView component
  - [ ] Printable view of production tasks
  - [ ] Recipe details and instructions
  - [ ] Checkpoints and quality control fields

### Manager Dashboard Components
- [x] ProductionSchedulerPage component
  - [x] Comprehensive production scheduling interface
  - [x] Calendar and modal integration
  - [x] CRUD operations for production tasks
  - [x] Filtering and staff assignment
  - [x] Improved task data handling for consistent display
  - [x] Enhanced event rendering with proper color coding
  - [x] Fixed syntax errors and linting issues for code quality
- [ ] ProductionScheduleOverview component
  - [ ] Summary of scheduled productions
  - [ ] Status indicators
  - [ ] Staff workload visualization
- [ ] ProductionAnalytics component
  - [ ] Production efficiency metrics
  - [ ] Waste tracking
  - [ ] Staff performance metrics

## III. Integration Points

### Inventory Integration
- [ ] Pre-production inventory check
  - [ ] Verify ingredient availability
  - [ ] Calculate required quantities
  - [ ] Flag insufficient inventory
- [ ] Post-production inventory update
  - [ ] Deduct used ingredients
  - [ ] Record produced items
  - [ ] Track waste

### Quality Control Integration
- [ ] Quality checkpoints in production workflow
  - [ ] Define quality metrics
  - [ ] Create input forms for quality data
  - [ ] Implement approval/rejection workflow
- [ ] Quality reporting
  - [ ] Trend analysis
  - [ ] Issue tracking
  - [ ] Improvement suggestions

### Staff Management Integration
- [ ] Staff availability checking
  - [ ] Prevent over-scheduling
  - [ ] Consider staff skills and roles
- [ ] Staff performance tracking
  - [ ] Production efficiency metrics
  - [ ] Quality metrics
  - [ ] Feedback collection

## IV. User Experience Enhancements

### UI/UX Modernization Recommendations
- [ ] Modal Layout Redesign
  - [ ] Implement React Hook Form for improved form handling and validation
  - [ ] Replace current form structure with more efficient controlled components
  - [ ] Add form validation with visual feedback using Zod or Yup schema validation
  - [ ] Implement stepped form layout for complex forms to reduce cognitive load
- [ ] Component Library Upgrades
  - [ ] Consider upgrading to Material UI v5 with the new styled API for consistent theming
  - [ ] Evaluate Chakra UI as an alternative for more accessible and customizable components
  - [ ] Implement responsive dialog components with improved mobile experience
  - [ ] Add skeleton loaders for better loading states
- [ ] User Interaction Improvements
  - [ ] Add drag handle indicators to draggable recipe chips
  - [ ] Implement visual feedback during drag operations
  - [ ] Add tooltips to show recipe details on hover
  - [ ] Implement keyboard navigation for accessibility
- [ ] Visual Design Enhancements
  - [ ] Create a consistent color system for task statuses and types
  - [ ] Improve typography hierarchy for better readability
  - [ ] Add subtle animations for state transitions
  - [ ] Implement responsive spacing system

### Mobile Responsiveness
- [ ] Optimize calendar view for mobile
- [ ] Create mobile-friendly task update forms
- [ ] Implement offline capability for remote updates

### Notifications
- [ ] Production schedule notifications
  - [ ] Staff assignment notifications
  - [ ] Upcoming production reminders
- [ ] Status update notifications
  - [ ] Completion notifications
  - [ ] Issue alerts

### Reporting
- [ ] Production schedule reports
  - [ ] Daily/weekly/monthly views
  - [ ] Staff workload reports
- [ ] Production outcome reports
  - [ ] Actual vs. planned production
  - [ ] Quality metrics
  - [ ] Waste analysis

## V. Testing and Deployment

### Unit Testing
- [ ] Backend model tests
- [ ] API endpoint tests
- [ ] Permission tests

### Integration Testing
- [ ] Calendar functionality tests
- [ ] Workflow progression tests
- [ ] Inventory integration tests

## VI. Recipe Production Scheduling UI/UX (vs. Cleaning Tasks) - Phase 1 Complete
- [x] **Placeholder Event on Drop**: Implement immediate visual feedback by adding a temporary placeholder event to the calendar when a recipe chip is dragged and dropped.
- [x] **Placeholder Event Styling**: Ensure placeholder events are visually distinct (e.g., greyed out, specific icon, '(Pending)' prefix, reduced opacity).
- [x] **`renderEventContent` Handles Placeholders**: Update the calendar's event rendering logic to correctly display placeholder events with their specific styling and information.
- [x] **Placeholder Removed on Save/Cancel**: Confirm that the placeholder event is correctly removed from the calendar when the scheduling modal is saved (and replaced by the actual event) or when the modal is cancelled.
- [x] **Visibility on All Calendar Views**: Verified that both placeholder and saved recipe production events are visible and correctly rendered across all calendar views (Day, Week, Month, Timeline).
- [x] **Saved Event Display**: Verified that the final saved event displays with the correct styling (based on status, task type) and information on all calendar views.
- [x] **Consistency with Cleaning Tasks**: Final review confirmed overall UX alignment with cleaning task scheduling, including tooltips, event click, date click, drag/resize, and general look/feel.

### User Acceptance Testing
- [ ] Manager scheduling workflow
- [ ] Staff production workflow
- [ ] Reporting and analytics review

### Deployment
- [ ] Database migrations
- [ ] Frontend build and deployment
- [ ] User documentation and training
