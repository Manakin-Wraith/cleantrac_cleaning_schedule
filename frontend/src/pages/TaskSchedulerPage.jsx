import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getUsers } from '../services/userService';
import TaskSchedulerCalendar from '../components/calendar/TaskSchedulerCalendar';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import EditTaskAssignmentModal from '../components/modals/EditTaskAssignmentModal';

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
        const [tasksRes, itemsRes, usersRes] = await Promise.all([
          getTaskInstances(params),
          getCleaningItems({ department_id: user.profile.department_id }),
          getUsers({ department_id: user.profile.department_id }),
        ]);

        const fetchedTasks = tasksRes?.results || tasksRes || [];
        setTasks(fetchedTasks);
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

  /* ----------------------------- Data Helpers ------------------------------- */
  const resolveItemName = useCallback(
    (task) => {
      if (!task) return 'Task';
      if (task.cleaning_item?.name) return task.cleaning_item.name;
      const item = cleaningItems.find((ci) => ci.id === task.cleaning_item_id);
      return item?.name || 'Task';
    },
    [cleaningItems],
  );

  /* --------------------------- Calendar Callbacks --------------------------- */
  const calendarEvents = useMemo(
    () =>
      tasks.map((t) => ({
        id: String(t.id),
        resourceId: t.assigned_to_id ? String(t.assigned_to_id) : UNASSIGNED_RESOURCE_ID,
        title: resolveItemName(t),
        start: t.start_time ? `${t.due_date}T${t.start_time}` : t.due_date,
        end: t.end_time ? `${t.due_date}T${t.end_time}` : null,
        allDay: !t.start_time,
        extendedProps: t,
      })),
    [tasks, resolveItemName],
  );

  const handleCalendarDateChange = (date) => setSelectedDate(date);

  /* ---------------------------- Event Handlers ------------------------------ */
  const persistEventUpdate = async (event, changes) => {
    try {
      await updateTaskInstance(event.id, changes);
      enqueueSnackbar('Task updated', { variant: 'success' });
      fetchData(true);
    } catch (err) {
      console.error('Failed updating task', err);
      enqueueSnackbar(err.message || 'Failed updating task', { variant: 'error' });
    }
  };

  const handleEventDrop = useCallback(
    (info) => {
      const { event } = info;
      const payload = {
        due_date: dateToYmd(event.start),
        start_time: timeFromIso(event.startStr),
        end_time: timeFromIso(event.endStr),
        assigned_to_id:
          event.getResources()?.[0]?.id !== UNASSIGNED_RESOURCE_ID
            ? parseInt(event.getResources()[0].id, 10)
            : null,
      };
      persistEventUpdate(event, payload);
    },
    [persistEventUpdate],
  );

  const handleEventResize = useCallback(
    (info) => {
      const { event } = info;
      const payload = {
        start_time: timeFromIso(event.startStr),
        end_time: timeFromIso(event.endStr),
      };
      persistEventUpdate(event, payload);
    },
    [persistEventUpdate],
  );

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

  /* --------------------------------- Render -------------------------------- */
  if (loadingUser || loadingData) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dataError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{dataError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <TaskSchedulerCalendar
        events={calendarEvents}
        resources={resources}
        currentDate={selectedDate}
        onDateChange={handleCalendarDateChange}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onEventReceive={handleEventReceive}
        onEventClick={(info) => openDetailModal(info.event.extendedProps)}
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

      {/* Global Snackbar fallback for any optimistic success that isn't handled elsewhere */}
      <Snackbar />
    </Box>
  );
}
