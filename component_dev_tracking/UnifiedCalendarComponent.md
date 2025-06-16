# Component: UnifiedCalendarComponent

## Status
- [ ] Not Started
- [ ] In Progress
- [x] Completed (current iteration)
- [ ] Blocked

## Key Props
- `events`, `resources`: Arrays consumed by FullCalendar.
- `currentDate`, `currentView`: Controlled props for navigation/view.
- `onDateChange`, `onViewChange`, `onEventClick`, etc.: Callback hooks wired to parent.

## Development Notes
- 2025-06-16: Added dynamic `dayMaxEvents` / `dayMaxEventRows` – 2 for `dayGrid` (month) and 1 for `timeGrid` (week/day).
- 2025-06-16: Added `eventMaxStack={1}` for `timeGrid` views to enforce a single chip per slot; excess chips now roll into the “+N more” pop-over.
- 2025-06-16: Works with new compact `EventChip` design; `compact` prop triggered for `timeGrid*` views.
- 2025-06-16: Calendar now fills full horizontal space thanks to layout padding removal.

## Related Design Docs
- `calendar_component_specifications.md`
- `calendar_overhaul_plan.md`

