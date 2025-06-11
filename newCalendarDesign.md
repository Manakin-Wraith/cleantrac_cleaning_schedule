# Detailed Calendar Wireframes for Desktop

## 1. Overall Layout Structure

### Base Layout Framework

```text
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

The layout maximizes horizontal space with these key components:

-   **Header Section**: Contains navigation, view controls, and date selection.
-   **Sidebar**: Collapsible panel **on the right** for filters, resources, and quick actions. This placement avoids conflict with any primary left-hand application navigation.
-   **Calendar Content**: Main display area that expands to fill available space to the left of the sidebar.
-   **Footer Controls**: Optional area for status, summary, and global actions.

## 2. Header Section Design

```text
+----------------------------------------------------------------------+
| Logo | Date Navigation | Current Period | View Controls | User Tools |
+----------------------------------------------------------------------+
| [Filters Bar - Collapsible]                           | [Collapse ▲] |
+----------------------------------------------------------------------+
```

### Header Components:

-   **Date Navigation**:
    -   Previous/Next buttons with clear visual indicators.
    -   `Today` button with active state when viewing current date.
    -   Date picker dropdown for quick navigation.
-   **Current Period Display**:
    -   Bold, prominent typography showing current view period.
    -   Adaptive text (e.g., "June 2025" for month view, "June 10-16, 2025" for week view).
-   **View Controls**:
    -   Segmented control for view switching (`Day`/`Week`/`Month`/`Timeline`).
    -   Visual indicators for the current view.
    -   Consistent with Material UI design language.
-   **User Tools**:
    -   Print/Export button.
    -   Settings dropdown.
    -   Help/Info button.
-   **Collapsible Filters Bar**:
    -   Department filter (dropdown).
    -   Status filter (multi-select chips).
    -   Search field.
    -   Date range quick selectors.
    -   Custom filter button.

## 3. Sidebar Design (Now on the Right)

```text
+--------------------+
| [Collapse ▶]       |
+--------------------+
| RESOURCES          |
|                    |
| □ Staff Member 1   |
| □ Staff Member 2   |
| □ Staff Member 3   |
+--------------------+
| QUICK ACTIONS      |
|                    |
| [+ New Task]       |
| [+ New Recipe]     |
+--------------------+
| LEGEND             |
|                    |
| ■ Completed        |
| ■ In Progress      |
| ■ Scheduled        |
+--------------------+
```

### Sidebar Components:

-   **Collapse Control**: Toggle to maximize calendar space.
-   **Resources Section**:
    -   Checkboxes to filter visible staff/resources.
    -   Color indicators for resource status.
    -   Resource grouping options.
-   **Quick Actions**:
    -   Context-aware action buttons.
    -   Drag-and-drop recipe/task templates.
-   **Legend**:
    -   Color-coded status indicators.
    -   Toggle visibility of status types.

## 4. Month View Design

```text
+----------------------------------------------------------------------+
| S | M | T | W | T | F | S | ← Day headers with consistent width      |
+---+---+---+---+---+---+---+
|   |   |   | 1 | 2 | 3 | 4 | ← Date cells with equal height/width     |
+---+---+---+---+---+---+---+
| 5 | 6 | 7 | 8 | 9 |10 |11 |                                          |
+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   | ← Each cell contains event cards         |
|   |   |   |   |   |   |   |                                          |
|   |   |   |   |   |   |   |                                          |
+---+---+---+---+---+---+---+
```

### Month View Event Cards:

```text
+----------------------------------+
| ■ Recipe Name                    | ← Color bar indicates status
+----------------------------------+
| ■ Cleaning Task                  |
+----------------------------------+
| ■ Another Task                   |
+----------------------------------+
| + 3 more                         | ← Overflow indicator
+----------------------------------+
```

-   **Compact Design**: Shows only essential information.
-   **Color Indicators**: Left border or background tint shows status.
-   **Overflow Handling**: `+X more` indicator with hover preview.
-   **Interaction**: Hover expands to show more details; click opens full details.

## 5. Week View Design

```text
+------+------+------+------+------+------+------+
|  MON |  TUE |  WED |  THU |  FRI |  SAT |  SUN | ← Day headers
| 6/10 | 6/11 | 6/12 | 6/13 | 6/14 | 6/15 | 6/16 | ← Dates
+------+------+------+------+------+------+------+
|      |      |      |      |      |      |      |
| 9:00 +------+------+------+------+------+------+
|      |      |      |      |      |      |      |
+------+------+------+------+------+------+------+
|      |      |      |      |      |      |      |
| 10:00+------+------+------+------+------+------+
|      |      |      |      |      |      |      |
+------+------+------+------+------+------+------+
```

### Week View Event Cards:

```text
+----------------------------------+
| ■ Recipe Name                    |
| 10:00 - 11:30 • Staff Name       | ← Key metadata only
+----------------------------------+
```

-   **Medium Detail**: Title, time, and assigned staff.
-   **Consistent Height**: Fixed height with scrollable content if needed.
-   **Visual Duration**: Card length represents time duration.
-   **Interaction**: Hover shows tooltip with full details.

## 6. Day View Design

```text
+----------------------------------------------------------------------+
| WEDNESDAY, JUNE 12, 2025                                             |
+----------------------------------------------------------------------+
| TIME  |  STAFF 1  |  STAFF 2  |  STAFF 3  |  STAFF 4  |  STAFF 5    |
+----------------------------------------------------------------------+
| 8:00  |           |           |           |           |             |
+----------------------------------------------------------------------+
| 9:00  |           |           |           |           |             |
+----------------------------------------------------------------------+
| 10:00 |[Event Card]|          |           |           |             |
+----------------------------------------------------------------------+
| 11:00 |           |           |[Event Card]|          |             |
+----------------------------------------------------------------------+
```

### Day View Event Cards:

```text
+----------------------------------+
| ■ Recipe Name                    |
|                                  |
| 🍳 Batch: 50 units               | ← Comprehensive details
| 👤 Assigned: John Smith          |
| ⏱️ 10:00 - 11:30 (1.5h)          |
|                                  |
| [Complete] [Edit] [Delete]       | ← Quick actions
+----------------------------------+
```

-   **Full Details**: Comprehensive information in a clean layout.
-   **Action Buttons**: Quick access to common tasks.
-   **Visual Indicators**: Icons for different information types.
-   **Status Clarity**: Clear visual indication of task status.

## 7. Timeline View Design

```text
+------+--------------------------------------------------------------+
| STAFF|  8:00  |  9:00  |  10:00  |  11:00  |  12:00  |  13:00  |   |
+------+--------------------------------------------------------------+
|      |        |        |         |         |         |         |   |
| S1   |        |[Event Card]      |         |         |         |   |
|      |        |        |         |         |         |         |   |
+------+--------------------------------------------------------------+
|      |        |        |         |         |         |         |   |
| S2   |        |        |         |[Event Card]      |         |   |
|      |        |        |         |         |         |         |   |
+------+--------------------------------------------------------------+
```

### Timeline Event Cards:

```text
+----------------------------------+
| ■ Recipe Name                    |
| 10:00 - 11:30                    | ← Streamlined for horizontal layout
+----------------------------------+
```

-   **Horizontal Layout**: Optimized for timeline view.
-   **Width = Duration**: Card width represents time duration.
-   **Minimal Content**: Only essential information.
-   **Staff Alignment**: Clear visual connection to assigned staff.

## 8. Event Card Design System

### Progressive Disclosure Pattern

#### Default State (Minimal)

```text
+----------------------------------+
| ■ Recipe Name                    | ← Color indicates status
+----------------------------------+
```

#### Hover State (Medium)

```text
+----------------------------------+
| ■ Recipe Name                    |
| 10:00 - 11:30 • Staff Name       | ← Additional context
| Batch: 50 units                  |
+----------------------------------+
```

#### Selected State (Full)

```text
+----------------------------------+
| ■ Recipe Name                    |
|                                  |
| 🍳 Batch: 50 units               |
| 👤 Assigned: John Smith          |
| ⏱️ 10:00 - 11:30 (1.5h)          |
| 📋 Status: In Progress           |
|                                  |
| [Complete] [Edit] [Delete]       |
+----------------------------------+
```

### Status Visualization

-   **Completed**: Green left border/background, optional checkmark icon.
-   **In Progress**: Blue left border/background, optional progress icon.
-   **Scheduled**: Purple left border/background.
-   **Cancelled**: Red left border/background, optional strikethrough.
-   **Pending Review**: Orange left border/background.
-   **On Hold**: Gray left border/background.

### Typography Hierarchy

-   **Title**: `16px`, Semi-bold
-   **Primary Metadata**: `14px`, Regular
-   **Secondary Metadata**: `12px`, Light
-   **Action Labels**: `14px`, Medium

## 9. Responsive Behavior

### Desktop Breakpoints

-   **Large Desktop (1440px+)**: Full layout with expanded sidebar.
-   **Medium Desktop (1024px-1439px)**: Compact sidebar, full calendar.
-   **Small Desktop (768px-1023px)**: Collapsed sidebar (expandable), optimized calendar.

### Space Optimization Techniques

-   **Collapsible Panels**: Sidebar and filters collapse to maximize calendar space.
-   **Density Controls**: Toggle between comfortable and compact views.
-   **Responsive Grid**: Columns adjust based on available width.
-   **Scrollable Areas**: Contained scrolling for overflow content.

## 10. Interaction Design

### Drag and Drop

-   **Visual Feedback**: Clear indicators during drag operations.
-   **Drop Zones**: Highlighted valid drop targets.
-   **Snap-to-Grid**: Automatic time alignment.
-   **Multi-select**: Ability to move multiple events together.

### Selection States

-   **Single Select**: Highlighted border and elevation.
-   **Multi-select**: Checkbox indicators and group actions.
-   **Hover**: Subtle elevation and expanded information.

### Keyboard Navigation

-   **Arrow Keys**: Move between days/events.
-   **Tab**: Navigate between interactive elements.
-   **Enter/Space**: Select or activate.
-   **Escape**: Cancel current operation.
