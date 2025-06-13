# Component: ScheduleListPanel

## Status
- [x] Completed

## Purpose
Sidebar list that displays scheduled cleaning and production (recipe) tasks with a toggle for All / Cleaning / Production.

## Key Features
- Segmented `ToggleButtonGroup` showing counts per type.
- Scrollable `List` of tasks with status icons.
- Stacked secondary text showing date range and assigned staff.
- Click row => scroll calendar and open appropriate modal via `handleListRowClick`.
- Accessible: keyboard friendly, `aria-label`s via MUI components.

## Props
- `onRowClick (function)`: callback when a row is clicked.

## Context Dependencies
Uses `useSchedule()` from `ScheduleContext` to get `visibleEvents`, filter state, and counts.

## Recent Changes (2025-06-13)
- Added robust title and assignee resolvers to support varied API shapes.
- Added vertical stacking of date & staff lines (`Stack`).
- Fixed hydration warning by setting `disableTypography` on `ListItemText`.

## Testing
- Verified 14 cleaning + 10 production events render with correct names.
- Verified toggle updates list instantly.
- Confirmed clicking list item highlights calendar event and opens modal.

---

