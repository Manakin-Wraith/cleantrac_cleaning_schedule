# High-Fidelity Calendar Design Proposal

**Project**: Modern Calendar Redesign (Cleaning & Recipe Schedulers)
**Client**: SaaS Platform
**Focus**: Desktop Manager Experience
**Date**: {{datetime.date}}

## 1. Introduction

This document presents a high-fidelity design proposal for the redesigned Cleaning and Recipe Calendar modules. The primary objective is to deliver a modern, frictionless, and visually appealing user interface, optimized for desktop use by managers. This proposal synthesizes previous research, wireframing, and component specification efforts into a cohesive design vision.

## 2. Design Philosophy & Principles

Our design is guided by the following core principles:

-   **Clarity & Intuition**: Interfaces should be immediately understandable and easy to navigate.
-   **Efficiency & Frictionless Workflow**: Streamline common tasks, reduce clicks, and provide information proactively.
-   **Modern Aesthetics**: Employ a clean, contemporary visual style aligned with Material UI best practices.
-   **Space Optimization**: Maximize the use of desktop screen real estate for better data visibility and interaction.
-   **Consistency**: Maintain uniform design patterns, iconography, and terminology across both calendars.
-   **Information Hierarchy**: Present data in a structured manner, emphasizing key information and using progressive disclosure effectively.

## 3. Global Style Guidelines

### 3.1. Typography

-   **Primary Font Family**: Roboto (Material Design default) or a similar clean sans-serif font.
-   **Headings (h1-h6)**: For section titles, modal titles, and prominent labels (e.g., Current Period Display).
-   **Body Text (body1, body2)**: For general content, event card details, descriptions.
-   **Captions & Overlines**: For secondary information, timestamps, small labels.
-   **Emphasis**: Use font weight (e.g., `fontWeightBold`, `fontWeightMedium`) for emphasis rather than relying solely on color or italics.

### 3.2. Color Palette

-   **Primary Color**: A professional and calming blue (e.g., Material UI Blue `500` - `#2196f3`) for primary actions, active states, and highlights.
-   **Secondary Color**: A complementary accent color (e.g., Material UI Teal `500` - `#009688` or Purple `500` - `#9c27b0`) for secondary actions or specific UI elements.
-   **Neutral Colors**: A range of grays (e.g., Material UI Grey `50` to `900`) for backgrounds, borders, text, and disabled states.
-   **Status Colors** (as defined in `calendar_card_specifications.md` and `calendar_card_mockups.md`):
    -   **Completed**: Green (e.g., `#2e7d32` / MUI Green `700`)
    -   **In Progress**: Blue (e.g., `#1976d2` / MUI Blue `700`)
    -   **Scheduled**: Purple (e.g., `#7b1fa2` / MUI Purple `700`)
    -   **Cancelled**: Red (e.g., `#d32f2f` / MUI Red `700`)
    -   **Pending Review**: Orange (e.g., `#ed6c02` / MUI Orange `700`)
    -   **On Hold**: Gray (e.g., `#757575` / MUI Grey `600`)
-   **Backgrounds**: Light neutrals (e.g., White `#FFFFFF` or MUI Grey `50` `#FAFAFA`) for main content areas to ensure high contrast and readability.

### 3.3. Iconography

-   **Library**: `@mui/icons-material` exclusively for consistency and a wide range of high-quality icons.
-   **Usage**: Icons should be used purposefully to enhance understanding and reduce cognitive load, not merely for decoration.
-   **Sizing**: Default Material UI sizes (`small`, `medium`, `large`) or custom consistent sizing (e.g., 16px, 20px, 24px).
-   **Key Icons**: Refer to `calendar_card_mockups.md` and `calendar_component_specifications.md` for specific icon choices for statuses, actions, and information types.

## 4. Overall Layout Structure

(Based on `newCalendarDesign.md` - Section 1 - *Updated to reflect right-hand sidebar*)

