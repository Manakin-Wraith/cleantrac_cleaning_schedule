# Component: CleaningTaskEventContent (FullCalendar eventContent)

## Status:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
- [ ] Blocked

## Key Props (from eventInfo):
- `eventInfo.event`: (FullCalendar EventAPI object) Contains `id`, `title`, `start`, `end`, `resourceId`, `extendedProps` (e.g., `status`, `priority`, `task_name`, `assigned_staff_name`, `location`, `estimated_duration`, `notes_count`, `equipment_needed`).
- `eventInfo.timeText`: (string)
- `eventInfo.view`: (FullCalendar ViewAPI object)

## State Management (within rendered card):
- `isExpanded`: (boolean, default: `false`)

## Development Notes:
- A functional component passed to FullCalendar's `eventContent` prop for the `TaskSchedulerCalendar`.
- Implements the detailed card design for cleaning task events, similar to `RecipeEventContent` but tailored to cleaning task data and presentation.

## Related Design Documents:
- `calendar_card_specifications.md`
- `calendar_card_mockups.md`
- `high_fidelity_calendar_design_proposal.md`
