# Frontend Development Task Checklist

## Production Scheduling Feature

### Component Renaming & Organization
- [x] Rename `TaskDetailModal.jsx` in `ProductionScheduling` to `ProductionTaskDetailModal.jsx`
- [x] Update imports for `ProductionTaskDetailModal.jsx`
- [x] Delete old `TaskDetailModal.jsx` from `ProductionScheduling`
- [x] Rename `ChangeStatusModal.jsx` to `ProductionChangeStatusModal.jsx` and update imports
- [x] Rename `EditTaskModal.jsx` to `ProductionEditTaskModal.jsx` and update imports
- [x] Rename `TaskSheetPrintView.jsx` to `ProductionTaskSheetPrintView.jsx` and update imports
- [x] Delete old `ChangeStatusModal.jsx`, `EditTaskModal.jsx`, and `TaskSheetPrintView.jsx`

### Core Functionality
- [x] Implement Print Task Sheet functionality (`TaskSheetPrintView.jsx`, `react-to-print`)
- [x] Implement basic Drag-and-Drop for tasks (Ported to `TaskSchedulerCalendar` in Manager/Staff dashboards with mock handlers)

### Calendar Component Refactor & Cleanup
- [x] Replace `ProductionCalendarView` (react-big-calendar) with `TaskSchedulerCalendar` (FullCalendar) in `ManagerProductionDashboardPage.jsx`
- [x] Implement mock data fetching and handlers for `TaskSchedulerCalendar` in `ManagerProductionDashboardPage.jsx`
- [x] Replace `ProductionCalendarView` (react-big-calendar) with `TaskSchedulerCalendar` (FullCalendar) in `StaffProductionDashboardPage.jsx`
- [x] Implement mock data fetching and handlers for `TaskSchedulerCalendar` in `StaffProductionDashboardPage.jsx`
- [x] Delete unused `ProductionCalendarView.jsx` component
- [x] Remove `react-big-calendar` dependency (by removing usage and component)
- [x] Delete unused generic `ProductionDashboardPage.jsx`
- [x] Remove import of generic `ProductionDashboardPage.jsx` from `App.jsx`

### Next Steps / To-Do
- [ ] **API Integration**
  - [ ] Persist scheduling changes from drag-and-drop to backend
  - [ ] Connect save operations in `ProductionEditTaskModal` to API
  - [ ] Connect status changes in `ProductionChangeStatusModal` to API
  - [ ] Fetch real data for tasks, recipes, staff, production lines instead of mock data
- [ ] **UX and Validation**
  - [ ] Add form validation and error handling in `ProductionEditTaskModal`
  - [ ] Add form validation and error handling in `ProductionChangeStatusModal`
  - [ ] Improve user feedback on save/update/status change operations (e.g., success/error notifications)
  - [ ] Confirmation dialogs for critical drag-and-drop actions (optional)
- [ ] **UI Enhancements**
  - [ ] Refine drag-and-drop (e.g., visual feedback, restrictions based on more complex rules)
  - [ ] Ensure `ProductionTaskSheetPrintView` uses real data and is well-formatted for printing
- [ ] **Testing**
  - [ ] Unit tests for new/modified components
  - [ ] Integration tests for scheduling and task management flows
- [ ] **Documentation**
  - [ ] Update developer documentation for new components and conventions
  - [ ] Update user documentation for new UI workflows

## General
- [ ] Review and refactor mock data usage
- [ ] Ensure consistent error handling across the application
- [ ] Accessibility review (A11y)
