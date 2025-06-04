import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import TaskSchedulerCalendar from '../components/calendar/TaskSchedulerCalendar'; // Replaced ProductionCalendarView
// Mock/Placeholder for API service calls - replace with actual service imports
const mockApiClient = {
  get: async (url) => {
    console.log(`Mock GET (Staff): ${url}`);
    if (url.includes('/api/taskinstances')) { // Adjust endpoint as needed for production tasks
      // Simulate fetching production tasks (for staff, this might be pre-filtered by backend)
      return { 
        data: [
          { id: 'task1', task_name: 'Prepare Dough Batch 1 (Staff)', scheduled_start_time: new Date(new Date().setHours(9,0,0,0)).toISOString(), scheduled_end_time: new Date(new Date().setHours(11,0,0,0)).toISOString(), status: 'pending', priority: 'High', assigned_to_user_id: 'user1', production_line_id: 'line1', recipe_id: 'recipeA', notes: 'First batch of the day' },
          { id: 'task2', task_name: 'Bake Croissants (Staff)', scheduled_start_time: new Date(new Date().setHours(10,0,0,0)).toISOString(), scheduled_end_time: new Date(new Date().setHours(12,0,0,0)).toISOString(), status: 'in_progress', priority: 'Medium', assigned_to_user_id: 'user2', production_line_id: 'line1', recipe_id: 'recipeB', notes: 'Ensure golden brown' },
        ]
      };
    }
    if (url.includes('/api/users')) { // Example for fetching staff as resources
        return { 
            data: [
                { id: 'user1', first_name: 'John', last_name: 'Doe' },
                { id: 'user2', first_name: 'Jane', last_name: 'Smith' },
            ]
        };
    }
    return { data: [] };
  },
  // Staff typically won't use PUT/POST for tasks, but include for structural consistency if any part needs it.
  put: async (url, payload) => { console.log(`Mock PUT (Staff): ${url}`, payload); return { data: payload }; },
  post: async (url, payload) => { console.log(`Mock POST (Staff): ${url}`, payload); return { data: { id: 'newTaskStaff123', ...payload } }; },
};

import ProductionTaskDetailModal from '../components/ProductionScheduling/ProductionTaskDetailModal';
import ProductionEditTaskModal from '../components/ProductionScheduling/ProductionEditTaskModal';
import ProductionChangeStatusModal from '../components/ProductionScheduling/ProductionChangeStatusModal';
import ProductionTaskSheetPrintView from '../components/ProductionScheduling/ProductionTaskSheetPrintView'; // Import Print View
import { useReactToPrint } from 'react-to-print'; // Import for printing

