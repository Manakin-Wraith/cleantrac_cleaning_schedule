import React, { useMemo } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  
  
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/PendingActions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RecurrenceChip from '../../tasks/RecurrenceChip';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { format } from 'date-fns';
import { useSchedule } from '../../../context/ScheduleContext';

const statusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'archived':
      return <CheckCircleIcon color="disabled" fontSize="small" />;
    case 'completed':
    case 'done':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'pending_review':
      return <HourglassBottomIcon color="info" fontSize="small" />;
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
  const { events, visibleEvents: visibleEventsRaw, listFilter, setListFilter } = useSchedule();
  
  // Build visible events (excluding done) first
  const visibleEventsFlat = useMemo(
    () => visibleEventsRaw.filter((ev) => !['completed', 'done', 'archived'].includes(ev.status?.toLowerCase?.())),
    [visibleEventsRaw]
  );

  // Group recurring events
  const groupedEvents = useMemo(() => {
    const groups = {};
    const singles = [];

    visibleEventsFlat.forEach((ev) => {
      if (ev.recurrence_type) {
        const key = `${ev.recurrence_type}-${resolveTitle(ev)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(ev);
      } else {
        singles.push(ev);
      }
    });

    const total = singles.length + Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
    return { groups, singles, total };
  }, [visibleEventsFlat]);

  const done = (e)=> ['completed','done','archived'].includes(e.status?.toLowerCase?.());
    const counts = React.useMemo(() => {
    const totalCleaning = events.filter(e=> e.type==='cleaning').length;
    const totalProduction = events.filter(e=> e.type==='production').length;
    const activeCleaning = events.filter(e=> e.type==='cleaning' && !done(e)).length;
    const activeProduction = events.filter(e=> e.type==='production' && !done(e)).length;
    return {
      total: { cleaning: totalCleaning, production: totalProduction, all: events.length },
      active: { cleaning: activeCleaning, production: activeProduction, all: events.filter(e=> !done(e)).length }
    };
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
          <Badge badgeContent={counts.active.all} color="secondary">
            <ViewAgendaIcon />
          </Badge>
        </ToggleButton>
        <ToggleButton value="cleaning">
          <Badge badgeContent={counts.active.cleaning} color="secondary">
            <CleaningServicesIcon />
          </Badge>
        </ToggleButton>
        <ToggleButton value="production">
          <Badge badgeContent={counts.active.production} color="secondary">
            <RestaurantMenuIcon />
          </Badge>
        </ToggleButton>
      </ToggleButtonGroup>
      

      {/* List */}
      <List dense sx={{ mt: 1, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {/* Recurring groups */}
        {Object.entries(groupedEvents.groups).map(([key, group]) => {
          const first = group[0];
          return (
            <Accordion key={key} disableGutters sx={{ bgcolor: 'background.paper' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <ListItemIcon sx={{ minWidth: 28 }}>{statusIcon(first.status)}</ListItemIcon>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {resolveTitle(first)}
                    </Typography>
                    <RecurrenceChip type={first.recurrence_type} size="small" sx={{ flexShrink: 0, fontSize:11 }} />
                  </Stack>
                  <Typography variant="caption" sx={{ color:'text.secondary' }} noWrap>
                    {format(first.start, 'MMM d')} · {format(first.start, 'p')} – {format(first.end, 'p')} · {resolveAssignee(first)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {group.map((ev, idx) => (
                  <React.Fragment key={ev.id}>
                    <ListItemButton onClick={() => onRowClick?.(ev)} sx={{ pl: 4 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width:'100%', pr:1 }}>
                        <Typography variant="caption" sx={{ width: 80, flexShrink:0 }} noWrap>{format(ev.start, 'MMM d')}</Typography>
                        <Typography variant="caption" sx={{ width: 85, flexShrink:0 }} noWrap>{format(ev.start, 'p')} – {format(ev.end, 'p')}</Typography>
                        <Typography variant="caption" sx={{ flexGrow:1 }} noWrap>{resolveAssignee(ev)}</Typography>
                      </Stack>
                    </ListItemButton>
                    {idx !== group.length -1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}

        {/* Single (non-recurring) events */}
        {groupedEvents.singles.map((ev) => (
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
        {groupedEvents.total === 0 && (
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
