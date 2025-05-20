import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // for drag & drop, resizing
import { Box } from '@mui/material';

// Helper to get a consistent color based on task status
const getStatusColorForCalendar = (status) => {
    switch (status) {
        case 'pending': return '#ffa726'; // Amber
        case 'in_progress': return '#29b6f6'; // Light Blue
        case 'completed': return '#66bb6a'; // Green
        case 'missed': return '#ef5350'; // Red
        default: return '#78909c'; // Blue Grey
    }
};

const TaskSchedulerCalendar = ({ tasks, staffUsers, selectedDate, onEventDrop, onEventClick, eventResize }) => {
    const calendarRef = useRef(null); // Ref to access FullCalendar methods

    const calendarEvents = tasks.map(task => {
        const event = {
            id: task.id.toString(),
            title: task.cleaning_item_name || 'Unnamed Task',
            extendedProps: { ...task },
            backgroundColor: getStatusColorForCalendar(task.status),
            borderColor: getStatusColorForCalendar(task.status),
            // Use assigned_to_details from the serializer for the resourceId
            resourceId: task.assigned_to_details ? task.assigned_to_details.id.toString() : undefined,
        };

        if (task.start_time && task.due_date) { // Assuming start_time exists for timed events
            event.start = `${task.due_date}T${task.start_time}`; 
            if (task.end_time) {
                event.end = `${task.due_date}T${task.end_time}`;
            }
            event.allDay = false;
        } else {
            event.start = task.due_date; // For all-day events, just the date
            event.allDay = true;
        }
        return event;
    });

    const calendarResources = staffUsers.map(staff => ({
        // staff is a User object, staff.profile is the UserProfile object.
        // event.resourceId is set to task.assigned_to_details.id, which is UserProfile.id.
        // So, the resource ID here must also be UserProfile.id.
        id: staff.profile ? staff.profile.id.toString() : staff.id.toString(), // Fallback to staff.id if no profile, though profile should exist for staff
        title: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.username || `Staff ${staff.profile ? staff.profile.id : staff.id}`,
    }));

    // Ensure initialDate is a Date object for FullCalendar
    const initialCalendarDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

    return (
        <Box sx={{ height: '75vh', position: 'relative' }}> 
            <FullCalendar
                ref={calendarRef} // Assign ref
                plugins={[dayGridPlugin, resourceTimeGridPlugin, timeGridPlugin, interactionPlugin]} // Ensure all needed plugins
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,resourceTimeGridWeek,resourceTimeGridDay' // Adjusted for new flow
                }}
                initialView="resourceTimeGridDay" // Default to resourceTimeGridDay view
                initialDate={initialCalendarDate}
                editable={true}      // To enable drag & drop
                selectable={true}    // To enable clicking/selecting time slots
                droppable={true}     // Allows dragging external events onto the calendar
                events={calendarEvents}
                resources={calendarResources} // Resources are still needed for when switching to resource views
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
                    // If you still want to propagate the click for other purposes (e.g., opening an edit modal):
                    // if (typeof onEventClick === 'function') {
                    //     onEventClick(clickInfo); 
                    // }
                }}
                height="100%"
                schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            />
        </Box>
    );
};

export default TaskSchedulerCalendar;