const StaffProductionDashboardPage = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToChangeStatus, setTaskToChangeStatus] = useState(null);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [taskToPrint, setTaskToPrint] = useState(null);
  const printComponentRef = useRef(null);

  // State for TaskSchedulerCalendar
  const [calendarKey, setCalendarKey] = useState(0); // To force re-render of calendar if needed
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarResources, setCalendarResources] = useState([]); // For staff, this might be just their own resource or empty

  // Department ID would likely come from global state/context or page-level filters
  const [departmentId, setDepartmentId] = useState(null); // Example: null for all, or specific ID
  // dateRange is not directly used by TaskSchedulerCalendar, which uses currentDate and onDateChange

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
    // console.log('Task selected via onEventClick (Staff):', task);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false); // Close detail modal when opening edit modal
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  const handleSaveTask = (updatedTask) => {
    console.log('Task saved (in page):', updatedTask);
    // Here you would typically update your main tasks list (e.g., refetch or update locally)
    // For now, just log and close
    // If the edited task was the one selected for detail view, re-select it to show updated details
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
      // setIsDetailModalOpen(true); // Optionally re-open detail modal, or let user re-select from calendar
    }
    // Potentially refresh calendar tasks if a real API was used
    handleCloseEditModal();
  };

  const handleOpenChangeStatusModal = (task) => {
    setTaskToChangeStatus(task);
    setIsChangeStatusModalOpen(true);
    // setIsDetailModalOpen(false); // Keep detail modal open in background or close, TBD by UX
  };

  const handleCloseChangeStatusModal = () => {
    setIsChangeStatusModalOpen(false);
    setTaskToChangeStatus(null);
  };

  const handleChangeTaskStatus = (task, newStatus, notes) => {
    console.log(`Status changed for task ${task.id}: ${newStatus}, Notes: ${notes}`);
    // Here you would typically update your main tasks list (e.g., refetch or update locally)
    // For now, just log and close
    // If the task whose status changed was the one selected for detail view, update it
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(prev => ({ ...prev, status: newStatus, history_log: [...(prev.history_log || []), {timestamp: new Date().toISOString(), user: 'Current User', action: 'Status Changed', details: `To: ${newStatus}. Notes: ${notes || 'N/A'}`}] }));
    }
    // Potentially refresh calendar tasks
    handleCloseChangeStatusModal();
  };

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    onAfterPrint: () => setTaskToPrint(null), // Clear taskToPrint after printing
  });

  const handleOpenPrintView = (task) => {
    setTaskToPrint(task);
    // The actual printing is triggered by useEffect below, once taskToPrint is set
  };

  useEffect(() => {
    if (taskToPrint) {
      handlePrint();
    }
  }, [taskToPrint, handlePrint]);

  // Fetch and transform data for TaskSchedulerCalendar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch production tasks. For staff, backend should ideally filter by assigned user.
        // const userId = 'currentUserActualId'; // Replace with actual current user ID from auth context
        const tasksResponse = await mockApiClient.get(`/api/taskinstances/?date=${currentCalendarDate.toISOString().split('T')[0]}`); // &assigned_to=${userId}
        const transformedEvents = tasksResponse.data.map(task => ({
          id: task.id,
          title: task.task_name,
          start: task.scheduled_start_time,
          end: task.scheduled_end_time,
          resourceId: task.assigned_to_user_id, // Staff view might only show their own resourceId
          extendedProps: { ...task, originalTask: task },
        }));
        setCalendarEvents(transformedEvents);

        // Fetch resources. For staff, this might be simplified to just their own resource or not needed if calendar doesn't use resource view.
        const usersResponse = await mockApiClient.get('/api/users'); 
        const transformedResources = usersResponse.data.map(user => ({
          id: user.id,
          title: `${user.first_name} ${user.last_name}`,
        }));
        setCalendarResources(transformedResources); // Or filter to current user: usersResponse.data.filter(u => u.id === userId).map(...)

      } catch (error) {
        console.error('Failed to fetch data for calendar (Staff):', error);
      }
    };

    fetchData();
  }, [departmentId, currentCalendarDate]); // Consider adding current user ID if filtering client-side or for query param

  // Handlers for TaskSchedulerCalendar callbacks
  const handleCalendarEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps && clickInfo.event.extendedProps.originalTask) {
      handleSelectTask(clickInfo.event.extendedProps.originalTask);
    } else {
      console.warn('Original task data not found in event.extendedProps (Staff)', clickInfo.event);
    }
  };

  const handleCalendarDateClick = (selectionInfo) => {
    console.log('Date clicked (Staff View) - typically disabled for task creation by staff:', selectionInfo.dateStr);
    // Staff usually don't create new tasks from calendar. If they do, logic to open modal would go here.
    // For example, if staff can log unscheduled work:
    // setTaskToEdit({ start_time: selectionInfo.dateStr, status: 'pending_approval' });
    // setIsEditModalOpen(true);
  };

  const handleCalendarEventDrop = (dropInfo) => {
    console.log('Event dropped (Staff View) - this action is typically disabled for staff.');
    dropInfo.revert(); // Automatically revert the change as staff usually cannot reschedule.
  };

  const handleCalendarEventResize = (resizeInfo) => {
    console.log('Event resized (Staff View) - this action is typically disabled for staff.');
    resizeInfo.revert(); // Automatically revert the change as staff usually cannot change durations.
  };

  const handleCalendarDateChange = (newDate) => {
    setCurrentCalendarDate(newDate);
  };


  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Production Schedule Dashboard
        </Typography>
        <TaskSchedulerCalendar 
          key={calendarKey}
          events={calendarEvents}
          resources={calendarResources} // Staff view might be configured to only show their resource or no resources column
          currentDate={currentCalendarDate}
          onDateChange={handleCalendarDateChange}
          onEventClick={handleCalendarEventClick}
          onEventDrop={handleCalendarEventDrop}   // Staff usually cannot drag/drop
          eventResize={handleCalendarEventResize} // Staff usually cannot resize
          onDateClick={handleCalendarDateClick}   // Staff usually cannot create tasks by clicking dates
          // Consider adding an 'editable={false}' prop to TaskSchedulerCalendar for staff
          // or more granular control props like 'eventStartEditable', 'eventDurationEditable'
        />
      </Paper>

      {selectedTask && (
        <ProductionTaskDetailModal
          open={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          task={selectedTask}
          onEditTask={() => handleOpenEditModal(selectedTask)} 
          onChangeStatus={() => handleOpenChangeStatusModal(selectedTask)}
          onPrintTaskSheet={() => handleOpenPrintView(selectedTask)}
        />
      )}

      {isEditModalOpen && (
        <ProductionEditTaskModal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          task={taskToEdit} // Pass null for new task, task object for editing
          onSave={handleSaveTask}
        />
      )}

      {isChangeStatusModalOpen && (
        <ProductionChangeStatusModal
          open={isChangeStatusModalOpen}
          onClose={handleCloseChangeStatusModal}
          task={taskToChangeStatus}
          onSubmit={handleChangeTaskStatus}
        />
      )}

      {/* Hidden component for printing */} 
      {taskToPrint && (
        <div style={{ display: 'none' }}>
          <ProductionTaskSheetPrintView ref={printComponentRef} task={taskToPrint} />
        </div>
      )}
    </Container>
  );
};

export default StaffProductionDashboardPage;
