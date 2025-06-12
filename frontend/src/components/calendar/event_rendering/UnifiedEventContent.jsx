import React from 'react';
import PropTypes from 'prop-types';
import CleaningTaskEventContent from './CleaningTaskEventContent';
import RecipeEventContent from './RecipeEventContent';

/**
 * Conditionally renders the appropriate event content based on the event's original type.
 * This component acts as a router, delegating the actual rendering to either
 * `CleaningTaskEventContent` or `RecipeEventContent`.
 */
const UnifiedEventContent = ({ eventInfo }) => {
  const { event } = eventInfo;
  const eventType = event.extendedProps?.originalType;

  switch (eventType) {
    case 'cleaning':
      return <CleaningTaskEventContent eventInfo={eventInfo} />;
    case 'recipe':
      return <RecipeEventContent eventInfo={eventInfo} />;
    default:
      // Fallback for unknown or undefined event types
      return (
        <div style={{ padding: '4px', backgroundColor: '#ccc' }}>
          <strong>Unknown Event Type</strong>
          <p>{event.title}</p>
        </div>
      );
  }
};

UnifiedEventContent.propTypes = {
  /**
   * The event object provided by FullCalendar, which includes the event's data.
   */
  eventInfo: PropTypes.shape({
    event: PropTypes.shape({
      title: PropTypes.string.isRequired,
      extendedProps: PropTypes.shape({
        originalType: PropTypes.oneOf(['cleaning', 'recipe']),
      }),
    }),
  }).isRequired,
};

export default UnifiedEventContent;
