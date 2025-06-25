import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { getCurrentUser } from '../services/authService';
import {
  getTaskInstances,
  updateTaskInstance,
  createTaskInstance,
  deleteTaskInstance,
} from '../services/taskService';
import { getCleaningItems } from '../services/cleaningItemService';
import { getProductionSchedules } from '../services/productionScheduleService';
import { getUsers } from '../services/userService';
import TaskSchedulerCalendar from '../components/calendar/TaskSchedulerCalendar';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import EditTaskAssignmentModal from '../components/modals/EditTaskAssignmentModal';

// Import the new layout and UI components
import CalendarPageLayout from '../components/calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../components/calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../components/calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../components/calendar/sidebar/QuickActionsMenu';
import CalendarLegend from '../components/calendar/sidebar/CalendarLegend';
import ResourceFilterList from '../components/calendar/sidebar/ResourceFilterList';
import CollapsibleFiltersDisplay from '../components/calendar/filters/CollapsibleFiltersDisplay';
import CleaningFilters from '../components/calendar/filters/CleaningFilters';

// Mock Data - to be replaced with API data
const cleaningStatuses = ['Completed', 'Pending Review', 'Pending', 'Overdue'];
const mockDepartments = ['Floor Care', 'Restrooms', 'Kitchen', 'Common Areas'];

const legendItems = [
  { label: 'Completed', color: '#4caf50' },
  { label: 'Pending Review', color: '#ff9800' },
  { label: 'Pending', color: '#2196f3' },
  { label: 'Overdue', color: '#f44336' },
];

const UNASSIGNED_RESOURCE_ID = '___unassigned___';

const dateToYmd = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const timeFromIso = (iso) => (iso ? iso.split('T')[1]?.substring(0, 8) : null);

