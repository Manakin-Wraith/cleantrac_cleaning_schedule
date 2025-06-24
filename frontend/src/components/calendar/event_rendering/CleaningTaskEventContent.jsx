import React from 'react';
import PropTypes from 'prop-types';
import EventChip from '../common/EventChip';

/**
 * Renders the content for a cleaning task event card within FullCalendar.
 */
// Clean implementation using EventChip
export default function CleaningTaskEventContent({ eventInfo }) {
  const { extendedProps: p } = eventInfo.event;
  const time = eventInfo.timeText; // FullCalendar provides formatted time range
  const badgeMap = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
  const badge = badgeMap[p.recurrence_type] || null;
  return (
    <EventChip
      title={eventInfo.event.title}
      type="cleaning"
      status={p.status}
      time={time}
      assignee={p.assigned_staff_name}
      notesCount={p.notes_count}
       badgeText={badge}
      dense={eventInfo.view?.type === 'dayGridMonth'}
      compact={eventInfo.view?.type?.startsWith('timeGrid')}
      tooltipContent={`${eventInfo.event.title} • ${p.status}`}
    />
  );
}

CleaningTaskEventContent.propTypes = {
  /**
   * The event object provided by FullCalendar.
   */
  eventInfo: PropTypes.shape({
    event: PropTypes.shape({
      extendedProps: PropTypes.shape({
        status: PropTypes.string.isRequired,
        task_name: PropTypes.string.isRequired,
        location: PropTypes.string,
        assigned_staff_name: PropTypes.string,
        equipment_needed: PropTypes.string,
        notes_count: PropTypes.number,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
