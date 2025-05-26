# Feature: AM/PM Staff Assignments for Temperature Checks

This document outlines the tasks required to implement designated AM/PM staff assignments for temperature checks.

## Phase 1: Clarification and Design

- [x] Clarify scope of assignments (per department, per area unit, daily roster). **Decision: Per Department.**
- [x] Clarify assignment duration and management (daily, ongoing, admin interface). **Decisions: Daily roster (can be scheduled weekly). Managed by Managers. UI: Explore integration with task scheduler (e.g., chips) or new UI if needed.**
- [x] Clarify impact on current logging workflow (strict vs. flexible assignments). **Decision: Strict (only assigned staff can log for their period/department).**
- [x] Clarify visibility for staff and managers. **Decision: Staff see assignments on `StaffTasksPage` (potentially bolder design). Managers manage via new UI/integration.**
- [x] Define backend model structure for assignments. **(Fields: date, department, am_assigned_staff, pm_assigned_staff, audit fields).**
- [ ] Define API endpoints for managing and fetching assignments.
- [ ] Design frontend UI for managing assignments (admin/manager view).
- [ ] Design frontend UI for displaying assignments to staff.

## Phase 2: Backend Implementation

- [ ] Create new Django model for `TemperatureCheckAssignment` (fields: date, department, am_assigned_staff, pm_assigned_staff, created_by, updated_by).
- [ ] Create database migrations for the new model.
- [ ] Implement Serializers for the new model.
- [ ] Implement API ViewSet for CRUD operations on assignments.
    - [ ] Endpoint for creating/updating assignments.
    - [ ] Endpoint for fetching assignments (e.g., by date, department).
    - [ ] Endpoint for staff to fetch their own assignments.
- [ ] Implement permissions for API endpoints (e.g., only managers can assign).
- [ ] Write unit tests for backend logic and API endpoints.

## Phase 3: Frontend Implementation

- [ ] Create new service functions (e.g., in `assignmentService.js`) to interact with backend assignment APIs.
- [ ] **Admin/Manager View:**
    - [ ] Create new page/component for managing AM/PM assignments.
    - [ ] Implement UI to select date, department (if applicable), and staff for AM/PM slots.
    - [ ] Implement logic to save and update assignments.
- [ ] **Staff View (`StaffTasksPage.jsx` / `TemperatureLoggingSection.jsx`):
    - [ ] Fetch and display current AM/PM assignments relevant to the logged-in staff member.
    - [ ] If logging is restricted, implement logic to check if the current user is the assigned AM/PM checker before allowing log submission for that period.
    - [ ] Potentially adjust UI in `TemperatureLoggingSection` based on assignments (e.g., highlighting, warnings).
- [ ] Write component tests for new frontend components.

## Phase 4: Testing and Refinement

- [ ] End-to-end testing of the assignment and logging workflow.
- [ ] Gather user feedback and make necessary adjustments.
- [ ] Update any relevant documentation.

## Open Questions (from Cascade to USER):

1.  ~~Scope of Assignment: Per department, per area unit, or general daily duty?~~
    - **Answered: Per Department.**
2.  ~~Assignment Duration & Management: Daily or ongoing? Who manages? New UI needed?~~
    - **Answered: Daily roster (can be scheduled weekly). Managed by Managers. UI: Explore integration with task scheduler (e.g., chips) or new UI if needed.**
3.  ~~Impact on Logging: Strict (only assigned can log) or flexible (others can still log)?~~
    - **Answered: Strict (only assigned staff can log).**
4.  ~~Visibility for Staff: How should staff see these assignments?~~
    - **Answered: Staff see assignments on `StaffTasksPage` (potentially bolder design).**
