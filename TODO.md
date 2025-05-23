# CleanTrack Application - Task Checklist

This checklist is derived from `docs/breakdown.md` and outlines the development tasks for the CleanTrack application. Each item should be checked off as it's completed.

## 0. Initial Project Setup & Configuration

- **[x] Define Technology Stack** (documented in `tech_stack.md`)
- **[x] Set up Python Virtual Environment** (`venv` created and activated)
- **[x] Install Django and Core Dependencies** (Django installed in `venv`)
- **[x] Initialize Django Project** (project `cleantrac_project` created)
- **[x] Create `.gitignore` file**
- **[x] Create Core Django App** (app `core` created)
- **[x] Register Core App in `settings.py`**
- **[x] Apply Initial Database Migrations** (for built-in apps)
- **[x] Create Superuser Account**
- **[x] Verify Development Server and Admin Access**
- **[x] Configure Database for Development (SQLite initially)** (default Django setup)
- **[ ] Plan for Production Database (PostgreSQL)** (documented in `tech_stack.md`, further setup pending)
- **[x] Set up Django REST framework** (installed, added to INSTALLED_APPS, basic URLs configured)
- **[x] Create DRF Serializers for core models**
- **[x] Create DRF ViewSets for core models**
- **[x] Define API URL patterns for core app**

## I. Application Core Elements (Shared & Underlying)

- **[x] Authentication System** (Session auth for browsable API is default, Token auth added)
  - [x] Implement user login logic (username/password) (Covered by DRF api-auth for now, JWT/Token to be added) (DRF Token Auth now added)
  - [x] Implement Token-based Authentication (e.g., JWT or DRF TokenAuthentication) for frontend API access (DRF TokenAuthentication setup complete)
  - [x] Implement session management (Primarily for browsable API and Django Admin) (Default Django/DRF behavior)
  - [x] Implement role verification (Integrated into custom DRF permission classes)
  - [x] Implement department identification for user upon login (Handled by `/api/users/me/` endpoint providing user, profile, role, and department_id)
- **[ ] User Management System**
  - [~] API: CRUD operations for users (Admin/Manager only) - Create & Delete implemented, Update (Edit) pending.
  - [~] UI: User listing and editing interface (Admin/Manager only) - Listing functional, Add New User functional, Delete functional. **Next: Implement Edit User functionality.**
    - [~] Implement Edit User functionality (Core logic complete; username field in modal remains editable - investigation deferred)
- **[ ] UI/UX Enhancements**
  - [x] Implement Toast Notifications (e.g., for login success/failure) using notistack
  - [x] Standardize page layout and centering (e.g., PageLayout component)
  - [x] Resolve MUI Select out-of-range warning for department_id in UserFormModal
- **[ ] Department Management System**
  - [ ] API: CRUD operations for departments (Admin/Manager only)
- **[ ] Database Setup**
  - [x] Define schema for all tables (Users, Departments, Items, Task Instances, Completion Logs)
  - [x] Ensure `department_id` foreign keys are in relevant tables (Items, Task Instances, Completion Logs, potentially Users if primary department)
  - [x] Set up initial database structure (for built-in Django apps)
  - [x] Create and apply migrations for core models
  - [x] Register core models in Django Admin
- **[ ] Backend API**
  - [x] Design API endpoints for all required functionalities (Initial CRUD covered by ViewSets)
  - **[x] Implement Department-Aware Data Filtering** (Implemented for major viewsets: CleaningItem, TaskInstance, CompletionLog, User, UserProfile)
    - [x] Filter lists (e.g., CleaningItems, TaskInstances) based on requesting user's department
    - [x] Prevent access to objects from other departments unless user is a superuser/has global role (Implemented for relevant models)
  - **[x] Implement Role-Based Access Control (RBAC)** (Initial permission classes created and applied to core ViewSets)
    - [x] Define permissions for 'manager' vs 'staff' roles (e.g., managers can create/assign tasks, staff can view/complete) (Covered by custom permission classes)
    - [x] Implement custom DRF permission classes or override ViewSet methods (Custom permission classes created in core/permissions.py)
  - [x] Implement permission enforcement based on user role and department (overlaps with above) (Covered by custom permissions)
  - **[x] Task Generation Logic** (Initial management command `generate_tasks` created)
    - [x] Develop scheduled process (e.g., cron job, scheduled task) to create daily/weekly task instances (Manual command `generate_tasks.py` created; scheduling is an infra step)
    - [x] Ensure task generation is per-department based on department-specific items and schedules (Command iterates per department and its items)
    - [x] Handle different frequencies (Daily, Weekly, Monthly, As Needed) ('As Needed' excluded, others handled)
