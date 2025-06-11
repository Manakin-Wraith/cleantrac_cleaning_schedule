# Legacy Component & Asset Deprecation Plan

This document tracks components, files, and assets that are expected to be deprecated, significantly refactored, or removed as part of the new calendar redesign project.

## Guiding Principles:
- Ensure no dead code remains post-redesign.
- Clearly identify replacements for deprecated functionalities.
- Update any dependent components or import paths.

## Items for Deprecation/Refactoring:

### 1. Core Calendar Components (Heavy Refactoring - UI Rendering Replaced)

*   **File**: `frontend/src/components/recipes/ProductionSchedulerCalendar.jsx`
    *   **Legacy Part**: Current `renderEventContent` function and associated custom styling logic within the component.
    *   **Replacement**: New `RecipeEventContent` component for event rendering; integration into `CalendarPageLayout`.
    *   **Notes**: FullCalendar configuration for `headerToolbar` and other UI aspects may be simplified or removed.

*   **File**: `frontend/src/components/calendar/TaskSchedulerCalendar.jsx`
    *   **Legacy Part**: Current `renderEventContent` function and associated custom styling logic.
    *   **Replacement**: New `CleaningTaskEventContent` component for event rendering; integration into `CalendarPageLayout`.
    *   **Notes**: FullCalendar configuration for `headerToolbar` and other UI aspects may be simplified or removed.

### 2. CSS Files (Potential Removal or Significant Reduction)

*   **File**: `frontend/src/components/recipes/productionSchedulerCalendar.css`
    *   **Legacy Part**: Styles specific to the old event rendering and layout of the recipe calendar.
    *   **Replacement**: Styling will primarily be handled by Material UI within the new components (`RecipeEventContent`, `CalendarPageLayout`, etc.).
    *   **Notes**: Review and remove redundant styles. Some utility styles might be salvageable or moved to a more global scope if still needed.

### 3. Old Calendar-Specific UI Sections (To Be Identified - TBI)

*   **Description**: Any components or JSX sections that render UI elements exclusively for the *old* calendar system, such as dedicated filter panels, sidebars, or header controls that are *not* part of a shared application layout and are being replaced by the new `CalendarPageLayout` and its sub-components.
    *   **Legacy Part**: (TBI - List specific component names/file paths as identified)
    *   **Replacement**: `CalendarPageLayout`, `CalendarHeaderControls`, `CalendarRightSidebar`, `CollapsibleFiltersDisplay`.
    *   **Notes**: This section requires further investigation during implementation or input from team members familiar with the broader application structure.

### 4. Legacy Pages (To Be Identified - TBI)

*   **Description**: Any entire pages whose sole or primary purpose was to display the old calendar interface in a manner that is now entirely superseded by the new design and integration approach.
    *   **Legacy Part**: (TBI - List specific page routes/component names as identified)
    *   **Replacement**: Existing pages will likely be refactored to use the new calendar components. New pages are not anticipated unless the redesign introduces a fundamentally new navigation structure for accessing calendars.
    *   **Notes**: (TBI)

## Process for Removal:
1.  Confirm the new component/feature fully replaces the legacy item's functionality.
2.  Identify and update all import paths and usages of the legacy item.
3.  Comment out or soft-delete the legacy item and test thoroughly.
4.  After a stabilization period (e.g., one sprint, or post-QA sign-off), permanently delete the legacy files/code.
5.  Ensure commits clearly state what legacy items are being removed.
