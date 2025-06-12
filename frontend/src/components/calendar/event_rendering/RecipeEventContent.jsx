import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

// Icons - placeholders, to be replaced with actual MUI icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import NotesIcon from '@mui/icons-material/Notes';

// Prevent statusColor prop from reaching the DOM
const EventCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'statusColor',
})(({ theme, statusColor }) => ({
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
    default: return '#9e9e9e'; // grey
  }
};

/**
 * Renders the content for a recipe event card within FullCalendar.
 */
export default function RecipeEventContent({ event }) {
  // FullCalendar passes { event, timeText, view, ... } directly as props
  const props = event.extendedProps || {};

  const statusColor = getStatusColor(props.status);

  return (
    <Tooltip title={`${props.recipe_name} - ${props.status}`} placement="top" arrow>
      <EventCard statusColor={statusColor}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
          {props.recipe_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {props.batch_size} {props.yield_unit}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
          <Tooltip title={`${props.subtasks_completed} / ${props.subtasks_total} subtasks completed`}>
            <CheckCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </Tooltip>
          <Tooltip title={`Assigned to: ${props.assigned_staff_name}`}>
            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </Tooltip>
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

RecipeEventContent.propTypes = {
  event: PropTypes.object.isRequired, // FullCalendar EventApi object
};
