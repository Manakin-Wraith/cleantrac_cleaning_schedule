# Component: RecipeEventContent (FullCalendar eventContent)

## Status:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
- [ ] Blocked

## Key Props (from eventInfo):
- `eventInfo.event`: (FullCalendar EventAPI object) Contains `id`, `title`, `start`, `end`, `resourceId`, `extendedProps` (e.g., `status`, `task_type`, `recipe_name`, `batch_size`, `yield_unit`, `isPlaceholder`, `description`, `isExternal`, `assigned_staff_name`, `priority_level`, `completion_percentage`, `notes_count`, `subtasks_total`, `subtasks_completed`).
- `eventInfo.timeText`: (string) Formatted time string.
- `eventInfo.view`: (FullCalendar ViewAPI object)

## State Management (within rendered card):
- `isExpanded`: (boolean, for progressive disclosure, default: `false`)
- `showTooltip`: (boolean, if custom tooltip logic is needed beyond MUI's default)

## Development Notes:
- A functional component passed to FullCalendar's `eventContent` prop for the `ProductionSchedulerCalendar`.
- Implements the detailed card design from `calendar_card_specifications.md` and `calendar_card_mockups.md` for recipe events, including Material UI icons, progressive disclosure, and status-based styling.

## Related Design Documents:
- `calendar_card_specifications.md`
- `calendar_card_mockups.md`
- `high_fidelity_calendar_design_proposal.md`
