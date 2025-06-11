# Calendar Technical Audit

**Date**: {{datetime.date}}

## Introduction

This document outlines the technical audit of the existing calendar components (`ProductionSchedulerCalendar.jsx` for recipes and `TaskSchedulerCalendar.jsx` for cleaning tasks). The goal is to understand their current implementation, identify reusable logic, and assess the effort required to integrate the new UI design while preserving backend functionality.

## I. Production Scheduler Calendar (`ProductionSchedulerCalendar.jsx` - Recipe Calendar)

### 1. Component Overview
   - **File Path**: `frontend/src/components/recipes/ProductionSchedulerCalendar.jsx` (Actual path in project: `/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/cleantrac_cleaning_schedule/frontend/src/components/recipes/ProductionSchedulerCalendar.jsx`)
   - **Primary Purpose**: Displays and manages production schedules for recipes, including assignment to staff resources and visualization of tasks across various calendar views.
   - **Key Libraries Used**:
     - FullCalendar: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/resource-timegrid`, `@fullcalendar/resource-timeline`, `@fullcalendar/interaction`. (Specific versions not available from import statements).
     - Material UI: `@mui/material` (Components: `Box`, `Typography`, `Tooltip`), `@mui/material/styles` (`useTheme`). (Specific version not available).
     - Date library: No explicit date manipulation library (like date-fns or Moment.js) is imported; FullCalendar handles most date-related functionalities internally.
     - State management: Primarily relies on React's local state (`useRef` for calendar instance and caching previous events, `useEffect` for side effects like event updates and UI enhancements). Data like `events` and `resources` are passed as props, and state modifications are typically handled by parent components via callbacks. No global state management like Redux or Context API is explicitly used for its core data within this component.

### 2. Data Fetching & State Management
   - **Data Fetching Mechanism**: This component does not fetch data directly. It receives `events` and `resources` as props from a parent component.
   - **API Endpoints Consumed**: None directly within this component. API interactions are expected to be handled by the parent component that provides the data and callbacks.
   - **Data Structure (Received & Expected by FullCalendar)**:
     - `events`: An array of event objects. Expected to conform to FullCalendar's event structure, including `id`, `title` (optional, `recipe_name` often used), `start`, `end`, `resourceId`, and `extendedProps`. `extendedProps` is crucial and contains fields like `status`, `task_type`, `recipe_name`, `batch_size`, `yield_unit`, `isPlaceholder`, `description`, `isExternal`.
     - `resources`: An array of resource objects, likely with at least `id` and a displayable title (e.g., `Staff A`).
   - **Local/Component State Management**:
     - `localCalendarRef = useRef(null)`: Used if an external `calendarRef` is not provided, allowing internal access to FullCalendar's API.
     - `effectiveRef = calendarRef || localCalendarRef`: Determines which ref to use for the FullCalendar instance.
     - `prevEventsRef = useRef([])`: Caches the previous `events` prop to implement a custom change detection logic (`hasEventsChanged`) within an `useEffect` hook. This is used to decide whether to refresh the calendar events, potentially optimizing re-renders or handling complex event object comparisons.
     - `useEffect` for event updates: Monitors the `events` prop. If changes are detected (using `hasEventsChanged`), it removes all existing events and adds the new event source. It also calls `calendarApi.updateSize()` after a short delay.
     - `useEffect` for day view enhancements: Specifically targets `resourceTimeGridDay` view. After rendering, it attempts to force `updateSize` and directly manipulates the DOM to style events for better visibility (e.g., `display: 'flex'`, `visibility: 'visible'`, `minHeight`).

### 3. Backend Interaction Logic (CRUD Operations)
   - This component is primarily presentational concerning CRUD operations, delegating these actions to parent components via callbacks.
   - **Create Events**: Potentially initiated via `onEventReceive` (for external draggable events dropped onto the calendar) or `onDateClick` (parent component could use this to open a creation modal). The component itself doesn't contain creation logic.
   - **Update Events (Drag & Drop, Edit Modal)**: 
     - `onEventDrop`: Callback triggered after an event is dragged and dropped to a new time/resource. Passes `EventDropArg`.
     - `eventResize`: Callback triggered after an event is resized. Passes `EventResizeDoneArg`.
     - `onEventClick`: Callback triggered when an event is clicked. Likely used by the parent to open an edit modal. Passes `EventClickArg`.
   - **Delete Events**: No specific `onEventDelete` callback. Deletion is likely handled by the parent component, possibly initiated through an action in an edit modal triggered by `onEventClick`.
   - **Payload Structures**: The component passes FullCalendar's argument objects directly in callbacks (e.g., `EventDropArg`, `EventClickArg`, `EventResizeDoneArg`, `EventReceiveArg`, `DateClickArg`). The parent component is responsible for transforming these into API request payloads.

### 4. Event Rendering & Customization
   - **`eventContent` Rendering**: A custom function `renderEventContent(eventInfo)` is defined to control the appearance of events.
     - It uses MUI components (`Box`, `Typography`, `Tooltip`) for structuring and styling event content.
     - Dynamic styling (background color, text color, border color) is applied based on `eventInfo.event.extendedProps.status` (e.g., 'completed', 'in_progress', 'scheduled', 'cancelled', 'pending_review', 'on_hold') and also considers `isPlaceholder` or `isExternal` flags. Colors are sourced from `theme.palette`.
     - Displays a `taskTypeIcon` (emoji: 🍳 for production, 🔪 for prep, 🧹 for cleaning) based on `extendedProps.task_type`.
     - The main displayed title (`displayTitle`) is derived from `recipe_name` or `eventInfo.event.title`.
     - A `Tooltip` shows more details: `displayTitle`, `batch_size`, `yield_unit`, `description`, and `status`.
     - Applies a `production-event` CSS class and `placeholder-event` if applicable.
     - Includes specific styling adjustments for different views (`resourceTimeGridDay`, `timelineView`, `monthView`, `weekView`), particularly concerning `minHeight` and text rendering.
     - Attempts to remove 'quality check indicators' by adding a `no-quality-indicators` class and using CSS `::before, ::after { display: 'none !important' }` on event text elements.
   - **Status-Based Styling Logic**: Yes, implemented within `renderEventContent` using a `switch` statement on `effectiveStatus` to set `backgroundColor`, `textColor`, and `borderColor` from `theme.palette`.
   - **Other Custom Rendering Logic**:
     - `resourceTimeGridDay` view has special handling in `renderEventContent` for a more robust layout (flex column, specific padding, shadow) and an additional `useEffect` hook that manipulates DOM elements with class `.fc-resourceTimeGridDay-view .fc-event` to ensure visibility and apply styling (e.g., `display: 'flex'`, `minHeight`).
     - FullCalendar options: `nowIndicator={true}`, `allDaySlot={false}`, `slotMinTime="06:00:00"`, `slotMaxTime="22:00:00"`, `resourceAreaHeaderContent="Staff"`.
     - `headerToolbar` is configured for navigation and view switching.
     - Custom view `resourceTimelineWeek` is defined.

### 5. Client-Side Business Logic
   - **Validation Rules**: No explicit data validation rules are apparent within this component. Validation is likely handled by parent components or the backend.
   - **Event Interaction Handling (Click, Hover)**:
     - Click: `onEventClick` callback is invoked, passing event information to the parent.
     - Hover: MUI `Tooltip` components are used to display detailed information on hover over events.
   - **Client-Side Filtering/Sorting**: No explicit client-side filtering or sorting logic is implemented within this component. It relies on the `events` and `resources` props being supplied as needed.
   - **Helper Functions/Utilities**:
     - `hasEventsChanged()`: An internal function within the event update `useEffect` hook. It compares the current `events` prop with a cached version (`prevEventsRef.current`) to determine if a re-render/refresh of calendar events is necessary. Uses `createEventSignature` for comparison.
     - `createEventSignature(event)`: Helper within `hasEventsChanged` to generate a simplified string representation of an event for comparison purposes.
     - `handleDatesSet(info)`: A FullCalendar callback that is used to notify the parent component of date range changes (`onDateChange`) and view type changes (`onViewChange`).

### 6. Decoupling & Reusability Assessment
   - **Logic-UI Coupling**:
     - Data fetching and core CRUD logic are well-decoupled, as these responsibilities are delegated to the parent component through props and callbacks.
     - The `renderEventContent` function is, by its nature, tightly coupled with the UI presentation (specific MUI components, styling logic, view-dependent rendering choices). This is typical for such rendering functions.
     - The `useEffect` hooks for event updates and day view styling are specific to this component's rendering lifecycle and current UI needs.
   - **Reusable Functions/Hooks**:
     - The pattern of using callbacks for event interactions (`onEventDrop`, `onEventClick`, etc.) promotes reusability of the parent component's handling logic.
     - The `renderEventContent` function, while specific, demonstrates a pattern for custom event rendering that could be adapted. The core logic for deriving colors from status could be extracted if similar logic is needed elsewhere.
   - **Refactoring Needs (for new UI design)**:
     - The `renderEventContent` function will require a complete rewrite or significant modification to align with the new design specifications (e.g., using specified Material UI icons, new layout for event cards, implementing progressive disclosure).
     - The FullCalendar configuration options (e.g., `headerToolbar`, `views`, `slotMinTime`, `slotMaxTime`) may need adjustments based on the `newCalendarDesign.md`.
     - The custom `useEffect` for day view styling (`.fc-resourceTimeGridDay-view .fc-event`) might become obsolete or need substantial changes depending on the robustness and styling of the new event card components.
     - The custom event comparison logic (`hasEventsChanged`) should be reviewed. If the new event objects are simpler or if FullCalendar's default change detection is sufficient, this custom logic might be simplified or removed. If not, it needs to be maintained or adapted.
   - **Potential Integration Challenges/Risks**:
     - Ensuring the new `renderEventContent` correctly interprets all existing `extendedProps` (like `status`, `task_type`) and applies the new design's styling and information hierarchy accurately.
     - The existing CSS file (`productionSchedulerCalendar.css`) needs careful review, as its styles might conflict with or override the new Material UI-based component styling. It may need to be significantly refactored or removed.
     - Maintaining the performance of event rendering and updates, especially if the new event cards are more complex.

### 7. Key Dependencies & Props
   - **Main Props Received**: 
     - `events`: Array of production tasks/schedules.
     - `resources`: Array of staff resources.
     - `currentDate`: Initial date for the calendar to display.
     - `currentView`: Initial view for the calendar (e.g., 'dayGridMonth').
     - `onDateChange`: Callback for date navigation.
     - `onEventDrop`: Callback for drag-and-drop rescheduling.
     - `onEventClick`: Callback for clicking on a production task.
     - `eventResize`: Callback for resizing a production task.
     - `onEventReceive`: Callback for external event drops.
     - `onDateClick`: Callback for clicking on a date.
     - `onViewChange`: Callback for view type changes.
     - `calendarRef`: Optional ref to access FullCalendar API from parent.
   - **External Module/Service Dependencies**: 
     - `@fullcalendar/react` and associated plugins.
     - `@mui/material` and `@mui/material/styles`.
     - `./productionSchedulerCalendar.css`: Local CSS file for additional styling.

## II. Task Scheduler Calendar (`TaskSchedulerCalendar.jsx` - Cleaning Calendar)

### 1. Component Overview
   - **File Path**: `frontend/src/components/calendar/TaskSchedulerCalendar.jsx` (Actual path in project: `/Users/thecasterymedia/Desktop/PORTFOLIO/SaaS/cleantrac_cleaning_schedule/frontend/src/components/calendar/TaskSchedulerCalendar.jsx`)
   - **Primary Purpose**: Displays and manages cleaning tasks, assigning them to staff resources and visualizing them across different calendar views.
   - **Key Libraries Used**:
     - FullCalendar: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/resource-timegrid`, `@fullcalendar/resource-timeline`, `@fullcalendar/interaction`. (Specific versions not available from import statements).
     - Material UI: `@mui/material` (Components: `Box`, `Typography`), `@mui/material/styles` (`useTheme`). (Specific version not available).
     - Date library: No explicit date manipulation library imported; FullCalendar handles date functionalities.
     - State management: Relies on React's local state (`useRef` for calendar instance). Data (`events`, `resources`) and state modifications are primarily handled by the parent component (`ManagerDashboardPage`) via props and callbacks.

