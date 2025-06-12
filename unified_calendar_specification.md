# Unified Calendar Technical Specification

## Overview

This document outlines the technical approach for combining cleaning tasks and recipe production scheduling into a single unified calendar interface. The goal is to simplify the manager experience while maintaining all existing functionality.

**Project**: Modern Calendar Redesign (Unified Cleaning & Recipe Schedulers)
**Client**: SaaS Platform
**Focus**: Desktop Manager Experience
**Date**: June 12, 2025

### Design Philosophy & Principles

Our unified calendar design is guided by the following core principles:

- **Clarity & Intuition**: Interfaces should be immediately understandable and easy to navigate.
- **Efficiency & Frictionless Workflow**: Streamline common tasks, reduce clicks, and provide information proactively.
- **Modern Aesthetics**: Employ a clean, contemporary visual style aligned with Material UI best practices.
- **Space Optimization**: Maximize the use of desktop screen real estate for better data visibility and interaction.
- **Consistency**: Maintain uniform design patterns, iconography, and terminology across both task types.
- **Information Hierarchy**: Present data in a structured manner, emphasizing key information and using progressive disclosure effectively.

## Architecture

### Component Structure

```
UnifiedCalendarPage
├── CalendarPageLayout
│   ├── UnifiedHeaderControls
│   ├── UnifiedCalendarFilters
│   ├── UnifiedRightSidebar
│   │   ├── QuickActionsMenu
│   │   ├── UnifiedLegend
│   │   └── ResourceFilterList
│   └── UnifiedCalendarComponent
│       ├── UnifiedEventContent (conditional rendering)
│       │   ├── CleaningTaskEventContent
│       │   └── RecipeEventContent
│       └── FullCalendar
└── Modal Components (conditional rendering)
    ├── TaskDetailModal
    ├── EditTaskAssignmentModal
    ├── RecipeDetailModal
    └── EditRecipeModal
```

### Component Structure Details

#### UnifiedCalendarPage
- **Purpose**: Main container component that integrates both cleaning and recipe task scheduling
- **Responsibilities**:
  - Fetching and normalizing data from both task types
  - Managing unified state for filters, resources, and view options
  - Handling event interactions (click, drag, resize)
  - Coordinating modal displays

#### UnifiedHeaderControls
- **Purpose**: Provides navigation, view selection, and date controls
- **Key Components**:
  - Date navigation (prev/next/today buttons)
  - Current period display
  - View selector (day/week/month/timeline)
  - User tools (print, settings)

#### UnifiedCalendarFilters
- **Purpose**: Allows filtering of calendar events
- **Key Features**:
  - Event type selector (All/Cleaning/Recipe)
  - Dynamic filters based on selected event type
  - Search field for text-based filtering
  - Department/location filters
  - Status filters with visual indicators

#### UnifiedRightSidebar
- **Purpose**: Provides additional controls and information
- **Key Components**:
  - Resource filtering (staff, equipment)
  - Quick actions for creating new events
  - Legend explaining status colors and icons
  - Collapsible for maximizing calendar space

#### UnifiedCalendarComponent
- **Purpose**: Renders the actual calendar with events
- **Implementation**:
  - Wraps FullCalendar library
  - Configures appropriate views and options
  - Handles event rendering via UnifiedEventContent

#### UnifiedEventContent
- **Purpose**: Conditionally renders the appropriate event content based on event type
- **Logic**:
  - Examines event's `originalType` property
  - Delegates rendering to appropriate component
  - Provides fallback rendering for unknown types

### Data Flow

1. **Data Fetching**
   - Fetch cleaning tasks and recipe tasks in parallel
   - Normalize data into a unified event format
   - Apply consistent ID prefixing to avoid collisions

2. **Event Normalization**
   ```javascript
   // Example event normalization
   const normalizeEvents = (events, type) => {
     return events.map(event => ({
       id: `${type}-${event.id}`, // Prefix to avoid ID collisions
       title: event.title || event.task_name || event.recipe_name,
       start: event.start || `${event.due_date}T${event.start_time || '00:00:00'}`,
       end: event.end || (event.end_time ? `${event.due_date}T${event.end_time}` : null),
       resourceId: event.resourceId || event.assigned_to_id || event.staff_id,
       eventType: type, // 'cleaning' or 'recipe'
       extendedProps: {
         ...event,
         originalType: type,
       },
     }));
   };
   ```

