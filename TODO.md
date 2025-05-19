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

- **[ ] Authentication System** (Session auth for browsable API is default, Token auth added)
  - [x] Implement user login logic (username/password) (Covered by DRF api-auth for now, JWT/Token to be added) (DRF Token Auth now added)
  - [x] Implement Token-based Authentication (e.g., JWT or DRF TokenAuthentication) for frontend API access (DRF TokenAuthentication setup complete)
  - [x] Implement session management (Primarily for browsable API and Django Admin) (Default Django/DRF behavior)
  - [x] Implement role verification (Integrated into custom DRF permission classes)
  - [x] Implement department identification for user upon login (Handled by `/api/users/me/` endpoint providing user, profile, role, and department)
- **[ ] User Management System**
  - [x] Database schema for Users (name, role, hashed credentials, department_id(s)) (covered by User & UserProfile models)
  - [x] Automate UserProfile creation upon User creation (via signals)
  - [ ] Functions for creating, reading, updating, deleting users
  - [ ] Logic for associating users with one or more departments
- **[ ] Department Management System**
  - [x] Database schema for Departments (id, name, e.g., Butchery, HMR, Bakery) (covered by Department model)
  - [ ] Functions for managing departments (CRUD operations)
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

- **[ ] 1. Login Page (Shared - also see Staff section)**
  - [ ] UI: Design and implement login form (Username/Email, Password, Remember Me, Forgot Password?)
  - [ ] UI: Application Logo/Name display
  - [ ] UI: Error message display area
  - [ ] Feature: User Authentication
  - [ ] Function: `Log In` API call (client-side)
  - [ ] Function: `Display Error Message` (client-side)
  - [ ] Function: `Redirect on Success` (to department-specific view or department selection)
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
  - [ ] UI: Dashboard widgets/cards layout
  - [ ] UI Component: Overall Completion Widget (Percentage, Progress Bar/Donut Chart, Counts)
  - [ ] UI Component: Overdue Tasks Widget (Count, Compact List, Link to full list)
  - [ ] UI Component: Completion By Staff Widget (Bar Chart)
  - [ ] UI Component: Quick Actions/Links Widget (Optional)
  - [ ] Feature: Monitoring (department-scoped)
  - [ ] Feature: Reporting (Summary, department-scoped)
  - [ ] Function: `Retrieve Dashboard Summary Data` API call (department-scoped)
  - [ ] Function: `Display Charts`
  - [ ] Function: `Display Lists`
- **[ ] 4. Daily Schedule Page (Manager View)**
  - [ ] UI: Page Heading (e.g., "[Department Name] Daily Schedule")
  - [ ] UI: Controls Bar (Date Picker, Day/Week Toggle, "+ Add New Cleaning Item" Button)
  - [ ] UI: Filter Panel (Staff, Status, Search by Item Name, Apply/Clear Buttons)
  - [ ] UI: Task List Table (Status Icon, Item Name, Frequency, Responsible Staff, Supervisor, Due Date/Day, Actions)
  - [ ] Feature: Task Management (Viewing, Filtering, Status Tracking, Assignment)
  - [ ] Feature: Scheduling (Viewing generated tasks)
  - [ ] Function: `Retrieve Tasks` API call (department-scoped, with filters)
  - [ ] Function: `Apply Filters` (client-side)
  - [ ] Function: `Select Date/Range`
  - [ ] Function: `Sort Table`
  - [ ] Function: `Open Task Detail Modal` (see Shared Components)
  - [ ] Function: `Mark Task Complete` API call (manager override)
  - [ ] Function: `Edit Task Assignment` API call
  - [ ] Function: `Open Item Form Modal` (for department-specific items, see below)
- **[ ] 5. Item Management Page (Manager View)**
  - [ ] UI: Page Heading (e.g., "[Department Name] Item Management")
  - [ ] UI: "+ Add New Master Item" Button
  - [ ] UI: Master Item List Table (Item Name, Frequency, Equipment, Chemical, Method, Default Staff, Actions)
  - [ ] Feature: Master Data Management (View, Add, Edit, Delete department-specific items)
  - [ ] Function: `Retrieve Cleaning Items` API call (department-scoped)
  - [ ] Function: `Sort Table`
  - [ ] Function: `Open Item Form Modal (for Add)`
  - [ ] Function: `Open Item Form Modal (for Edit)`
  - [ ] Function: `Delete Cleaning Item` API call (with confirmation)
  - [ ] Function: `Show Confirmation Modal` (for delete)
- **[ ] 6. Item Form Modal (Primarily Manager Use)**
  - [ ] UI: Modal Container and Header (e.g., "Add New Cleaning Item to [Dept]")
  - [ ] UI: Form fields (Item Name, Frequency, Equipment, Chemical, Method, Default Assigned Staff from department)
  - [ ] UI: Save, Cancel buttons
  - [ ] UI: Form validation error display
  - [ ] Feature: Master Data Management (Adding, Editing department-specific items)
  - [ ] Function: `Save Cleaning Item` API call (POST/PUT/PATCH, associates with department)
  - [ ] Function: `Cancel Form` (Close Modal)
  - [ ] Function: `Validate Form Data`
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
  - [ ] UI: Task List (List or Simple Table: Status, Item Name, Due Date/Day, Actions)
  - [ ] UI: Empty state message ("No tasks assigned")
  - [ ] Feature: Task Management (Viewing assigned tasks, Status Tracking)
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
- **[ ] 5. Task Detail Modal (Shared - Manager & Staff Use)**
  - [ ] UI: Modal Container and Header (e.g., "Task Details - [Item Name] ([Dept])")
  - [ ] UI: Display fields (Item Name, Frequency, Equipment, Chemical, Method, Responsible Staff, Supervisor, Status)
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

Use this checklist to track progress. You can add more granular sub-tasks as needed.
