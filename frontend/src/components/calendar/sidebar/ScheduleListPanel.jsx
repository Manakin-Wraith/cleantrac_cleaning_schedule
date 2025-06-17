import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Stack,
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/PendingActions';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { format } from 'date-fns';
import { useSchedule } from '../../../context/ScheduleContext';

const statusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'pending':
    case 'in progress':
      return <PendingIcon color="warning" fontSize="small" />;
    default:
      return <ErrorIcon color="error" fontSize="small" />;
  }
};

const formatRange = (start, end) => {
  if (!start) return '';
  const s = format(new Date(start), 'PP p');
  if (!end) return s;
  const e = format(new Date(end), 'p');
  return `${s} – ${e}`;
};

const resolveTitle = (ev) => {
  if (ev.title) return ev.title;
  if (ev.cleaning_item_name) return ev.cleaning_item_name;
  if (ev.cleaning_item?.name) return ev.cleaning_item.name;
  if (ev.recipe_details?.name) return ev.recipe_details.name;
  return 'Untitled';
};

const resolveAssignee = (ev) => {
  if (ev.assignedToName) return ev.assignedToName;
  if (ev.assigned_staff_details?.length) {
    const u = ev.assigned_staff_details[0];
    const fname = u.first_name || u.name || '';
    const lname = u.last_name || '';
    const composed = `${fname} ${lname}`.trim();
    return composed || u.username || u.email || 'Unassigned';
  }
  if (ev.assigned_to_details) {
    const u = ev.assigned_to_details;
    const fname = u.first_name || u.name || '';
    const lname = u.last_name || '';
    const composed = `${fname} ${lname}`.trim();
    return composed || u.username || 'Unassigned';
  }
  if (Array.isArray(ev.assigned_staff) && ev.assigned_staff.length) {
    const u = ev.assigned_staff[0];
    return `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unassigned';
  }
  if (ev.assigned_staff_name) return ev.assigned_staff_name;
  if (ev.assigned_to_name) return ev.assigned_to_name;
  return 'Unassigned';
};

const ScheduleListPanel = ({ onRowClick }) => {
  const { events, visibleEvents, listFilter, setListFilter } = useSchedule();

  const counts = React.useMemo(() => {
    const cleaning = events.filter((e) => e.type === 'cleaning').length;
    const production = events.filter((e) => e.type === 'production').length;
    return { cleaning, production, all: events.length };
  }, [events]);

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {/* Filter Toggle */}
      <ToggleButtonGroup
        color="primary"
        size="small"
        exclusive
        value={listFilter}
        onChange={(_, v) => v && setListFilter(v)}
        fullWidth
      >
        <ToggleButton value="all">
          <Badge badgeContent={counts.all} color="secondary">
            <ViewAgendaIcon />
          </Badge>
        </ToggleButton>
        <ToggleButton value="cleaning">
          <Badge badgeContent={counts.cleaning} color="secondary">
            <CleaningServicesIcon />
          </Badge>
        </ToggleButton>
        <ToggleButton value="production">
          <Badge badgeContent={counts.production} color="secondary">
            <RestaurantMenuIcon />
          </Badge>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* List */}
      <List dense sx={{ mt: 1, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {visibleEvents.map((ev) => (
          <ListItemButton key={ev.id} onClick={() => onRowClick?.(ev)}>
            <ListItemIcon>{statusIcon(ev.status)}</ListItemIcon>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2" fontWeight={500} noWrap sx={{ textDecoration: ((ev.type==='production' || ev.type==='cleaning') && ['completed','done'].includes(ev.status?.toLowerCase?.())) ? 'line-through' : 'none' }}>
                  {resolveTitle(ev)}
                </Typography>
              }
              secondary={
                <Stack spacing={0} direction="column">
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {formatRange(ev.start, ev.end)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {resolveAssignee(ev)}
                  </Typography>
                </Stack>
              }
            />
          </ListItemButton>
        ))}
        {visibleEvents.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No tasks in this view
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

ScheduleListPanel.propTypes = {
  onRowClick: PropTypes.func,
};

export default ScheduleListPanel;
