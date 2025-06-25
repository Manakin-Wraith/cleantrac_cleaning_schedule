import React, { useState, useRef, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Box } from '@mui/material';

// Import the new layout and UI components
import CalendarPageLayout from '../calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../calendar/sidebar/QuickActionsMenu';
import CalendarLegend from '../calendar/sidebar/CalendarLegend';
import ResourceFilterList from '../calendar/sidebar/ResourceFilterList';
import CollapsibleFiltersDisplay from '../calendar/filters/CollapsibleFiltersDisplay';
import RecipeFilters from '../calendar/filters/RecipeFilters';
import RecipeEventContent from '../calendar/event_rendering/RecipeEventContent';

// Mock Data - to be replaced with props or state management
const recipeStatuses = ['Completed', 'In Progress', 'Pending', 'Missed'];
const mockDepartments = ['Kitchen', 'Bakery', 'Front of House', 'Catering'];

const mockLegendItems = [
  { label: 'Completed', color: '#4caf50' },
  { label: 'In Progress', color: '#ff9800' },
  { label: 'Pending', color: '#2196f3' },
  { label: 'Missed', color: '#f44336' },
];

const ProductionSchedulerCalendar = ({ 
    events = [],
    resources = [],
    currentDate,
    currentView = 'dayGridMonth',
    onDateChange,
    onEventDrop,
    eventResize,
    onViewChange,
    calendarRef,
    onNewTask, // Callback for creating a new task
    onNewRecipe, // Callback for creating a new recipe
    onOpenAssignmentModal, // New prop from parent
    onOpenDetailModal, // New prop from parent
    useSimpleLayout = false, // Flag to determine if we should use the simple layout or full layout
}) => {
    const localCalendarRef = useRef(null);
    const effectiveRef = calendarRef || localCalendarRef;

    // State for new UI components
    const [isFiltersOpen, setFiltersOpen] = useState(false);
        const [selectedResourceIds, setSelectedResourceIds] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    // When the component mounts or resources change, select all resources by default
    useEffect(() => {
        if (resources.length > 0) {
            setSelectedResourceIds(resources.map(r => r.id));
        }
    }, [resources]);

    const handleDatesSet = (info) => {
        if (typeof onDateChange === 'function') onDateChange(info.view.activeStart);
        if (typeof onViewChange === 'function') onViewChange(info.view.type);
    };

    const handleNavigate = (action) => {
        const calendarApi = effectiveRef.current?.getApi();
        if (!calendarApi) return;

        if (action === 'today') calendarApi.today();
        else if (action === 'prev') calendarApi.prev();
        else if (action === 'next') calendarApi.next();
    };

    const handleViewChange = (view) => {
        const calendarApi = effectiveRef.current?.getApi();
        if (calendarApi) calendarApi.changeView(view);
    };

    // Filter events based on selected resources
    const filteredEvents = useMemo(() => {
        if (selectedResourceIds.length === resources.length) {
            return events; // All resources selected, show all events
        }
                return events.filter(event => {
            const resourceMatch = selectedResourceIds.length === 0 || selectedResourceIds.includes(event.resourceId);
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(event.extendedProps.status);
                        const searchMatch = !searchTerm || event.title.toLowerCase().includes(searchTerm.toLowerCase());
            const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(event.extendedProps.department);
            return resourceMatch && statusMatch && searchMatch && departmentMatch;
        });
    }, [events, selectedResourceIds, resources.length]);

    // Internal handlers to call parent modal openers
    const handleEventClick = (clickInfo) => {
        const task = clickInfo.event.extendedProps;
        if (task && typeof onOpenDetailModal === 'function') {
            onOpenDetailModal(task);
        }
    };

    const handleDateClick = (clickInfo) => {
        if (typeof onOpenAssignmentModal === 'function') {
            onOpenAssignmentModal(clickInfo, true);
        }
    };

    const handleEventReceive = (eventInfo) => {
        if (typeof onOpenAssignmentModal === 'function') {
            onOpenAssignmentModal(eventInfo, true);
        }
    };

    // Header Controls Component
    const headerControls = (
        <CalendarHeaderControls
            currentDate={currentDate}
            currentView={currentView}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange}
            onToggleFilters={() => setFiltersOpen(!isFiltersOpen)}
        />
    );

    // Sidebar Component
    const sidebarContent = (
        <CalendarRightSidebar
            quickActionsContent={
                <QuickActionsMenu
                    onNewTaskClick={onNewTask}
                    onNewRecipeClick={onNewRecipe}
                />
            }
            legendContent={<CalendarLegend legendItems={mockLegendItems} />}
            resourceFilterContent={
                <ResourceFilterList
                    resources={resources}
                    selectedResourceIds={selectedResourceIds}
                    onResourceSelectionChange={setSelectedResourceIds}
                    onSelectAllResources={() => setSelectedResourceIds(resources.map(r => r.id))}
                    onClearAllResources={() => setSelectedResourceIds([])}
                />
            }
        />
    );

    // Filters Bar Component
    const filtersBarContent = (
        <CollapsibleFiltersDisplay isOpen={isFiltersOpen}>
            {/* Placeholder for actual filter controls */}
                        <RecipeFilters 
                statuses={recipeStatuses}
                selectedStatuses={selectedStatuses}
                onStatusChange={setSelectedStatuses}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                departments={mockDepartments}
                selectedDepartments={selectedDepartments}
                onDepartmentChange={setSelectedDepartments}
            />
        </CollapsibleFiltersDisplay>
    );

    // If useSimpleLayout is true, render only the FullCalendar component without the layout wrapper
    // This is used when the parent component (ProductionSchedulerPage) is managing the layout
    if (useSimpleLayout) {
        return (
            <Box sx={{ position: 'relative', zIndex: 0, height: '100%' }}>
                <FullCalendar
                    ref={effectiveRef}
                    plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false} // Use our custom header controls
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
                    droppable={true}
                    initialDate={currentDate}
                    events={filteredEvents} // Use filtered events
                    resources={resources}
                    eventContent={(eventInfo) => <RecipeEventContent eventInfo={eventInfo} />} // Use new event rendering component
                    eventClick={handleEventClick}
                    eventDrop={(info) => onEventDrop && onEventDrop(info)}
                    eventResize={(info) => eventResize && eventResize(info)}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    eventReceive={handleEventReceive}
                    height="100%"
                    allDaySlot={false}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    resourceAreaHeaderContent="Staff"
                    schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
                />
            </Box>
        );
    }
    
    // Otherwise, use the full layout with header, sidebar, and filters
    return (
        <CalendarPageLayout
            headerContent={headerControls}
            sidebarContent={sidebarContent}
            filtersBarContent={filtersBarContent}
        >
            <Box sx={{ position: 'relative', zIndex: 0, height: '100%' }}>
                <FullCalendar
                    ref={effectiveRef}
                    plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false} // Use our custom header controls
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
                    droppable={true}
                    initialDate={currentDate}
                    events={filteredEvents} // Use filtered events
                    resources={resources}
                    eventContent={(eventInfo) => <RecipeEventContent eventInfo={eventInfo} />} // Use new event rendering component
                    eventClick={handleEventClick}
                    eventDrop={(info) => onEventDrop && onEventDrop(info)}
                    eventResize={(info) => eventResize && eventResize(info)}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    eventReceive={handleEventReceive}
                    height="100%"
                    allDaySlot={false}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    resourceAreaHeaderContent="Staff"
                    schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
                />
            </Box>
        </CalendarPageLayout>
    );
};

export default ProductionSchedulerCalendar;
