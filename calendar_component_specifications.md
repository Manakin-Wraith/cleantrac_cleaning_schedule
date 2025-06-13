# Calendar UI Component Specifications

This document details the UI components for the redesigned cleaning and recipe calendars, focusing on a manager's desktop experience. The design aims for a modern, frictionless, and beautiful user interface, leveraging Material UI.

## I. Overall Layout Structure Components

### 1. Main Application Wrapper
   - **Purpose**: Provides the foundational structure for the entire calendar application page.
   - **Key Features**: Consists of Header, Sidebar (collapsible), Main Content Area (Calendar View), and optional Footer.
   - **Styling Notes**: Clean lines, balanced spacing, responsive to desktop viewport changes. Utilizes Material UI's `Container` or `Box` for layout.
   - **Desktop Optimization**: Maximizes usable screen real estate, ensures clear separation of sections.

### 2. Header Section Container
   - **Purpose**: Houses global navigation, date controls, view selectors, and user tools.
   - **Key Features**: Fixed or sticky at the top for persistent access.
   - **Styling Notes**: Consistent height, clear visual hierarchy for its elements. Material UI `AppBar` can be used.
   - **Desktop Optimization**: Efficiently organizes controls without cluttering the main calendar view.

### 3. Sidebar Container
   - **Purpose**: Provides access to filters, resource management, quick actions, and legend.
   - **Key Features**: Collapsible to maximize calendar content area. Width should be optimized for content readability when expanded.
   - **Styling Notes**: Smooth collapse/expand animation. Material UI `Drawer` (persistent variant) is suitable.
   - **Desktop Optimization**: Offers powerful filtering and quick access without overwhelming the user; easily hidden when not needed.

### 4. Calendar Content Area
   - **Purpose**: The primary space where the selected calendar view (Month, Week, Day, Timeline) is rendered.
   - **Key Features**: Dynamically updates based on view selection and filters. Should handle overflow gracefully.
   - **Styling Notes**: Ample padding, clear visual boundaries. The core of the FullCalendar component will reside here.
   - **Desktop Optimization**: Expands to fill available space, ensuring calendar data is easily viewable and interactive.

### 5. Footer Controls Container (Optional)
   - **Purpose**: Displays summary information, global actions, or status messages.
   - **Key Features**: Fixed at the bottom if present.
   - **Styling Notes**: Unobtrusive, provides supplementary information without distracting from the main content.
   - **Desktop Optimization**: Useful for persistent global actions or system status without taking up primary interaction space.

## II. Header Section Components

### 1. Logo / Branding Area
   - **Purpose**: Displays application logo or brand name.
   - **Key Features**: Typically links to the dashboard or home page.
   - **Styling Notes**: Clean, appropriately sized. Placed on the left.

### 2. Date Navigation Controls
   - **Component Name**: `DateNavigator`
   - **Purpose**: Allows users to change the currently viewed date range.
   - **Key Features**:
     - **Previous Button**: Icon-only button (`<ArrowBackIosNewIcon />`).
     - **Next Button**: Icon-only button (`<ArrowForwardIosIcon />`).
     - **Today Button**: Text button (`Today`). Becomes visually distinct (e.g., `variant="contained"`) when the current view *is not* today; `variant="outlined"` or subdued when *on* today.
     - **Date Picker Dropdown**: Icon-button (`<CalendarTodayIcon />`) opening a Material UI `DatePicker` for quick month/year jumps.
   - **Interactions**: Click navigates the calendar. Date picker allows direct date selection.
   - **Styling Notes**: Grouped controls, clear iconography, Material UI `Button` and `IconButton`.
   - **Desktop Optimization**: Compact, intuitive controls for quick date adjustments.

### 3. Current Period Display
   - **Component Name**: `CurrentPeriodLabel`
   - **Purpose**: Shows the currently displayed date range (e.g., "June 2025", "June 10-16, 2025").
   - **Key Features**: Dynamically updates with date navigation. Prominent typography.
   - **Styling Notes**: `Typography` component (e.g., `h6` or `subtitle1`), bold, centered between date navigation and view controls.
   - **Desktop Optimization**: Provides clear context of the current view at a glance.

### 4. View Controls
   - **Component Name**: `ViewSelector`
   - **Purpose**: Allows users to switch between different calendar views (Month, Week, Day, Timeline).
   - **Key Features**: Segmented button group (Material UI `ToggleButtonGroup`).
   - **Buttons**: `Month`, `Week`, `Day`, `Timeline` (or icons like `<CalendarViewMonthIcon />`, `<CalendarViewWeekIcon />`, `<CalendarViewDayIcon />`, `<TimelineIcon />`).
   - **Interactions**: Click selects a view, updating the Calendar Content Area. Only one view active at a time.
   - **Styling Notes**: Clear indication of the active view. Consistent Material UI styling.
   - **Desktop Optimization**: Easy and quick switching between perspectives.

