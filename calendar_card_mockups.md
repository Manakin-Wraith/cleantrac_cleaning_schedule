# Calendar Card Visual Mockups

This document provides visual mockups of the redesigned calendar cards using Material UI icons for both cleaning and recipe calendars.

## Material UI Icons Selection

The following Material UI icons will be used throughout the calendar cards:

### Status Icons
- **Completed**: `CheckCircleOutlineIcon` - A checkmark in a circle
- **In Progress**: `AutorenewIcon` - A circular arrow indicating ongoing process
- **Scheduled**: `EventIcon` - A calendar icon
- **Cancelled**: `CancelIcon` - A circle with an X
- **Pending Review**: `WarningAmberIcon` - A warning triangle
- **On Hold**: `PauseCircleOutlineIcon` - A pause symbol in a circle

### Information Type Icons
- **Recipe**: `RestaurantIcon` - A fork and knife icon
- **Cleaning**: `CleaningServicesIcon` - A spray bottle icon
- **Batch Size**: `Inventory2Icon` - A box with items
- **Staff**: `PersonIcon` - A person silhouette
- **Time**: `AccessTimeIcon` - A clock face
- **Duration**: `HourglassBottomIcon` - An hourglass
- **Department**: `BusinessIcon` - A building icon
- **Priority**: `FlagIcon` - A flag icon
- **Location**: `RoomIcon` - A location pin

## Card Mockups by View Type

### Month View Card

```
┌────────────────────────────────┐
│█ Recipe Name                   │ ← 3px colored border (status)
└────────────────────────────────┘
```

**Material UI Version:**
```
┌────────────────────────────────┐
│█ <RestaurantIcon fontSize="small" /> Recipe Name │
└────────────────────────────────┘
```

### Week View Card

```
┌────────────────────────────────┐
│█ Recipe Name                   │
│ <AccessTimeIcon fontSize="small" /> 10:00-11:30 • <PersonIcon fontSize="small" /> J. Smith │
└────────────────────────────────┘
```

**Material UI Version with Status:**
```
┌────────────────────────────────┐
│█ <RestaurantIcon fontSize="small" /> Recipe Name <EventIcon fontSize="small" color="action" /> │
│ <AccessTimeIcon fontSize="small" /> 10:00-11:30 • <PersonIcon fontSize="small" /> J. Smith │
└────────────────────────────────┘
```

### Day View Card

```
┌────────────────────────────────┐
│█ <RestaurantIcon /> Recipe Name                  │
│                                │
│ <Inventory2Icon /> Batch: 50 units              │
│ <PersonIcon /> Assigned: John Smith          │
│ <AccessTimeIcon /> 10:00 - 11:30 (1.5h)          │
│ <EventIcon /> Status: Scheduled               │
│                                │
│ [Complete] [Edit] [Delete]     │
└────────────────────────────────┘
```

**Material UI Version with Action Buttons:**
```
┌────────────────────────────────┐
│█ <RestaurantIcon /> Recipe Name                  │
│                                │
│ <Inventory2Icon /> Batch: 50 units              │
│ <PersonIcon /> Assigned: John Smith          │
│ <AccessTimeIcon /> 10:00 - 11:30 <HourglassBottomIcon fontSize="small" /> 1.5h │
│                                │
│ <Button startIcon={<CheckCircleOutlineIcon />}>Complete</Button> │
│ <Button startIcon={<EditIcon />}>Edit</Button> │
│ <Button startIcon={<DeleteIcon />}>Delete</Button> │
└────────────────────────────────┘
```

### Timeline View Card

```
┌────────────────────────────────┐
│█ <RestaurantIcon fontSize="small" /> Recipe Name │
│ <AccessTimeIcon fontSize="small" /> 10:00-11:30  │
└────────────────────────────────┘
```

## Progressive Disclosure Examples

### 1. Default State (Month View)

```
┌────────────────────────────────┐
│█ <RestaurantIcon fontSize="small" /> Recipe Name │
└────────────────────────────────┘
```

### 2. Hover State (Month View)

```
┌────────────────────────────────┐
│█ <RestaurantIcon fontSize="small" /> Recipe Name <EventIcon fontSize="small" color="action" /> │
│ <AccessTimeIcon fontSize="small" /> 10:00-11:30 • <PersonIcon fontSize="small" /> J. Smith │
└────────────────────────────────┘
```

### 3. Selected State (Month View)

