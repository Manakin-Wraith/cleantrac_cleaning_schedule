# Component: ResourceFilterList

## Status:
- [ ] Not Started
- [ ] In Progress
- [ ] Completed
- [ ] Blocked

## Key Props:
- `resources`: (Array<{id: string, name: string, color?: string}>) List of available resources.
- `selectedResourceIds`: (Array<string>) IDs of currently selected/visible resources.
- `onResourceSelectionChange`: (function(resourceId: string, isSelected: boolean)) Callback.
- `onSelectAllResources`: (function, optional)
- `onClearAllResources`: (function, optional)

## State Management:
- `searchTerm`: (string) For filtering the list of resources locally.

## Development Notes:
- Displays staff/resources with checkboxes/toggles to filter events on the calendar.
- Search/filter within the list if extensive.
- Resides within `CalendarRightSidebar`.

## Related Design Documents:
- `calendar_component_specifications.md`
- `high_fidelity_calendar_design_proposal.md`
- `newCalendarDesign.md`
