# UI Theming & Consistency Enhancement Checklist

## Phase 1: Setup & Core Theming
- [x] Analyze existing UI and identify inconsistencies
- [x] Research Material-UI theming best practices (via MCP)
- [ ] Create `theme.js` with initial palette, typography, shape, and basic component overrides.
- [ ] Update `main.jsx` to use `ThemeProvider` and `CssBaseline` with the new theme.
- [ ] Review global CSS (`index.css`) and remove redundant/conflicting styles.

## Phase 2: Component Standardization
- [ ] **Modals**:
  - [ ] Define standard modal structure (e.g., `BaseModal.jsx`).
  - [ ] Refactor existing modals (`TaskDetailModal`, `UserFormModal`, etc.) to use `BaseModal` or apply consistent theme styling.
  - [ ] Ensure consistent header, content, and action sections.
  - [ ] Standardize modal sizing and responsiveness.
- [ ] **Forms**:
  - [ ] Define standard form layout (e.g., `FormContainer.jsx`).
  - [ ] Style form elements (`TextField`, `Button`, `Select`) consistently via theme overrides or common props.
  - [ ] Ensure consistent spacing and alignment within forms.
- [ ] **Buttons**:
  - [ ] Ensure all buttons use theme colors and styles (primary, secondary, error).
  - [ ] Verify consistent padding, border-radius, and text transformation.
- [ ] **Cards & Paper Elements**:
  - [ ] Apply consistent `borderRadius` and `boxShadow` via theme.
  - [ ] Standardize padding and margins for card content.
- [ ] **Tables/Lists**:
  - [ ] Review styling for tables and lists for consistency.
  - [ ] Ensure proper spacing and typography.
- [ ] **Navigation (Sidebar, HeaderBar)**:
  - [ ] Ensure `HeaderBar` uses themed `AppBar` styles.
  - [ ] Ensure `Sidebar` elements (ListItems, Icons) are themed consistently.

## Phase 3: Page Layouts & Content
- [ ] Review all pages for consistent layout (padding, margins, content alignment).
- [ ] Ensure typography (headings, body text) is consistent across all pages.
- [ ] Check for consistent use of spacing units (e.g., `theme.spacing()`).

## Phase 4: Polish & Documentation
- [ ] Create/Update `STYLE_GUIDE.md` with defined colors, typography, spacing, and component examples.
- [ ] Test UI across different screen sizes and devices.
- [ ] Perform accessibility check (WCAG contrast, keyboard navigation).
- [ ] Gather feedback and iterate on theme and component styles.

## Specific Components/Pages to Review:
- [ ] `HeaderBar.jsx`
- [ ] `Sidebar.jsx`
- [ ] `PageLayout.jsx`
- [ ] `TaskDetailModal.jsx`
- [ ] `UserFormModal.jsx`
- [ ] `DepartmentFormModal.jsx`
- [ ] `ItemFormModal.jsx`
- [ ] `EditTaskAssignmentModal.jsx`
- [ ] `LoginPage.jsx`
- [ ] `ManagerDashboardPage.jsx`
- [ ] `UserManagementPage.jsx` (and other management pages)
- [ ] `TaskSchedulerCalendar.jsx`
- [ ] `TemperatureLoggingSection.jsx` and related thermometer components
