import React from 'react';
import PropTypes from 'prop-types';
import EventChip from '../common/EventChip';

export default function RecipeEventContent({ eventInfo }) {
  const { extendedProps: p } = eventInfo.event;
  const time = eventInfo.timeText;     // “14:00 – 15:00”, etc.

  return (
    <EventChip
      title={eventInfo.event.title}
      type="recipe"
      status={p.status}
      time={time}
      assignee={p.assigned_staff_name}
      notesCount={p.notes_count}
      dense={eventInfo.view?.type === 'dayGridMonth'}
      compact={eventInfo.view?.type?.startsWith('timeGrid')}
      tooltipContent={`${eventInfo.event.title} • ${p.status}`}
    />
  );
}

RecipeEventContent.propTypes = {
  eventInfo: PropTypes.object.isRequired,
};