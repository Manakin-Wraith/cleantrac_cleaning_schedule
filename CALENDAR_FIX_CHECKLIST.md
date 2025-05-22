# Calendar Fix Checklist

## I. Addressing Task Visibility and Duplication Issues

- **[ ] Eliminate Duplicate Tasks in Month View**
    - [ ] Review and refine logic in `handleEventReceive` to ensure placeholder events are correctly removed after task creation. (Note: `handleEventReceive` creates placeholders; primary removal logic is in `handleCreateTaskSubmit` and `handleCloseCreateTaskModal`)
    - [x] Review and refine logic in `handleCreateTaskSubmit` to ensure placeholder events are correctly removed after task creation.
- **[x] Ensure Consistent Task Visibility Across All Views (Month, Week, Day)**
    - [x] Verify that all tasks (newly created and existing) have explicit `start` and `end` times. (Addressed by current event mapping logic: defaults are applied if times are missing)
    - [x] Confirm tasks are marked as non-all-day events (e.g., `allDay: false` or ensure time is set). (Addressed by current event mapping logic: `allDay: false` is set explicitly)
    - [ ] Investigate why tasks might appear in month view but not in week/day views (if issue persists after above checks).
    - [ ] Ensure `fetchManagerData` correctly merges local and server tasks without loss, especially on view changes or refreshes.
- **[ ] Robust Data Handling and Synchronization**
    - [ ] Review the merging logic in `fetchManagerData` (or equivalent function) to ensure `localTasks` and server-fetched tasks are combined correctly without causing duplicates or missing updates.
    - [ ] Ensure changes made to tasks (creation, update, deletion) are consistently reflected in the backend database.
    - [ ] Verify that fetching tasks from the server updates the calendar view correctly, integrating any local changes smoothly.
- **[ ] Holistic Review and Refinement**
    - [ ] Conduct a thorough review of state updates related to tasks and calendar re-rendering.
    - [ ] Identify and minimize any UI flickering during task operations.
    - [ ] Ensure the calendar accurately represents the current state of tasks at all times.

## II. Task Visibility Checklist

- [x] Investigated `handleEventDrop` in `ManagerDashboardPage.jsx`: Frontend correctly identifies `assigned_to_id` during drag-and-drop.
- [x] Investigated `updateTaskInstance` in `taskService.js`: Modified to ensure `assigned_to: <id>` is sent to the backend for updates.
- [x] Console logs (`resource=undefined`) indicated that `task.assigned_to` was `null` or `undefined` in the `departmentTasks` data fetched from the backend API (`GET /api/taskinstances/`) after a page refresh.
- [x] **Investigated Backend API Response:** User inspected raw JSON from `GET /api/taskinstances/`. Found that assigned user data is nested: `task.assigned_to_details.id` contains the `User.id` (e.g., 5), not `task.assigned_to` directly.
- [x] **Frontend Mapping Logic Updated:** Modified `ManagerDashboardPage.jsx` to correctly derive `resourceId` for FullCalendar by:
    - Checking `task.assigned_to_details.id` (User ID from backend).
    - Finding the corresponding `staffUser` in `staffUsers` (where `staffUser.id` matches `task.assigned_to_details.id`).
    - Using that `staffUser.profile.id` as the calendar `resourceId`.
    - Fallback to `task.assigned_to` (profile ID from local state) if `assigned_to_details` is not present.
- [x] **Task Assignment Persistence Resolved:** User confirmed tasks now persist correctly under assigned staff members in all calendar views after page refreshes.
- [x] **Removed "Unassigned" Column:** Modified `ManagerDashboardPage.jsx` to remove the "Unassigned" resource from `calendarResources`, so it no longer appears in week/day views. Ensured `staff.profile.id` is consistently used for resource IDs.
- [ ] **Next: User Testing & Final Review**
    - User to confirm "Unassigned" column is no longer visible in week/day views.
    - User to check console logs for any new warnings or errors, particularly `[CalendarMap]` or resource-related messages.
    - If issues persist, and `staffUser.profile.id` is not being correctly found/used, review the `staffUsers` state and `calendarResources` prop to ensure they are correctly populated with `profile.id`s that match what `resourceIdForCalendar` resolves to.
- [ ] Ensure tasks without start/end times are consistently assigned default times to appear in week/day views (already partially addressed).
- [ ] Final testing: Task creation, drag-and-drop assignment, refresh persistence in all views (month, week, day).
