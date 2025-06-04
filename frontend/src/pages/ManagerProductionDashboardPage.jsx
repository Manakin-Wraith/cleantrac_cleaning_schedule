import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import TaskSchedulerCalendar from "../components/calendar/TaskSchedulerCalendar"; // Replaced ProductionCalendarView
// Mock/Placeholder for API service calls - replace with actual service imports
const mockApiClient = {
  get: async (url) => {
    console.log(`Mock GET: ${url}`);
    if (url.includes('/api/taskinstances')) { // Adjust endpoint as needed for production tasks
      // Simulate fetching production tasks
      return { 
        data: [
          { id: 'task1', task_name: 'Prepare Dough Batch 1', scheduled_start_time: new Date(new Date().setHours(9,0,0,0)).toISOString(), scheduled_end_time: new Date(new Date().setHours(11,0,0,0)).toISOString(), status: 'pending', priority: 'High', assigned_to_user_id: 'user1', production_line_id: 'line1', recipe_id: 'recipeA', notes: 'First batch of the day' },
          { id: 'task2', task_name: 'Bake Croissants', scheduled_start_time: new Date(new Date().setHours(10,0,0,0)).toISOString(), scheduled_end_time: new Date(new Date().setHours(12,0,0,0)).toISOString(), status: 'in_progress', priority: 'Medium', assigned_to_user_id: 'user2', production_line_id: 'line1', recipe_id: 'recipeB', notes: 'Ensure golden brown' },
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
  put: async (url, payload) => { console.log(`Mock PUT: ${url}`, payload); return { data: payload }; },
  post: async (url, payload) => { console.log(`Mock POST: ${url}`, payload); return { data: { id: 'newTask123', ...payload } }; },
};

import ProductionTaskDetailModal from '../components/ProductionScheduling/ProductionTaskDetailModal';
import ProductionEditTaskModal from '../components/ProductionScheduling/ProductionEditTaskModal';
import ProductionChangeStatusModal from '../components/ProductionScheduling/ProductionChangeStatusModal';
import ProductionTaskSheetPrintView from '../components/ProductionScheduling/ProductionTaskSheetPrintView'; // Import Print View
import { useReactToPrint } from 'react-to-print'; // Import for printing

const ManagerProductionDashboardPage = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToChangeStatus, setTaskToChangeStatus] = useState(null);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [taskToPrint, setTaskToPrint] = useState(null);
  const printComponentRef = useRef(null);

  // Department ID and Date Range would likely come from global state/context or page-level filters
  // State for TaskSchedulerCalendar
  const [calendarKey, setCalendarKey] = useState(0); // To force re-render of calendar if needed
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarResources, setCalendarResources] = useState([]);

  // Department ID would likely come from global state/context or page-level filters
  const [departmentId, setDepartmentId] = useState(null); // Example: null for all, or specific ID
  // dateRange is not directly used by TaskSchedulerCalendar, which uses currentDate and onDateChange
  // const [dateRange, setDateRange] = useState({
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
    // console.log('Task selected via onEventClick:', task);
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
        // Fetch production tasks (adjust API endpoint and params as needed)
        // Example: /api/production-tasks?departmentId=${departmentId}&date=${currentCalendarDate}
        const tasksResponse = await mockApiClient.get(`/api/taskinstances/?date=${currentCalendarDate.toISOString().split('T')[0]}`);
        const transformedEvents = tasksResponse.data.map(task => ({
          id: task.id,
          title: task.task_name,
          start: task.scheduled_start_time,
          end: task.scheduled_end_time,
          resourceId: task.assigned_to_user_id, // Or task.production_line_id if resources are lines
          extendedProps: { ...task, originalTask: task }, // Store original task and other props
          // Dynamically set color based on status for FullCalendar (optional, as TaskSchedulerCalendar has its own styling)
          // backgroundColor: task.status === 'completed' ? 'green' : task.status === 'pending' ? 'orange' : 'blue',
          // borderColor: task.status === 'completed' ? 'darkgreen' : task.status === 'pending' ? 'darkorange' : 'darkblue',
        }));
        setCalendarEvents(transformedEvents);

        // Fetch resources (e.g., staff)
        const usersResponse = await mockApiClient.get('/api/users'); // Adjust as needed
        const transformedResources = usersResponse.data.map(user => ({
          id: user.id,
          title: `${user.first_name} ${user.last_name}`,
        }));
        setCalendarResources(transformedResources);

      } catch (error) {
        console.error('Failed to fetch data for calendar:', error);
        // Handle error (e.g., show a notification)
      }
    };

    fetchData();
  }, [departmentId, currentCalendarDate]); // Refetch when department or date changes

  // Handlers for TaskSchedulerCalendar callbacks
  const handleCalendarEventClick = (clickInfo) => {
    // clickInfo.event is a FullCalendar EventApi object
    // Retrieve the original task data from extendedProps
    if (clickInfo.event.extendedProps && clickInfo.event.extendedProps.originalTask) {
      handleSelectTask(clickInfo.event.extendedProps.originalTask);
    } else {
      console.warn('Original task data not found in event.extendedProps', clickInfo.event);
      // Fallback or handle error if originalTask is missing
    }
  };

  const handleCalendarDateClick = (selectionInfo) => {
    // selectionInfo.dateStr, selectionInfo.resource (if available)
    console.log('Date clicked:', selectionInfo.dateStr);
    // Open the 'new task' modal, pre-filled with the clicked date/time and resource
    // This matches the functionality of onSelectSlot in the old calendar if used for creation
    setTaskToEdit({ start_time: selectionInfo.dateStr, resourceId: selectionInfo.resource?.id }); // Pass date and resource to new task modal
    setIsEditModalOpen(true);
  };

  const handleCalendarEventDrop = async (dropInfo) => {
    // dropInfo.event, dropInfo.oldEvent, dropInfo.delta, dropInfo.oldResource, dropInfo.newResource
    const { event, oldEvent, delta, oldResource, newResource } = dropInfo;
    console.log(`Event ${event.id} dropped. New start: ${event.startStr}, New end: ${event.endStr}, New resource: ${newResource?.id}`);
    const updatedTaskFields = {
        scheduled_start_time: event.startStr,
        scheduled_end_time: event.endStr || oldEvent.endStr, // FullCalendar might nullify end if not explicitly set during drag to all-day slot
        assigned_to_user_id: newResource ? newResource.id : oldEvent.extendedProps.assigned_to_user_id,
        // Potentially update production_line_id if resources are lines and it changed
    };

    try {
      // Call API to update the task
      // await mockApiClient.put(`/api/taskinstances/${event.id}/`, updatedTaskFields);
      console.log(`Mock API Call: Update task ${event.id} with`, updatedTaskFields);
      // Refresh events from server or update local state optimistically
      setCalendarEvents(prevEvents => prevEvents.map(e => 
        e.id === event.id ? { ...e, start: event.startStr, end: event.endStr, resourceId: newResource?.id, extendedProps: {...e.extendedProps, ...updatedTaskFields} } : e
      ));
      // Show success feedback
    } catch (error) {
      console.error('Failed to update task after drop:', error);
      // Revert event to its original position (dropInfo.revert() can be called)
      dropInfo.revert();
      // Show error feedback
    }
  };

  const handleCalendarEventResize = async (resizeInfo) => {
    const { event, oldEvent } = resizeInfo;
    console.log(`Event ${event.id} resized. New start: ${event.startStr}, New end: ${event.endStr}`);
    const updatedTaskFields = {
        scheduled_start_time: event.startStr,
        scheduled_end_time: event.endStr,
    };
    try {
      // await mockApiClient.put(`/api/taskinstances/${event.id}/`, updatedTaskFields);
      console.log(`Mock API Call: Update task ${event.id} with`, updatedTaskFields);
      setCalendarEvents(prevEvents => prevEvents.map(e => 
        e.id === event.id ? { ...e, start: event.startStr, end: event.endStr, extendedProps: {...e.extendedProps, ...updatedTaskFields} } : e
      ));
      // Show success feedback
    } catch (error) {
      console.error('Failed to update task after resize:', error);
      resizeInfo.revert();
      // Show error feedback
    }
  };

  const handleCalendarDateChange = (newDate) => {
    setCurrentCalendarDate(newDate);
    // Data fetching is handled by useEffect watching currentCalendarDate
  };


  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Production Schedule Dashboard
        </Typography>
        <TaskSchedulerCalendar 
          key={calendarKey} // To help with re-initialization if needed
          events={calendarEvents}
          resources={calendarResources}
          currentDate={currentCalendarDate}
          onDateChange={handleCalendarDateChange} // For when user navigates in calendar
          onEventClick={handleCalendarEventClick} // For clicking on an existing event
          onEventDrop={handleCalendarEventDrop}   // For drag-and-drop existing event
          eventResize={handleCalendarEventResize} // For resizing an existing event
          // onEventReceive for external drops (if we implement a draggable list of unscheduled tasks)
          onDateClick={handleCalendarDateClick}   // For clicking on an empty date/time slot to create new task
          // calendarRef can be used if parent needs to call FullCalendar methods directly
        />
      </Paper>

      {selectedTask && (
        <ProductionTaskDetailModal
          open={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          task={selectedTask}
          onEdit={() => handleOpenEditModal(selectedTask)} 
          onChangeStatus={() => handleOpenChangeStatusModal(selectedTask)}
          onPrint={() => handleOpenPrintView(selectedTask)}
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

export default ManagerProductionDashboardPage;
