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
  Tooltip,
  Chip,
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/PendingActions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RecurrenceChip from '../../tasks/RecurrenceChip';
// distinct icons per status bucket
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import PendingReviewIcon from '@mui/icons-material/ReportProblem';
import ProgressIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { format, parseISO, isValid, isSameDay } from 'date-fns';
import { useSchedule } from '../../../context/ScheduleContext';

const statusOrder = {
  pending_review: 0,
  in_progress: 1,
  pending: 2,
  scheduled: 2,
  completed: 3,
  done: 3,
  archived: 4,
  default: 5,
};
const statusWeight = (s) => statusOrder[String(s||'').toLowerCase()] ?? statusOrder.default;

const bucketConfigs=[
  {key:'pending_review',label:'Pending Review',color:'warning',icon:PendingReviewIcon},
  {key:'in_progress',label:'In Progress',color:'info',icon:ProgressIcon},
  {key:'pending',label:'Scheduled',color:'default',icon:ScheduleIcon},
];
// helper to collect items by status
const extractByStatus=(status,groupsObj,singlesArr)=>{
  const arr=[];
  singlesArr.forEach(ev=>{if(String(ev.status).toLowerCase()===status) arr.push(ev);});
  Object.values(groupsObj).forEach(list=> list.forEach(ev=>{if(String(ev.status).toLowerCase()===status) arr.push(ev);}));
  return arr;
};

const statusLabels = {
  pending_review:'Pending',
  in_progress:'In-Prog',
  pending:'Pending',
  scheduled:'Scheduled',
  completed:'Done',
  done:'Done',
  archived:'Archived'
};

const safeFormat = (val, fmt) => {
  if (!val) return '-';
  const d = typeof val === 'string' ? parseISO(val) : val;
  if (!isValid(d)) return '-';
  return format(d, fmt);
};

const statusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'archived':
      return <CheckCircleIcon color="disabled" fontSize="small" />;
    case 'done':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'pending_review':
      return <PendingReviewIcon color="warning" fontSize="small" />;
    case 'in_progress':
      return <ProgressIcon color="info" fontSize="small" />;
    case 'pending':
    case 'scheduled':
      return null;
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
  const [groupStatusFilter, setGroupStatusFilter] = React.useState({});

  const today = new Date();
  const visibleEventsFlat = useMemo(
    () =>
      visibleEventsRaw
        .filter((ev) => !['completed', 'done', 'archived'].includes(ev.status?.toLowerCase?.()))
        .filter((ev) => {
          // Always include pending review tasks regardless of date
          if (String(ev.status).toLowerCase() === 'pending_review') return true;
          const d = ev.start || ev.scheduled_date || ev.date;
          if (!d) return false;
          const dt = typeof d === 'string' ? parseISO(d) : new Date(d);
          return isValid(dt) && isSameDay(dt, today);
        }),
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
          <ViewAgendaIcon />
        </ToggleButton>
        <ToggleButton value="cleaning">
          <CleaningServicesIcon />
        </ToggleButton>
        <ToggleButton value="production">
          <RestaurantMenuIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Today heading */}
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        Today
      </Typography>

      {/* List */}
      <List dense sx={{ mt: 1, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {/* --- STATUS BUCKETS (top priority) --- */}
        {bucketConfigs.map((cfg) => {
          const list = extractByStatus(cfg.key, groupedEvents.groups, groupedEvents.singles);
          if (list.length === 0) return null;
          const IconComp = cfg.icon;
          return (
            <Accordion key={cfg.key} defaultExpanded={cfg.key === 'pending_review'} disableGutters
              sx={{ bgcolor: 'background.paper', mb: 1, border: 1, borderColor: `${cfg.color}.light` }}>
              <AccordionSummary>
                <IconComp color={cfg.color} sx={{ mr:4 }} />
                <Typography variant="subtitle2" fontWeight={600}>{cfg.label} ({list.length})</Typography>
                <AutorenewIcon fontSize="small" sx={{ ml:'auto' }} />
              </AccordionSummary>
              <AccordionDetails sx={{ p:0 }}>
                {list.map(ev=> (
                  <ListItemButton key={`${cfg.key}-${ev.id}`} onClick={()=> onRowClick?.(ev)}>
                    {statusIcon(ev.status) && <ListItemIcon>{statusIcon(ev.status)}</ListItemIcon>}
                    <ListItemText
                      disableTypography
                      primary={<Typography variant="body2" fontWeight={500} noWrap>{resolveTitle(ev)}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{safeFormat(ev.start,'MMM d p')} · {resolveAssignee(ev)}</Typography>}
                    />
                  </ListItemButton>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}

        {/* Task type sections */}
        {[...Object.entries(groupedEvents.groups)].filter(([_,arr])=> !arr.some(ev=> bucketConfigs.some(b=>b.key===String(ev.status).toLowerCase())))
            .sort((a,b)=> statusWeight(a[1][0].status)-statusWeight(b[1][0].status))
            .map(([key, group]) => {
          const first = group[0];
          if(group.length===1){
            return (
              <ListItemButton key={key} onClick={()=> onRowClick?.(first)} sx={{ mb:1, border:1, borderColor:'grey.300', borderRadius:1 }}>
                {statusIcon(first.status) && <ListItemIcon>{statusIcon(first.status)}</ListItemIcon>}
                <ListItemText
                  disableTypography
                  primary={<Stack direction="row" alignItems="center" sx={{ width:'100%' }}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ flexGrow:1 }}>
                      {resolveTitle(first)}
                    </Typography>
                    <Tooltip title={`Occurs ${first.recurrence_type?.toLowerCase?.()}` || ''}>
                      <RecurrenceChip type={first.recurrence_type} size="small" sx={{ flexShrink:0, fontSize:11 }} />
                    </Tooltip>
                  </Stack>}
                  secondary={<Typography variant="caption" color="text.secondary" noWrap>
                    {safeFormat(first.start,'p')} – {safeFormat(first.end,'p')} · {resolveAssignee(first)}
                  </Typography>}
                />
              </ListItemButton>
            );
          }
          return (
            <Accordion disableGutters defaultExpanded sx={{ mb:1, border:1, borderColor:'grey.300' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <ListItemIcon sx={{ minWidth: 28 }}>{statusIcon(first.status)}</ListItemIcon>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {resolveTitle(first)}
                    </Typography>
                    <Tooltip title={`Occurs ${first.recurrence_type?.toLowerCase?.()}` || ''}>
                      <Box>
                        <Box sx={{ ml:'auto' }}>
                          <RecurrenceChip type={first.recurrence_type} size="small" sx={{ flexShrink: 0, fontSize:11 }} />
                        </Box>
                      </Box>
                    </Tooltip>
                  </Stack>
                  <Typography variant="caption" sx={{ color:'text.secondary' }} noWrap>
                    {safeFormat(first.start, 'MMM d')} · {safeFormat(first.start, 'p')} – {safeFormat(first.end, 'p')} · {resolveAssignee(first)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, bgcolor:'grey.50', pl:2 }}>
                {(groupStatusFilter[key]? group.filter(ev=> String(ev.status).toLowerCase()===groupStatusFilter[key]):group.slice(1)).map((ev, idx) => (
                  <React.Fragment key={ev.id}>
                    <ListItemButton onClick={() => onRowClick?.(ev)} sx={{ pl: 4 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width:'100%', pr:1 }}>
                        <Typography variant="caption" noWrap>
                          {isSameDay(parseISO(first.start), parseISO(ev.start)) ? 'Today' : safeFormat(ev.start,'MMM d')}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ ml:2 }}>
                          {safeFormat(ev.start,'p')} – {safeFormat(ev.end,'p')} · {resolveAssignee(ev)}
                        </Typography>
                      </Stack>
                    </ListItemButton>
                    {idx !== group.length -1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}

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
