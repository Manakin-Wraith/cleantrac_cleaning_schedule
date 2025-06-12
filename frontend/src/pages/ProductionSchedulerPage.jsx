import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import ProductionSchedulerCalendar from '../components/recipes/ProductionSchedulerCalendar';
import ProductionAssignmentModal from '../components/recipes/ProductionAssignmentModal';
import ProductionTaskDetailModal from '../components/recipes/ProductionTaskDetailModal';

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
    setSuccessMessage(message || 'Task saved successfully!');
    handleCloseAssignmentModal();
    // The calendar will refetch its own data internally now.
  }, [handleCloseAssignmentModal]);
  
  const handleTaskDeleted = useCallback((message) => {
    setSuccessMessage(message || 'Task deleted successfully!');
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

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}> {/* Adjust 64px based on actual AppBar height */}
      <ProductionSchedulerCalendar
        events={eventsData}
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
  );
};

export default ProductionSchedulerPage;
