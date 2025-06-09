import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import './productionSchedulerCalendar.css'; // We'll create this CSS file

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
    
    // Use effect to enhance day view event visibility after render
    // useEffect(() => {
    //     const enhanceDayViewEvents = () => {
    //         if (effectiveRef.current && currentView === 'resourceTimeGridDay') {
    //             // Force a refresh of the calendar to ensure events are properly rendered
    //             const calendarApi = effectiveRef.current.getApi();
    //             setTimeout(() => {
    //                 calendarApi.updateSize();
                    
    //                 // Apply additional styling to day view events
    //                 const dayViewEvents = document.querySelectorAll('.fc-resourceTimeGridDay-view .fc-event');
    //                 dayViewEvents.forEach(event => {
    //                     event.style.display = 'flex';
    //                     event.style.visibility = 'visible';
    //                     event.style.opacity = '1';
    //                     event.style.zIndex = '5';
    //                     event.style.minHeight = '30px';
    //                 });
    //             }, 100);
    //         }
    //     };
        
    //     enhanceDayViewEvents();
        
    //     // Re-apply when events or view changes
    //     return () => {
    //         // Cleanup if needed
    //     };
    // }, [events, currentView, effectiveRef]);

    const handleDatesSet = (info) => {
        if (typeof onDateChange === 'function') {
            onDateChange(info.view.activeStart);
        }
        if (typeof onViewChange === 'function') {
            onViewChange(info.view.type);
        }
    };

    // Custom event rendering function for production tasks
    const renderEventContent = (eventInfo) => {
        const eventResources = eventInfo.event.getResources ? eventInfo.event.getResources() : [];
        const actualResourceId = eventInfo.event.resourceId || (eventResources.length > 0 ? eventResources[0]?.id : undefined);

        console.log(`[RenderEventContent] View: ${eventInfo.view.type}, Event ID: ${eventInfo.event.id}, Title: ${eventInfo.event.title}, RecipeName: ${eventInfo.event.extendedProps?.recipe_name}, Start: ${eventInfo.event.start}, event.resourceId: ${eventInfo.event.resourceId}, getResources[0]?.id: ${eventResources.length > 0 ? eventResources[0]?.id : 'N/A'}, actualUsedResourceId: ${actualResourceId}`);
        // console.log('[RenderEventContent] Full eventInfo.event.getResources():', eventResources);

        const extendedProps = eventInfo.event.extendedProps || {}; // Ensure extendedProps exists
        const { status, task_type, recipe_name, batch_size, yield_unit, isPlaceholder, description, isExternal } = extendedProps;

        if (eventInfo.view.type === 'resourceTimeGridDay' && typeof recipe_name === 'undefined') {
            console.warn('[RenderEventContent - DayView Missing RecipeName] Full eventInfo.event:', JSON.stringify(eventInfo.event, null, 2));
        }
        
        let backgroundColor, textColor, borderColor, effectiveStatus;
        
        // Determine the current view type for specific styling
        const isTimelineView = eventInfo.view.type.includes('timeline');
        const isMonthView = eventInfo.view.type === 'dayGridMonth';
        const isDayView = eventInfo.view.type === 'resourceTimeGridDay';
        const isWeekView = eventInfo.view.type === 'timeGridWeek';
        
        if (isPlaceholder || isExternal) {
            backgroundColor = eventInfo.event.backgroundColor || theme.palette.grey[300];
            textColor = eventInfo.event.textColor || theme.palette.getContrastText(backgroundColor);
            borderColor = eventInfo.event.borderColor || theme.palette.grey[500];
            effectiveStatus = 'placeholder'; // Use a distinct status for styling if needed
        } else {
            effectiveStatus = status;
            // Default colors, will be overridden by status
            backgroundColor = theme.palette.grey[200];
            textColor = theme.palette.getContrastText(backgroundColor);
            borderColor = theme.palette.grey[400];

            // Color coding based on production task status
            switch (effectiveStatus) {
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
                    backgroundColor = theme.palette.grey[300];
                    textColor = theme.palette.text.primary;
                    borderColor = theme.palette.grey[500];
                    break;
                default:
                    // Keep default colors
                    break;
            }
        }
        
        // Determine what icon to show based on task type
        let taskTypeIcon = '';
        if (task_type === 'production') {
            taskTypeIcon = '🍳'; // Cooking emoji for production tasks
        } else if (task_type === 'prep') {
            taskTypeIcon = '🔪'; // Knife emoji for prep tasks
        } else if (task_type === 'cleaning') {
            taskTypeIcon = '🧹'; // Broom emoji for cleaning tasks
        }
        
        // Determine what to display as the title
        const displayTitle = recipe_name || (eventInfo.event.extendedProps && eventInfo.event.extendedProps.recipe_name) || eventInfo.event.title || 'Untitled Task';
        
        // Create tooltip content
        const tooltipTitle = `${displayTitle} (${batch_size || '?'} ${yield_unit || ''})
${description || ''}
Status: ${effectiveStatus || 'unknown'}`;
        
        // Add placeholder class if this is a placeholder event
        const className = isPlaceholder ? 'placeholder-event' : '';
        
        // Special handling for day view to ensure visibility
        if (isDayView) {
            // For day view, use a more visible and robust rendering
            return (
                <Tooltip title={tooltipTitle}>
                    <Box
                        className={`production-event ${className} day-view-event`}
                        sx={{
                            backgroundColor,
                            color: textColor,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            borderLeft: `6px solid ${borderColor}`,
                            overflow: 'visible',
                            height: '100%',
                            minHeight: '35px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxShadow: theme.shadows[2],
                            opacity: isPlaceholder ? 0.8 : 1,
                            position: 'relative',
                            zIndex: 10,
                            margin: '1px 0',
                        }}
                    >
                        <Typography 
                            variant="body1"
                            sx={{ 
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                lineHeight: 1.5,
                                overflow: 'visible',
                                whiteSpace: 'normal',
                                textDecoration: effectiveStatus === 'completed' ? 'line-through' : 'none',
                                color: textColor,
                                display: 'block',
                                width: '100%',
                            }}
                        >
                            {taskTypeIcon} {displayTitle}
                        </Typography>
                        {eventInfo.timeText && (
                            <Typography 
                                variant="caption"
                                sx={{ 
                                    fontWeight: 500,
                                    display: 'block',
                                    width: '100%',
                                }}
                            >
                                {eventInfo.timeText}
                            </Typography>
                        )}
                    </Box>
                </Tooltip>
            );
        }
        
        // Standard rendering for other views
        return (
            <Tooltip title={tooltipTitle}>
                <Box
                    className={`production-event ${className}`}
                    sx={{
                        backgroundColor,
                        color: textColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        borderLeft: `4px solid ${borderColor}`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        height: '100%',
                        minHeight: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[1],
                        opacity: isPlaceholder ? 0.7 : 1,
                        position: 'relative',
                        zIndex: isPlaceholder || isExternal ? 5 : 1,
                        // Specific styling for timeline view
                        ...(isTimelineView && {
                            minWidth: '80px',
                            minHeight: '30px',
                        }),
                        // Specific styling for month view
                        ...(isMonthView && {
                            minHeight: '20px',
                        }),
                        // Specific styling for week view
                        ...(isWeekView && {
                            minHeight: '25px',
                        }),
                    }}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: effectiveStatus === 'completed' ? 'line-through' : 'none',
                            fontSize: isMonthView ? '0.75rem' : '0.875rem',
                            lineHeight: isMonthView ? 1.2 : 1.43,
                            display: 'block',
                            width: '100%',
                            fontWeight: 'bold',
                        }}
                    >
                        {taskTypeIcon} {displayTitle}
                    </Typography>
                    {eventInfo.timeText && (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textDecoration: effectiveStatus === 'completed' ? 'line-through' : 'none',
                            }}
                        >
                            {eventInfo.timeText}
                        </Typography>
                    )}
                </Box>
            </Tooltip>
        );
    };

    return (
        <Box sx={{ position: 'relative', zIndex: 0 }}>
            <FullCalendar
                ref={calendarRef} // Attach the ref here
                plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
                initialView={currentView || 'resourceTimeGridDay'} // Set initial view
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,resourceTimeGridDay,resourceTimelineWeek'
                }}
                views={{
                    resourceTimelineWeek: {
                        type: 'resourceTimeline',
                        duration: { days: 7 },
                        buttonText: 'Timeline'
                    }
                }}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                nowIndicator={true}
                droppable={true} // Enable dropping external elements onto the calendar
                initialDate={currentDate}
                events={events}
                resources={resources}
                eventContent={renderEventContent}
                eventClick={(info) => onEventClick && onEventClick(info)}
                eventDrop={(info) => onEventDrop && onEventDrop(info)}
                eventResize={(info) => eventResize && eventResize(info)}
                dateClick={(info) => onDateClick && onDateClick(info)}
                datesSet={handleDatesSet} // This now handles date and view changes
                eventReceive={(info) => onEventReceive && onEventReceive(info)}
                height="auto"
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                resourceAreaHeaderContent="Staff"
                schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            />
        </Box>
    );
};

export default ProductionSchedulerCalendar;