3. **State Management**
   - Combined state for both event types
   - Type-specific state when needed
   - Shared state for common functionality (date navigation, view type)

## UI/UX Design

### Global Style Guidelines

#### Typography
- **Primary Font Family**: Roboto (Material Design default) or similar clean sans-serif font
- **Headings (h1-h6)**: For section titles, modal titles, and prominent labels
- **Body Text (body1, body2)**: For general content, event card details, descriptions
- **Captions & Overlines**: For secondary information, timestamps, small labels
- **Emphasis**: Use font weight for emphasis rather than relying solely on color or italics

#### Color Palette
- **Primary Color**: Professional and calming blue (e.g., Material UI Blue `500` - `#2196f3`)
- **Secondary Color**: Complementary accent color (e.g., Material UI Teal `500` - `#009688`)
- **Neutral Colors**: Range of grays (e.g., Material UI Grey `50` to `900`)
- **Status Colors**:
  - **Completed**: Green (e.g., `#2e7d32` / MUI Green `700`)
  - **In Progress**: Blue (e.g., `#1976d2` / MUI Blue `700`)
  - **Scheduled**: Purple (e.g., `#7b1fa2` / MUI Purple `700`)
  - **Cancelled**: Red (e.g., `#d32f2f` / MUI Red `700`)
  - **Pending Review**: Orange (e.g., `#ed6c02` / MUI Orange `700`)
  - **On Hold**: Gray (e.g., `#757575` / MUI Grey `600`)
- **Backgrounds**: Light neutrals for main content areas to ensure high contrast and readability

#### Iconography
- **Library**: `@mui/icons-material` exclusively for consistency
- **Usage**: Icons should be used purposefully to enhance understanding, not merely for decoration

### Layout Structure

```
+----------------------------------------------------------------------+
|                          HEADER SECTION                              |
+----------------------------------------------------------------------+
|                                                            |         |
|                                                            |         |
|                     CALENDAR CONTENT                       | SIDEBAR |
|                                                            |         |
|                                                            |         |
+----------------------------------------------------------------------+
|                          FOOTER CONTROLS                             |
+----------------------------------------------------------------------+
```

- **Header Section**: Contains navigation, view controls, and date selection
- **Sidebar**: Collapsible panel **on the right** for filters, resources, and quick actions
- **Calendar Content**: Main display area that expands to fill available space
- **Footer Controls**: Optional area for status, summary, and global actions

### Event Type Differentiation

1. **Visual Indicators**
   - **Color coding**: Different base colors for cleaning vs recipe tasks
   - **Icons**: Task-specific icons in event cards (`<CleaningServicesIcon />` for cleaning tasks, `<RestaurantIcon />` for recipes)
   - **Badges**: Type indicator badges for quick identification

2. **Filtering System**
   - **Top-level event type filter**: Dropdown or toggle group (All, Cleaning, Recipe)
   - **Type-specific filters**: Dynamic filters that appear based on selected event type
   - **Shared filters**: Staff, date range, search term

### Mockup: Event Type Filter

```
[All Events ▼] | [Date Range ▼] | [Staff ▼] | [More Filters ▼]

When "All Events" is selected:
  - Common filters only

When "Cleaning Tasks" is selected:
  - Common filters + Cleaning-specific filters (status, location)

When "Recipe Tasks" is selected:
  - Common filters + Recipe-specific filters (department, complexity)
```

### Event Card System

#### Information Priority Framework

Information on calendar cards is organized according to these priority levels:

1. **Primary (Always Visible)**: Essential information that must always be visible in any view
2. **Secondary (View-Dependent)**: Important information shown based on available space and view type
3. **Tertiary (On-Demand)**: Additional details shown on hover, selection, or in expanded views
4. **Hidden (Modal Only)**: Detailed information only accessible via modal/detail view

#### Essential Information by Card Type