### 2. Data Fetching & State Management
   - **Data Fetching Mechanism**: This component receives `events` and `resources` as props, presumably fetched by its parent component (`ManagerDashboardPage`).
   - **API Endpoints Consumed**: None directly. API interactions are handled by the parent.
   - **Data Structure (Received & Expected by FullCalendar)**:
     - `events`: Array of event objects, expected to conform to FullCalendar's structure, including `id`, `title`, `start`, `end`, `resourceId`, and `extendedProps`. `extendedProps` contains fields like `status` and `priority`.
     - `resources`: Array of resource objects (e.g., staff), likely with at least `id` and a displayable title.
   - **Local/Component State Management**:
     - `localCalendarRef = useRef(null)`: Used if an external `calendarRef` is not provided.
     - `effectiveRef = calendarRef || localCalendarRef`: Determines the ref for the FullCalendar instance.

### 3. Backend Interaction Logic (CRUD Operations)
   - This component is primarily presentational for CRUD, delegating actions to the parent via callbacks.
   - **Create Events**: Initiated via `onDateClick` (parent likely opens a creation modal) or `onEventReceive` (for external draggable events).
   - **Update Events (Drag & Drop, Edit Modal)**:
     - `onEventDrop`: Callback for drag-and-drop rescheduling.
     - `eventResize`: Callback for event resizing.
     - `onEventClick`: Callback for event clicks, likely used by the parent to open an edit modal. Also includes logic to switch to `resourceTimeGridDay` view if an event is clicked in `dayGridMonth` view.
   - **Delete Events**: No specific delete callback. Likely handled by the parent via an edit modal triggered by `onEventClick`.
   - **Payload Structures**: Passes FullCalendar's argument objects directly in callbacks. The parent transforms these for API requests.

