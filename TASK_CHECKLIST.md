# CleanTrack UI/UX Enhancement & Feature Completion Plan

## I. Overall Application Layout & Core UI

- **[x] Implement Fixed Header Bar**
  - [x] Component: `HeaderBar.jsx`
  - [x] Display: Application Name/Logo (Basic "CleanTrack" text, links to user dashboard/login)
  - [x] Display: User Name & Role (dynamic, from AuthContext)
  - [x] Display: Current Active Department (dynamic, from AuthContext, if available)
  - [x] Functionality: Logout Button (functional, uses AuthContext)
  - [x] Foundational: Implemented `AuthContext` for global authentication state management.
- **[x] Implement Fixed/Collapsible Sidebar Navigation**
  - [x] Component: `Sidebar.jsx`
  - [x] Display: App Logo (`box_icon.png` - visible always, text name on mobile only)
  - [x] Navigation Links (role-based, placeholders for now, includes Logout)
    - [x] Manager: Dashboard, Schedule/Calendar, Item Management, Staff
    - [x] Staff: My Tasks
- **[x] Integrate Header & Sidebar into Main Application Layout**
  - [x] `HeaderBar` integrated into `PageLayout.jsx`.
  - [x] `Sidebar` integrated into `PageLayout.jsx`.
  - [x] `PageLayout.jsx` updated to manage responsive sidebar behavior (mobile toggle, permanent on desktop).
  - [x] Page content renders correctly within the new layout.

## II. Manager Dashboard Enhancements

- **[x] Calendar - Resource View Implementation**
  - [x] Refactor `TaskSchedulerCalendar.jsx` to use resource-aware views (`resourceTimelineWeek`, `resourceTimeGridDay`).
  - [x] Ensure `ManagerDashboardPage.jsx` provides staff data as resources to the calendar.
  - [x] Verify tasks correctly map to `resourceId` for display in staff lanes.
- **[x] Calendar - Improved Task Event Rendering**
  - [x] Enhance visual styling of calendar events (task "chips").
  - [x] Test and Refine new event chip styling.
  - [x] Clear status indicators (e.g., color-coding based on 'pending', 'pending_review', 'completed').
  - [x] Prominently display start/end times if appropriate. (Current display is sufficient)
  - [x] Ensure readability and clarity. (Achieved with new styling)
- **[ ] Calendar - Drag & Drop Functionality (Verification & Refinement)**
    - [ ] Verify that dragging a cleaning item onto a staff member on a specific date/time opens the "Create New Task" modal.
    - [ ] Confirm the modal is correctly pre-filled with: Cleaning Item, Assigned Staff, Due Date, Start Time, End Time (calculated).
    - [ ] Test task creation via this drag-and-drop flow.
    - [ ] Verify the task appears correctly on the calendar after creation.
    - [ ] Test edge cases (dropping on day without time slot, items with/without durations, cancelling modal).
- **[ ] Calendar - General Issues & Refinements**
    - [ ] Investigate and fix any remaining "Unknown Item" or incorrect name displays for tasks/staff on the calendar.
        *   Sub-task: Verify `cleaning_item_id` is correctly populated in fetched tasks.
        *   Sub-task: Verify `cleaning_item_id` and `assigned_to_id` in `departmentTasks` during calendar event mapping.
        *   Sub-task: Verify `getItemName` and `getStaffName` function logic.
    - [ ] Refine styling of draggable items from external list and drop zones on calendar if needed.

- **[x] Bulk Task Deletion (Manager Task List View)**
  - [x] Frontend: Add "Select All" and individual row checkboxes (`ManagerDashboardPage.jsx`).
  - [x] Frontend: Implement state management for selected tasks (`selectedTaskIds` in `ManagerDashboardPage.jsx`).
  - [x] Frontend: Add "Delete Selected" button, visible when tasks are selected (`ManagerDashboardPage.jsx`).
  - [x] Frontend: Implement confirmation dialog for bulk deletion (`ManagerDashboardPage.jsx`).
  - [x] Frontend: Create `deleteMultipleTaskInstances` service function (`taskService.js`).
  - [x] Backend: Implement `bulk_delete` action in `TaskInstanceViewSet` (`core/views.py`) with permission checks.
  - [x] Backend: Ensure correct URL routing for `bulk_delete` endpoint (`core/urls.py` - automatic via router).
  - [x] Integration: Implement `handleBulkDeleteTasks` in `ManagerDashboardPage.jsx` (API call, UI feedback, task list refresh).
  - [x] Refinement: Correct task list refresh in `handleBulkDeleteTasks` to use `fetchManagerData` with proper arguments.
  - **[ ] Testing - Bulk Task Deletion**
    - [ ] Test selecting/deselecting all tasks using "Select All" checkbox.
    - [ ] Test selecting/deselecting individual tasks using row checkboxes.
    - [ ] Test "Delete Selected" button appears only when tasks are selected and shows correct count.
    - [ ] Test bulk delete confirmation dialog: "Cancel" action.
    - [ ] Test bulk delete confirmation dialog: "Delete Selected" action.
    - [ ] Test successful bulk deletion of multiple tasks (verify tasks removed from UI and database).
    - [ ] Test attempting bulk deletion with no tasks selected (verify snackbar message, no API call).
    - [ ] Test permission handling:
        - [ ] Manager can delete tasks from their own department.
        - [ ] Manager cannot delete tasks from other departments (if test setup allows this scenario).
        - [ ] Superuser can delete tasks from any department.
    - [ ] Test error handling (e.g., simulate API error during deletion and verify UI feedback).