```
┌────────────────────────────────┐
│█ <RestaurantIcon /> Recipe Name <EventIcon color="action" /> │
│                                │
│ <Inventory2Icon /> Batch: 50 units              │
│ <PersonIcon /> Assigned: John Smith          │
│ <AccessTimeIcon /> 10:00 - 11:30 <HourglassBottomIcon fontSize="small" /> 1.5h │
│                                │
│ <IconButton><CheckCircleOutlineIcon /></IconButton> │
│ <IconButton><EditIcon /></IconButton> │
│ <IconButton><DeleteIcon /></IconButton> │
└────────────────────────────────┘
```

## Status Visualization with Material UI

| Status | Border Color | Background | Material UI Icon |
|--------|--------------|------------|------------------|
| Completed | #2e7d32 (green) | #e8f5e9 (light green) | `<CheckCircleOutlineIcon color="success" />` |
| In Progress | #1976d2 (blue) | #e3f2fd (light blue) | `<AutorenewIcon color="primary" />` |
| Scheduled | #7b1fa2 (purple) | #f3e5f5 (light purple) | `<EventIcon color="secondary" />` |
| Cancelled | #d32f2f (red) | #ffebee (light red) | `<CancelIcon color="error" />` |
| Pending Review | #ed6c02 (orange) | #fff3e0 (light orange) | `<WarningAmberIcon color="warning" />` |
| On Hold | #757575 (gray) | #f5f5f5 (light gray) | `<PauseCircleOutlineIcon color="disabled" />` |

## Task Type Icons

| Task Type | Material UI Icon |
|-----------|------------------|
| Production | `<RestaurantIcon />` |
| Prep | `<KitchenIcon />` |
| Cleaning | `<CleaningServicesIcon />` |
| Sanitizing | `<SanitizerIcon />` |

## Implementation Examples

### Recipe Card - Month View (Scheduled)

```jsx
<Box
  sx={{
    borderLeft: '3px solid #7b1fa2',
    backgroundColor: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    boxShadow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    height: '22px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }}
>
  <RestaurantIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />
  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
    Chocolate Cake
  </Typography>
</Box>
```

### Cleaning Card - Week View (In Progress)

```jsx
<Box
  sx={{
    borderLeft: '4px solid #1976d2',
    backgroundColor: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    boxShadow: 1,
    height: '40px',
    display: 'flex',
    flexDirection: 'column',
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <CleaningServicesIcon fontSize="small" sx={{ fontSize: '0.875rem' }} />
    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
      Deep Clean Ovens
    </Typography>
    <AutorenewIcon fontSize="small" color="primary" sx={{ marginLeft: 'auto', fontSize: '0.875rem' }} />
  </Box>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
    <AccessTimeIcon fontSize="small" sx={{ fontSize: '0.75rem' }} />
    <Typography variant="caption">14:00-15:30</Typography>
    <Typography variant="caption" sx={{ mx: 0.5 }}>•</Typography>
    <PersonIcon fontSize="small" sx={{ fontSize: '0.75rem' }} />
    <Typography variant="caption">M. Johnson</Typography>
  </Box>
</Box>
```

### Recipe Card - Day View (Completed)

```jsx
<Box
  sx={{
    borderLeft: '6px solid #2e7d32',
    backgroundColor: '#e8f5e9',
    padding: '8px 12px',
    borderRadius: '4px',
    boxShadow: 2,
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
    <RestaurantIcon />
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      Sourdough Bread
    </Typography>
    <CheckCircleOutlineIcon color="success" sx={{ marginLeft: 'auto' }} />
  </Box>
  
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
    <Inventory2Icon fontSize="small" />
    <Typography variant="body2">Batch: 24 loaves</Typography>
  </Box>
  
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
    <PersonIcon fontSize="small" />
    <Typography variant="body2">Assigned: Alex Baker</Typography>
  </Box>
  
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
    <AccessTimeIcon fontSize="small" />
    <Typography variant="body2">08:00 - 12:00</Typography>
    <HourglassBottomIcon fontSize="small" sx={{ ml: 0.5 }} />
    <Typography variant="body2">4h</Typography>
  </Box>
  
  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
    <Button variant="outlined" size="small" startIcon={<EditIcon />}>
      Edit
    </Button>
    <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />}>
      Delete
    </Button>
  </Box>
</Box>
```

## Responsive Adaptations

### Small Desktop (768px-1023px)

```jsx
// Month view card (more compact)
<Box
  sx={{
    borderLeft: '3px solid #7b1fa2',
    backgroundColor: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    boxShadow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    height: '20px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }}
>
  <RestaurantIcon fontSize="small" sx={{ fontSize: '0.75rem' }} />
  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
    Chocolate Cake
  </Typography>
</Box>
```

These mockups provide a comprehensive visualization of how the calendar cards will look with Material UI icons across different views and states.
