# Component: CalendarRightSidebar

## Status:
- [ ] Not Started
- [ ] In Progress
- [x] Completed
- [ ] Blocked

## Key Props:
- `isOpen`: (boolean) Controlled by `CalendarPageLayout`.
- `onToggle`: (function) Callback to request a toggle (e.g., from a collapse button within the sidebar).
- `resourceFilterContent`: (ReactNode)
- `quickActionsContent`: (ReactNode)
- `legendContent`: (ReactNode)

## State Management:
- (Primarily layout, `isOpen` is a prop).

## Development Notes:
- The main container for the right-hand sidebar.
- Originally included Quick Actions, Scheduled Tasks, Filter by Staff, and Legend sections.
- 2025-06-13: Removed **Filter by Staff** and **Legend** sections per UX feedback. Scheduled Tasks area now uses `flex:1` to fill freed space.

## Related Design Documents:
- `calendar_component_specifications.md`
- `high_fidelity_calendar_design_proposal.md`
- `newCalendarDesign.md`