```text
+------------------------------------------------------------------------------------+
| AppBar (Header Section)                                                            |
| [Logo] [Date Nav] [Current Period] [View Selectors] [Filters Toggle] [User Tools]  |
+------------------------------------------------------------------------------------+
| Collapsible Filters Bar (if expanded)                                              |
| [Dept Filter] [Status Filter] [Search Field] [Custom Filter]                       |
+------------------------------------------------------------------------------------+
|                                                |                                     |
|         Main Content Area                      | Drawer (Sidebar - Collapsible)      |
|         (FullCalendar Instance)                | +---------------------------------+ |
|                                                | | [Collapse/Expand Btn]           | |
|                                                | |---------------------------------| |
|                                                | | Resources Section               | |
|                                                | | - [ ] Staff A (Color)           | |
|         <Selected Calendar View />             | | - [ ] Staff B (Color)           | |
|                                                | |---------------------------------| |
|                                                | | Quick Actions Section           | |
|                                                | | - [+ New Task]                  | |
|                                                | | - [+ New Recipe]                | |
|                                                | |---------------------------------| |
|                                                | | Legend Section                  | |
|                                                | | - [Color] Status A              | |
|                                                | | - [Color] Status B              | |
|                                                | +---------------------------------+ |
+------------------------------------------------------------------------------------+
| Optional Footer (Status Bar, Global Actions)                                       |
+------------------------------------------------------------------------------------+
```

-   **Header (`AppBar`)**: Fixed at the top, providing consistent access to navigation and controls.
-   **Sidebar (`Drawer` - persistent variant)**: Collapsible, docked to the **right**. Width: ~280-320px when open. This placement avoids conflict with a primary left-hand application sidebar.
-   **Main Content Area**: Expands to fill the remaining space to the left of the Drawer, housing the FullCalendar component.

## 5. Key Component High-Fidelity Mockups

### 5.1. Header Components

#### Date Navigation (`DateNavigator`)
```text
// Material UI: ButtonGroup for Prev/Next/Today, IconButton + DatePicker for Calendar
// Example: June 2025

  <IconButton><ArrowBackIosNewIcon /></IconButton>
  <Button variant="outlined">Today</Button>
  <IconButton><ArrowForwardIosIcon /></IconButton>
  <Typography variant="h6" sx={{ mx: 2, fontWeight: 'bold' }}>JUNE 2025</Typography>
  <IconButton><CalendarTodayIcon /></IconButton> // Opens DatePicker
```

#### View Controls (`ViewSelector`)
```text
// Material UI: ToggleButtonGroup

  <ToggleButtonGroup value={currentView} exclusive onChange={handleViewChange}>
    <ToggleButton value="month"><CalendarViewMonthIcon sx={{mr:0.5}}/>Month</ToggleButton>
    <ToggleButton value="week"><CalendarViewWeekIcon sx={{mr:0.5}}/>Week</ToggleButton>
    <ToggleButton value="day"><CalendarViewDayIcon sx={{mr:0.5}}/>Day</ToggleButton>
    <ToggleButton value="timeline"><TimelineIcon sx={{mr:0.5}}/>Timeline</ToggleButton>
  </ToggleButtonGroup>
```

#### Collapsible Filters Bar (Content)
```text
// Layout: Horizontal Stack (or Grid) of Material UI components

  <Autocomplete multiple options={departments} placeholder="Department" sx={{width: 200}} />
  <MultiSelectChipGroup options={statuses} selected={selectedStatuses} label="Status" />
  <TextField InputProps={{startAdornment: <SearchIcon />}} placeholder="Search..." />
  <Button variant="outlined" startIcon={<TuneIcon />}>Custom Filters</Button>
```

### 5.2. Sidebar Components

