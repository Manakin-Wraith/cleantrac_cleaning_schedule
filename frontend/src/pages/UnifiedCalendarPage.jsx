import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { ScheduleProvider } from '../context/ScheduleContext'; // Filters bar removed – CollapsibleFiltersDisplay no longer used

// Import services
import { getCurrentUser } from '../services/authService';
import {
  getTaskInstances,
  updateTaskInstance,
  createTaskInstance,
  deleteTaskInstance,
} from '../services/taskService';
import { getCleaningItems } from '../services/cleaningItemService';
import { getUsers } from '../services/userService';
import apiClient from '../services/api'; // still used elsewhere if needed
import { getProductionSchedules, createProductionSchedule, updateProductionSchedule } from '../services/productionScheduleService';

// Import calendar components
import CalendarPageLayout from '../components/calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../components/calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../components/calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../components/calendar/sidebar/QuickActionsMenu';
import CalendarLegend from '../components/calendar/sidebar/CalendarLegend';
import TaskDrawer from '../components/calendar/TaskDrawer';
import ResourceFilterList from '../components/calendar/sidebar/ResourceFilterList';
import ScheduleListPanel from '../components/calendar/sidebar/ScheduleListPanel';

// Import modals
import TaskDetailModal from '../components/modals/TaskDetailModal';
import ProductionTaskDetailModal from '../components/recipes/ProductionTaskDetailModal';
import ProductionAssignmentModal from '../components/recipes/ProductionAssignmentModal';
import NewCleaningTaskModal from '../components/modals/NewCleaningTaskModal';

// Import placeholder components (to be implemented)
// import UnifiedCalendarComponent from '../components/calendar/UnifiedCalendarComponent';
// import UnifiedFilters from '../components/calendar/filters/UnifiedFilters';

// Temporary imports until we implement the unified components
import UnifiedCalendarComponent from '../components/calendar/UnifiedCalendarComponent';
import UnifiedFilters from '../components/calendar/filters/UnifiedFilters';

import dayjs from 'dayjs';
import { format } from 'date-fns';

// Mock Data - to be replaced with API data
const cleaningStatuses = ['Completed', 'Pending Review', 'Pending', 'Overdue'];
const recipeStatuses = ['Completed', 'In Progress', 'Pending', 'Missed'];
const mockDepartments = ['Floor Care', 'Restrooms', 'Kitchen', 'Common Areas', 'Bakery', 'Front of House', 'Catering'];

const legendItems = [
  { label: 'Completed', color: '#4caf50' },
  { label: 'Pending Review', color: '#ff9800' },
  { label: 'Pending', color: '#2196f3' },
  { label: 'Overdue/Missed', color: '#f44336' },
  { label: 'In Progress', color: '#ff9800' },
];

const UNASSIGNED_RESOURCE_ID = '___unassigned___';

// Helper functions
const pad = (n) => n.toString().padStart(2, '0');
const dateToYmd = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

