---

**Application Core Elements (Shared & Underlying)**

*   **Authentication System:** Handles user login, session, role verification. *Crucially, identifies the user's assigned department(s) upon login.*
*   **User Management System:** Stores user data (name, role, credentials, *assigned department(s)*).
*   **Department Management System:** (New) Stores information about each department (e.g., Butchery, HMR, Bakery) and their configurations.
*   **Database:** Stores all application data (Users, Departments, Items, Task Instances, Completion Logs). *Data will be keyed or filtered by department (e.g., using a `department_id` foreign key in relevant tables) to ensure segregation and relevance.*
*   **Backend API:** Serves data and handles actions for the front-end, enforcing permissions *based on user role and department*. *API endpoints will need to account for department context, typically by filtering data based on the authenticated user's department.*
*   **Task Generation Logic:** Scheduled process to create daily/weekly task instances *per department, based on department-specific items and schedules.*
*   **Status Calculation Logic:** Backend logic to determine task status (Pending, Complete, Overdue) *within the context of a specific department.*

---

**I. Manager/Overview Component/Pages**

This section covers the interface primarily used by managers or supervisors for scheduling, monitoring, and administration.

**1. Login Page (Shared)**

*   **Purpose:** Allow users to access the application.
*   **Wireframe Description:**
    *   Simple, centered layout.
    *   Application Logo/Name at the top.
    *   Heading: "Login".
    *   Form block with:
        *   Label & Input Field for Username/Email.
        *   Label & Input Field for Password (masked).
        *   "Remember Me" Checkbox (Optional).
        *   "Forgot Password?" Link (Optional).
    *   Prominent "Login" Button.
    *   Area for displaying error messages (e.g., "Invalid credentials").