#### Resources Section
```text
// Material UI: List, ListItem, Checkbox, Typography, Avatar (for color dot)

  <ListSubheader>RESOURCES</ListSubheader>
  <ListItem dense>
    <Checkbox edge="start" />
    <ListItemAvatar sx={{minWidth: 20}}><Avatar sx={{width:10, height:10, bgcolor:'blue.500'}} /></ListItemAvatar>
    <ListItemText primary="John Smith" />
  </ListItem>
  <ListItem dense>
    <Checkbox edge="start" />
    <ListItemAvatar sx={{minWidth: 20}}><Avatar sx={{width:10, height:10, bgcolor:'green.500'}} /></ListItemAvatar>
    <ListItemText primary="Cleaning Crew A" />
  </ListItem>
```

#### Quick Actions Section
```text
// Material UI: Button

  <ListSubheader>QUICK ACTIONS</ListSubheader>
  <Button fullWidth variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{mb:1}}>New Task</Button>
  <Button fullWidth variant="contained" startIcon={<RestaurantIcon />} color="secondary">New Recipe</Button>
```

## 6. Calendar View High-Fidelity Mockups

(These will show the structure and how event cards fit. Event card details are in Section 7)

### 6.1. Month View
-   **Layout**: Standard grid. Cells are spacious.
-   **Day Cell**: Date number top-right. Events stack vertically.
-   **Event Cards**: Compact, single-line (title + icon). Color border for status.
-   **Overflow**: `+N more` Chip, clickable to show popover or navigate to Day view.

```text
// Cell for June 12, showing 2 events and overflow
+----------------------+
|                   12 |
| <Box sx={{borderLeft: '3px solid green', p:0.5, mb:0.5, borderRadius:1, bgcolor:'white', boxShadow:1}}>
|   <RestaurantIcon fontSize="inherit"/> Choc. Cake
| </Box>               |
| <Box sx={{borderLeft: '3px solid blue', p:0.5, mb:0.5, borderRadius:1, bgcolor:'white', boxShadow:1}}>
|   <CleaningServicesIcon fontSize="inherit"/> Oven Clean
| </Box>               |
| <Chip label="+2 more" size="small" onClick={...} />
+----------------------+
```

### 6.2. Week View
-   **Layout**: Columns for days, rows for time slots.
-   **Event Cards**: Medium detail (title, time, assignee). Length can represent duration.

```text
// Event spanning 10:00-11:30 in a day column
+----------------------+
| <Box sx={{borderLeft: '4px solid purple', p:1, borderRadius:1, bgcolor:'white', boxShadow:1, height: '90px' /* for 1.5h */}}>
|   <Typography variant="subtitle2"><RestaurantIcon fontSize="small"/> Sourdough Prep</Typography>
|   <Typography variant="caption"><AccessTimeIcon fontSize="inherit"/> 10:00-11:30</Typography>
|   <Typography variant="caption"><PersonIcon fontSize="inherit"/> A. Baker</Typography>
| </Box>               |
+----------------------+
```

### 6.3. Day View / Timeline View
-   **Layout**: Columns for resources (Timeline/Day-Resource) or single day with time slots (Day-Standard).
-   **Event Cards**: Can show full detail (Day view) or be compact (Timeline).
-   **Timeline Cards**: Width represents duration accurately.

```text
// Timeline View Event Card for Staff A, 9:00-11:00
// [ Staff A ] | ... | [ <RestaurantIcon/> Recipe X (9-11) ] | ... |

// Day View Event Card (full detail)
+----------------------------------------------------+
| <Box sx={{borderLeft: '6px solid orange', p:1.5, borderRadius:1, bgcolor:'white', boxShadow:2}}>
|   <Box display="flex" alignItems="center">
|     <RestaurantIcon sx={{mr:1}}/> <Typography variant="h6">Spicy Curry</Typography>
|     <WarningAmberIcon color="warning" sx={{ml:'auto'}}/>
|   </Box>
|   <Typography><Inventory2Icon fontSize="small"/> Batch: 30 portions</Typography>
|   <Typography><PersonIcon fontSize="small"/> Assigned: Chef B</Typography>
|   <Typography><AccessTimeIcon fontSize="small"/> 14:00-16:30 <HourglassBottomIcon fontSize="small"/> 2.5h</Typography>
|   <Box sx={{mt:1}}>
|     <Button size="small" startIcon={<EditIcon />}>Edit</Button>
|     <Button size="small" startIcon={<DeleteIcon />} color="error">Delete</Button>
|   </Box>
| </Box>                                             |
+----------------------------------------------------+
```

