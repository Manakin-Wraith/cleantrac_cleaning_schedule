import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

// Icons - placeholders, to be replaced with actual MUI icons
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import NotesIcon from '@mui/icons-material/Notes';

const EventCard = styled(Box)(({ theme, statusColor }) => ({
  width: '100%',
  height: '100%',
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.background.paper,
  borderLeft: `4px solid ${statusColor}`,
  borderRadius: '4px',
  boxShadow: theme.shadows[1],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return '#4caf50'; // green
    case 'In Progress': return '#ff9800'; // orange
    case 'Pending': return '#2196f3'; // blue
    case 'Missed': return '#f44336'; // red
    default: return '#9e9e9e'; // grey
  }
};

/**
 * Renders the content for a cleaning task event card within FullCalendar.
 */
export default function CleaningTaskEventContent({ eventInfo }) {
  const { extendedProps: props } = eventInfo.event;

  const statusColor = getStatusColor(props.status);

  return (
    <Tooltip title={`${props.task_name} - ${props.status}`} placement="top" arrow>
      <EventCard statusColor={statusColor}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
          {props.task_name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnIcon sx={{ fontSize: 14 }} />
          <Typography variant="body2" noWrap>
            {props.location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
          <Tooltip title={`Assigned to: ${props.assigned_staff_name}`}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </Tooltip>
          {props.equipment_needed && (
            <Tooltip title={`Equipment: ${props.equipment_needed}`}>
              <CleaningServicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          )}
          {props.notes_count > 0 && (
            <Tooltip title={`${props.notes_count} notes`}>
              <NotesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          )}
        </Box>
      </EventCard>
    </Tooltip>
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
