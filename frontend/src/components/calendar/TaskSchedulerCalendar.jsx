import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Added for timeline view
import interactionPlugin from '@fullcalendar/interaction'; // for drag & drop, resizing
import { Box, Typography } from '@mui/material'; // Added Typography
import { useTheme } from '@mui/material/styles'; // Added useTheme

const TaskSchedulerCalendar = ({ 
    events,         // Pre-formatted events from ManagerDashboardPage
    resources,      // Pre-formatted resources from ManagerDashboardPage
    currentDate,    // Current date to display, controlled by parent
    onDateChange,   // Callback to inform parent of date navigation
    onEventDrop, 
    onEventClick, 
    eventResize,
    onEventReceive, // Added new prop for external event drops
    onDateClick,    // New prop for handling date clicks
    calendarRef     // Ref to access calendar API from parent
}) => {
    // Use ref from props if provided, otherwise create local ref
    const localCalendarRef = useRef(null);
    const effectiveRef = calendarRef || localCalendarRef;
    const theme = useTheme(); // Get the theme object

    const handleDatesSet = (dateInfo) => {
        // dateInfo.view.currentStart, dateInfo.view.currentEnd, dateInfo.start, dateInfo.end, dateInfo.startStr, dateInfo.endStr, dateInfo.timeZone
        // This is a good place to call onDateChange if you want to sync the parent's selectedDate
        // with the calendar's current view's central date, or the start of the view.
        // For simplicity, if onDateChange expects a single date (like for a DatePicker), 
        // we might use the view's active start date or a calculated center.
        // Let's assume onDateChange in ManagerDashboardPage expects a new primary date.
        if (typeof onDateChange === 'function') {
            // FullCalendar's current view might span a week or month. 
            // For a day view, dateInfo.view.activeStart is good.
            // For week/month, it's often the start of the interval.
            // ManagerDashboardPage currently uses a single 'selectedDate'. 
            // We can use the start of the current view as the new selectedDate.
            onDateChange(dateInfo.view.activeStart);
        }
    };

    // Custom event rendering function for eventContent
    const renderEventContent = (eventInfo) => {
        const { status, priority } = eventInfo.event.extendedProps;
        const isCompleted = status === 'completed';

        let backgroundColor = theme.palette.grey[200]; // Default background
        let textColor = theme.palette.getContrastText(backgroundColor);
        let borderColor = theme.palette.grey[400];

        switch (status) {
            case 'completed':
                backgroundColor = theme.palette.success.light;
                textColor = theme.palette.success.contrastText;
                borderColor = theme.palette.success.main;
                break;
            case 'pending_review':
                backgroundColor = theme.palette.warning.light;
                textColor = theme.palette.warning.contrastText;
                borderColor = theme.palette.warning.main;
                break;
            case 'pending':
                backgroundColor = theme.palette.info.light;
                textColor = theme.palette.info.contrastText;
                borderColor = theme.palette.info.main;
                break;
            // Add more cases for other statuses like 'overdue' or 'in_progress'
            // case 'overdue':
            //     backgroundColor = theme.palette.error.light;
            //     textColor = theme.palette.error.contrastText;
            //     borderColor = theme.palette.error.main;
            //     break;
            default:
                // Keep default grey for unknown statuses
                break;
        }

        return (
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
                    boxShadow: theme.shadows[1]
                }}
            >
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontWeight: 'bold', 
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        // fontSize: '0.8rem', // Keep or adjust as needed for body2
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {eventInfo.event.title}
                </Typography>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        // fontSize: '0.75rem', // Keep or adjust as needed for caption
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {eventInfo.timeText}
                </Typography>
                {priority && (
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                        Priority: {priority}
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ height: '75vh', position: 'relative' }}> 
            <FullCalendar
                ref={effectiveRef} // Assign ref
                plugins={[dayGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, timeGridPlugin, interactionPlugin]} 
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,resourceTimelineWeek,resourceTimeGridDay' // Reverted to resourceTimelineWeek for 'week'
                }}
                initialView="resourceTimelineWeek" // Reverted default view to resourceTimelineWeek
                initialDate={currentDate} // Use currentDate prop for the initial display
                editable={true}      // To enable drag & drop
                selectable={true}    // To enable clicking/selecting time slots
                droppable={true}     // Allows dragging external events onto the calendar
                events={events}      // Use the 'events' prop directly
                resources={resources}  // Use the 'resources' prop directly
                resourceAreaHeaderContent="Staff"
                eventDrop={onEventDrop} 
                eventResize={eventResize} 
                eventClick={(clickInfo) => { 
                    const calendarApi = effectiveRef.current?.getApi();
                    if (!calendarApi) return;

                    console.log('Event clicked:', clickInfo.event.title, 'on', clickInfo.event.start);
                    console.log('Current view type:', calendarApi.view.type);

                    // If in month view and an event is clicked, switch to resourceTimeGridDay for that event's date
                    if (calendarApi.view.type === 'dayGridMonth' && clickInfo.event.start) {
                        console.log(`Switching to resourceTimeGridDay for date: ${clickInfo.event.start}`);
                        calendarApi.changeView('resourceTimeGridDay', clickInfo.event.start);
                    }
                    // Propagate the click if an onEventClick handler is provided (e.g., for opening modals)
                    if (typeof onEventClick === 'function') {
                         onEventClick(clickInfo);
                    }
                }}
                eventReceive={onEventReceive} // Added eventReceive callback
                datesSet={handleDatesSet} // Use datesSet to handle navigation and sync parent
                eventContent={renderEventContent} // Added custom event rendering
                dateClick={onDateClick} // Add dateClick handler to open create task modal
                height="100%"
                schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            />
        </Box>
    );
};

export default TaskSchedulerCalendar;