# Task Checklist: Implementing Drag-and-Drop Scheduling

## Objective
Enable drag-and-drop functionality for scheduling tasks by allowing users to drag cleaning items onto staff members in the `resourceTimelineWeek` view of the calendar.

## Core Requirements
- [x] Display a list of available "Cleaning Items" that can be dragged.
- [x] Make these "Cleaning Items" draggable using FullCalendar's interaction plugin.
- [x] Configure the calendar (`TaskSchedulerCalendar.jsx`) to receive these draggable items (`eventReceive` callback).
- [x] Implement a handler (`handleEventReceive` in `ManagerDashboardPage.jsx`) for when a cleaning item is dropped onto the calendar.
- [x] The handler should extract necessary information:
    - [x] Cleaning Item ID
    - [x] Staff Member ID (from the resource it was dropped on)
    - [x] Date of drop
    - [x] Time of drop (start time)
    - [x] Calculate end time based on cleaning item's default duration.
- [x] Pre-fill and open the "Create New Task" modal with the extracted information.
- [x] Ensure the temporary event placed by FullCalendar on drop is removed, as the modal handles final task creation.

## UI/UX Considerations
- [x] Clearly indicate draggable items.
- [x] Provide visual feedback during drag and drop. (FullCalendar handles much of this)
- [x] Ensure the "Create New Task" modal is intuitive with pre-filled data.

## Testing
- [ ] Verify that dragging a cleaning item onto a staff member on a specific date/time opens the "Create New Task" modal.
- [ ] Confirm the modal is correctly pre-filled with:
    - [ ] Correct Cleaning Item.
    - [ ] Correct Assigned Staff Member.
    - [ ] Correct Due Date.
    - [ ] Correct Start Time.
    - [ ] Correct End Time (calculated from default duration).
- [ ] Test task creation via this drag-and-drop flow.
- [ ] Verify the task appears correctly on the calendar for the assigned staff member and date/time after creation.
- [ ] Test edge cases:
    - [ ] Dropping on a day without a specific time slot (if applicable).
    - [ ] Cleaning items with and without default durations.
    - [ ] Cancelling the "Create New Task" modal (ensure no temporary event remains).

## Task Calendar Issues Checklist

1.  [x] Fix MUI `Select` component warning for `assigned_to_id` in `CreateNewTaskModal` when triggered by drag-and-drop.
    *   Status: Addressed.
2.  [x] Pre-populate "Create New Task" modal with assignee, date, and time on drag-and-drop.
    *   Status: Confirmed working.
3.  [ ] Investigate and fix "Unknown Item" display for tasks on the calendar.
    *   Sub-task: Verify `cleaning_item_id` is correctly populated in fetched tasks (AWAITING LOGS: `Inspecting first fetched task raw structure...` from `fetchManagerData`).
    *   Sub-task: Verify `cleaning_item_id` and `assigned_to_id` in `departmentTasks` (AWAITING LOGS: `Inspecting first task from departmentTasks during calendar event mapping...`).
    *   Sub-task: Verify `getItemName` and `getStaffName` function logic and their usage in calendar event rendering.
4.  [x] Ensure tasks retain the correct date after drag-and-drop actions and do not default to "today".
    *   Status: Confirmed working.
5.  [x] Investigate and fix `TaskDetailModal` receiving `null` or `undefined` task prop when an event is clicked.
    *   Status: Resolved. TaskDetailModal correctly receives task data when an event is clicked and the modal opens. Console logging within TaskDetailModal is now conditional on its `open` state, eliminating previous extraneous logs when the modal was closed and tabs were switched.
6.  [ ] Ensure correct cleaning item and staff member names are displayed on calendar events instead of "Unknown Item" after creation/update.
7.  [x] Fix "Task List" tab displaying the calendar instead of the task list.
    *   Status: Conditional rendering for tabs is working. "Scheduler" tab shows calendar, "Task List" tab shows placeholder. Actual content for task list view pending USER implementation.
8.  [x] Investigate and fix "No scheduled tasks displaying on calendar".
    *   Status: Corrected `staffName` and `resourceId` mapping. Added `due_date` filter to `fetchManagerData`. Tasks display correctly when the correct date is selected/navigated to. `getStaffName` confirmed working.
9.  [x] Investigate and fix `TaskDetailModal` receiving `null` or `undefined` task prop when an event is clicked.
    *   Status: Resolved. TaskDetailModal correctly receives task data when an event is clicked and the modal opens. Console logging within TaskDetailModal is now conditional on its `open` state, eliminating previous extraneous logs when the modal was closed and tabs were switched.

## Code Implementation
- **`ManagerDashboardPage.jsx`**
    - [x] Import `Draggable` from `@fullcalendar/interaction` and `useRef`.
    - [x] Set up a ref for the external events container.
    - [x] `useEffect` to initialize `Draggable` on the cleaning items list.
    - [x] Render the draggable cleaning items list.
    - [x] Implement `handleEventReceive` function.
    - [x] Pass `handleEventReceive` to `TaskSchedulerCalendar`.
- **`TaskSchedulerCalendar.jsx`**
    - [x] Accept `onEventReceive` prop.
    - [x] Pass `onEventReceive` to FullCalendar's `eventReceive` option.

## Follow-up / Future Enhancements
- [ ] Consider a collapsible sidebar for cleaning items or other controls (as per USER's broader goals).
- [ ] Refine styling of draggable items and drop zones.
