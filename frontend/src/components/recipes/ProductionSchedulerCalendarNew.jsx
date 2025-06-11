import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { Box, Typography, Tooltip, CircularProgress, useMediaQuery, Paper, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Import React Big Calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Import our custom calendar styles
import './productionSchedulerCalendar.css';

// Create a draggable calendar component
const DnDCalendar = withDragAndDrop(Calendar);

// Set up the localizer for React Big Calendar
const localizer = momentLocalizer(moment);

// Map FullCalendar view types to React Big Calendar view types
const viewMapping = {
    'dayGridMonth': Views.MONTH,
    'timeGridWeek': Views.WEEK,
    'resourceTimeGridDay': Views.DAY,
    'resourceTimelineWeek': Views.AGENDA // React Big Calendar calls this 'agenda'
};

const ProductionSchedulerCalendar = ({ 
    events,         // Production tasks/schedules
    resources,      // Staff resources
    currentDate,    // Current date to display
    currentView,    // Current view to display (e.g., 'dayGridMonth', 'timeGridWeek')
    onDateChange,   // Callback for date navigation
    onEventDrop,    // Callback for drag-and-drop rescheduling
    onEventClick,   // Callback for clicking on a production task
    eventResize,    // Callback for resizing a production task
    onEventReceive, // Callback for external event drops
    onDateClick,    // Callback for clicking on a date
    onViewChange,   // Callback for view type changes
    calendarRef     // Ref to access calendar API from parent
}) => {
    const localCalendarRef = useRef(null);
    const effectiveRef = calendarRef || localCalendarRef;
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    
    // Convert the currentView from FullCalendar format to React Big Calendar format
    const [view, setView] = useState(viewMapping[currentView] || Views.DAY);
    
    // Format events for React Big Calendar
    const [formattedEvents, setFormattedEvents] = useState([]);

    // Format events for React Big Calendar whenever the events prop changes
    useEffect(() => {
        if (!events) {
            setFormattedEvents([]);
            return;
        }
        
        setIsLoading(true);
        
        const formattedEvts = events.map(event => {
            const { id, title, start, end, resourceId, extendedProps = {} } = event;
            const { status, task_type, recipe_name, batch_size, yield_unit, description, isPlaceholder } = extendedProps;
            
            return {
                id,
                title: recipe_name || title || 'Untitled Task',
                start: new Date(start),
                end: new Date(end || start), // Fallback to start if end is not provided
                allDay: event.allDay || false, // Ensure allDay is defined
                resourceId, // Keep resourceId for filtering/grouping if needed
                // Store original data and extended props in the event object for custom rendering
                status,
                task_type,
                recipe_name,
                batch_size,
                yield_unit,
                description,
                isPlaceholder
            };
        });
        
        setFormattedEvents(formattedEvts);
        setIsLoading(false);
    }, [events]);
    
    // Update view when currentView prop changes from parent
    useEffect(() => {
        const mappedView = viewMapping[currentView] || Views.DAY;
        if (view !== mappedView) {
            setView(mappedView);
        }
    }, [currentView, view]);

    // Handle date range change (navigation)
    const handleNavigate = (newDate) => {
        if (typeof onDateChange === 'function') {
            onDateChange(newDate);
        }
    };

    // Handle view change from calendar toolbar
    const handleView = (newView) => {
        if (typeof onViewChange === 'function') {
            const fcView = Object.keys(viewMapping).find(key => viewMapping[key] === newView) || 'resourceTimeGridDay';
            onViewChange(fcView);
        }
        setView(newView);
    };

    // Handle event selection
    const handleSelectEvent = (event) => {
        if (typeof onEventClick === 'function') {
            const eventClickInfo = {
                event: {
                    id: event.id,
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    allDay: event.allDay,
                    resourceId: event.resourceId, // Pass resourceId
                    extendedProps: {
                        status: event.status,
                        task_type: event.task_type,
                        recipe_name: event.recipe_name,
                        batch_size: event.batch_size,
                        yield_unit: event.yield_unit,
                        description: event.description,
                        isPlaceholder: event.isPlaceholder
                    },
                    getResources: () => resources.filter(r => r.id === event.resourceId) // Mimic FullCalendar getResources
                }
            };
            onEventClick(eventClickInfo);
        }
    };

    // Handle event drag and drop
    const handleEventDropWrapper = ({ event, start, end, resourceId, isAllDay }) => {
        if (typeof onEventDrop === 'function') {
            const originalEvent = events.find(e => e.id === event.id);
            const eventDropInfo = {
                event: { ...event, start, end, resourceId, allDay: isAllDay }, // Updated event
                oldEvent: originalEvent, // Original event from props
                newStart: start,
                newEnd: end,
                newResource: resources.find(r => r.id === resourceId) // Full resource object
            };
            onEventDrop(eventDropInfo);
        }
    };

    // Handle event resize
    const handleEventResizeWrapper = ({ event, start, end }) => {
        if (typeof eventResize === 'function') {
            const originalEvent = events.find(e => e.id === event.id);
            const eventResizeInfo = {
                event: { ...event, start, end }, // Updated event
                oldEvent: originalEvent, // Original event from props
                newStart: start,
                newEnd: end
            };
            eventResize(eventResizeInfo);
        }
    };

    // Handle slot selection (clicking on a date/time slot)
    const handleSelectSlot = (slotInfo) => {
        if (typeof onDateClick === 'function') {
            const dateClickInfo = {
                date: slotInfo.start,
                resource: resources.find(r => r.id === slotInfo.resourceId),
                resourceId: slotInfo.resourceId,
                view: { type: Object.keys(viewMapping).find(key => viewMapping[key] === view) || 'resourceTimeGridDay' }
            };
            onDateClick(dateClickInfo);
        }
    };

    // Handle external event drops (if needed, basic setup)
    const handleDropFromOutside = ({ start, end, resource }) => {
        if (typeof onEventReceive === 'function') {
            // This needs an external draggable element's data to be truly useful
            const newEvent = {
                title: 'New External Event',
                start,
                end,
                resourceId: resource,
                // You'll need to define how to get data from the dragged element
            };
            onEventReceive({ event: newEvent }); 
        }
    };

    // Memoized function to determine task type icon
    const getTaskTypeIcon = useCallback((taskType) => {
        switch(taskType) {
            case 'production': return '🍳';
            case 'prep': return '🔪';
            case 'cleaning': return '🧹';
            default: return '📋';
        }
    }, []);
    
    // Memoized function to determine status colors
    const getStatusColors = useCallback((status, isPlaceholder) => {
        let backgroundColor = theme.palette.grey[200];
        let textColor = theme.palette.getContrastText(backgroundColor);
        let borderColor = theme.palette.grey[400];

        if (isPlaceholder) {
            backgroundColor = theme.palette.grey[300];
            textColor = theme.palette.getContrastText(backgroundColor);
            borderColor = theme.palette.grey[500];
            return { backgroundColor, textColor, borderColor };
        }
        
        switch (status) {
            case 'completed':
                backgroundColor = theme.palette.success.light;
                textColor = theme.palette.success.contrastText;
                borderColor = theme.palette.success.main;
                break;
            case 'in_progress':
                backgroundColor = theme.palette.info.light;
                textColor = theme.palette.info.contrastText;
                borderColor = theme.palette.info.main;
                break;
            case 'scheduled':
                backgroundColor = theme.palette.primary.light;
                textColor = theme.palette.primary.contrastText;
                borderColor = theme.palette.primary.main;
                break;
            case 'cancelled':
                backgroundColor = theme.palette.error.light;
                textColor = theme.palette.error.contrastText;
                borderColor = theme.palette.error.main;
                break;
            case 'pending_review':
                backgroundColor = theme.palette.warning.light;
                textColor = theme.palette.warning.contrastText;
                borderColor = theme.palette.warning.main;
                break;
            case 'on_hold':
                backgroundColor = theme.palette.grey[400]; // Darker grey for on_hold
                textColor = theme.palette.getContrastText(backgroundColor);
                borderColor = theme.palette.grey[600];
                break;
            default:
                break;
        }
        return { backgroundColor, textColor, borderColor };
    }, [theme]);
    
    // Custom event component for React Big Calendar
    const EventComponent = useCallback(({ event }) => {
        const taskTypeIcon = getTaskTypeIcon(event.task_type);
        const { backgroundColor, textColor, borderColor } = getStatusColors(event.status, event.isPlaceholder);
        
        const tooltipContent = `
            ${event.title || event.recipe_name}
            ${event.batch_size ? `Batch: ${event.batch_size} ${event.yield_unit || ''}` : ''}
            ${event.description ? `Desc: ${event.description}` : ''}
            ${event.status ? `Status: ${event.status.replace('_', ' ')}` : ''}
        `.trim().replace(/\n\s*/g, '\n'); // Clean up multiline string
        
        return (
            <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipContent}</div>} arrow placement="top">
                <Box
                    className={`production-event ${event.isPlaceholder ? 'placeholder-event' : ''}`}
                    sx={{
                        backgroundColor,
                        color: textColor,
                        borderLeft: `4px solid ${borderColor}`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[1],
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: theme.shadows[3],
                            transform: 'translateY(-1px)',
                            filter: 'brightness(1.05)'
                        },
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}
                    aria-label={`${event.title || event.recipe_name} ${event.status ? event.status.replace('_', ' ') : ''}`}
                    role="button"
                    tabIndex={0}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {taskTypeIcon} {event.title || event.recipe_name}
                    </Typography>
                    {(view === Views.DAY || view === Views.WEEK) && event.batch_size && (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                opacity: 0.85,
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {`${event.batch_size} ${event.yield_unit || ''}`}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    }, [getTaskTypeIcon, getStatusColors, theme, view]);

    // Format resources for React Big Calendar (resource view)
    const rbcResources = resources && resources.length > 0 ? resources.map(res => ({
        id: res.id,
        title: res.title || res.name || `Resource ${res.id}`
    })) : undefined; // Undefined if no resources, to disable resource view

    // Custom Resource Header Component
    const ResourceHeaderComponent = useCallback(({ label }) => (
        <Box sx={{ padding: '4px', textAlign: 'center', fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}`}}>
            {label}
        </Box>
    ), [theme.palette.divider]);

    // Custom Toolbar for navigation and view selection
    const CustomToolbar = useCallback(({ label, onNavigate, onView, views: availableViews }) => {
        const viewNames = {
            [Views.MONTH]: 'Month',
            [Views.WEEK]: 'Week',
            [Views.DAY]: 'Day',
            [Views.AGENDA]: 'Timeline'
        };

        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: theme.spacing(1, 2),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    flexWrap: 'wrap', // Allow wrapping on small screens
                    gap: theme.spacing(1)
                }}
            >
                <Box sx={{ display: 'flex', gap: theme.spacing(1), flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" onClick={() => onNavigate('PREV')}>Prev</Button>
                    <Button variant="outlined" size="small" onClick={() => onNavigate('TODAY')}>Today</Button>
                    <Button variant="outlined" size="small" onClick={() => onNavigate('NEXT')}>Next</Button>
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 500, textAlign: 'center', flexGrow: 1 }}>
                    {label}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: theme.spacing(1), flexWrap: 'wrap' }}>
                    {Array.isArray(availableViews) && availableViews.map(v => (
                        (viewNames[v] && (!isMobile || (v !== Views.MONTH && v !== Views.AGENDA))) && (
                            <Button 
                                key={v} 
                                variant={view === v ? "contained" : "outlined"} 
                                size="small" 
                                onClick={() => onView(v)}
                            >
                                {viewNames[v]}
                            </Button>
                        )
                    ))}
                </Box>
            </Box>
        );
    }, [theme, isMobile, view]);

    // Loading overlay component
    const LoadingOverlay = () => (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 1000, // Ensure it's on top
                borderRadius: theme.shape.borderRadius
            }}
        >
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                Loading Calendar...
            </Typography>
        </Box>
    );

    return (
        <Box className="production-scheduler-calendar-rbc" sx={{ position: 'relative', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
            {isLoading && <LoadingOverlay />}
            <Paper 
                elevation={3} 
                sx={{ 
                    height: '100%', 
                    overflow: 'hidden',
                    borderRadius: theme.shape.borderRadius,
                    display: 'flex',
                    flexDirection: 'column',
                    '& .rbc-calendar': {
                        flexGrow: 1,
                        border: 'none' // Remove default border from rbc
                    },
                    '& .rbc-toolbar': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        padding: theme.spacing(1)
                    },
                    '& .rbc-event': {
                        padding: '0px', // Reset padding as custom component handles it
                        border: 'none', // Reset border
                        backgroundColor: 'transparent' // Reset background
                    },
                    '& .rbc-header': {
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        borderBottom: `1px solid ${theme.palette.divider}`
                    },
                    '& .rbc-time-slot': {
                        minHeight: '30px' // Adjust slot height
                    }
                }}
            >
                <DnDCalendar
                    ref={effectiveRef}
                    localizer={localizer}
                    events={formattedEvents}
                    resources={rbcResources} // Pass formatted resources
                    resourceIdAccessor="id" // Accessor for resource ID
                    resourceTitleAccessor="title" // Accessor for resource title
                    
                    view={view} // Controlled view
                    date={currentDate ? new Date(currentDate) : new Date()} // Controlled date
                    onNavigate={handleNavigate} // Controlled navigation
                    onView={handleView} // Controlled view change

                    startAccessor="start"
                    endAccessor="end"
                    allDayAccessor="allDay"
                    
                    selectable
                    resizable
                    popup // For overflowing events in month view
                    
                    defaultView={Views.DAY} // Default if view prop is not initially set
                    views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]} // Available views

                    step={15} // Time slot increment in minutes
                    timeslots={4} // Number of slots in an hour (step=15 -> 4 slots)
                    min={new Date(0, 0, 0, 6, 0, 0)} // Calendar start time (6 AM)
                    max={new Date(0, 0, 0, 22, 0, 0)} // Calendar end time (10 PM)
                    showMultiDayTimes
                    
                    components={{
                        event: EventComponent,
                        toolbar: CustomToolbar,
                        resourceHeader: rbcResources ? ResourceHeaderComponent : undefined // Only if resources are present
                    }}
                    
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleEventDropWrapper}
                    onEventResize={handleEventResizeWrapper}
                    onSelectSlot={handleSelectSlot}
                    onDropFromOutside={handleDropFromOutside} // For external drag-n-drop
                    
                    draggableAccessor={(event) => !event.isPlaceholder} // Only allow dragging non-placeholder events
                    resizableAccessor={(event) => !event.isPlaceholder} // Only allow resizing non-placeholder events
                />
            </Paper>
        </Box>
    );
};

export default ProductionSchedulerCalendar;
