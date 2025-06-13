import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import ProductionSchedulerCalendar from '../components/recipes/ProductionSchedulerCalendar';
import ProductionAssignmentModal from '../components/recipes/ProductionAssignmentModal';
import ProductionTaskDetailModal from '../components/recipes/ProductionTaskDetailModal';

// Import the new layout and UI components
import CalendarPageLayout from '../components/calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../components/calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../components/calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../components/calendar/sidebar/QuickActionsMenu';
import CalendarLegend from '../components/calendar/sidebar/CalendarLegend';
import ResourceFilterList from '../components/calendar/sidebar/ResourceFilterList';
import CollapsibleFiltersDisplay from '../components/calendar/filters/CollapsibleFiltersDisplay';
import RecipeFilters from '../components/calendar/filters/RecipeFilters';

// Mock Data - to be replaced with API data
const recipeStatuses = ['Completed', 'In Progress', 'Pending', 'Missed'];
const mockDepartments = ['Kitchen', 'Bakery', 'Front of House', 'Catering'];

const mockLegendItems = [
  { label: 'Completed', color: '#4caf50' },
  { label: 'In Progress', color: '#ff9800' },
  { label: 'Pending', color: '#2196f3' },
  { label: 'Missed', color: '#f44336' },
];

const ProductionSchedulerPage = () => {
  // State for calendar data and view
  const [eventsData, setEventsData] = useState([]);
  const [resourcesData, setResourcesData] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date()); // Initialize with current date
  const [currentCalendarView, setCurrentCalendarView] = useState('dayGridMonth'); // Default view
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalInfo, setModalInfo] = useState({ event: null, isNew: false });
  const [successMessage, setSuccessMessage] = useState('');
  const calendarRef = useRef(null);
  
  // State for filters and sidebar
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // Fetch/initialize data (mocked for now)
  useEffect(() => {
    const juneEvents = [
      { id: 'recipe1', resourceId: 'staff1', title: 'Recipe Prep', start: '2025-06-03T09:00:00', end: '2025-06-03T11:00:00', extendedProps: { status: 'Completed', type: 'recipe', notes: 'Prepare ingredients for lunch service.' } },
      { id: 'clean1', resourceId: 'staff2', title: 'Deep Clean Kitchen', start: '2025-06-04T14:00:00', end: '2025-06-04T16:00:00', extendedProps: { status: 'Pending', type: 'cleaning', area: 'Main Kitchen' } },
      { id: 'recipe2', resourceId: 'staff1', title: 'Recipe Prep', start: '2025-06-06T09:00:00', end: '2025-06-06T11:00:00', extendedProps: { status: 'Completed', type: 'recipe' } },
      { id: 'clean2', resourceId: 'staff3', title: 'Deep Clean Bakery', start: '2025-06-08T13:00:00', end: '2025-06-08T15:00:00', extendedProps: { status: 'Pending', type: 'cleaning' } },
      { id: 'recipe3', resourceId: 'staff2', title: 'Recipe Prep', start: '2025-06-09T10:00:00', end: '2025-06-09T12:00:00', extendedProps: { status: 'Completed', type: 'recipe' } },
      { id: 'recipe4', resourceId: 'staff1', title: 'Recipe Prep', start: '2025-06-12T09:30:00', end: '2025-06-12T11:30:00', extendedProps: { status: 'Completed', type: 'recipe' } },
      { id: 'clean3', resourceId: 'staff2', title: 'Deep Clean Storage', start: '2025-06-13T15:00:00', end: '2025-06-13T17:00:00', extendedProps: { status: 'Pending', type: 'cleaning' } },
      { id: 'recipe5', resourceId: 'staff3', title: 'Recipe Prep', start: '2025-06-15T08:00:00', end: '2025-06-15T10:00:00', extendedProps: { status: 'Completed', type: 'recipe' } },
      { id: 'clean4', resourceId: 'staff1', title: 'Deep Clean Front', start: '2025-06-16T16:00:00', end: '2025-06-16T18:00:00', extendedProps: { status: 'Pending', type: 'cleaning' } },
      { id: 'recipe6', resourceId: 'staff2', title: 'Recipe Prep', start: '2025-06-18T11:00:00', end: '2025-06-18T13:00:00', extendedProps: { status: 'Completed', type: 'recipe' } },
      { id: 'clean5', resourceId: 'staff3', title: 'Deep Clean Ovens', start: '2025-06-19T14:00:00', end: '2025-06-19T15:30:00', extendedProps: { status: 'Pending', type: 'cleaning' } },
      { id: 'clean6', resourceId: 'staff1', title: 'Deep Clean Fryers', start: '2025-06-20T14:00:00', end: '2025-06-20T15:30:00', extendedProps: { status: 'Pending', type: 'cleaning' } },
      { id: 'recipe7', resourceId: 'staff2', title: 'Recipe Prep', start: '2025-06-21T09:00:00', end: '2025-06-21T11:00:00', extendedProps: { status: 'Completed', type: 'recipe' } },
    ];
    setEventsData(juneEvents);

    const staffResources = [
      { id: 'staff1', title: 'John D.' },
      { id: 'staff2', title: 'Sarah M.' },
      { id: 'staff3', title: 'Mike R.' },
    ];
    setResourcesData(staffResources);
    setCurrentCalendarDate(new Date(2025, 5, 1)); // Set to June 1st, 2025 for screenshot consistency
  }, []);

  // When the component mounts or resources change, select all resources by default
  useEffect(() => {
    if (resourcesData.length > 0) {
      setSelectedResourceIds(resourcesData.map(r => r.id));
    }
  }, [resourcesData]);

  const handleOpenAssignmentModal = useCallback((eventInfo, isNew = false) => {
    setModalInfo({ event: eventInfo, isNew });
    setAssignmentModalOpen(true);
  }, []);

  const handleCloseAssignmentModal = useCallback(() => {
    setAssignmentModalOpen(false);
    setModalInfo({ event: null, isNew: false });
  }, []);

  const handleOpenDetailModal = useCallback((task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskSaved = useCallback((message) => {
    // Snackbar message must be a plain string; if an object is passed, fallback to default
    const safeMessage = typeof message === 'string' ? message : 'Task saved successfully!';
    setSuccessMessage(safeMessage);
    handleCloseAssignmentModal();
    // The calendar will refetch its own data internally now.
  }, [handleCloseAssignmentModal]);

  const handleTaskDeleted = useCallback((message) => {
    const safeMessage = typeof message === 'string' ? message : 'Task deleted successfully!';
    setSuccessMessage(safeMessage);
    handleCloseDetailModal();
    // TODO: Add logic to refetch or update eventsData state after deletion
  }, [handleCloseDetailModal]);

  const handleOpenNewRecipeModal = useCallback(() => {
    console.log('Open New Recipe Modal triggered');
    // This is a placeholder. In a real app, you might open a different modal
    // or enhance ProductionAssignmentModal to handle different types.
    setModalInfo({ event: null, isNew: true, type: 'recipe' }); 
    setAssignmentModalOpen(true);
  }, []);

  const handleCalendarDateChange = useCallback((date) => {
    setCurrentCalendarDate(date);
  }, []);

  const handleCalendarViewChange = useCallback((view) => {
    setCurrentCalendarView(view);
  }, []);

  const handleNavigate = (action) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (action === 'today') calendarApi.today();
    else if (action === 'prev') calendarApi.prev();
    else if (action === 'next') calendarApi.next();
  };

  // Filter events based on selected resources, statuses, search term, and departments
  const filteredEvents = React.useMemo(() => {
    return eventsData.filter(event => {
      const resourceMatch = selectedResourceIds.length === 0 || 
                           selectedResourceIds.includes(event.resourceId);
      
      const statusMatch = selectedStatuses.length === 0 || 
                         (event.extendedProps && selectedStatuses.includes(event.extendedProps.status));
      
      const searchMatch = !searchTerm || 
                         (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const departmentMatch = selectedDepartments.length === 0 || 
                             (event.extendedProps && selectedDepartments.includes(event.extendedProps.department));
      
      return resourceMatch && statusMatch && searchMatch && departmentMatch;
    });
  }, [eventsData, selectedResourceIds, selectedStatuses, searchTerm, selectedDepartments]);

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  // Header Controls Component
  const headerControls = (
    <CalendarHeaderControls
      currentDate={currentCalendarDate}
      currentView={currentCalendarView}
      onNavigate={handleNavigate}
      onViewChange={handleCalendarViewChange}
      onToggleFilters={() => setFiltersOpen(!isFiltersOpen)}
    />
  );

  // Sidebar Component
  const sidebarContent = (
    <CalendarRightSidebar
      quickActionsContent={
        <QuickActionsMenu
          onNewTaskClick={() => handleOpenAssignmentModal(null, true)}
          onNewRecipeClick={handleOpenNewRecipeModal}
        />
      }
      legendContent={<CalendarLegend legendItems={mockLegendItems} />}
      resourceFilterContent={
        <ResourceFilterList
          resources={resourcesData}
          selectedResourceIds={selectedResourceIds}
          onResourceSelectionChange={setSelectedResourceIds}
          onSelectAllResources={() => setSelectedResourceIds(resourcesData.map(r => r.id))}
          onClearAllResources={() => setSelectedResourceIds([])}
        />
      }
    />
  );

  // Filters Bar Component
  const filtersBarContent = (
    <CollapsibleFiltersDisplay isOpen={isFiltersOpen}>
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

  return (
    <CalendarPageLayout
      headerContent={headerControls}
      sidebarContent={sidebarContent}
      filtersBarContent={filtersBarContent}
    >
      <Box sx={{ position: 'relative', zIndex: 0, height: '100%' }}>
        <ProductionSchedulerCalendar
        ref={calendarRef}
        events={filteredEvents}
        resources={resourcesData}
        currentDate={currentCalendarDate}
        currentView={currentCalendarView}
        onDateChange={handleCalendarDateChange}
        onViewChange={handleCalendarViewChange}
        // eventDrop, eventResize handlers can be added here if needed
        onOpenAssignmentModal={handleOpenAssignmentModal} // For dateClick and eventReceive in calendar
        onOpenDetailModal={handleOpenDetailModal}     // For eventClick in calendar
        onNewTask={() => handleOpenAssignmentModal(null, true)} // For 'New Task' button in sidebar
        onNewRecipe={handleOpenNewRecipeModal} // For 'New Recipe' button in sidebar 
        useSimpleLayout={true} // Tell the calendar to use simple layout without its own header/sidebar
      />
      {/* Modals and Snackbar remain at this page level */}
      {assignmentModalOpen && (
        <ProductionAssignmentModal
          open={assignmentModalOpen}
          onClose={handleCloseAssignmentModal}
          onSave={handleTaskSaved}
          eventInfo={modalInfo.event}
          isNewTask={modalInfo.isNew}
        />
      )}
      {detailModalOpen && (
        <ProductionTaskDetailModal
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          onEdit={() => {
            // Close detail, open assignment modal for editing
            handleCloseDetailModal();
            handleOpenAssignmentModal(selectedTask, false);
          }}
          onDelete={handleTaskDeleted}
          task={selectedTask}
        />
      )}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      </Box>
    </CalendarPageLayout>
  );
};

export default ProductionSchedulerPage;
