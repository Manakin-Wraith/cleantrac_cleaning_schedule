# Production Task Dashboard Wireframes (Material UI)

This document outlines the wireframes for the Production Task Dashboard, designed with Material UI components. It breaks down the interface page by page, component by component, and modal by modal.

## 1. Main Dashboard Page

**Objective**: Provide a comprehensive overview of all production tasks and allow for easy scheduling and management.

**Layout**: Standard Material UI App Layout with an `AppBar`, a persistent or temporary `Drawer` for navigation (if applicable to the broader app structure), and a main content area.

### 1.1. `AppBar` (Top Navigation)
- **Content**:
    - Application Title (e.g., "CleanTrac Production Dashboard")
    - Navigation Menu Icon (if using a drawer)
    - Date Range Picker (e.g., `TextField` with `DatePicker` from `@mui/x-date-pickers` or custom range component) - Allows users to select the period for the calendar view.
    - View Switcher (e.g., `ToggleButtonGroup`) for Day/Week/Month/Agenda views for the calendar.
    - "Create Task" Button (`Button` with `AddIcon`)
    - User Profile/Settings Icon (`Avatar` or `IconButton`)

### 1.2. Main Content Area
- **Layout**: Primarily occupied by the Calendar View, with a section for filters.

#### 1.2.1. Task Filters Panel
- **Position**: Either a collapsible `Accordion` above the calendar or a `Drawer` that slides in from the side.
- **Components**:
    - **Department Filter**: `FormControl` with `InputLabel` ("Department") and `Select` component populated with department names.
    - **Status Filter**: `FormControl` with `InputLabel` ("Status") and `Select` component (Scheduled, In Progress, Completed, Cancelled, On Hold).
    - **Recipe Filter**: `Autocomplete` component allowing users to search and select recipes.
    - **Assigned Staff Filter**: `Autocomplete` component for selecting staff members.
    - **Date Filter (Redundant if in AppBar, otherwise here)**: `DatePicker` components for start and end dates.
    - **"Apply Filters" Button**: `Button`.
    - **"Clear Filters" Button**: `Button` (variant: "outlined" or "text").

#### 1.2.2. Calendar View (`React Big Calendar` styled with Material UI)
- **Objective**: Display production tasks visually on a calendar.
- **Component**: `React Big Calendar` integrated and styled to match Material UI aesthetics. Events (tasks) on the calendar will be custom rendered to show key information.
- **Features**:
    - **Task Representation**: Each task on the calendar will be a colored block. Color could represent status or department.
        - **Content of Task Block**: Recipe Name, Scheduled Quantity, Start Time.
    - **Drag and Drop**: Tasks can be dragged to reschedule. `onEventDrop` will trigger an API call.
    - **Resize**: Task durations can be resized. `onEventResize` will trigger an API call.
    - **Click Action**: Clicking a task opens the "Task Detail Modal/Drawer". `onSelectEvent`.
    - **Hover Action**: Hovering over a task shows a `Tooltip` with a summary (Recipe, Time, Status).
    - **View Navigation**: Handled by AppBar controls (Day, Week, Month, Agenda).
    - **Date Navigation**: Arrows for previous/next period, and a "Today" button.

## 2. Modals / Drawers

### 2.1. Task Detail Modal/Drawer
- **Trigger**: Clicking a task on the calendar.
- **Component**: `Dialog` (for modal) or `Drawer` (for side panel).
- **Layout**: Tabbed interface using `Tabs` and `Tab` components.

    #### 2.1.1. Header Section (within Modal/Drawer)
    - **Recipe Name**: `Typography` (e.g., `h5` or `h6`).
    - **Recipe Version**: `Chip` or `Typography` (e.g., "Version: 1.2").
    - **Task Status**: `Chip` with color coding (e.g., green for Completed, blue for In Progress).
    - **Close Button**: `IconButton` with `CloseIcon`.

    #### 2.1.2. "Details" Tab
    - **Objective**: Show core information about the task.
    - **Components**:
        - **Scheduled Quantity**: `TextField` (read-only or editable with permissions) with `InputLabel` ("Scheduled Quantity").
        - **Scheduled Start Time**: `DateTimePicker` (read-only or editable).
        - **Scheduled End Time**: `DateTimePicker` (read-only or editable).
        - **Department**: `Typography`.
        - **Assigned Staff**: `Typography` or `Autocomplete` for reassignment.
        - **Notes**: `TextField` (multiline, for viewing/editing notes).
        - **Action Buttons**: "Edit Task", "Change Status", "Delete Task" (`Button` components, visibility based on user permissions and task status).

    #### 2.1.3. "Ingredients" Tab
    - **Objective**: Display scaled ingredient requirements and track usage.
    - **Components**:
        - **Ingredient List**: `Table` (`TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell`).
            - **Columns**: Ingredient Name, Required Quantity (scaled), Unit, Available Quantity (from inventory), Status (e.g., `Chip` for "Available", "Low Stock", "Out of Stock").
        - **"Print Ingredient List" Button**: `Button`.
        - **(Future)** Interface for recording actual ingredient usage if different from scaled.

    #### 2.1.4. "Output" Tab
    - **Objective**: Record and view actual production output.
    - **Components**:
        - **Actual Quantity Produced**: `TextField` (number input) with `InputLabel` ("Actual Quantity"). Unit displayed next to it.
        - **Yield Percentage**: `Typography` (calculated: Actual / Scheduled * 100%).
        - **Quality Rating**: `Rating` component or `Slider`.
        - **Batch Code**: `TextField` with `InputLabel` ("Batch Code").
        - **Production Date**: `DatePicker`.
        - **Expiry Date**: `DatePicker`.
        - **"Save Output" Button**: `Button`.

    #### 2.1.5. "History" Tab (Integration with Django Simple History)
    - **Objective**: Show a log of changes made to the task.
    - **Components**:
        - **History Log**: `List` with `ListItem` components, or a `Table`.
            - **Each entry shows**: Timestamp, User, Action (e.g., "Status changed to Completed", "Scheduled quantity updated to X"), Details of change.

