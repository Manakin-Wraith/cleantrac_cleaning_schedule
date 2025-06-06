import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
        const { status, task_type, recipe_name, batch_size, yield_unit, isPlaceholder, description } = eventInfo.event.extendedProps;
        
        let backgroundColor, textColor, borderColor, effectiveStatus;

        if (isPlaceholder) {
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
                    backgroundColor = theme.palette.grey[400];
                    textColor = theme.palette.getContrastText(theme.palette.grey[400]);
                    borderColor = theme.palette.grey[600];
                    break;
                default:
                    // Keep default grey for unknown statuses
                    break;
            }
        }

        // Additional styling based on task type
        let taskTypeIcon = '📋'; // Default icon
        if (task_type) { // Only show icon if task_type is defined
            switch (task_type) {
                case 'prep':
                    taskTypeIcon = '🔪';
                    break;
                case 'production':
                    taskTypeIcon = '👨‍🍳';
                    break;
                case 'post_production':
                    taskTypeIcon = '🧹';
                    break;
                case 'quality_check':
                    taskTypeIcon = '✓';
                    break;
                case 'packaging':
                    taskTypeIcon = '📦';
                    break;
                case 'cleanup':
                    taskTypeIcon = '🧼';
                    break;
                default:
                    break;
            }
        } else if (isPlaceholder) {
            taskTypeIcon = '⏳'; // Placeholder icon
        }
        
        const displayTitle = isPlaceholder ? `(Pending) ${eventInfo.event.title}` : eventInfo.event.title;
        const tooltipTitle = `${recipe_name || eventInfo.event.title} - ${batch_size || ''} ${yield_unit || ''} - ${description || ''}`.trim().replace(/^- - $/, '');

        return (
            <Tooltip title={tooltipTitle}>
                <Box
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
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[1],
                        opacity: isPlaceholder ? 0.7 : 1,
                    }}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: effectiveStatus === 'completed' ? 'line-through' : 'none',
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
