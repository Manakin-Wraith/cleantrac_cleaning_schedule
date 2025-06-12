import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Box } from '@mui/material';

// New UI shell components
import CalendarPageLayout from './layout/CalendarPageLayout';
import CalendarHeaderControls from './header/CalendarHeaderControls';
import CalendarRightSidebar from './sidebar/CalendarRightSidebar';
import CollapsibleFiltersDisplay from './filters/CollapsibleFiltersDisplay';
import CleaningFilters from './filters/CleaningFilters';
import CleaningTaskEventContent from './event_rendering/CleaningTaskEventContent';

const cleaningStatuses = ['Completed', 'Pending Review', 'Pending', 'Overdue'];
const mockDepartments = ['Floor Care', 'Restrooms', 'Kitchen', 'Common Areas'];

const TaskSchedulerCalendar = ({ 
    events, 
    resources, 
    currentDate, 
    onDateChange, 
    onEventDrop, 
    onEventClick, 
    eventResize,
    onEventReceive,
    onDateClick,
    calendarRef
}) => {
    const localCalendarRef = useRef(null);
    const effectiveRef = calendarRef || localCalendarRef;

    // State for new UI controls
    const [view, setView] = useState('resourceTimelineWeek');
    const [isFiltersVisible, setFiltersVisible] = useState(true);
        const [selectedResources, setSelectedResources] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    // Memoize filtered events based on selected resources
    const filteredEvents = useMemo(() => {
        // Add null check to prevent errors when events is undefined
        return (events || []).filter(event => {
            const resourceMatch = selectedResources.length === 0 || selectedResources.includes(event.resourceId);
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(event.extendedProps.status);
                        const searchMatch = !searchTerm || event.title.toLowerCase().includes(searchTerm.toLowerCase());
            const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(event.extendedProps.department);
            return resourceMatch && statusMatch && searchMatch && departmentMatch;
        });
    }, [events, selectedResources, selectedStatuses, searchTerm]);

    const handleViewChange = (newView) => {
        const calendarApi = effectiveRef.current.getApi();
        calendarApi.changeView(newView);
        setView(newView);
    };

    const handleDateNav = (direction) => {
        const calendarApi = effectiveRef.current.getApi();
        if (direction === 'today') {
            calendarApi.today();
        } else {
            calendarApi[direction](); // 'next' or 'prev'
        }
        onDateChange(calendarApi.getDate());
    };

    const handleResourceSelectionChange = (newSelectedResourceIds) => {
        setSelectedResources(newSelectedResourceIds);
    };

    // Placeholder handlers for Quick Actions
    const handleNewTask = () => console.log('New Task clicked');
    const handleNewRecipe = () => console.log('New Recipe clicked');

    return (
        <CalendarPageLayout
            header={
                <CalendarHeaderControls
                    view={view}
                    onViewChange={handleViewChange}
                    onDateNav={handleDateNav}
                    onFiltersToggle={() => setFiltersVisible(!isFiltersVisible)}
                    isFiltersVisible={isFiltersVisible}
                    title="Cleaning Schedule"
                />
            }
            sidebar={
                <CalendarRightSidebar
                    onNewTask={handleNewTask}
                    onNewRecipe={handleNewRecipe}
                    resources={resources}
                    selectedResourceIds={selectedResources}
                    onResourceSelectionChange={handleResourceSelectionChange}
                    legendItems={[
                        { title: 'Completed', color: 'success.light' },
                        { title: 'Pending Review', color: 'warning.light' },
                        { title: 'Pending', color: 'info.light' },
                        { title: 'Overdue', color: 'error.light' },
                    ]}
                />
            }
            filters={
                <CollapsibleFiltersDisplay isVisible={isFiltersVisible}>
                                        <CleaningFilters 
                        statuses={cleaningStatuses}
                        selectedStatuses={selectedStatuses}
                        onStatusChange={setSelectedStatuses}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        departments={mockDepartments}
                        selectedDepartments={selectedDepartments}
                        onDepartmentChange={setSelectedDepartments}
                    />
                </CollapsibleFiltersDisplay>
            }
        >
            <Box sx={{ height: '100%', width: '100%' }}>
                <FullCalendar
                    ref={effectiveRef}
                    plugins={[dayGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={false} // Disable default header
                    initialView={view}
                    initialDate={currentDate}
                    editable={true}
                    selectable={true}
                    droppable={true}
                    events={filteredEvents} // Use filtered events
                    resources={resources}
                    resourceAreaHeaderContent="Staff"
                    eventDrop={onEventDrop}
                    eventResize={eventResize}
                    eventClick={onEventClick}
                    eventReceive={onEventReceive}
                    dateClick={onDateClick}
                    eventContent={(eventInfo) => <CleaningTaskEventContent eventInfo={eventInfo} />} // Use new component
                    height="100%"
                    schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
                />
            </Box>
        </CalendarPageLayout>
    );
};

export default TaskSchedulerCalendar;