*   **UI Components:** Input Field (Text, Password), Checkbox, Button, Link, Static Text (Labels, Heading, Error Message), Image (Logo).
*   **Features:** User Authentication.
*   **Key Functions:** `Log In` (API call, *returns user details including department(s) and roles*), `Display Error Message` (if login fails), `Redirect on Success` (*to the user's department-specific view, or a department selection page if applicable*).

**2. Overall Application Layout (Shared Structure)**

*   **Purpose:** Provide consistent navigation and structure across the application after login, *reflecting the user's current departmental context.*
*   **Wireframe Description:**
    *   Fixed Header Bar at the top: App Name/Logo, User Name & Role display, *Current Active Department Display (e.g., "Butchery View")*, Logout Button.
    *   Fixed Sidebar Navigation on the left (or collapsible):
        *   App Logo (smaller version).
        *   Navigation Links specific to the user's role *and current department* (Manager links for Butchery: Butchery Dashboard, Butchery Daily Schedule, etc. Staff links for HMR: My HMR Tasks).
    *   Main Content Area on the right: This area dynamically loads the content of the selected page, *filtered for the current department.*
*   **UI Components:** Top Bar, Sidebar Navigation, Navigation Links (Button/Link components), User Info Display, *Department Display*, Logout Button.
*   **Features:** Navigation, Role-based UI display, User Session Management, *Department-Contextual Interface*.
*   **Key Functions:** `Navigate To [View]` (*within current department context*), `Log Out` (API call), *`Switch Active Department` (if user has access to multiple and this feature is implemented)*.

**3. Manager Dashboard Page**

*   **Purpose:** Provide a quick visual summary of cleaning status and key metrics *for the manager's specific department*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "[Department Name] Dashboard" (e.g., "Butchery Dashboard").
    *   Arrangement of several dashboard widgets/cards (e.g., in a grid or two columns). Examples:
        *   **Widget 1: Overall Completion (Today/This Week)**
            *   Heading: "Today's Completion" or "Weekly Completion".
            *   Large Percentage Number.
            *   Simple visual (e.g., Progress Bar or Donut Chart).
            *   Counts: "X Completed / Y Total".
        *   **Widget 2: Overdue Tasks**
            *   Heading: "Overdue Tasks".
            *   Count of overdue tasks.
            *   Maybe a compact list of 3-5 most overdue items (Item Name, Assigned Staff, Due Date).
            *   Link: "View All Overdue Tasks" (Optional, links to Daily Schedule filtered to Overdue).
        *   **Widget 3: Completion By Staff (Today)**
            *   Heading: "Completion By Staff (Today)".
            *   Simple Bar Chart: Each bar is a staff member, split into "Completed" and "Pending" counts.
        *   **Widget 4: Recent Activity / Quick Links (Optional)**
            *   Heading: "Quick Actions".
            *   Buttons/Links: "View Today's Schedule", "Add New Item", "View Reports".
*   **UI Components:** Heading, Widgets/Cards (Container), Static Text, Numbers/Percentages, Charts (Bar Chart, Donut Chart, Progress Bar), Compact List (Simple Table), Buttons/Links.
*   **Features:** Monitoring, Reporting (Summary).
*   **Key Functions:** `Retrieve Dashboard Summary Data` (API call, *scoped to department*), `Display Charts`, `Display Lists`, `Navigate To [View]`.

**4. Daily Schedule Page (Manager View)**

*   **Purpose:** Allow managers to view, filter, and manage all daily cleaning tasks *for their department*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "[Department Name] Daily Schedule".
    *   Controls Bar:
        *   Date Picker / Date Range Selector (e.g., clicking opens a calendar).
        *   Toggle Button Group: "View Day" / "View Week".
        *   Button: "+ Add New Cleaning Item" (Triggers opening the Item Form Modal).
    *   Filter Panel (e.g., collapsible or a persistent sidebar section):
        *   Heading: "Filters".
        *   Filter for Staff: Dropdown (Multi-select, populated with user names).
        *   Filter for Status: Radio Buttons or Checkboxes (e.g., "All", "Pending", "Completed", "Overdue").
        *   Search Input Field: "Search by Item Name".
        *   Buttons: "Apply Filters", "Clear Filters".
    *   Task List Table:
        *   Table Header: Columns for: Status (Icon), Item Name (Sortable), Cleaning Frequency, Responsible Staff, Supervisor, Due Date/Day.
        *   Table Rows: Each row represents a task *instance* for the selected date/period.
        *   Status Column: Displays icon (Green=Complete, Grey=Pending, Red=Overdue) and/or color coding.
        *   Actions Column: Contains buttons/links for each task row:
            *   "View Details" Button (Opens Task Detail Modal).
            *   "Mark Complete" Button (Manager override).
            *   "Edit Assignment" Button (Allows changing Responsible Staff for this instance, maybe inline or via a small modal).
*   **UI Components:** Heading, Date Picker, Button Group, Button, Filter Panel (Container), Dropdown (Multi-select), Radio Buttons/Checkboxes, Search Input Field, Table (Header, Rows, Cells), Status Icon, Action Buttons (View, Mark Complete, Edit).
*   **Features:** Task Management (Viewing, Filtering, Status Tracking, Assignment Management, **Bulk Task Deletion**), Scheduling (Viewing generated tasks), Filtering & Sorting.
*   **Key Functions:** `Retrieve Tasks` (API call with date/filter parameters, *scoped to department*), `Apply Filters`, `Select Date/Range`, `Sort Table`, `Open Task Detail Modal`, `Mark Task Complete` (API call), `Edit Task Assignment` (API call), `Open Item Form Modal` (*for department-specific items*), **`Handle Task Selection (Select All/Individual)`**, **`Initiate Bulk Delete` (API call with selected task IDs, includes confirmation)**.

**5. Item Management Page (Manager View)**

*   **Purpose:** Allow managers to maintain the master list of standard cleaning procedures *for their department*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "[Department Name] Item Management".
    *   Button: "+ Add New Master Item" (Triggers opening the Item Form Modal, *item will be associated with the current department*).
    *   Master Item List Table: *Lists items specific to the current department.*
        *   Table Header: Columns for: Item Name (Sortable), Frequency, Equipment, Chemical, Method (maybe truncated with a "View Full" link or tooltip), Default Staff (*from the current department*).
        *   Table Rows: Each row represents a master cleaning item.
        *   Actions Column: Contains buttons for each item row:
            *   "Edit" Button (Triggers opening the Item Form Modal, pre-filled with item data).
            *   "Delete" Button (Triggers a confirmation modal before deleting).
*   **UI Components:** Heading, Button, Table (Header, Rows, Cells), Action Buttons (Edit, Delete), Optional Tooltip or "View Full Method" Link.
*   **Features:** Master Data Management (Viewing, Adding, Editing, Deleting items).
*   **Key Functions:** `Retrieve Cleaning Items` (API call, *scoped to department*), `Sort Table`, `Open Item Form Modal (for Add)`, `Open Item Form Modal (for Edit)`, `Delete Cleaning Item` (API call), `Show Confirmation Modal`.

**6. Item Form Modal (Primarily Manager Use)**

*   **Purpose:** Form for adding a new master cleaning item or editing an existing one, *associated with the current manager's department*.
*   **Wireframe Description:**
    *   Modal window overlaying the page.
    *   Modal Header: "Add New Cleaning Item to [Department Name]" or "Edit Cleaning Item - [Item Name] ([Department Name])".
    *   Form fields within the modal:
        *   Label & Input Field: "Item Name" (Required).
        *   Label & Input Field/Dropdown: "Cleaning Frequency" (e.g., Daily, Weekly, Monthly).
        *   Label & Input Field: "Cleaning Equipment".
        *   Label & Input Field: "Cleaning Chemical".
        *   Label & Text Area: "Method" (Required, multi-line input).
        *   Label & Multi-select Dropdown: "Default Assigned Staff" (Populated with user names *from the current department*).
    *   Action Buttons at the bottom: "Save", "Cancel".
    *   Area for displaying form validation errors.
*   **UI Components:** Modal Container, Heading, Input Field (Text), Text Area, Dropdown (Multi-select), Button, Static Text (Labels, Error Messages).
*   **Features:** Master Data Management (Adding, Editing item details).
*   **Key Functions:** `Save Cleaning Item` (API call - POST for new, PUT/PATCH for edit, *associating item with department*), `Cancel Form` (Close Modal), `Validate Form Data`.

**7. Reports Page (Manager View)**

*   **Purpose:** Generate and view various reports on cleaning activities and performance *for the manager's department*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "[Department Name] Reports".
    *   Report Configuration Section:
        *   Label & Dropdown: "Select Report Type" (e.g., "Daily Completion Summary", "Overdue Tasks List", "Staff Completion Rates", "Task Completion History").
        *   Label & Date Range Picker: "Select Date Range".
        *   Optional Filters (visible based on report type): e.g., Label & Dropdown "Filter by Staff", Label & Dropdown "Filter by Item".
        *   Button: "Generate Report".
    *   Report Display Area:
        *   Heading: "[Generated Report Title]".
        *   Display area showing the report data: Can be a Table (e.g., for lists of tasks), or Charts (e.g., for completion rates over time).
        *   Optional Button: "Export Report" (e.g., CSV, PDF).
*   **UI Components:** Heading, Dropdown, Date Range Picker, Button, Table, Charts, Export Button.
*   **Features:** Reporting.
*   **Key Functions:** `Select Report Type`, `Select Date Range`, `Apply Filters`, `Generate Report` (API call, *scoped to department*), `Display Report Data`, `Export Report`.

---

**II. Staff Tasks/Profile Component/Pages**

This section covers the interface primarily used by staff members to view and complete their assigned tasks.

**1. Login Page (Shared) - *See Section I.1***

**2. Overall Application Layout (Shared Structure) - *See Section I.2***
*(Note: Staff navigation will only show links like "My [Department Name] Tasks", maybe "Overall [Department Name] Schedule" if implemented read-only).*

**3. My Tasks Page (Staff View)**

*   **Purpose:** Show the logged-in staff member their currently assigned tasks *for their department*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "My [Department Name] Tasks".
    *   Time Period Selector/Toggle: Button Group "Today" | "This Week".
    *   Task List (can be a simpler list or a table):
        *   For List View: Each item shows Status (Icon/Color), Item Name, Due Date/Day.
        *   For Simple Table: Columns like Status, Item Name, Due Date/Day, maybe Equipment/Chemical snippet.
        *   Action Buttons/Links per task:
            *   "View Details" Button (Opens Task Detail Modal).
            *   "Mark Complete" Button.
    *   Message displayed if no tasks are assigned for the selected period: "No tasks assigned for [Today/This Week]."
*   **UI Components:** Heading, Button Group, List or Table, Status Icon, Action Buttons (View Details, Mark Complete), Static Text (Empty state message).
*   **Features:** Task Management (Viewing assigned tasks, Status Tracking), Filtering (by time period).
*   **Key Functions:** `Retrieve My Tasks` (API call for logged-in user and selected period, *scoped to their department*), `Select Period`, `Open Task Detail Modal`, `Mark Task Complete` (API call).

**4. Overall Schedule Page (Optional - Read-only Staff View)**

*   **Purpose:** (If included) Allow staff members to see the full cleaning schedule *for their department*, even tasks not assigned to them, for context.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "Overall [Department Name] Schedule".
    *   Date/Period Selector (similar to Manager view).
    *   Task List Table (Similar columns to Manager view's schedule table, but **no action buttons** or editing capabilities). Status, Item Name, Frequency, Responsible Staff, Supervisor, Due Date/Day.
    *   Highlighting: Could visually highlight the logged-in user's assigned tasks.
*   **UI Components:** Heading, Date/Period Selector, Table (Header, Rows, Cells), Status Icon, Static Text.
*   **Features:** Scheduling (Viewing), Filtering (by date).
*   **Key Functions:** `Retrieve Tasks` (API call for all tasks in period, *scoped to department*), `Select Date/Period`, `Display Tasks`. *(Note: Backend authorization prevents modifications).*

**5. Task Detail Modal (Shared)**

*   **Purpose:** Display comprehensive details of a specific cleaning task *within its departmental context*.
*   **Wireframe Description:**
    *   Modal window overlaying the page.
    *   Modal Header: "Task Details - [Item Name] ([Department Name])".
    *   Display fields for: Item Name, Frequency, Equipment, Chemical, Method, Responsible Staff (Highlighting 'You' if assigned), Supervisor, Current Status.
    *   Completion Log Section: List of previous completion entries.
    *   Action Buttons at the bottom:
        *   "Mark Complete" Button (Only visible/enabled if the task is assigned to the logged-in user and is not already complete).
        *   "Close Modal" Button.
        *   *(Note: "Edit Task Instance" button is hidden for Staff role).*
*   **UI Components:** Modal Container, Heading, Static Text (Labels, Values), Text Area (for Method), List (Completion Log), Button (Mark Complete, Close).
*   **Features:** Task Management (Viewing details, Marking complete), Monitoring (Viewing history).
*   **Key Functions:** `Retrieve Task Details` (API call), `Mark Task Complete` (API call), `Close Modal`.

**6. My Profile Page (Optional - Staff View)**

*   **Purpose:** Allow staff members to view or potentially update their basic profile information, *which includes their department assignment*.
*   **Wireframe Description:**
    *   Main Content Area displays:
    *   Heading: "My Profile".
    *   User Information Section:
        *   Display Field: Name.
        *   Display Field: Role.
        *   Display Field: *Assigned Department(s)*.
        *   (Optional) Link/Button: "Edit Profile" or "Change Password".
*   **UI Components:** Heading, Static Text (Labels, Data), Optional Button/Link.
*   **Features:** User Information Display, *Department Awareness*.
*   **Key Functions:** `Retrieve User Profile` (API call), * Potentially `Update User Profile` (API call if editing is allowed)*.

---