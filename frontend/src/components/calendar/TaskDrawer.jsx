import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * TaskDrawer – slide-in panel showing details of a cleaning or recipe task.
 * Phase-1 MVP: read-only details + Edit / Delete buttons that call parent callbacks.
 */
export default function TaskDrawer({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
}) {
  if (!task) return null;

  // Helpers
  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1200 }}>
      <Box sx={{ width: { xs: '100vw', sm: 480 }, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {task.type === 'cleaning' ? 'Cleaning Task' : 'Recipe Production'}
          </Typography>
          <IconButton onClick={onClose} aria-label="close drawer">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details Section */}
        <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Title */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
            {task.title || task.cleaning_item_name || task.cleaning_item?.name || task.recipe_details?.name || 'Untitled'}
          </Typography>

          {/* Status & Department */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {task.status && (
              <Typography variant="caption" color="text.secondary">Status: {task.status}</Typography>
            )}
            {task.department && (
              <Typography variant="caption" color="text.secondary">Department: {task.department}</Typography>
            )}
          </Stack>

          {/* Schedule */}
          <Typography variant="body2" color="text.secondary">
            Schedule: {formatDate(task.start)} – {formatDate(task.end)}
          </Typography>

          {/* Recurrence */}
          {task.is_recurring && task.recurrence_pattern && (
            <Typography variant="body2" color="text.secondary">
              Recurs: {task.recurrence_pattern}
            </Typography>
          )}

          {/* Assignment */}
          {task.assignedToName && (
            <Typography variant="body2" color="text.secondary">
              Assigned to: {task.assignedToName}
            </Typography>
          )}

          {/* Cleaning / Recipe specific */}
          {task.batch_size && (
            <Typography variant="body2" color="text.secondary">
              Batch size: {task.batch_size} {task.batch_unit || ''}
            </Typography>
          )}
          {task.cleaning_item?.area && (
            <Typography variant="body2" color="text.secondary">
              Area: {task.cleaning_item.area}
            </Typography>
          )}

          {/* Costs */}
          {typeof task.unit_cost === 'number' && (
            <Typography variant="body2" color="text.secondary">
              Unit cost: {task.unit_cost.toFixed(2)}
            </Typography>
          )}
          {typeof task.total_cost === 'number' && (
            <Typography variant="body2" color="text.secondary">
              Total cost: {task.total_cost.toFixed(2)}
            </Typography>
          )}

          {/* Notes */}
          {task.notes && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              Notes: {task.notes}
            </Typography>
          )}

          {/* Audit */}
          {(task.created_at || task.updated_at) && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
              {task.created_at && `Created: ${formatDate(task.created_at)}`}
              {task.updated_at && ` | Updated: ${formatDate(task.updated_at)}`}
            </Typography>
          )}
        </Stack>

        {/* Actions */}
        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(task)}>
            Delete
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

TaskDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
