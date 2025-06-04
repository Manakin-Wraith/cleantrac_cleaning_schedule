# Production Scheduling Feature: Task Checklist

This checklist tracks the development progress for the Production Scheduling feature.

## Phase 1: Basic Setup & API Integration (Modal Dropdowns)

- [X] Integrate API for Recipes in `ProductionEditTaskModal`
- [X] Integrate API for Staff (Users) in `ProductionEditTaskModal`
- [X] Integrate API for Production Lines in `ProductionEditTaskModal`
- [X] Add loading and error states for dropdowns in `ProductionEditTaskModal`

## Phase 2: Calendar View & Core Functionality

- [X] Add route for Production Dashboard page (`App.jsx`)
- [X] Add sidebar link for Production Dashboard page (`Sidebar.jsx`)
- [ ] Verify `ProductionCalendarView` loads tasks from API (`/api/taskinstances/`)
- [ ] Test drag-and-drop functionality with backend updates
- [ ] Test task resizing functionality with backend updates
- [ ] Test opening `ProductionEditTaskModal` from calendar (for create/edit)
- [ ] Test opening `ProductionChangeStatusModal` from calendar

## Phase 3: Role-Based Dashboards

- [X] Create `ManagerProductionDashboardPage.jsx`
- [X] Create `StaffProductionDashboardPage.jsx`
- [X] Add route `/manager/production-dashboard` for managers (`App.jsx`)
- [X] Add route `/staff/production-dashboard` for staff (`App.jsx`)
- [X] Update sidebar links to point to role-specific dashboards (`Sidebar.jsx`)
- [ ] Customize `ManagerProductionDashboardPage.jsx` (Define specific features/data)
- [ ] Customize `StaffProductionDashboardPage.jsx` (Define specific features/data)

## Phase 4: Bug Fixes & Refinements

- [X] Resolve `moment` import error in `ProductionTaskSheetPrintView.jsx` (install `moment`)
- [X] Resolve `GET /api/staff/ 404` error (corrected in `ProductionScheduleFormModal.jsx` to use `/api/users/` via `getUsersByDepartment`)
- [ ] Investigate any remaining console errors or warnings.

## Phase 5: Enhancements (Future)

- [ ] Improve user feedback (e.g., use Material UI Snackbars instead of alerts)
- [ ] Add comprehensive form validation to modals
- [ ] Implement unit/integration tests
- [ ] Update/create user documentation

---
*Last Updated: {{YYYY-MM-DD}}*