- **[ ] Status Calculation Logic**
  - [x] Implement backend logic to determine task status (Pending, Complete, Overdue) (TaskInstance.status field; `update_task_statuses.py` command handles marking 'Missed' for overdue)
  - [x] Ensure status calculation operates within the context of a specific department (DepartmentViewSet `/status-summary/` action provides daily task counts and completion % per department)

---

## II. Manager/Overview Component/Pages

- **[x] 1. Login Page (Shared - also see Staff section)**
  - [x] UI: Design and implement login form (Username/Email, Password, Remember Me, Forgot Password?)_Basic implemented_
  - [ ] UI: Application Logo/Name display
  - [x] UI: Error message display area _Basic implemented_
  - [x] Feature: User Authentication
  - [x] Function: `Log In` API call (client-side)
  - [x] Function: `Display Error Message` (client-side)
  - [x] Function: `Redirect on Success` (to department-specific view or department selection) _Basic to /manager-dashboard done_
- **[ ] 2. Overall Application Layout (Shared Structure - also see Staff section)**
  - [ ] UI: Fixed Header Bar (App Name/Logo, User Name & Role, Current Active Department, Logout Button)
  - [ ] UI: Fixed/Collapsible Sidebar Navigation
  - [ ] UI: Department-specific navigation links
  - [ ] Feature: Navigation system
  - [ ] Feature: Role-based UI display
  - [ ] Feature: User Session Management (client-side)
  - [ ] Feature: Department-Contextual Interface
  - [ ] Function: `Navigate To [View]` (within department context)
  - [ ] Function: `Log Out` API call (client-side)
  - [ ] Function: `Switch Active Department` (if implemented)
- **[ ] 3. Manager Dashboard Page**
  - [ ] UI: Page Heading (e.g., "[Department Name] Dashboard")
  - [~] Data: Foundation for displaying department tasks, cleaning items, and staff users is implemented.
  - [ ] UI: Dashboard widgets/cards layout
  - [ ] UI Component: Overall Completion Widget (Percentage, Progress Bar/Donut Chart, Counts)
  - [ ] UI Component: Overdue Tasks Widget (Count, Compact List, Link to full list)
  - [ ] UI Component: Completion By Staff Widget (Bar Chart)
  - [ ] UI Component: Quick Actions/Links Widget (Optional)
  - [ ] Feature: Monitoring (department-scoped)
  - [ ] Feature: Reporting (Summary, department-scoped)
  - [x] Function: `Retrieve Dashboard Summary Data` API call (department-scoped) (Core calls for tasks, items, users in place)
  - [ ] Function: `Display Charts`
  - [ ] Function: `Display Lists`
- **[ ] 4. Daily Schedule Page (Manager View)**
  - [ ] UI: Page Heading (e.g., "[Department Name] Daily Schedule")
  - [x] UI: Controls Bar (Date Picker, Day/Week Toggle, "+ Add New Cleaning Item" Button) (Create Task button & modal functional, Date Picker implemented)
  - [ ] UI: Filter Panel (Staff, Status, Search by Item Name, Apply/Clear Buttons)
  - [x] UI: Task List Table (Status Icon, Item Name, Frequency, Responsible Staff, Supervisor, Due Date/Day, Actions) (Task details display correctly, including item names, assignees, start/end times. A dedicated 'Task List' tab view using a Material UI table is now also implemented and functional, displaying tasks for the selected date.)
  - [x] UI: **Calendar View** (FullCalendar integrated, displays tasks by staff and time, supports drag & drop for rescheduling/reassigning, and resizing for duration. Task events correctly display item and staff names.)
    - [x] Calendar: Persist `start_time`, `end_time`, `due_date`, and `assignee` changes from drag & drop and resize operations to the backend.
    - [ ] **Calendar UI/UX Enhancements (Manager Scheduler View):**
        - [ ] Implement FullCalendar **Resource View** (e.g., `resourceTimeGridWeek`, `resourceTimeGridDay`) to display staff as distinct columns/lanes, replacing the current horizontal staff name list.
        - [ ] Ensure tasks correctly map to `resourceId` for display in staff lanes.
        - [ ] Improve task "chip" (event) rendering: display status (e.g., color-coding), start/end times, and enhance clarity.
        - [ ] Evaluate and implement responsive behavior for calendar views on smaller screens (e.g., switching to `resourceTimelineDay` or `listWeek`).
  - [ ] **UI: Collapsible Sidebar (MUI Drawer) for Enhanced Controls:**
      - [ ] Implement a collapsible sidebar.
      - [ ] Add staff filtering controls to show/hide specific staff resources in the calendar.
      - [ ] Consider moving "Create New Task" functionality to the sidebar.
      - [ ] Add filters for task status (Pending, Completed etc.).
      - [ ] Explore adding a section for "Unassigned Tasks".
    - [x] Actions: Implement 'Edit Task Assignment' functionality (Modal created, API connected, assignment, notes, layout, and info display complete)
        - [x] Modal: "Edit Task Assignment" modal (Layout and informational display improvements complete, dropdown sizing fixed, pre-fills and saves time and date correctly)
        - [x] Modal: Non-editable item name and assignee. Editable due date, start time, end time, and notes.
    - [x] Actions: Implement "Mark Task Complete" (manager override) functionality
        - [x] API: Add `markTaskAsComplete` function in `taskService.js`.
        - [x] UI: Hook up "Complete" button in task table to call the service.
        - [x] UI: Refresh task list or update task status locally.
        - [x] UI: Provide user feedback (e.g., snackbar notification).
    - [x] Actions: Implement 'View Task Details' (modal) (Basic modal implemented, receives task data correctly)
  - [x] Feature: Task Management (Viewing, Filtering, Status Tracking, Assignment) (Core data loading and assignment via modal working)
  - [x] Feature: Scheduling (Viewing generated tasks)
  - [x] Function: `Retrieve Tasks` API call (department-scoped, with filters) (Task loading by department and selected date working)
  - [ ] Function: `Apply Filters` (client-side)
  - [x] Function: `Select Date/Range` (Date picker implemented and triggers data refresh)
  - [ ] Function: `Sort Table`
  - [x] Function: `Open Task Detail Modal` (see Shared Components) (Implemented)
  - [x] Modal: "Create New Task" modal opens.
  - [x] Modal: "Select Cleaning Item" dropdown populates correctly.
  - [x] Modal: "Assign To (Optional)" staff dropdown populates correctly.
  - [x] Modal: Task creation API call and UI update upon success.
  - [x] Function: `Edit Task Assignment` API call (Implemented in taskService.js)
  - [x] Modal: "Edit Task Assignment" modal (Layout and informational display improvements complete, dropdown sizing fixed, pre-fills and saves time and date correctly)
