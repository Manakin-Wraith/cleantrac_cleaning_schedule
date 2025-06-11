# Component: CalendarRightSidebar

## Status:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
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
- The main container for the new right-hand sidebar.
- Manages its own collapsed/expanded state and layout for its child sections.

## Related Design Documents:
- `calendar_component_specifications.md`
- `high_fidelity_calendar_design_proposal.md`
- `newCalendarDesign.md`
