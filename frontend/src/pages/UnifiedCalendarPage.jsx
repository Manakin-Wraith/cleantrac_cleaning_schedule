import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../context/AuthContext';
import { ScheduleProvider, useSchedule } from '../context/ScheduleContext';
import { getTaskInstances, updateTaskInstance } from '../services/taskService';
import { getProductionSchedules, updateProductionSchedule } from '../services/productionScheduleService';
import { getUsers } from '../services/userService';
import CalendarPageLayout from '../components/calendar/layout/CalendarPageLayout';
import CalendarHeaderControls from '../components/calendar/header/CalendarHeaderControls';
import CalendarRightSidebar from '../components/calendar/sidebar/CalendarRightSidebar';
import QuickActionsMenu from '../components/calendar/sidebar/QuickActionsMenu';
import EventList from '../components/calendar/sidebar/EventList';
import UnifiedCalendarComponent from '../components/calendar/UnifiedCalendarComponent';
import TaskDrawer from '../components/calendar/TaskDrawer';
import EventDrawer from '../components/calendar/EventDrawer';
import dayjs from 'dayjs';

// Helper to format date consistently
const dateToYmd = (date) => dayjs(date).format('YYYY-MM-DD');
const timeToHms = (date) => dayjs(date).format('HH:mm:ss');

const UnifiedCalendarPageContent = () => {
  const calendarRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const { externalEvents, addOrUpdateEvent } = useSchedule();

  const [isLoading, setIsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [currentCalendarView, setCurrentCalendarView] = useState('dayGridMonth');

  const [isTaskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [isEventDrawerOpen, setEventDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasks, productions, users] = await Promise.all([
        getTaskInstances(),
        getProductionSchedules(),
        getUsers(),
      ]);

      const taskEvents = tasks.map(task => ({
        ...task,
        id: `task-${task.id}`,
        title: task.cleaning_item_name || 'Cleaning Task',
        start: dayjs(`${task.due_date} ${task.start_time || '00:00:00'}`).toDate(),
        end: task.end_time ? dayjs(`${task.due_date} ${task.end_time}`).toDate() : null,
        type: 'task',
        extendedProps: { ...task, type: 'task' },
        resourceId: task.assigned_to_id,
      }));

      const productionEvents = productions.map(prod => ({
        ...prod,
        id: `recipe-${prod.id}`,
        title: prod.recipe_name || 'Production Task',
        start: new Date(prod.scheduled_start_time),
        end: prod.scheduled_end_time ? new Date(prod.scheduled_end_time) : null,
        type: 'recipe',
        extendedProps: { ...prod, type: 'recipe' },
        resourceIds: prod.assigned_staff || [],
      }));

      const combined = [...taskEvents, ...productionEvents, ...externalEvents];
      setAllEvents(combined);

      const upcoming = combined
        .filter(e => dayjs(e.start).isAfter(dayjs()))
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 10);
      setUpcomingEvents(upcoming);

    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      enqueueSnackbar('Failed to load calendar data.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar, externalEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEventDrop = useCallback(async (dropInfo) => {
    const { event } = dropInfo;
    const newStart = event.start;
    const newEnd = event.end;
    const [type, id] = event.id.split('-');

    try {
      let updatedEventData;
      if (type === 'task') {
        updatedEventData = await updateTaskInstance(id, {
          due_date: dateToYmd(newStart),
          start_time: timeToHms(newStart),
          end_time: newEnd ? timeToHms(newEnd) : null,
        });
      } else if (type === 'recipe') {
        updatedEventData = await updateProductionSchedule(id, {
          scheduled_start_time: newStart.toISOString(),
          scheduled_end_time: newEnd ? newEnd.toISOString() : null,
        });
      }
      addOrUpdateEvent({ ...event.toPlainObject(), ...updatedEventData });
      enqueueSnackbar('Event updated successfully!', { variant: 'success' });
      await fetchData(); // Refetch all data
    } catch (error) {
      console.error('Failed to update event:', error);
      enqueueSnackbar('Failed to update event.', { variant: 'error' });
      dropInfo.revert();
    }
  }, [enqueueSnackbar, addOrUpdateEvent, fetchData]);

  const handleEventClick = useCallback((clickInfo) => {
    setSelectedEvent(clickInfo.event);
    if (clickInfo.event.extendedProps.type === 'task') {
      setTaskDrawerOpen(true);
    } else {
      setEventDrawerOpen(true);
    }
  }, []);

  const handleDateSelect = useCallback((selectInfo) => {
    setSelectedDate(selectInfo.startStr);
    setTaskDrawerOpen(true);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentCalendarView(view.type);
  }, []);

  const handleDatesSet = useCallback((dateInfo) => {
    setCurrentCalendarDate(dateInfo.view.currentStart);
  }, []);

  const handleNavigate = (action) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (calendarApi[action]) {
        calendarApi[action]();
        setCurrentCalendarDate(calendarApi.getDate());
      }
    }
  };

  const handleSave = async () => {
    await fetchData();
    setTaskDrawerOpen(false);
    setEventDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', width: '100%' }}>
      <CalendarPageLayout
        headerContent={
          <CalendarHeaderControls
            onViewChange={(viewType) => calendarRef.current?.getApi().changeView(viewType)}
            currentDate={currentCalendarDate}
            currentView={currentCalendarView}
            onNavigate={handleNavigate}
          />
        }
        sidebarContent={
          <CalendarRightSidebar
            quickActionsContent={
              <QuickActionsMenu
                onAddTask={() => setTaskDrawerOpen(true)}
                onAddEvent={() => setEventDrawerOpen(true)}
              />
            }
            eventListContent={
              <EventList
                events={upcomingEvents}
                onSelectEvent={handleEventClick}
              />
            }
          />
        }
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <UnifiedCalendarComponent
            ref={calendarRef}
            events={allEvents}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
            initialView={currentCalendarView}
            onDatesSet={handleDatesSet}
          />
        )}
      </CalendarPageLayout>
      <TaskDrawer
        open={isTaskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        onSave={handleSave}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
      />
      <EventDrawer
        open={isEventDrawerOpen}
        onClose={() => setEventDrawerOpen(false)}
        onSave={handleSave}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
      />
    </Box>
  );
};

const UnifiedCalendarPage = () => (
  <DndProvider backend={HTML5Backend}>
    <ScheduleProvider>
      <UnifiedCalendarPageContent />
    </ScheduleProvider>
  </DndProvider>
);

export default UnifiedCalendarPage;
