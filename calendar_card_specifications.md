# Calendar Card Information Specifications

This document specifies the essential information to display on calendar event cards for both cleaning and recipe calendars, optimized for desktop viewing.

## Information Priority Framework

Information on calendar cards is organized according to these priority levels:

1. **Primary (Always Visible)**: Essential information that must always be visible in any view
2. **Secondary (View-Dependent)**: Important information shown based on available space and view type
3. **Tertiary (On-Demand)**: Additional details shown on hover, selection, or in expanded views
4. **Hidden (Modal Only)**: Detailed information only accessible via modal/detail view

## Essential Information by Card Type

### Recipe Calendar Cards

#### Primary Information
- **Recipe Name**: The most prominent element on the card
- **Status Indicator**: Color-coded border/background (no text needed)

#### Secondary Information
- **Time**: Start and end time (format varies by view)
- **Staff**: Assigned staff member name (when relevant to view)
- **Batch Size**: Quantity with unit (e.g., "50 units")

#### Tertiary Information
- **Department**: Only when filtering across departments
- **Duration**: Calculated time span
- **Task Type**: Icon only (🍳 production, 🔪 prep)

#### Hidden Information
- **Description**: Full recipe description
- **Creation/Modification Date**: When the task was created/modified
- **Notes**: Any additional notes
- **History**: Previous changes or status updates

### Cleaning Calendar Cards

#### Primary Information
- **Task Name**: The most prominent element on the card
- **Status Indicator**: Color-coded border/background (no text needed)

#### Secondary Information
- **Time**: Start and end time (format varies by view)
- **Staff**: Assigned staff member name (when relevant to view)
- **Priority**: Visual indicator for high-priority tasks only

#### Tertiary Information
- **Area/Location**: Where cleaning takes place
- **Duration**: Calculated time span
- **Task Type**: Icon only (🧹 cleaning, 🧽 sanitizing)

#### Hidden Information
- **Description**: Full task description
- **Equipment Needed**: Special equipment requirements
- **Creation/Modification Date**: When the task was created/modified
- **Notes**: Any additional notes

## View-Specific Display Rules

### Month View

**Card Height**: 22px (compact), 30px (comfortable)
**Information Displayed**:
- Primary information only
- Status shown as left border color (3px width)
- Overflow handling: "+X more" indicator

```
+----------------------------------+
| ■ Recipe/Task Name               | ← Color bar indicates status
+----------------------------------+
```

### Week View

**Card Height**: 30px (compact), 40px (comfortable)
**Information Displayed**:
- Primary information
- Time (compact format)
- One piece of secondary information
- Status shown as left border color (4px width)

```
+----------------------------------+
| ■ Recipe Name                    |
| 10:00-11:30 • Staff Name         |
+----------------------------------+
```

### Day View

**Card Height**: 60px (compact), 80px (comfortable)
**Information Displayed**:
- Primary information
- All secondary information
- 1-2 pieces of tertiary information
- Status shown as both left border (6px) and subtle background tint

```
+----------------------------------+
| ■ Recipe Name                    |
|                                  |
| 🍳 Batch: 50 units               |
| 👤 John Smith                    |
| ⏱️ 10:00 - 11:30                 |
+----------------------------------+
```

### Timeline View

**Card Height**: Fixed by row height
**Card Width**: Proportional to duration
**Information Displayed**:
- Primary information
- Time (compact format)
- Status shown as left border color (4px width)

```
+----------------------------------+
| ■ Recipe Name                    |
| 10:00-11:30                      |
+----------------------------------+
```

## Progressive Disclosure Implementation

### Default State
- Show only primary information
- Use color to convey status
- Maintain consistent height based on view

### Hover State
- Expand to show all secondary information
- Add subtle elevation effect
- Show tooltip with tertiary information

### Selected State
- Highlight with distinct border
- Show action buttons if applicable
- Maintain expanded state until deselected

## Typography and Formatting Guidelines

### Recipe Name / Task Name
- Font: System primary font, semi-bold
- Size: 14px (month), 16px (week/day/timeline)
- Color: High contrast against background
- Truncation: Ellipsis after 1 line (month/week), 2 lines (day/timeline)

### Time Display
- Format by view:
  - Month: Hidden or icon only
  - Week: "10:00-11:30" (compact)
  - Day: "10:00 AM - 11:30 AM" (full)
  - Timeline: "10:00-11:30" (compact)

### Staff Name
- Format: First name + last initial (e.g., "John S.")
- Only show when relevant to view context

### Batch Size / Priority
- Format: Value + unit (e.g., "50 units")
- Use icon prefix for visual scanning

## Status Visualization

| Status | Border Color | Background | Icon |
|--------|--------------|------------|------|
| Completed | #2e7d32 (green) | #e8f5e9 (light green) | ✓ |
| In Progress | #1976d2 (blue) | #e3f2fd (light blue) | ⟳ |
| Scheduled | #7b1fa2 (purple) | #f3e5f5 (light purple) | 📅 |
| Cancelled | #d32f2f (red) | #ffebee (light red) | ✕ |
| Pending Review | #ed6c02 (orange) | #fff3e0 (light orange) | ⚠️ |
| On Hold | #757575 (gray) | #f5f5f5 (light gray) | ⏸️ |

## Interaction Patterns

### Click Behavior
- Single click: Select card and show full details in sidebar/panel
- Double click: Open edit modal
- Right click: Context menu with quick actions

### Drag Behavior
- Drag handle: Subtle indicator on hover
- Visual feedback: Shadow and transparency during drag
- Drop indicators: Highlight valid drop zones

## Accessibility Considerations

- Color is never the sole indicator of status (always paired with shape/icon)
- Sufficient contrast ratios for all text elements
- Screen reader friendly alternative text
- Keyboard navigable with clear focus indicators

## Implementation Notes

1. Use CSS variables for consistent color application
2. Implement view-specific card components that share a common base
3. Use CSS Grid for layout to maximize space efficiency
4. Consider virtual scrolling for performance with many events
5. Implement responsive breakpoints for different desktop sizes
