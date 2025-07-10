import React from 'react';
import { CardContent, Box, Typography, Chip, Divider } from '@mui/material';
import { CheckCircleOutline as CheckCircleOutlineIcon, Event as EventIcon, AccessTime as AccessTimeIcon, Build as BuildIcon, Science as ScienceIcon, ListAlt as ListAltIcon, Notes as NotesIcon, HourglassBottom as HourglassBottomIcon } from '@mui/icons-material';
import RecurrenceChip from './RecurrenceChip';
import { alpha, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

function formatDate(dateStr) {
  return dayjs(dateStr).format('D MMM YYYY');
}

const TaskCardContent = ({ task }) => {
  const theme = useTheme();
  return (
    <CardContent sx={{ padding: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          
          <Typography
            variant="h6"
            component="div"
            sx={{
              ...(task.status === 'completed' && {
                textDecoration: 'line-through',
                color: theme.palette.text.disabled,
              }),
              ml: 0.5,
            }}
          >
            {task.__type === 'recipe'
              ? task.recipe_details?.name || task.recipe?.name || 'Unnamed Recipe'
              : task.cleaning_item?.name || 'Unnamed Task'}
          </Typography>
          {task.recurrence_type && (
            <RecurrenceChip type={task.recurrence_type} sx={{ ml: 0.5 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            label={(task.status || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            size="small"
            variant={['pending','scheduled'].includes(task.status) ? 'outlined' : 'filled'}
            color={task.status === 'completed' ? 'success' : task.status === 'pending_review' ? 'info' : task.status === 'pending' ? 'warning' : task.status === 'scheduled' ? 'info' : 'default'}
            sx={{
              fontWeight: 'medium',
              ...(task.status === 'pending' && {
                bgcolor: theme.palette.warning.light,
                color: theme.palette.getContrastText(theme.palette.warning.light),
              }),
              ...(task.status === 'scheduled' && {
                bgcolor: theme.palette.info.light,
                color: theme.palette.getContrastText(theme.palette.info.light),
              }),
            }}
          />
          {task.status === 'completed' && (
            <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, ml: 1 }} />
          )}
          {task.status === 'pending_review' && (
            <HourglassBottomIcon sx={{ color: theme.palette.info.main, ml: 1 }} />
          )}
        </Box>
      </Box>

      <Box sx={{ my: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <EventIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            <strong>Scheduled Date:</strong>{' '}
            {task.__type === 'recipe'
              ? task.scheduled_date
                ? formatDate(task.scheduled_date)
                : 'N/A'
              : task.due_date
              ? formatDate(task.due_date)
              : 'N/A'}
          </Typography>
        </Box>
        {(task.start_time || task.end_time || task.timeslot || task.scheduled_start_time) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <strong>Timeslot:</strong>{' '}
              {task.__type === 'recipe'
                ? task.start_time && task.end_time
                  ? `${task.start_time.substring(0, 5)} - ${task.end_time.substring(0, 5)}`
                  : task.scheduled_start_time && task.scheduled_end_time
                  ? `${task.scheduled_start_time.substring(11, 16)} - ${task.scheduled_end_time.substring(11, 16)}`
                  : 'N/A'
                : task.start_time && task.end_time
                ? `${task.start_time.substring(0, 5)} - ${task.end_time.substring(0, 5)}`
                : task.timeslot || 'N/A'}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ mb: 1 }}>
        {task.__type === 'cleaning' && task.cleaning_item?.equipment && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
            <BuildIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <strong>Equipment:</strong> {task.cleaning_item.equipment}
            </Typography>
          </Box>
        )}
        {task.__type === 'cleaning' && task.cleaning_item?.chemical && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
            <ScienceIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <strong>Chemicals:</strong> {task.cleaning_item.chemical}
            </Typography>
          </Box>
        )}
        {task.__type === 'cleaning' && task.cleaning_item?.method && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
            <ListAltIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <strong>Method:</strong> {task.cleaning_item.method}
            </Typography>
          </Box>
        )}
      </Box>

      {task.__type === 'recipe' && (
        <Typography variant="body2" color="text.secondary">
          <strong>Quantity:</strong>{' '}
          {task.batch_size ? `${task.batch_size} ${task.batch_unit || ''}` : task.quantity || task.batch_quantity || 'N/A'}
        </Typography>
      )}

      {task.notes && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <NotesIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              <strong>Notes:</strong> {task.notes}
            </Typography>
          </Box>
        </>
      )}
    </CardContent>
  );
};

export default TaskCardContent;