- **[~] 5. Item Management Page (Manager View)**
  - [x] UI: Page Heading (e.g., "[Department Name] Item Management")
  - [x] UI: "+ Add New Master Item" Button (Button exists and opens functional modal)
  - [x] UI: Master Item List Table (Item Name, Frequency, Equipment, Chemical, Method, Actions) - Core table, data display, edit/delete icons implemented and functional.
  - [x] Feature: Master Data Management (View, Add, Edit, Delete department-specific items) - Core CRUD functionality implemented via modal.
  - [x] Function: `Retrieve Cleaning Items` API call (department-scoped) - Implemented and working.
  - [ ] Function: `Sort Table`
  - [x] Function: `Open Item Form Modal (for Add)` - Implemented.
  - [x] Function: `Open Item Form Modal (for Edit)` - Implemented.
  - [x] UI: Display fields (Item Name, Frequency, Equipment, Chemical, Method) - Implemented and working.
- **[x] 6. Item Form Modal (Primarily Manager Use)**
  - [x] UI: Modal Container and Header (e.g., "Add New Cleaning Item to [Dept]") - Implemented.
  - [x] UI: Form fields (Item Name, Frequency, Equipment, Chemical, Method, Default Assigned Staff) - Implemented with icons, sectioned layout, and enhanced UX for staff selection (deletable chips & checkboxes).
  - [x] UI: Save, Cancel buttons - Implemented.
  - [x] UI: Form validation error display - Basic validation and snackbar errors implemented.
  - [x] Feature: Master Data Management (Adding, Editing department-specific items) - Core functionality implemented.
  - [x] Function: `Save Cleaning Item` API call (POST/PUT/PATCH, associates with department) - Implemented.
  - [x] Function: `Cancel Form` (Close Modal) - Implemented.
  - [x] Function: `Validate Form Data` - Basic client-side validation implemented.
  - [x] UI/UX: Enhanced with leading icons for fields, sectioned layout using Paper components, and improved visual hierarchy.
- **[ ] 7. Reports Page (Manager View)**
  - [ ] UI: Page Heading (e.g., "[Department Name] Reports")
  - [ ] UI: Report Configuration Section (Report Type, Date Range, Optional Filters, Generate Button)
  - [ ] UI: Report Display Area (Title, Table/Charts)
  - [ ] UI: Optional Export Button
  - [ ] Feature: Reporting (department-scoped)
  - [ ] Function: `Select Report Type`
  - [ ] Function: `Select Date Range`
  - [ ] Function: `Apply Filters`
  - [ ] Function: `Generate Report` API call (department-scoped)
  - [ ] Function: `Display Report Data`
  - [ ] Function: `Export Report` (CSV, PDF)

---

## III. Staff Tasks/Profile Component/Pages