export default function TaskSchedulerPage() {
  /* ---------------------------- Snackbar / Alerts --------------------------- */
  const { enqueueSnackbar } = useSnackbar();

  /* ---------------------------------- State --------------------------------- */
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');
  
  // Calendar ref for direct API access
  const calendarRef = useRef(null);
  
  // State for filters and sidebar
  // Default calendar view to Month when page loads
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [cleaningItems, setCleaningItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [resources, setResources] = useState([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  /* -------------------------- Unified Data Fetching ------------------------- */
  const fetchData = useCallback(
    async (skipLoading = false) => {
      if (!user || !user.profile?.department_id) return;

      if (!skipLoading) setLoadingData(true);
      setDataError('');

      const dateStr = dateToYmd(selectedDate);
      const params = { department_id: user.profile.department_id, due_date: dateStr };
      try {
        const [tasksRes, prodRes, itemsRes, usersRes] = await Promise.all([
          getTaskInstances(params),
          getProductionSchedules({ department_id: user.profile.department_id, scheduled_date: dateStr, expand: 'recipe_details,recipe' }),
          getCleaningItems({ department_id: user.profile.department_id }),
          getUsers({ department_id: user.profile.department_id }),
        ]);

        const fetchedTasks = tasksRes?.results || tasksRes || [];
        const fetchedRecipes = prodRes?.results || prodRes || [];
        const merged = [
          ...fetchedTasks.map(t=>({...t,__type:'cleaning'})),
          ...fetchedRecipes.map(r=>({
            ...r,
            __type:'recipe',
            title: r.recipe_details?.name || r.recipe_name || r.recipe?.name || r.description || r.name || 'Recipe',
          }))
        ];
        setTasks(merged);
        if (typeof window !== 'undefined') {
          window.__lastFetchedRecipes = fetchedRecipes;
        }
        setCleaningItems(itemsRes?.results || itemsRes || []);
        const staffOnly = (usersRes?.results || usersRes || []).filter(
          (u) => u.profile?.role === 'staff',
        );
        setStaff(staffOnly);

        const res = staffOnly.map((s) => ({
          id: String(s.id),
          title: `${s.first_name} ${s.last_name}`.trim() || s.username,
        }));
        res.unshift({ id: UNASSIGNED_RESOURCE_ID, title: 'Unassigned' });
        setResources(res);
      } catch (err) {
        console.error('Failed to load task scheduler data:', err);
        setDataError(err.message || 'Failed to load data');
        enqueueSnackbar(err.message || 'Failed to load data', { variant: 'error' });
      } finally {
        if (!skipLoading) setLoadingData(false);
      }
    },
    [user, selectedDate, enqueueSnackbar],
  );

  /* ---------------------------- Load Current User --------------------------- */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (err) {
        enqueueSnackbar('Failed to load user', { variant: 'error' });
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [enqueueSnackbar]);

  /* ----------------------- Fetch Data When User / Date ---------------------- */
  useEffect(() => {
    if (user) fetchData();
  }, [user, selectedDate, fetchData]);

  // Ensure calendar starts in month view on first render
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView('dayGridMonth');
    }
  }, []);

  /* ----------------------------- Data Helpers ------------------------------- */
  const resolveItemName = useCallback(
    (task) => {
      if (!task) return 'Task';
      // Recipe production task (check various possible fields)
      if (task.recipe_details?.name) return task.recipe_details.name;
      if (task.recipe_details?.recipe_name) return task.recipe_details.recipe_name;
      if (task.recipe_name) return task.recipe_name;
      if (task.recipe?.name) return task.recipe.name;
      if (task.recipe?.recipe_name) return task.recipe.recipe_name;
      if (task.recipe?.description) return task.recipe.description;
      if (task.description && task.__type==='recipe' && task.description.toLowerCase() !== 'recipe') return task.description;
      if (task.name && task.__type==='recipe' && task.name.toLowerCase() !== 'recipe') return task.name;
      // Cleaning task
      if (task.cleaning_item?.name) return task.cleaning_item.name;
      const item = cleaningItems.find((ci) => ci.id === task.cleaning_item_id);
      return item?.name || 'Task';
    },
    [cleaningItems],
  );

  /* -------------------------- Calendar Event Handlers ------------------------- */
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const handleEventDrop = useCallback(
    async (info) => {
      try {
        const { event } = info;
        const updatedTask = {
          id: event.id,
          start: event.start.toISOString(),
          end: event.end?.toISOString() || null,
          resourceId: event.getResources()[0]?.id || UNASSIGNED_RESOURCE_ID,
        };

        await updateTaskInstance(updatedTask.id, updatedTask);
        enqueueSnackbar('Task updated successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error updating task after drop:', error);
        enqueueSnackbar('Failed to update task', { variant: 'error' });
        info.revert();
      }
    },
    [enqueueSnackbar]
  );
  
  const handleEventResize = useCallback(
    async (info) => {
      try {
        const { event } = info;
        const updatedTask = {
          id: event.id,
          start: event.start.toISOString(),
          end: event.end?.toISOString() || null,
        };

        await updateTaskInstance(updatedTask.id, updatedTask);
        enqueueSnackbar('Task duration updated successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error updating task after resize:', error);
        enqueueSnackbar('Failed to update task duration', { variant: 'error' });
        info.revert();
      }
    },
    [enqueueSnackbar]
  );
  
  const handleNavigate = (action) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (action === 'today') calendarApi.today();
    else if (action === 'prev') calendarApi.prev();
    else if (action === 'next') calendarApi.next();
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };
  
  // When the component mounts or resources change, select all resources by default
  useEffect(() => {
    if (resources.length > 0) {
      setSelectedResourceIds(resources.map(r => r.id));
    }
  }, [resources]);

  const handleEventClick = useCallback((info) => {
    const taskId = info.event.id;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
      setDetailModalOpen(true);
    }
  }, [tasks]);

  const handleDateClick = useCallback(
    (info) => {
      // Create a new task template
      const newTask = {
        cleaningItemId: '',
        date: dateToYmd(info.date),
        time: timeFromIso(info.date.toISOString()) || '09:00:00',
        resourceId: info.resource?.id || UNASSIGNED_RESOURCE_ID,
        status: 'Pending',
      };
      setActiveTask(newTask);
      setEditModalOpen(true);
    },
    []
  );
  
  // Handle new task creation from quick actions menu
  const handleNewTask = useCallback(() => {
    const newTask = {
      cleaningItemId: '',
      date: dateToYmd(selectedDate),
      time: '09:00:00',
      resourceId: UNASSIGNED_RESOURCE_ID,
      status: 'Pending',
    };
    setActiveTask(newTask);
    setEditModalOpen(true);
  }, [selectedDate]);
  
  // Create calendar events from tasks
  const calendarEvents = useMemo(
    () =>
      tasks.map((t) => ({
        id: String(t.id),
        resourceId: t.assigned_to_id ? String(t.assigned_to_id) : UNASSIGNED_RESOURCE_ID,
        title: t.title || resolveItemName(t),
        start: t.scheduled_start_time || (t.start_time ? `${t.due_date || t.scheduled_date}T${t.start_time}` : t.due_date || t.scheduled_date),
        end: t.scheduled_end_time || (t.end_time ? `${t.due_date || t.scheduled_date}T${t.end_time}` : null),
        extendedProps: {
          ...t,
          status: t.status || 'Pending',
          department: t.department || 'General',
          recurrence_type: t.recurrence_type,
        },
      })),
    [tasks, resolveItemName],
  );

  // Filter events based on selected resources, statuses, search term, and departments
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      // Add null checks to prevent errors when properties are undefined
      const resourceMatch = selectedResourceIds.length === 0 || 
                           (event.resourceId && selectedResourceIds.includes(event.resourceId));
      
      const statusMatch = selectedStatuses.length === 0 || 
                         (event.extendedProps && event.extendedProps.status && 
                          selectedStatuses.includes(event.extendedProps.status));
      
      const searchMatch = !searchTerm || 
                         (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const departmentMatch = selectedDepartments.length === 0 || 
                             (event.extendedProps && event.extendedProps.department && 
                              selectedDepartments.includes(event.extendedProps.department));
      
      return resourceMatch && statusMatch && searchMatch && departmentMatch;
    });
  }, [calendarEvents, selectedResourceIds, selectedStatuses, searchTerm, selectedDepartments]);

  const handleEventReceive = useCallback(
    async (info) => {
      const { event } = info;
      try {
        const payload = {
          cleaning_item_id_write: parseInt(event.extendedProps.cleaning_item_id, 10),
          due_date: dateToYmd(event.start),
          assigned_to_id:
            event.getResources()?.[0]?.id !== UNASSIGNED_RESOURCE_ID
              ? parseInt(event.getResources()[0].id, 10)
              : null,
          status: 'pending',
          department_id: user.profile.department_id,
        };
        const created = await createTaskInstance(payload);
        event.setProp('id', created.id);
        enqueueSnackbar('Task created', { variant: 'success' });
        fetchData(true);
      } catch (err) {
        console.error('Failed creating task from drag', err);
        enqueueSnackbar(err.message || 'Failed creating task', { variant: 'error' });
        event.remove();
      }
    },
    [user, fetchData, enqueueSnackbar],
  );

  const openDetailModal = (task) => {
    setActiveTask(task);
    setDetailModalOpen(true);
  };

  const handleTaskEdited = () => {
    setEditModalOpen(false);
    fetchData(true);
  };

  /* --------------------------------- Render --------------------------------- */
  if (loadingUser || loadingData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 64px)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (dataError) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 64px)',
        }}
      >
        <Alert severity="error">{dataError}</Alert>
      </Box>
    );
  }
  
  // Header Controls Component
  const headerControls = (
    <CalendarHeaderControls
      currentDate={selectedDate}
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
          onNewTaskClick={handleNewTask}
          onNewRecipeClick={() => console.log('New recipe clicked')}
        />
      }
      legendContent={<CalendarLegend legendItems={legendItems} />}
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
  );

  return (
    <CalendarPageLayout
      headerContent={headerControls}
      sidebarContent={sidebarContent}
      filtersBarContent={filtersBarContent}
    >
      <Box sx={{ position: 'relative', zIndex: 0, height: '100%' }}>
        <TaskSchedulerCalendar
          ref={calendarRef}
          events={filteredEvents}
          resources={resources}
          currentDate={selectedDate}
          onDateChange={handleDateChange}
          onEventDrop={handleEventDrop}
          onEventClick={handleEventClick}
          eventResize={handleEventResize}
          onDateClick={handleDateClick}
          useSimpleLayout={true} // Tell the calendar to use simple layout without its own header/sidebar
        />
        {/* Detail Modal */}
        {detailModalOpen && (
          <TaskDetailModal
            open={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            onEdit={() => {
              setDetailModalOpen(false);
              setEditModalOpen(true);
            }}
            task={activeTask}
          />
        )}
        {/* Edit Modal */}
        {editModalOpen && (
          <EditTaskAssignmentModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            task={activeTask}
            onTaskUpdated={handleTaskEdited}
          />
        )}
      </Box>
    </CalendarPageLayout>
  );
}