### 5. User Tools Area
   - **Purpose**: Provides access to user-specific actions and application settings.
   - **Key Features**:
     - **Print/Export Button**: Icon-button (`<PrintIcon />` or `<DownloadIcon />`) potentially opening a dropdown for format options.
     - **Settings Dropdown**: Icon-button (`<SettingsIcon />`) opening a menu for calendar display preferences, notifications, etc.
     - **Help/Info Button**: Icon-button (`<HelpOutlineIcon />`) linking to documentation or a help modal.
   - **Styling Notes**: Grouped on the right side of the header. Uses Material UI `IconButton` and `Menu`.

### 6. Collapsible Filters Bar
   - **Purpose**: Provides advanced filtering options for the calendar events.
   - **Key Features**: Expands/collapses below the main header. Controlled by a toggle button (`<FilterListIcon />` or text "Filters" with `<ExpandMoreIcon />`/`<ExpandLessIcon />`).
   - **Filter Components within Bar**:
     - **Department Filter**: `Select` dropdown with multi-select capability or `Autocomplete` with multiple values.
     - **Status Filter**: `Chip` components for each status, allowing multi-select. Chips can be clickable to toggle selection.
     - **Search Field**: `TextField` with integrated search icon (`<SearchIcon />`) for text-based search within event titles/details.
     - **Date Range Quick Selectors**: Predefined `Button`s for common ranges (e.g., "This Week", "Next Month") if applicable beyond main navigation.
     - **Custom Filter Button**: Opens a modal for more complex filter combinations.
   - **Styling Notes**: Well-organized layout of filter controls. Clear visual feedback on active filters.
   - **Desktop Optimization**: Powerful filtering capabilities that can be hidden to save space.

## III. Sidebar Components

### 1. Sidebar Collapse Control
   - **Purpose**: Allows users to expand or collapse the sidebar.
   - **Key Features**: Icon-button (`<ChevronLeftIcon />` to collapse, `<ChevronRightIcon />` to expand) or a simple text button.
   - **Styling Notes**: Placed prominently at the top or side of the sidebar. Smooth animation.

### 2. Resources Section
   - **Purpose**: Manages visibility of events based on assigned resources (e.g., staff, rooms).
   - **Key Features**:
     - **Resource List**: Displays a list of available resources (e.g., "Staff Member 1").
     - **Resource Item**: Each item includes a `Checkbox` to toggle visibility, resource name, and an optional color indicator/icon representing the resource or their status.
     - **Resource Grouping**: Option to group resources by type or department (e.g., using `ListSubheader`).
     - **Search/Filter Resources**: A small `TextField` within the section to quickly find a resource in a long list.
   - **Styling Notes**: Clear, readable list. Material UI `List`, `ListItem`, `Checkbox`.
   - **Desktop Optimization**: Efficient management of multiple resources, crucial for busy schedules.

### 3. Quick Actions Section
   - **Purpose**: Provides shortcuts for creating new events or tasks.
   - **Key Features**:
     - **"New Task" Button**: `Button` with icon (`<AddCircleOutlineIcon />` or specific task type icon) to open a creation modal/form for cleaning tasks.
     - **"New Recipe" Button**: `Button` with icon (`<AddCircleOutlineIcon />` or `<RestaurantIcon />`) to open a creation modal/form for recipe events.
     - **Drag-and-Drop Templates (Optional)**: Pre-defined task/recipe templates that can be dragged onto the calendar.
   - **Styling Notes**: Action-oriented buttons, clearly labeled. Material UI `Button` (full-width or prominent).

### 4. Legend Section
   - **Purpose**: Explains the color-coding or iconography used for event statuses or types.
   - **Key Features**:
     - **Legend Item**: Each item shows a color swatch/icon and its corresponding meaning (e.g., "■ Completed", "● In Progress").
     - **Toggle Visibility (Optional)**: `Checkbox` next to each legend item to show/hide events of that status/type from the calendar.
   - **Styling Notes**: Clear, concise. Material UI `List` or custom layout with `Box` and `Typography`.

## IV. Calendar View Components (FullCalendar Integration)

This section refers to the main calendar display, typically managed by a library like FullCalendar, styled with Material UI.

### 1. Day Headers (Month, Week, Day Views)
   - **Purpose**: Display the days of the week (e.g., S, M, T, W, T, F, S or MON, TUE).
   - **Styling Notes**: Consistent width, clear typography. Material UI `TableCell` or custom `Box` within FullCalendar's header rendering.

### 2. Date Cells (Month View)
   - **Purpose**: Represent individual days in the month grid.
   - **Key Features**: Display date number. Container for event cards. Equal height/width.
   - **Interactions**: Click on cell (or a "+N more" indicator) might navigate to Day view or show an overflow popover.
   - **Styling Notes**: Clear visual separation. Highlight for 'today'. Hover state for the cell.

### 3. Time Grid (Week, Day, Timeline Views)
   - **Purpose**: Vertical or horizontal axis representing time slots.
   - **Styling Notes**: Clear time labels (e.g., 9:00, 10:00). Grid lines for visual structure. Current time indicator line.