const timeToHms = (date) => {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const timeFromIso = (iso) => (iso ? iso.split('T')[1]?.substring(0, 8) : null);

/**
 * UnifiedCalendarPage - Main container component that integrates both cleaning tasks and recipe production scheduling
 * This component fetches and normalizes data from both task types, manages unified state for filters, resources, 
 * and view options, handles event interactions, and coordinates modal displays.
 */
const UnifiedCalendarPage = () => {
  // Reference to the calendar API
  const calendarRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();

  // State for calendar data and view
  const [cleaningEvents, setCleaningEvents] = useState([]);
  const [recipeEvents, setRecipeEvents] = useState([]);
  const [resourcesData, setResourcesData] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [currentCalendarView, setCurrentCalendarView] = useState('resourceTimelineWeek');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for event type filter
  const [selectedEventType, setSelectedEventType] = useState('all'); // 'all', 'cleaning', or 'recipe'

  // State for modals
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [taskAssignmentModalOpen, setTaskAssignmentModalOpen] = useState(false);
  const [recipeDetailModalOpen, setRecipeDetailModalOpen] = useState(false);
  const [recipeAssignmentModalOpen, setRecipeAssignmentModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalInfo, setModalInfo] = useState({ event: null, isNew: false });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State for filters and sidebar
  const [isFiltersOpen, setFiltersOpen] = useState(true);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [selectedCleaningStatuses, setSelectedCleaningStatuses] = useState([]);
  const [selectedRecipeStatuses, setSelectedRecipeStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // Combined events array for schedule context
  const allEvents = useMemo(() => {
    const clean = cleaningEvents.map(ev => {
      let assignedName = '';
      if (ev.assigned_to_details) {
        const u = ev.assigned_to_details;
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (ev.assigned_to_name) {
        assignedName = ev.assigned_to_name;
      }
      const start = dayjs(`${ev.due_date || ev.date || ''} ${ev.start_time || ''}`).toDate();
      const end = ev.end_time ? dayjs(`${ev.due_date || ev.date || ''} ${ev.end_time}`).toDate() : undefined;
      return {
        ...ev,
        id: `cleaning-${ev.id}`,
        title: ev.cleaning_item?.name || ev.name || 'Cleaning Task',
        type: 'cleaning',
        status: ev.status || 'Pending',
        assignedToName: assignedName || 'Unassigned',
        resourceId: ev.assigned_to_details?.id || ev.assigned_to_id || null,
        start,
        end,
        extendedProps: {
          originalType: 'cleaning',
          status: ev.status || 'Pending',
          task_name: ev.cleaning_item?.name || ev.name || '',
          location: ev.location || ev.cleaning_item?.equipment || '',
          assigned_staff_name: assignedName || 'Unassigned',
          equipment_needed: ev.cleaning_item?.equipment || '',
          notes_count: ev.notes_count || 0,
        },
      };
    });

    const prod = recipeEvents.map(ev => {
      let assignedName = '';
      if (Array.isArray(ev.assigned_staff_details) && ev.assigned_staff_details.length) {
        const u = ev.assigned_staff_details[0];
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (Array.isArray(ev.assigned_staff) && ev.assigned_staff.length) {
        const u = ev.assigned_staff[0];
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (ev.assigned_staff_name) {
        assignedName = ev.assigned_staff_name;
      }
      const start = ev.scheduled_start_time ? new Date(ev.scheduled_start_time) : dayjs(`${ev.scheduled_date || ''} ${ev.start_time || ''}`).toDate();
      const end = ev.scheduled_end_time ? new Date(ev.scheduled_end_time) : (ev.end_time ? dayjs(`${ev.scheduled_date || ''} ${ev.end_time}`).toDate() : undefined);
      return {
        ...ev,
        id: `recipe-${ev.id}`,
        title: ev.recipe_name || ev.name || 'Recipe',
        type: 'production',
        status: ev.status || 'Pending',
        assignedToName: assignedName || 'Unassigned',
        resourceId: assignedName ? (ev.assigned_staff_details?.[0]?.id || ev.assigned_staff?.[0]?.id) : null,
        start,
        end,
        extendedProps: {
          originalType: 'recipe',
          status: ev.status || 'Pending',
          recipe_name: ev.recipe_name || ev.name || '',
          batch_size: ev.batch_size || '',
          yield_unit: ev.yield_unit || '',
          subtasks_completed: ev.subtasks_completed || 0,
          subtasks_total: ev.subtasks_total || 0,
          assigned_staff_name: assignedName || 'Unassigned',
          notes_count: ev.notes_count || 0,
        },
      };
    });
    return [...clean, ...prod];
  }, [cleaningEvents, recipeEvents]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Event type hide/reveal checkbox logic
      if (selectedEventType !== 'all' && event.originalType !== selectedEventType) {
        return false;
      }
      // Common filters
      const searchMatch = !searchTerm || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.extendedProps?.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const resourceMatch = selectedResourceIds.length === 0 || 
        selectedResourceIds.includes(event.resourceId);
      
      const departmentMatch = selectedDepartments.length === 0 || 
        selectedDepartments.includes(event.extendedProps?.department);
      
      // Type-specific filters
      let statusMatch = true;
      if (event.originalType === 'cleaning') {
        statusMatch = selectedCleaningStatuses.length === 0 || 
          selectedCleaningStatuses.includes(event.extendedProps?.status);
      } else if (event.originalType === 'recipe') {
        statusMatch = selectedRecipeStatuses.length === 0 || 
          selectedRecipeStatuses.includes(event.extendedProps?.status);
      }
      
      return searchMatch && resourceMatch && departmentMatch && statusMatch;
    });
  }, [
    allEvents, 
    selectedEventType, 
    searchTerm, 
    selectedResourceIds, 
    selectedDepartments, 
    selectedCleaningStatuses,
    selectedRecipeStatuses
  ]);

  // Event handlers
  const handleEventClick = useCallback((clickInfo) => {
    const rawId = clickInfo.event.id;
    const idStr = typeof rawId === 'string' ? rawId : `unknown-${rawId}`;
    const eventType = idStr.includes('-') ? idStr.split('-')[0] : clickInfo.event.extendedProps?.type || 'cleaning';
    
    setModalInfo({
      event: clickInfo.event,
      isNew: false
    });
    
    if (eventType === 'cleaning') {
      setSelectedTask(clickInfo.event);
      setTaskDetailModalOpen(true);
    } else if (eventType === 'recipe') {
      setSelectedTask(clickInfo.event);
      setRecipeDetailModalOpen(true);
    }
  }, []);

  const handleEventDrop = useCallback(async (dropInfo) => {
    const eventId = dropInfo.event.id;
    const [prefix, rawId] = eventId.split('-');
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end || null;

    try {
      if (prefix === 'cleaning') {
        await updateTaskInstance(rawId, {
          due_date: dateToYmd(newStart),
          start_time: timeToHms(newStart),
          end_time: newEnd ? timeToHms(newEnd) : null,
        });
      } else if (prefix === 'recipe') {
        await updateProductionSchedule(rawId, {
          scheduled_date: dateToYmd(newStart),
          scheduled_start_time: newStart.toISOString(),
          scheduled_end_time: newEnd ? newEnd.toISOString() : null,
        });
      }
      enqueueSnackbar('Event updated successfully', { variant: 'success' });
    } catch (err) {
      console.error('Update failed', err);
      enqueueSnackbar('Failed to update event', { variant: 'error' });
      dropInfo.revert();
    }
  }, [enqueueSnackbar]);

  const handleEventResize = useCallback(async (resizeInfo) => {
    const eventId = resizeInfo.event.id;
    const [prefix, rawId] = eventId.split('-');
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;

    try {
      if (prefix === 'cleaning') {
        await updateTaskInstance(rawId, {
          due_date: dateToYmd(newStart),
          start_time: timeToHms(newStart),
          end_time: newEnd ? timeToHms(newEnd) : null,
        });
      } else if (prefix === 'recipe') {
        await updateProductionSchedule(rawId, {
          scheduled_date: dateToYmd(newStart),
          scheduled_start_time: newStart.toISOString(),
          scheduled_end_time: newEnd ? newEnd.toISOString() : null,
        });
      }
      enqueueSnackbar('Event duration updated', { variant: 'success' });
    } catch (err) {
      console.error('Resize update failed', err);
      enqueueSnackbar('Failed to resize event', { variant: 'error' });
      resizeInfo.revert();
    }
  }, [enqueueSnackbar]);

  const handleDateClick = useCallback((dateClickInfo) => {
    // TODO: Implement date click logic for creating new events
    console.log('Date clicked:', dateClickInfo);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setCurrentCalendarView(newView);
    const api = calendarRef.current?.getApi?.();
    if (api && api.view?.type !== newView) {
      api.changeView(newView);
    }
  }, []);

  const handleDateChange = useCallback((date) => {
    setCurrentCalendarDate(date);
  }, []);

  const handleNavigate = useCallback((action) => {
    const api = calendarRef.current?.getApi?.();
    if (!api) return;
    if (action === 'today') api.today();
    else if (action === 'prev') api.prev();
    else if (action === 'next') api.next();
    setCurrentCalendarDate(api.getDate());
  }, []);

  const handleEventTypeChange = useCallback((eventType) => {
    setSelectedEventType(eventType);
  }, []);

  const handleCloseModals = () => {
    setTaskDetailModalOpen(false);
    setTaskAssignmentModalOpen(false);
    setRecipeDetailModalOpen(false);
    setRecipeAssignmentModalOpen(false);
    setSelectedTask(null);
  };

  // Save handler for recipe modal (create or update)
  const handleProductionTaskSaved = async (taskData, existingId = null) => {
    try {
      let saved;
      if (existingId) {
        saved = await updateProductionSchedule(existingId, taskData);
      } else {
        saved = await createProductionSchedule(taskData);
      }

      // merge into recipeEvents
      setRecipeEvents(prev => {
        const withoutOld = prev.filter(ev => ev.id !== saved.id && ev.id !== existingId);
        return [...withoutOld, saved];
      });

      enqueueSnackbar(existingId ? 'Recipe updated' : 'Recipe created', { variant: 'success' });
      setRecipeAssignmentModalOpen(false);
      setDrawerOpen(false);
    } catch (err) {
      console.error('Save recipe failed', err);
      enqueueSnackbar(err.message || 'Failed to save recipe', { variant: 'error' });
    }
  };

  // Save handler for cleaning task modal
  const handleCleaningTaskSaved = async (taskData, existingId = null) => {
    try {
      let saved;
      const payload = {
        ...taskData,
        cleaning_item_id_write: taskData.cleaning_item_id || taskData.cleaning_item?.id,
      };
      if (existingId) {
        saved = await updateTaskInstance(existingId, payload);
      } else {
        saved = await createTaskInstance(payload);
      }

      setCleaningEvents(prev => {
        const withoutOld = prev.filter(ev => ev.id !== saved.id && ev.id !== existingId);
        return [...withoutOld, saved];
      });

      enqueueSnackbar(existingId ? 'Task updated' : 'Task scheduled', { variant: 'success' });
      setTaskAssignmentModalOpen(false);
      setDrawerOpen(false);
    } catch (err) {
      console.error('Save cleaning task failed', err);
      enqueueSnackbar(err.message || 'Failed to save cleaning task', { variant: 'error' });
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        // setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setErrorMessage('Failed to fetch user data');
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const cleaningData = await getTaskInstances();
      console.log('Raw Cleaning Task Instances:', cleaningData);
      setCleaningEvents(cleaningData.results || cleaningData);

      const scheduleData = await getProductionSchedules();
      console.log('Raw Production Schedules:', scheduleData);
      setRecipeEvents(scheduleData.results || scheduleData);

      const usersData = await getUsers();
      const formattedResources = (usersData.results || []).map(user => ({
        id: user.id.toString(),
        title: `${user.first_name} ${user.last_name}`.trim() || user.email,
      }));
      setResourcesData(formattedResources);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setErrorMessage('Failed to fetch calendar data. Please try again later.');
      enqueueSnackbar('Failed to load calendar data', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar]);

  // initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers for Quick Actions
  const handleNewCleaningTask = useCallback(() => {
    setSelectedTask(null);
    setTaskAssignmentModalOpen(true);
  }, []);

  const handleNewRecipeTask = useCallback(() => {
    setSelectedTask(null);
    setRecipeAssignmentModalOpen(true);
  }, []);

  // Combine and normalize events from both sources
  const combinedEvents = useMemo(() => {
    // Add type identifier and ensure unique IDs
    const normalizedCleaningEvents = cleaningEvents.map(event => {
      let assignedName = '';
      if (event.assigned_to_details) {
        const u = event.assigned_to_details;
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (event.assigned_to_name) {
        assignedName = event.assigned_to_name;
      }
      const start = dayjs(`${event.due_date || event.date || ''} ${event.start_time || ''}`).toDate();
      const end = event.end_time ? dayjs(`${event.due_date || event.date || ''} ${event.end_time}`).toDate() : undefined;
      return {
        ...event,
        id: `cleaning-${event.id}`,
        originalType: 'cleaning',
        assignedToName: assignedName || 'Unassigned',
        start,
        end,
      };
    });

    const normalizedRecipeEvents = recipeEvents.map(event => {
      let assignedName = '';
      if (Array.isArray(event.assigned_staff_details) && event.assigned_staff_details.length) {
        const u = event.assigned_staff_details[0];
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (Array.isArray(event.assigned_staff) && event.assigned_staff.length) {
        const u = event.assigned_staff[0];
        const fname = u.first_name || u.name || '';
        const lname = u.last_name || '';
        assignedName = `${fname} ${lname}`.trim() || u.username || u.email || '';
      } else if (event.assigned_staff_name) {
        assignedName = event.assigned_staff_name;
      }
      const start = event.scheduled_start_time ? new Date(event.scheduled_start_time) : dayjs(`${event.scheduled_date || ''} ${event.start_time || ''}`).toDate();
      const end = event.scheduled_end_time ? new Date(event.scheduled_end_time) : (event.end_time ? dayjs(`${event.scheduled_date || ''} ${event.end_time}`).toDate() : undefined);
      return { ...event, id: `recipe-${event.id}`, originalType: 'recipe', assignedToName: assignedName || 'Unassigned', start, end };
    });

    // Filter based on selected event type
    if (selectedEventType === 'cleaning') {
      return normalizedCleaningEvents;
    } else if (selectedEventType === 'recipe') {
      return normalizedRecipeEvents;
    } else {
      return [...normalizedCleaningEvents, ...normalizedRecipeEvents];
    }
  }, [cleaningEvents, recipeEvents, selectedEventType]);

  // Handle list row click -> scroll calendar and open modal
  const handleListRowClick = useCallback((ev) => {
    if (!ev) return;
    const api = calendarRef.current?.getApi?.();
    if (api) {
      api.gotoDate(ev.start || ev.date || new Date());
    }
    setSelectedTask(ev);
    setDrawerOpen(true);
  }, []);

  // drawer callbacks
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleDrawerEdit = (task) => {
    if (!task) return;
    if (task.type === 'cleaning') {
      setSelectedTask(task);
      setTaskAssignmentModalOpen(true);
    } else {
      setSelectedTask(task);
      setRecipeAssignmentModalOpen(true);
    }
  };

  const handleDrawerDelete = (task) => {
    // TODO: implement delete confirmation and API call
    enqueueSnackbar('Delete functionality coming soon', { variant: 'info' });
  };

  // Render the component
  return (
    <ScheduleProvider externalEvents={allEvents}>
      <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', flexGrow: 1, width: '100%', maxWidth: '100vw' }}>
        <CalendarPageLayout
          headerContent={
            <CalendarHeaderControls
              onViewChange={handleViewChange}
              currentDate={currentCalendarDate}
              currentView={currentCalendarView}
              onNavigate={handleNavigate}
            />
          }
          sidebarContent={
            <CalendarRightSidebar
              quickActionsContent={
                <QuickActionsMenu
                  onNewTaskClick={handleNewCleaningTask}
                  onNewRecipeClick={handleNewRecipeTask}
                />
              }
              listContent={<ScheduleListPanel onRowClick={handleListRowClick} />}
              legendContent={<CalendarLegend legendItems={legendItems} />}
              resourceFilterContent={
                <ResourceFilterList
                  resources={resourcesData}
                  selectedResourceIds={selectedResourceIds}
                  onResourceSelectionChange={setSelectedResourceIds}
                />
              }
            />
          }
          filtersBarContent={
            <UnifiedFilters
              selectedEventType={selectedEventType}
              onEventTypeChange={handleEventTypeChange}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedDepartments={selectedDepartments}
              onDepartmentChange={setSelectedDepartments}
              allDepartments={mockDepartments}
              cleaningStatuses={cleaningStatuses}
              selectedCleaningStatuses={selectedCleaningStatuses}
              onCleaningStatusChange={setSelectedCleaningStatuses}
              recipeStatuses={recipeStatuses}
              selectedRecipeStatuses={selectedRecipeStatuses}
              onRecipeStatusChange={setSelectedRecipeStatuses}
            />
          }
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <UnifiedCalendarComponent
              events={filteredEvents}
              resources={resourcesData}
              currentDate={currentCalendarDate}
              currentView={currentCalendarView}
              onDateChange={handleDateChange}
              onViewChange={handleViewChange}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onDateClick={handleDateClick}
              calendarRef={calendarRef}
            />
          )}
        </CalendarPageLayout>

        {/* Task detail drawer */}
        <TaskDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          task={selectedTask}
          onEdit={handleDrawerEdit}
          onDelete={handleDrawerDelete}
        />

        {/* Modals */}
        {taskDetailModalOpen && (
          <TaskDetailModal
            open={taskDetailModalOpen}
            onClose={handleCloseModals}
            task={selectedTask}
            onEdit={() => {
              handleCloseModals();
              setTaskAssignmentModalOpen(true);
            }}
          />
        )}
        {taskAssignmentModalOpen && (
          <NewCleaningTaskModal
            open={taskAssignmentModalOpen}
            onClose={handleCloseModals}
            departmentId={currentUser?.profile?.department_id || null}
            editMode={Boolean(selectedTask?.id)}
            task={selectedTask}
            onSave={handleCleaningTaskSaved}
          />
        )}
        {recipeDetailModalOpen && (
          <ProductionTaskDetailModal
            open={recipeDetailModalOpen}
            onClose={handleCloseModals}
            task={selectedTask}
          />
        )}
        {recipeAssignmentModalOpen && (
          <ProductionAssignmentModal
            open={recipeAssignmentModalOpen}
            onClose={() => setRecipeAssignmentModalOpen(false)}
            onSave={handleProductionTaskSaved}
            editMode={Boolean(selectedTask?.id)}
            productionTask={selectedTask}
          />
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage('')}
        >
          <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={() => setErrorMessage('')}
        >
          <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ScheduleProvider>
  );
};

export default UnifiedCalendarPage;