### 4. Event Rendering & Customization
   - **`eventContent` Rendering**: A custom function `renderEventContent(eventInfo)` controls event appearance.
     - Uses MUI `Box` and `Typography` for styling.
     - Dynamic styling (background, text, border colors) based on `eventInfo.event.extendedProps.status` ('completed', 'pending_review', 'pending'). Colors from `theme.palette`.
     - Displays event `title`, `timeText`, and `priority` (if available).
     - Applies text decoration (`line-through`) for 'completed' tasks.
   - **Status-Based Styling Logic**: Yes, within `renderEventContent` using a `switch` statement on `status`.
   - **Other Custom Rendering Logic**:
     - FullCalendar options: `resourceAreaHeaderContent="Staff"`, `height="100%"` (within a `Box` of `75vh`).
     - `headerToolbar` configured for navigation and view switching.
     - Initial view set to `resourceTimelineWeek`.

### 5. Client-Side Business Logic
   - **Validation Rules**: None apparent within this component.
   - **Event Interaction Handling (Click, Hover)**:
     - Click: `onEventClick` callback. Special logic: if in `dayGridMonth` view, it switches to `resourceTimeGridDay` for the clicked event's date.
     - Hover: No explicit hover effects like tooltips are defined in `renderEventContent` for this calendar, unlike `ProductionSchedulerCalendar`.
   - **Client-Side Filtering/Sorting**: None implemented in this component.
   - **Helper Functions/Utilities**:
     - `handleDatesSet(dateInfo)`: FullCalendar callback used to notify the parent (`onDateChange`) of date navigation or view changes, passing `dateInfo.view.activeStart`.

