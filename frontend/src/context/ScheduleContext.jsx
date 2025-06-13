import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

/**
 * ScheduleContext – holds unified calendar events (cleaning + production) and current list filter.
 */
const ScheduleContext = createContext();

export const ScheduleProvider = ({ children, initialEvents = [], externalEvents }) => {
  const [events, setEvents] = useState(initialEvents); // [{ id, type: 'cleaning'|'production', ...fullcalendarProps }]
  const [listFilter, setListFilter] = useState('all'); // 'all' | 'cleaning' | 'production'

  useEffect(() => {
    if (Array.isArray(externalEvents)) {
      setEvents(externalEvents);
    }
  }, [externalEvents]);

  const visibleEvents = useMemo(() => {
    if (listFilter === 'all') return events;
    return events.filter((e) => e.type === listFilter);
  }, [events, listFilter]);

  const value = {
    events,
    setEvents,
    listFilter,
    setListFilter,
    visibleEvents,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

export const useSchedule = () => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
};