## 7. Event Card System - Detailed Mockups

(Referencing `calendar_card_mockups.md` and `calendar_card_specifications.md`)

### 7.1. Progressive Disclosure States

#### Default (e.g., Month View)
-   **Visual**: `Box` with `borderLeft` (status color), `padding` (e.g., `4px 8px`), `borderRadius`.
-   **Content**: `<TaskTypeIcon fontSize="small" /> <Typography variant="body2" fontWeight="bold">Event Name</Typography>`

#### Hover (e.g., Week View or Month View Hover)
-   **Visual**: Shadow might increase slightly. Tooltip appears with more details.
-   **Content on Card**: `<TaskTypeIcon /> Event Name`, `<AccessTimeIcon /> Time`, `<PersonIcon /> Assignee`.
-   **Tooltip Content**: Status, Full Title, Time, Assignee, Location/Department if applicable.

#### Selected / Detailed (e.g., Day View Card or Clicked Card)
-   **Visual**: `Paper` or `Card` component, potentially slightly lighter background of status color (e.g., green `50` for completed).
-   **Content**: Full information hierarchy with icons and labels, action buttons.
    -   Header: `<TaskTypeIcon /> <Typography variant="h6">Event Name</Typography> <StatusIcon sx={{ml:'auto'}} />`
    -   Details Section: Lines for Batch Size, Staff, Time/Duration, Department, Priority, Location.
    -   Actions: `Button` components for `Complete`, `Edit`, `Delete`, `More...`

### 7.2. Status & Type Visualization
-   **Status**: Consistent use of border colors and Material UI status icons (e.g., `<CheckCircleOutlineIcon color="success" />`).
-   **Task Type**: Dedicated icons (`<RestaurantIcon />` for recipes, `<CleaningServicesIcon />` for cleaning).

## 8. Interaction Patterns

-   **Drag & Drop**: For rescheduling events within/between views and resources.
-   **Click**: On event for quick view/edit (configurable: popover or modal). On date/time slot to create new event.
-   **Hover**: For tooltips and subtle visual feedback (e.g., slight shadow change on cards).
-   **Modals/Dialogs**: For event creation/editing, confirmations, custom filters. Standard Material UI `Dialog` behavior.
-   **Keyboard Navigation**: Adherence to WAI-ARIA practices for navigating calendar grid, events, and controls.

## 9. Accessibility Considerations

-   **Color Contrast**: Ensure sufficient contrast between text, icons, and backgrounds (WCAG AA).
-   **Keyboard Accessibility**: All interactive elements must be focusable and operable via keyboard.
-   **Screen Reader Support**: Use ARIA attributes where necessary (e.g., `aria-label` for icon buttons, roles for calendar sections).
-   **Focus Management**: Logical focus order and visible focus indicators.
-   **Alternative Text**: For images or icons that convey information if not purely decorative.
-   **Status Not by Color Alone**: Status also indicated by icons and text in detailed views/tooltips.

## 10. Next Steps & Developer Handoff

-   Review this design proposal with stakeholders for feedback.
-   Iterate on designs based on feedback.
-   Proceed to component-based development using React, FullCalendar, and Material UI.
-   Refer to `calendar_component_specifications.md` for detailed prop lists and states for each UI component.
-   Pay close attention to the defined color palette, typography, and iconography for consistency.
-   Implement responsive behaviors for optimal display on various desktop screen sizes.

This high-fidelity proposal aims to provide a clear and comprehensive vision for the new calendar system, ensuring a delightful and efficient experience for managers.