### 6. Decoupling & Reusability Assessment
   - **Logic-UI Coupling**:
     - Data fetching and CRUD logic are well-decoupled (handled by parent).
     - `renderEventContent` is tightly coupled with UI presentation (MUI components, styling), which is typical.
     - The view-switching logic within `onEventClick` is a piece of UI behavior specific to this component's current interaction design.
   - **Reusable Functions/Hooks**:
     - Callback pattern promotes reusability of parent's handling logic.
     - `renderEventContent` structure could be adapted.
   - **Refactoring Needs (for new UI design)**:
     - `renderEventContent` will need a complete rewrite/significant modification for the new design (Material UI icons, new card layout, progressive disclosure).
     - FullCalendar configuration (`headerToolbar`, `views`) may need adjustments.
     - The view-switching logic in `onEventClick` might need review based on new interaction patterns.
   - **Potential Integration Challenges/Risks**:
     - Ensuring new `renderEventContent` correctly uses `extendedProps` (`status`, `priority`, and any new ones like `task_type` if cleaning tasks get more diverse) for the new design.
     - No specific local CSS file is imported, reducing risk of CSS conflicts compared to `ProductionSchedulerCalendar`, but global styles could still interact.

### 7. Key Dependencies & Props
   - **Main Props Received**:
     - `events`: Array of task events.
     - `resources`: Array of staff resources.
     - `currentDate`: Initial date for display.
     - `onDateChange`: Callback for date navigation.
     - `onEventDrop`: Callback for event drop.
     - `onEventClick`: Callback for event click.
     - `eventResize`: Callback for event resize.
     - `onEventReceive`: Callback for external event drops.
     - `onDateClick`: Callback for date click.
     - `calendarRef`: Optional ref for FullCalendar API access.
   - **External Module/Service Dependencies**:
     - `@fullcalendar/react` and associated plugins.
     - `@mui/material` and `@mui/material/styles`.

## III. General Observations & Recommendations

- Common patterns or libraries used across both calendars.
- Overall assessment of code quality and maintainability in relevant sections.
- Recommendations for refactoring shared logic.
- Strategy for integrating the new UI components.
