import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Added for timeline view
import interactionPlugin from '@fullcalendar/interaction'; // for drag & drop, resizing
import { Box } from '@mui/material';

const TaskSchedulerCalendar = ({ 
    events,         // Pre-formatted events from ManagerDashboardPage
    resources,      // Pre-formatted resources from ManagerDashboardPage
    currentDate,    // Current date to display, controlled by parent
    onDateChange,   // Callback to inform parent of date navigation
    onEventDrop, 
    onEventClick, 
    eventResize,
    onEventReceive // Added new prop for external event drops
}) => {
    const calendarRef = useRef(null); // Ref to access FullCalendar methods

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

    return (
        <Box sx={{ height: '75vh', position: 'relative' }}> 
            <FullCalendar
                ref={calendarRef} // Assign ref
                plugins={[dayGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, timeGridPlugin, interactionPlugin]} // Added resourceTimelinePlugin
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,resourceTimelineWeek,resourceTimeGridDay' // Changed resourceTimeGridWeek to resourceTimelineWeek
                }}
                initialView="resourceTimelineWeek" // Changed default view to resourceTimelineWeek
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
                    const calendarApi = calendarRef.current?.getApi();
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
                height="100%"
                schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            />
        </Box>
    );
};

export default TaskSchedulerCalendar;