##### Recipe Calendar Cards

- **Primary Information**
  - Recipe Name: The most prominent element on the card
  - Status Indicator: Color-coded border/background (no text needed)

- **Secondary Information**
  - Time: Start and end time (format varies by view)
  - Staff: Assigned staff member name (when relevant to view)
  - Batch Size: Quantity with unit (e.g., "50 units")

- **Tertiary Information**
  - Department: Only when filtering across departments
  - Duration: Calculated time span
  - Task Type: Icon only (🍳 production, 🔪 prep)

##### Cleaning Calendar Cards

- **Primary Information**
  - Task Name: The most prominent element on the card
  - Status Indicator: Color-coded border/background (no text needed)

- **Secondary Information**
  - Time: Start and end time (format varies by view)
  - Staff: Assigned staff member name (when relevant to view)
  - Priority: Visual indicator for high-priority tasks only

- **Tertiary Information**
  - Area/Location: Where cleaning takes place
  - Duration: Calculated time span
  - Task Type: Icon only (e.g., deep clean, maintenance)

#### Card Visual States

- **Default State**: Shows primary and some secondary information
- **Hover State**: Reveals tertiary information and action buttons
- **Selected State**: Visual highlight and possibly expanded information
- **Dragging State**: Visual feedback during drag operations

### Mockup: Unified Calendar Event Cards

**Cleaning Task Card:**
```
┌──────────────────────────────┐
│ [CLEANING ICON] Floor Cleaning│
│ Location: Main Entrance      │
│ Assigned: John Doe           │
│ Status: Completed            │
└──────────────────────────────┘
```

**Recipe Task Card:**
```
┌──────────────────────────────┐
│ [RECIPE ICON] Chocolate Cake │
│ Quantity: 12 servings        │
│ Assigned: Jane Smith         │
│ Department: Bakery           │
└──────────────────────────────┘
```

#### Card Component Implementation

```jsx
// Unified event card component example
const UnifiedEventContent = ({ eventInfo }) => {
  const { extendedProps: props } = eventInfo.event;
  const eventType = props.originalType; // 'cleaning' or 'recipe'
  
  // Determine which component to render based on event type
  if (eventType === 'cleaning') {
    return <CleaningTaskEventContent eventInfo={eventInfo} />;
  } else if (eventType === 'recipe') {
    return <RecipeEventContent eventInfo={eventInfo} />;
  }
  
  // Fallback for unknown event types
  return (
    <Box sx={{ p: 1, border: '1px solid grey' }}>
      <Typography>{eventInfo.event.title}</Typography>
    </Box>
  );
};
```

## Implementation Strategy

### Phase 1: Foundation

1. **Create UnifiedCalendarPage Component**
   - Implement data fetching for both task types
   - Set up event normalization
   - Basic rendering of both event types

2. **Implement Event Type Filtering**
   - Add event type selector
   - Basic filter controls

### Phase 2: Enhanced Features

1. **Develop Type-Specific Interactions**
   - Modal handling based on event type
   - Edit/update functionality

2. **Advanced Filtering**
   - Dynamic filter controls
   - Saved filter presets

### Phase 3: Optimization

1. **Performance Enhancements**
   - Lazy loading of events
   - Virtual scrolling for large datasets

2. **User Experience Refinement**
   - Keyboard shortcuts
   - Drag-and-drop improvements

## Migration Plan

### Step 1: Create Unified Components

1. Create `UnifiedCalendarPage.jsx`
2. Create `UnifiedEventContent.jsx`
3. Adapt existing filter components for unified use

### Step 2: Data Integration

1. Create data adapter functions
2. Implement event normalization
3. Set up unified state management

### Step 3: UI Implementation

1. Build unified filter controls
2. Implement conditional rendering for event cards
3. Create unified sidebar components

### Step 4: Testing & Validation

1. Test with real data from both systems
2. Validate all interactions work correctly
3. Performance testing with large datasets

### Step 5: Rollout

1. Implement feature flag for unified calendar
2. Beta test with select users
3. Gather feedback and iterate
4. Full deployment

## Technical Challenges & Solutions