### 4. All-Day Slot (Week, Day Views)
   - **Purpose**: Area at the top of day columns for all-day events.
   - **Styling Notes**: Clearly demarcated from the timed grid.

### 5. Resource Axis (Timeline View, optional in Day View)
   - **Purpose**: Vertical axis displaying resources (staff, rooms) when in resource-based views.
   - **Styling Notes**: Clear resource labels. Sticky if scrolling horizontally.

## V. Event Card System Components

Refers to the visual representation of individual calendar events (tasks or recipes).

### 1. Base Event Card
   - **Purpose**: Displays information about a single calendar event.
   - **Key Features**: Adapts content and layout based on the current calendar view (Month, Week, Day, Timeline) and interaction state (default, hover, selected).
   - **Styling Notes**: Material UI `Paper` or `Card` with custom styling. Uses color codes and icons for status and type. Rounded corners, subtle shadows for depth. Prioritizes readability and modern aesthetics.
   - **Material UI Icons**: As defined in `calendar_card_mockups.md` (e.g., `<RestaurantIcon />`, `<CleaningServicesIcon />`, status icons).
   - **Desktop Optimization**: Designed to be scannable in dense views and informative in detailed views.

### 2. Event Card - Month View
   - **Content**: Minimal. Task/Recipe Type Icon, Event Title. Left color border for status.
   - **Styling**: Compact, single line or two if space allows. Truncated text with ellipsis.
   - **Example Icons**: `<RestaurantIcon />`, `<CleaningServicesIcon />`.

### 3. Event Card - Week View
   - **Content**: Task/Recipe Type Icon, Event Title, Time Range, Primary Assignee/Resource. Left color border for status. Status icon (optional, on hover).
   - **Styling**: Slightly more detail than month view. Fixed height, content might scroll if it overflows (rarely, for very long titles).

### 4. Event Card - Day View / Selected State
   - **Content**: Full details. Task/Recipe Type Icon, Event Title, Status Icon, All relevant metadata (Batch Size, Assigned Staff, Department, Priority, Location, Time, Duration). Action buttons.
   - **Styling**: Most detailed view. Clear hierarchy of information using typography and spacing. Action buttons are typically icon-buttons or small text buttons.
   - **Action Buttons**: `<CheckCircleOutlineIcon />` (Complete), `<EditIcon />` (Edit), `<DeleteIcon />` (Delete), `<MoreVertIcon />` (More actions).

### 5. Event Card - Timeline View
   - **Content**: Task/Recipe Type Icon, Event Title, Time Range. Color fill or border for status.
   - **Styling**: Optimized for horizontal layout. Width represents duration. Compact.

### 6. Event Card Overflow Indicator (Month View)
   - **Purpose**: Indicates when there are more events in a day cell than can be displayed.
   - **Key Features**: Displays as "+N more".
   - **Interactions**: Click or hover might show a popover/tooltip listing the hidden events or navigate to Day view.
   - **Styling**: Unobtrusive but clear. Material UI `Chip` or simple `Typography`.

### 7. Event Card Tooltip
   - **Purpose**: Provides additional details on hover for event cards in compact views.
   - **Key Features**: Shows key information not visible on the card itself.
   - **Styling**: Material UI `Tooltip` component.

### 8. Status Visualization Elements
   - **Purpose**: Consistently communicate event status.
   - **Key Features**:
     - **Color-Coded Borders**: Prominent left border on cards (e.g., 3-6px thick).
     - **Color-Coded Backgrounds**: Subtle background tint for selected or detailed cards (optional).
     - **Status Icons**: Material UI icons corresponding to each status (e.g., `<CheckCircleOutlineIcon />` for Completed, `<AutorenewIcon />` for In Progress).
   - **Colors & Icons**: As defined in `calendar_card_mockups.md` and `calendar_card_specifications.md`.

## VI. Modals & Dialogs

### 1. Event Creation/Editing Modal
   - **Purpose**: Form for creating or modifying calendar events (tasks/recipes).
   - **Key Features**: Fields for all event properties (title, date, time, duration, assignee, status, type, description, etc.). Date/Time pickers, Selects for resources/status.
   - **Styling**: Material UI `Dialog` component. Clear form layout, validation messages. `Save` and `Cancel` actions.
   - **Desktop Optimization**: Sufficient space for all fields, easy data entry.

### 2. Confirmation Dialog
   - **Purpose**: Asks for user confirmation before destructive actions (e.g., deleting an event).
   - **Key Features**: Clear message, `Confirm` and `Cancel` buttons.
   - **Styling**: Material UI `Dialog` with `DialogTitle`, `DialogContentText`, `DialogActions`.

### 3. Custom Filter Modal
   - **Purpose**: Allows users to define and apply complex filter combinations.
   - **Key Features**: Multiple filter criteria selectors, logic operators (AND/OR).
   - **Styling**: Material UI `Dialog`.

This list provides a solid foundation for the high-fidelity design and development phases. Each component should be designed with a focus on clarity, efficiency, and modern aesthetics to ensure a frictionless experience for the manager.