- **[ ] Main Dashboard Page - Widget Implementation**
  - [ ] Design UI for dashboard widgets (Overall Completion, Overdue Tasks, Completion by Staff).
  - [ ] Develop/Adapt API endpoints for widget summary data (department-scoped).
  - [ ] Implement frontend components for each widget:
    - [ ] Widget: Overall Completion (Today/This Week) - Percentage, Progress Bar/Donut Chart, Counts.
    - [ ] Widget: Overdue Tasks - Count, Compact List, Link to full list.
    - [ ] Widget: Completion By Staff (Today) - Bar Chart.
- **[ ] Manager Task List (Tab View - Enhancements & Testing)**
    - [ ] Ensure 'Mark Complete' button is enabled and functional for 'pending_review' (and other appropriate) tasks.
    - [ ] Verify manager can mark 'pending_review' tasks as 'completed' and UI updates correctly.
    - [ ] Test overall manager task list interactions (view, edit, mark complete) with new 'pending_review' status.

## III. Item Management (Manager View)

- **[ ] Implement Item Management Page UI**
  - [ ] Page Heading: "[Department Name] Item Management".
  - [ ] Button: "+ Add New Master Item".
  - [ ] Implement Master Item List Table:
    - [ ] Columns: Item Name, Frequency, Equipment, Chemical, Method, Default Staff, Actions.
    - [ ] Actions: "Edit" button, "Delete" button.
- **[ ] Implement Item Form Modal (Add/Edit)**
  - [ ] Modal Header: "Add New/Edit Cleaning Item to [Dept]".
  - [ ] Form Fields: Item Name, Frequency, Equipment, Chemical, Method, Default Assigned Staff (department-specific).
  - [ ] Buttons: "Save", "Cancel".
  - [ ] Implement form validation.
- **[ ] API Integration for Item CRUD**
  - [ ] Function: `Retrieve Cleaning Items` (department-scoped).
  - [ ] Function: `Save Cleaning Item` (POST/PUT/PATCH, department-associated).
  - [ ] Function: `Delete Cleaning Item` (with confirmation).

## IV. Staff Workflow & Other Pending Tasks

- **[ ] Staff Task Submission**
    - [ ] Verify staff can submit tasks for review (status change to 'pending_review') and UI updates correctly on `StaffTasksPage.jsx`.
- **[ ] Testing & Refinement**
    - [ ] Conduct End-to-End Workflow Test for all core user stories (task creation, assignment, staff submission, manager review/completion).

## V. Future Enhancements (From `docs/breakdown.md` & previous lists)

- [ ] Consider a collapsible sidebar for cleaning items or other controls on Manager Dashboard.
- [ ] Reports Page (Manager View): Design, API, Implementation.
- [ ] User Management System (Admin/Manager): API & UI.
- [ ] Department Management System (Admin/Manager): API & UI.
- [ ] Further UI/UX refinements based on user feedback.
- [ ] Plan for Production Database (PostgreSQL setup).

## VI. Thermometer Verification System

- **[x] `ThermometerStatusDashboard.jsx` - UI Fixes**
  - [x] Resolve MUI Grid v2 prop warnings (remove `item` prop, apply responsive props directly).
  - [x] Update display to show AM and PM assignees separately for better visibility.
  - [x] Reset assignment form after a staff member has been assigned.
- **[x] `ThermometerAssignmentManager.jsx` - UI & Logic Fixes**
  - [x] Resolve MUI `Select` component "out-of-range value `undefined`" warning for `staff_member_id`.
  - [x] Ensure `department_id` is correctly included in assignment creation payload.
  - [x] Ensure `assignment_date` is correctly formatted for API.
  - [x] Add date picker for scheduling assignments up to 30 days in advance.
  - [x] Refactor UI to clearly show today's AM/PM assignment status with actionable alerts.
  - [x] Implement separate "Assign AM Duty" and "Assign PM Duty" buttons for unassigned slots.
  - [x] Display today's AM and PM assigned staff with "Edit" buttons for quick modification.
  - [x] Streamline form opening logic (`handleOpenAssignmentForm`) for new/edit scenarios.
  - [x] Update form submission (`handleSubmitAssignment`) for create/update and data refresh.
  - [x] Remove redundant display of assigned staff in the main assignment section (focus on status).
- **[x] Temperature Logging API Enhancements**
  - [x] Add new endpoint in TemperatureLogViewSet to retrieve temperature logs by date.
  - [x] Implement API service function to get all current thermometer verification assignments.
  - [x] Add new endpoint to retrieve areas with their logged status for the current day.
  - [x] Create manager summary endpoint for temperature logging dashboard.
- **[x] Staff Tasks Page Enhancements**
  - [x] Enhance StaffTasksPage to display logged areas for staff assigned to AM/PM temperature logging.
  - [x] Add visual indicators for logged areas with temperature status.
  - [x] Implement conditional visibility for thermometer verification and temperature logging sections.
  - [x] Show informative message when staff is not assigned to thermometer duties.
  - [x] Improve visibility of previously logged temperature areas for staff members.
  - [x] Add AM/PM filtering tabs for temperature logging areas.
- **[x] System Testing & Validation**
  - [x] Test `ThermometerStatusDashboard` for correct display and no console warnings.
  - [x] Test `ThermometerAssignmentManager` for assignment creation/update, ensuring no console warnings and correct data submission.
  - [x] Verify overall functionality of thermometer verification assignment.
  - [x] Test temperature logs by date endpoint functionality.
- **[x] Manager Dashboard Enhancements**
  - [x] Create temperature logging summary widget for managers.
  - [x] Add visual progress indicators for AM/PM temperature logging completion.
  - [x] Implement detailed area-by-area temperature status view.
  - [x] Add out-of-range temperature indicators for managers.

- **[ ] Gather User Feedback** (Post-testing)
