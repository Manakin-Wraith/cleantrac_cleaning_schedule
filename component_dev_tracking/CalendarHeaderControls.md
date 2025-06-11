# Component: CalendarHeaderControls

## Status:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
- [ ] Blocked

## Key Props:
- `currentDate`: (Date) The currently selected date.
- `currentView`: (string) The current FullCalendar view name (e.g., 'dayGridMonth').
- `onNavigate`: (function(action: 'prev' | 'next' | 'today' | Date)) Callback for date navigation.
- `onViewChange`: (function(viewName: string)) Callback for view selection.
- `onToggleFilters`: (function) Callback to toggle the `CollapsibleFiltersDisplay`.
- `availableViews`: (Array<{name: string, label: string}>, default: `[{name: 'dayGridMonth', label: 'Month'}, ...]`) 

## State Management:
- (Likely minimal, mostly controlled by props and parent state for date/view).

## Development Notes:
- Renders the content within the main `AppBar` specific to the calendar views (Date Navigation, Current Period, View Selectors, Filters Toggle).

## Related Design Documents:
- `calendar_component_specifications.md`
- `high_fidelity_calendar_design_proposal.md`
- `newCalendarDesign.md`
