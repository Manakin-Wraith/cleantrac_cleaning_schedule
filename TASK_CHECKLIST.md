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

## VII. Food Safety Forms Digitization

This section tracks the progress of digitizing the Temperature Checklist and Daily Cleaning Checklist.

- **[x] Add "Food Safety Files" link to `Sidebar.jsx`**
- **[x] Create initial `FoodSafetyPage.jsx` component and route setup**

### Phase 1: Backend Development (Completed for Temperature & Cleaning Checklists)

-   [x] Define Django Model for Weekly Temperature Review (`WeeklyTemperatureReview`)
-   [x] Define Django Model for Daily Cleaning Record (`DailyCleaningRecord`)
-   [x] Create and apply database migrations for new models
-   [x] Implement Serializer for `WeeklyTemperatureReview`
-   [x] Implement Serializer for `DailyCleaningRecord`
-   [x] Implement ViewSet for `WeeklyTemperatureReview`
-   [x] Implement ViewSet for `DailyCleaningRecord`
-   [x] Register API endpoints for new ViewSets in `urls.py`

### Phase 2: Frontend Integration (Temperature & Cleaning Checklists)

-   [x] **FoodSafetyPage.jsx Enhancements:**
    -   [x] Design layout to display options for "Weekly Temperature Review" and "Daily Cleaning Records" (Implemented with Tabs).
    -   [x] Implement navigation or selection mechanism to switch between these forms (Implemented with Tabs).
-   [x] **Weekly Temperature Review Frontend:**
    -   [x] Create React component for listing/viewing `WeeklyTemperatureReview` entries (`WeeklyTemperatureReviewSection.jsx`).
    -   [x] Create React component/form for creating/editing `WeeklyTemperatureReview` entries (`AddWeeklyTemperatureReviewForm.jsx`).
    -   [x] Integrate components into `FoodSafetyPage.jsx` (or designated parent component).
    -   [x] Implement API calls to fetch and submit data (`foodSafetyService.js`).
    -   [x] Integrate `AuthContext` in `WeeklyTemperatureReviewSection.jsx` and `AddWeeklyTemperatureReviewForm.jsx` for dynamic `departmentId` and user-specific data handling.
    -   Note: `departmentId` is currently a placeholder in `WeeklyTemperatureReviewSection.jsx` and needs dynamic assignment.
-   [x] **Daily Cleaning Records Frontend:**
    -   [x] Update `DailyCleaningRecordSection.jsx` to use dynamic `departmentId` from `AuthContext` for fetching records and passing `departmentId` to `AddDailyCleaningRecordForm.jsx`.
    -   [x] Update `AddDailyCleaningRecordForm.jsx` to use `departmentId` (received as prop) for fetching department-specific cleaning items and include it in the submission payload.
    -   [x] Ensure `DailyCleaningRecordSection.jsx` and `AddDailyCleaningRecordForm.jsx` handle API submissions, loading, error, and authentication/authorization states related to `AuthContext` and `departmentId`.
    -   [x] Verify relevant API calls in `foodSafetyService.js` (e.g., `fetchDailyCleaningRecords`, `fetchCleaningItemsForDepartment`, `submitDailyCleaningRecord`) are correctly used.
-   [x] **UI/UX:**
    -   [x] Ensure forms are user-friendly and match the digitized XLSX structure where appropriate (Achieved through MUI components and clear layouts).
    -   [x] Provide feedback to the user on form submission (success/error) (Implemented with Alert components).

### Phase 3: Permissions & Roles (Refinement for Temperature & Cleaning Checklists)

-   [ ] **Backend Permissions:**
    -   [ ] Review and refine `permission_classes` for `WeeklyTemperatureReviewViewSet`.
        -   Consider: Who can create, view all, view specific, edit, delete?
    -   [ ] Review and refine `permission_classes` for `DailyCleaningRecordViewSet`.
        -   Consider: Who can create, view all, view specific, edit, delete?
    -   [ ] Ensure `perform_create` and `get_queryset` in viewsets correctly handle user-specific data access based on roles (e.g., staff vs. manager).
-   [ ] **Frontend Role-Based Access:**
    -   [ ] Conditionally render UI elements or restrict actions based on the logged-in user's role.

### Phase 4: Testing (Temperature & Cleaning Checklists)

-   [ ] **API Endpoint Testing:**
    -   [ ] Test CRUD operations for `/api/weekly-temperature-reviews/`.
    -   [ ] Test CRUD operations for `/api/daily-cleaning-records/`.
    -   [ ] Test filtering and permissions for both endpoints.
-   [ ] **Frontend Component Testing:**
    -   [ ] Test data display in listing components.
    -   [ ] Test form submissions (create and edit) for both types of records.
    -   [ ] Test user interactions and error handling.
-   [ ] **End-to-End Workflow Testing:**
    -   [ ] Test the complete flow from a staff member logging in, accessing the forms, submitting data, to a manager reviewing the data.

### Phase 5: Documentation (Optional - As Needed for Temperature & Cleaning Checklists)

-   [ ] Update any relevant project documentation regarding the new food safety features.

- **[ ] Gather User Feedback** (Post-testing)
