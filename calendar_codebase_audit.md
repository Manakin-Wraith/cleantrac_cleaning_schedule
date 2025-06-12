# Calendar Codebase Audit for Unified Implementation

## Overview

This document outlines the results of our codebase audit for implementing the unified calendar approach. It identifies which components to keep, refactor, or create new to achieve our goal of combining cleaning tasks and recipe production into a single calendar interface.

## Page Components

### Keep and Refactor

1. **CalendarPageLayout.jsx**
   - **Status**: Keep with minor modifications
   - **Purpose**: Core layout component that provides the structure for all calendar views
   - **Modifications**: No significant changes needed; already designed for reuse

2. **CalendarHeaderControls.jsx**
   - **Status**: Keep with modifications
   - **Purpose**: Provides navigation, view selection, and date controls
   - **Modifications**: Add event type selector (All/Cleaning/Recipe)

3. **CalendarRightSidebar.jsx**
   - **Status**: Keep with modifications
   - **Purpose**: Container for sidebar components (filters, resources, legend)
   - **Modifications**: Update to handle unified resource types and filters

### Create New

1. **UnifiedCalendarPage.jsx**
   - **Purpose**: Main container component that integrates both cleaning and recipe task scheduling
   - **Replaces**: Will eventually replace both TaskSchedulerPage.jsx and ProductionSchedulerPage.jsx
   - **Key Features**: 
     - Fetches and normalizes data from both task types
     - Manages unified state for filters, resources, and view options
     - Handles event interactions (click, drag, resize)
     - Coordinates modal displays

2. **UnifiedCalendarComponent.jsx**
   - **Purpose**: Renders the actual calendar with events from both sources
   - **Replaces**: Will replace functionality from both TaskSchedulerCalendar.jsx and ProductionSchedulerCalendar.jsx
   - **Key Features**:
     - Wraps FullCalendar library
     - Configures appropriate views and options
     - Handles event rendering via UnifiedEventContent

3. **UnifiedEventContent.jsx**
   - **Purpose**: Conditionally renders the appropriate event content based on event type
   - **Key Features**:
     - Examines event's `originalType` property
     - Delegates rendering to appropriate component
     - Provides fallback rendering for unknown types

### Phase Out

1. **TaskSchedulerPage.jsx**
   - **Status**: Phase out after UnifiedCalendarPage is implemented
   - **Valuable Code**: 
     - Event handling functions (onEventClick, onEventDrop, onEventResize)
     - API integration for cleaning tasks
     - Modal handling logic

2. **ProductionSchedulerPage.jsx**
   - **Status**: Phase out after UnifiedCalendarPage is implemented
   - **Valuable Code**:
     - Event handling functions
     - API integration for recipe tasks
     - Modal handling logic

## Calendar Components

### Keep

1. **CleaningTaskEventContent.jsx**
   - **Status**: Keep as is
   - **Purpose**: Renders cleaning task event cards
   - **Notes**: Already well-structured and styled according to our design specs

2. **RecipeEventContent.jsx**
   - **Status**: Keep as is
   - **Purpose**: Renders recipe event cards
   - **Notes**: Already well-structured and styled according to our design specs

### Phase Out

1. **TaskSchedulerCalendar.jsx**
   - **Status**: Phase out after UnifiedCalendarComponent is implemented
   - **Valuable Code**:
     - FullCalendar configuration for cleaning tasks
     - Event filtering logic
     - View handling

2. **ProductionSchedulerCalendar.jsx**
   - **Status**: Phase out after UnifiedCalendarComponent is implemented
   - **Valuable Code**:
     - FullCalendar configuration for recipe tasks
     - Event filtering logic
     - View handling

## Filter Components

### Refactor and Combine

1. **CleaningFilters.jsx** and **RecipeFilters.jsx**
   - **Status**: Refactor into a unified filter component
   - **New Component**: UnifiedFilters.jsx
   - **Purpose**: Provides filtering options for both event types
   - **Key Features**:
     - Dynamic filters based on selected event type
     - Common filters (status, date range, search)
     - Type-specific filters that appear contextually

2. **CollapsibleFiltersDisplay.jsx**
   - **Status**: Keep with minor modifications
   - **Purpose**: Container for filter components with collapse/expand functionality
   - **Modifications**: Update to handle unified filters

3. **ResourceFilterList.jsx**
   - **Status**: Keep with modifications
   - **Purpose**: Manages visibility of events based on assigned resources
   - **Modifications**: Update to handle both staff types (cleaning and kitchen)

## Sidebar Components

### Keep with Modifications

1. **CalendarLegend.jsx**
   - **Status**: Keep with modifications
   - **Purpose**: Explains the color-coding or iconography used for event statuses
   - **Modifications**: Update to include both cleaning and recipe statuses

2. **QuickActionsMenu.jsx**
   - **Status**: Keep with modifications
   - **Purpose**: Provides shortcuts for creating new events or tasks
   - **Modifications**: Update to include actions for both cleaning tasks and recipes

## Modal Components

### Keep

1. **TaskDetailModal.jsx**
   - **Status**: Keep as is
   - **Purpose**: Displays details for cleaning tasks
   - **Notes**: Will be conditionally rendered based on event type

2. **EditTaskAssignmentModal.jsx**
   - **Status**: Keep as is
   - **Purpose**: Edits cleaning task assignments
   - **Notes**: Will be conditionally rendered based on event type

3. **ProductionTaskDetailModal.jsx**
   - **Status**: Keep as is
   - **Purpose**: Displays details for recipe tasks
   - **Notes**: Will be conditionally rendered based on event type

4. **ProductionAssignmentModal.jsx**
   - **Status**: Keep as is
   - **Purpose**: Edits recipe task assignments
   - **Notes**: Will be conditionally rendered based on event type

## Implementation Strategy

### Phase 1: Foundation

1. Create `UnifiedCalendarPage.jsx` (skeleton)
2. Create `UnifiedEventContent.jsx`
3. Create `UnifiedFilters.jsx` (basic version)

### Phase 2: Data Integration

1. Implement data fetching and normalization in `UnifiedCalendarPage.jsx`
2. Update `CalendarHeaderControls.jsx` to include event type selector
3. Update `CalendarRightSidebar.jsx` to handle unified resources

### Phase 3: UI Implementation

1. Complete `UnifiedFilters.jsx` with dynamic controls
2. Update `CalendarLegend.jsx` to include both status types
3. Update `QuickActionsMenu.jsx` for both task types

### Phase 4: Testing & Validation

1. Test with real data from both systems
2. Validate all interactions work correctly
3. Performance testing with large datasets

### Phase 5: Cleanup

1. Remove deprecated components after successful migration
2. Update documentation
3. Final code review and optimization

### Completed Refactors (2025-06-12)
- `Sidebar.jsx` – hover tooltips, blur/shadow, in-drawer chevron collapse, parent dropdown toggle.
- `UnifiedFilters.jsx` – responsive grid, card elevation, compressed spacing.
- `CalendarHeaderControls.jsx` – pill-style view toggle, outlined filter icon.

### Outstanding
- Empty-state illustration/message for calendars.
