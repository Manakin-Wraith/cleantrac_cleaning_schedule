import React from 'react';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import UnifiedEventContent from './event_rendering/UnifiedEventContent';

/**
 * A unified calendar component that wraps FullCalendar and handles the rendering of both
 * cleaning tasks and recipe production events. It uses UnifiedEventContent to render the
 * appropriate event card for each event type.
 */
const UnifiedCalendarComponent = ({
  events,
  resources,
  currentDate,
  currentView,
  onDateChange,
  onViewChange,
  onEventClick,
  onEventDrop,
  onEventResize,
  onDateClick,
  calendarRef,
}) => {
  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, resourceTimelinePlugin, interactionPlugin]}
      headerToolbar={false} // Header is handled by CalendarHeaderControls
      initialView={currentView}
      initialDate={currentDate}
      schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
      events={events}
      resources={resources}
      editable={true}
      droppable={true}
      selectable={true}
      eventContent={(eventInfo) => <UnifiedEventContent eventInfo={eventInfo} />}
      eventClassNames={({ event }) => {
        const type = event.extendedProps?.originalType;
        return type === 'recipe' ? ['production-chip'] : ['cleaning-chip'];
      }}
      eventClick={onEventClick}
      eventDrop={onEventDrop}
      eventResize={onEventResize}
      dateClick={onDateClick}
      dayMaxEvents={currentView.startsWith('timeGrid') ? 1 : 2}
      dayMaxEventRows={currentView.startsWith('timeGrid') ? 1 : 2}
      moreLinkClick="popover"
      eventMaxStack={currentView.startsWith('timeGrid') ? 1 : undefined}
      datesSet={(arg) => {
        if (typeof onDateChange === 'function') {
          onDateChange(arg.view.currentStart);
        }
        if (typeof onViewChange === 'function') {
          onViewChange(arg.view.type);
        }
      }}
      resourceAreaHeaderContent="Resources"
      resourceOrder="title"
      // Add any other FullCalendar options you need
    />
  );
};

UnifiedCalendarComponent.propTypes = {
  events: PropTypes.array.isRequired,
  resources: PropTypes.array.isRequired,
  currentDate: PropTypes.instanceOf(Date).isRequired,
  currentView: PropTypes.string.isRequired,
  onDateChange: PropTypes.func,
  onViewChange: PropTypes.func,
  onEventClick: PropTypes.func.isRequired,
  onEventDrop: PropTypes.func.isRequired,
  onEventResize: PropTypes.func.isRequired,
  onDateClick: PropTypes.func.isRequired,
  calendarRef: PropTypes.object,
};

export default UnifiedCalendarComponent;