### 2.2. Create/Edit Task Modal
- **Trigger**: Clicking "Create Task" button in `AppBar` or "Edit Task" button in Task Detail Modal/Drawer.
- **Component**: `Dialog` with `DialogTitle`, `DialogContent`, and `DialogActions`.
- **Objective**: Allow users to create new production tasks or edit existing ones.

    #### 2.2.1. `DialogTitle`
    - **Content**: "Create New Production Task" or "Edit Production Task: [Recipe Name]".

    #### 2.2.2. `DialogContent` (Form Layout)
    - **Layout**: A `Grid` container with `Grid` items for form fields.
    - **Form Fields**:
        - **Recipe Selection**: `Autocomplete` component to search and select a `Recipe`. 
            - *On selection, fetch available `RecipeVersion`s.*
        - **Recipe Version**: `Select` component populated with versions for the selected recipe. `InputLabel` ("Recipe Version").
            - *Defaults to the latest version.*
        - **Scheduled Quantity**: `TextField` (type="number") with `InputLabel` ("Scheduled Quantity").
            - *Unit (from selected recipe/version) displayed as `InputAdornment`.*
        - **Scheduled Start Time**: `DateTimePicker` from `@mui/x-date-pickers` with `InputLabel` ("Scheduled Start").
        - **Scheduled End Time**: `DateTimePicker` from `@mui/x-date-pickers` with `InputLabel` ("Scheduled End").
            - *Could auto-calculate based on start time and recipe's standard duration, or allow manual input.*
        - **Department**: `Select` component with `InputLabel` ("Department").
            - *Populated with user's accessible departments.*
        - **Assign Staff (Optional)**: `Autocomplete` (multiple selection) for assigning staff members. `InputLabel` ("Assign Staff").
        - **Task Status (for Edit mode, might be read-only or limited options)**: `Select` component with `InputLabel` ("Status").
        - **Recurrence (Future Enhancement)**: Section for defining recurrence rules (e.g., daily, weekly, custom).
            - `Checkbox` ("Recurring Task").
            - If checked, show fields for frequency, interval, end date/occurrences.
        - **Notes**: `TextField` (multiline) with `InputLabel` ("Notes").

    #### 2.2.3. `DialogActions`
    - **Buttons**:
        - **"Cancel" Button**: `Button` (variant: "outlined").
        - **"Save Task" / "Create Task" Button**: `Button` (variant: "contained", color: "primary").

### 2.3. Change Status Modal
- **Trigger**: Clicking "Change Status" button in Task Detail Modal/Drawer.
- **Component**: `Dialog`.
- **Objective**: Allow users to update the status of a task with optional notes.
- **Content**:
    - `DialogTitle`: "Change Task Status for [Recipe Name]".
    - `DialogContent`:
        - Current Status: `Typography`.
        - New Status: `Select` component with available next statuses based on workflow. `InputLabel` ("New Status").
        - Reason/Notes (Optional): `TextField` (multiline) with `InputLabel` ("Reason for change (optional)").
    - `DialogActions`:
        - "Cancel" Button.
        - "Confirm Change" Button.

### 2.4. Delete Confirmation Modal
- **Trigger**: Clicking "Delete Task" button.
- **Component**: `Dialog`.
- **Objective**: Confirm deletion of a task.
- **Content**:
    - `DialogTitle`: "Confirm Deletion".
    - `DialogContent`: `Typography` ("Are you sure you want to delete the task for [Recipe Name] scheduled on [Date]? This action cannot be undone.").
    - `DialogActions`:
        - "Cancel" Button.
        - "Delete" Button (`Button` color: "error").

## 3. Visual Styling and Theming

- **Overall Theme**: Adhere to the existing Material UI theme of the CleanTrac application (primary/secondary colors, typography, spacing).
- **Color Coding**: Use theme colors strategically for status indicators, department tags, and calendar event backgrounds to provide clear visual cues.
    - Example Status Colors:
        - Scheduled: Blue (e.g., `theme.palette.info.main`)
        - In Progress: Orange (e.g., `theme.palette.warning.main`)
        - Completed: Green (e.g., `theme.palette.success.main`)
        - Cancelled/On Hold: Grey (e.g., `theme.palette.grey[500]`)
- **Icons**: Utilize Material Icons (`@mui/icons-material`) consistently for buttons and indicators.
- **Responsiveness**: Ensure the dashboard is usable on various screen sizes, with components adapting appropriately (e.g., filters moving to a drawer on smaller screens).
- **Feedback**: Use `Snackbar` for notifications (e.g., "Task created successfully", "Error updating task") and `CircularProgress` or `LinearProgress` for loading states.