- **[ ] 1. Login Page (Shared) - *Covered in Manager section***
- **[ ] 2. Overall Application Layout (Shared Structure) - *Covered in Manager section, staff view will have limited nav links***
- **[ ] 3. My Tasks Page (Staff View)**
  - [ ] UI: Page Heading (e.g., "My [Department Name] Tasks")
  - [ ] UI: Time Period Selector/Toggle (Today, This Week)
  - [x] UI: Task List (List or Simple Table: Status, Item Name, Due Date/Day, Actions) -> **Evolved to responsive Card Grid**
      - [x] Implemented card-based UI for tasks.
      - [x] Cards display: Cleaning Item Name, Equipment, Chemicals, Method, Scheduled Date, Timeslot, Notes, Status.
      - [x] Icons integrated for key details (Date, Time, Equipment, etc.).
      - [x] Responsive grid layout (e.g., 2-3 cards on desktop, 1 on mobile).
      - [x] Consistent card height per row.
      - [x] Distinct background colors for 'Completed' (grey) and 'Pending Review' (light blue/alpha-blended) tasks.
      - [x] Title styling (strike-through, disabled color) for 'Completed' tasks.
  - [ ] UI: Empty state message ("No tasks assigned")
  - [x] Feature: Task Management (Viewing assigned tasks, Status Tracking) - *Basic viewing implemented*
  - [ ] Feature: Filtering (by time period)
  - [ ] Function: `Retrieve My Tasks` API call (for logged-in user, department-scoped)
  - [ ] Function: `Select Period`
  - [ ] Function: `Open Task Detail Modal` (see Shared Components)
  - [ ] Function: `Mark Task Complete` API call
- **[ ] 4. Overall Schedule Page (Optional - Read-only Staff View)**
  - [ ] UI: Page Heading (e.g., "Overall [Department Name] Schedule")
  - [ ] UI: Date/Period Selector
  - [ ] UI: Task List Table (Read-only: Status, Item Name, Frequency, Responsible Staff, Supervisor, Due Date/Day)
  - [ ] UI: Highlighting for logged-in user's tasks (Optional)
  - [ ] Feature: Scheduling (Viewing department schedule)
  - [ ] Feature: Filtering (by date)
  - [ ] Function: `Retrieve Tasks` API call (department-scoped, read-only for staff)
  - [ ] Function: `Select Date/Period`
  - [ ] Function: `Display Tasks`
- **[x] 5. Task Detail Modal (Shared - Manager & Staff Use)**
  - [x] UI: Modal Container and Header (e.g., "Task Details - [Item Name] ([Dept])") (Basic modal implemented, receives task data correctly)
  - [x] UI: Display fields (Item Name, Frequency, Equipment, Chemical, Method, Responsible Staff, Supervisor, Status, Due Date, Start Time, End Time) (Displays key task info, including formatted times. Logging behavior for null props refined.)
  - [ ] UI: Completion Log Section
  - [ ] UI: Action Buttons ("Mark Complete" for staff, "Close")
  - [ ] Feature: Task Management (Viewing details, Staff marking complete)
  - [ ] Feature: Monitoring (Viewing history)
  - [ ] Function: `Retrieve Task Details` API call
  - [ ] Function: `Mark Task Complete` API call (by staff)
  - [ ] Function: `Close Modal`
- **[ ] 6. My Profile Page (Optional - Staff View)**
  - [ ] UI: Page Heading ("My Profile")
  - [ ] UI: User Information Display (Name, Role, Assigned Department(s))
  - [ ] UI: Optional "Edit Profile" / "Change Password" links/buttons
  - [ ] Feature: User Information Display
  - [ ] Feature: Department Awareness
  - [ ] Function: `Retrieve User Profile` API call
  - [ ] Function: `Update User Profile` API call (if editing allowed)

---

## IV. General/Cross-Cutting Concerns

- **[ ] Documentation**
  - [ ] User Guide (Manager)
  - [ ] User Guide (Staff)
  - [ ] API Documentation (if applicable for other integrations)
  - [ ] Deployment Guide
- **[ ] Testing**
  - [ ] Unit tests for backend logic
  - [ ] Integration tests for API endpoints
  - [ ] End-to-end tests for user flows
  - [ ] User Acceptance Testing (UAT) with representatives from each department
- **[ ] Deployment**
  - [ ] Choose hosting environment
  - [ ] Set up CI/CD pipeline
  - [ ] Database migration strategy

---

## V. Project-Wide / Refactoring / Developer Experience (DX)

- [ ] Review and refactor code for clarity, performance, and maintainability at major milestones.
- [x] Create reusable PageLayout component for consistent page structure
- [ ] Set up frontend testing environment (e.g., Jest, React Testing Library).
- [ ] Set up backend testing environment (e.g., PyTest).

Use this checklist to track progress. You can add more granular sub-tasks as needed.