### Challenge 1: Event ID Collisions

**Problem:** Both systems might use the same ID format, causing collisions.

**Solution:** Prefix all IDs with event type (`cleaning-123`, `recipe-456`).

### Challenge 2: Different Data Structures

**Problem:** Cleaning tasks and recipes have different properties.

**Solution:** Create a normalized event structure with common properties and type-specific properties in `extendedProps`.

### Challenge 3: Type-Specific Interactions

**Problem:** Different event types need different interaction patterns.

**Solution:** Implement conditional rendering and behavior based on `eventType` property.

### Challenge 4: Performance with Combined Data

**Problem:** Twice the data could cause performance issues.

**Solution:** Implement pagination, lazy loading, and virtual scrolling for large datasets.

## Accessibility Considerations

The unified calendar must be accessible to all users, including those with disabilities. The following considerations should be implemented:

- **Keyboard Navigation**: All interactive elements must be focusable and operable via keyboard
- **Screen Reader Support**: Use ARIA attributes where necessary (e.g., `aria-label` for icon buttons, roles for calendar sections)
- **Focus Management**: Logical focus order and visible focus indicators
- **Alternative Text**: For images or icons that convey information if not purely decorative
- **Status Not by Color Alone**: Status also indicated by icons and text in detailed views/tooltips
- **Sufficient Color Contrast**: All text and important UI elements must have sufficient contrast ratios
- **Responsive Text Sizing**: Text should scale appropriately when users increase browser font size

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Create `UnifiedCalendarPage.jsx` component
- Implement data fetching and normalization for both task types
- Develop basic event type filtering
- Build unified event rendering system

### Phase 2: Enhanced Features (Weeks 3-4)

- Implement dynamic filter controls based on event type
- Develop unified sidebar with resource management
- Create type-specific modal interactions
- Add advanced filtering capabilities

### Phase 3: Optimization & Refinement (Weeks 5-6)

- Performance optimizations for large datasets
- User experience refinements based on testing
- Accessibility improvements
- Documentation and knowledge transfer

### Phase 4: Rollout & Training (Week 7)

- Feature flag implementation for gradual rollout
- User training materials
- Feedback collection system
- Full deployment

## UI Polish (2025-06-12)

### Sidebar Enhancements
- Removed global header to maximize vertical space; `PageLayout` now defaults `showHeaderBar: false`.
- Left sidebar improvements:
  - Added in-drawer chevron (top-right) to collapse / expand.
  - Floating menu icon only visible when collapsed.
  - Collapsed state shows tooltip on hover, with subtle blur + shadow.
- Behaviour mirrors right sidebar so managers have consistent controls.

### Calendar Header Controls
- Re-styled view toggle (Month / Week / Day) into pill-style button group with active-state colour.
- Filter icon converted to outlined circular icon with primary tint.

### Filters Card
- Card now uses responsive Grid.
- Hover elevation and tighter spacing for modern look.

## Changelog

#### 2025-06-12
- **Recipe Task Persistence**: Integrated `createProductionSchedule` and `updateProductionSchedule` service functions. `ProductionAssignmentModal` now calls `onSave(payload, id)` which triggers the appropriate API request in `UnifiedCalendarPage`.
- **Unified Refresh Logic**: Introduced a memoised `fetchAllData` (`useCallback`) and removed `currentCalendarDate` from the dependency array to avoid tight polling loops.
- **Error & Success Handling**: Success snackbar on save, descriptive error messaging on failure.
- **Performance**: Eliminated redundant API polling that caused rapid loops (`~6 req/s`). Calendar now refreshes only on mount and after write operations.
- **Documentation**: Updated spec to reflect final data-flow diagram and persistence workflow.

## Conclusion

A unified calendar approach offers significant UX improvements and maintenance benefits. By carefully designing the component structure and data flow, we can create a seamless experience that handles both cleaning tasks and recipe production scheduling in a single interface.

The phased implementation approach allows for incremental development and testing, reducing risk while delivering value at each stage. This unified calendar will provide managers with a more efficient and intuitive tool for managing both cleaning tasks and recipe production from a single interface.
