# Component: CalendarPageLayout

## Status:
- [ ] Not Started
- [ ] In Progress
- [x] Completed
- [ ] Blocked

## Key Props:
- `children`: (ReactNode) Likely to render the FullCalendar instance or main content.
- `headerContent`: (ReactNode) Content to be rendered in the header/AppBar area (could be `CalendarHeaderControls`).
- `sidebarContent`: (ReactNode) Content for the right sidebar (could be `CalendarRightSidebar`).
- `filtersBarContent`: (ReactNode, optional) Content for the collapsible filters bar.
- `initialSidebarOpen`: (boolean, default: `true`)
- `initialFiltersBarOpen`: (boolean, default: `false`)

## State Management:
- `isSidebarOpen`: (boolean) To control the visibility of the right sidebar.
- `isFiltersBarOpen`: (boolean) To control the visibility of the filters bar.

## Development Notes:
- Manages the overall page structure: Header, optional Filters Bar, Main Content Area (for FullCalendar), and the new Right Sidebar.
- Handles the open/closed state of the sidebar and filters bar.

## Related Design Documents:
- `calendar_component_specifications.md`
- `high_fidelity_calendar_design_proposal.md`
- `newCalendarDesign.md`
