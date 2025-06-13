# Component: TaskDrawer

## Status
- [x] MVP Implemented (read-only + edit/delete buttons)

## Purpose
Slide-in drawer from the right that shows details of a Cleaning or Recipe task when a list row is clicked. Offers quick Edit and Delete actions while keeping the calendar visible.

## Key Features (Phase 1)
- Anchored right `Drawer` (480 px desktop, full-width mobile).
- Displays: title, schedule range, assignee, batch/unit (recipes), notes.
- Header with close icon and status badge placeholder.
- Action buttons:
  - **Edit** — opens existing assignment modal depending on task type.
  - **Delete** — placeholder toast until API hook ready.
- Optimistic: shows immediately with list item data; background fetch integration planned.

## Props
| Name | Type | Description |
| --- | --- | --- |
| `open` | `bool` | Whether the drawer is visible. |
| `onClose` | `func` | Close callback. |
| `task` | `object` | Task object (cleaning or recipe). |
| `onEdit` | `func` | Called when Edit clicked. |
| `onDelete` | `func` | Called when Delete clicked. |

## Integration Notes (2025-06-13)
- `UnifiedCalendarPage` manages `selectedTask` and `drawerOpen` state.
- `ScheduleListPanel` row click now sets task + opens drawer.
- Drawer Edit routes to existing assignment modals; Delete emits info toast until implemented.

## Next Steps (Phase 2)
- Replace modals with inline **Edit** tab + auto-save inside drawer.
- Add status toggle (Complete/Re-open) and duplicate action.
- Audit trail section.
- Confirm mobile behaviour and animation polish.

---
