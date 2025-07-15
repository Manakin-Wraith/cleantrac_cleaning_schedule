import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Button,
  Chip,
  Collapse,
  Alert,
} from '@mui/material';
// Timeline components are in MUI Lab, not core MUI
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineContent from '@mui/lab/TimelineContent';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

import RecurrenceChip from '../tasks/RecurrenceChip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * TaskDrawer – slide-in panel showing details of a cleaning or recipe task. */
export default function TaskDrawer({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
  onComplete,
}) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!task || task.status === 'archived') return null;

  const { currentUser } = useAuth();
  const roleRaw = currentUser?.profile?.role || currentUser?.role || 'staff';
  const role = String(roleRaw).toLowerCase();
  const isManager = role === 'manager' || role === 'superuser';
  
  // Helpers
  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };
  
  // Determine if the task is in pending review status
  const isPendingReview = task.status === 'pending_review';
  
  // Calculate how long the task has been pending review (if applicable)
  const getDaysInReview = () => {
    if (!isPendingReview || !task.review_requested_at) return null;
    const reviewDate = new Date(task.review_requested_at);
    const today = new Date();
    const diffTime = Math.abs(today - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysInReview = getDaysInReview();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1200 }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 600, md: 640 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display:'flex', alignItems:'center' }}>
            <Typography variant="h6" sx={{ mr:1 }}>
              {task.title || task.cleaning_item_name || task.cleaning_item?.name || task.recipe_details?.name || 'Task'}
            </Typography>
            {task.recurrence_type && (
              <RecurrenceChip type={task.recurrence_type} sx={{ mr:1 }} />
            )}
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Chip
              label={(task.status || '').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
              size="small"
              variant={['pending','scheduled','pending_review'].includes(task.status) ? 'outlined' : 'filled'}
              color={
                task.status === 'completed' ? 'success' : 
                task.status === 'pending_review' ? 'secondary' : 
                task.status === 'pending' ? 'warning' : 
                task.status === 'scheduled' ? 'info' : 'default'
              }
              icon={task.status === 'pending_review' ? <PendingIcon /> : undefined}
              sx={{
                fontWeight:'medium',
                ...(task.status === 'pending' && {
                  bgcolor: theme.palette.warning.light,
                  color: theme.palette.getContrastText(theme.palette.warning.light),
                }),
                ...(task.status === 'scheduled' && {
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.getContrastText(theme.palette.info.light),
                }),
                ...(task.status === 'pending_review' && {
                  bgcolor: theme.palette.secondary.light,
                  color: theme.palette.getContrastText(theme.palette.secondary.light),
                  border: `1px solid ${theme.palette.secondary.main}`,
                }),
              }}
            />
            <IconButton onClick={onClose} aria-label="close drawer">
            <CloseIcon />
          </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details Section */}
        <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto' }}>
          {/* Title */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word', textDecoration: ['completed','done'].includes(task.status?.toLowerCase?.()) ? 'line-through' : 'none' }}>
            {task.title || task.cleaning_item_name || task.cleaning_item?.name || task.recipe_details?.name || 'Untitled'}
          </Typography>

          {/* Pending Review Alert - Only show for pending review tasks */}
          {isPendingReview && (
            <Alert 
              severity="info" 
              icon={<PendingIcon />}
              sx={{ 
                mb: 1,
                bgcolor: theme.palette.secondary.light + '20', // Transparent version of secondary color
                '& .MuiAlert-icon': {
                  color: theme.palette.secondary.main
                }
              }}
            >
              {isManager ? (
                <Typography variant="body2">
                  This task requires your review and approval.
                  {daysInReview > 0 && ` Pending for ${daysInReview} day${daysInReview !== 1 ? 's' : ''}.`}
                </Typography>
              ) : (
                <Typography variant="body2">
                  Awaiting manager review.
                  {daysInReview > 0 && ` Submitted ${daysInReview} day${daysInReview !== 1 ? 's' : ''} ago.`}
                </Typography>
              )}
            </Alert>
          )}

          {/* Status & Department */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {task.status && (
              <Typography variant="caption" color="text.secondary">Status: {task.status.replace(/_/g, ' ')}</Typography>
            )}
            {task.department && (
              <Typography variant="caption" color="text.secondary">Department: {task.department}</Typography>
            )}
          </Stack>

          {/* Schedule */}
          <Typography variant="body2" color="text.secondary">
            Schedule: {formatDate(task.start)} – {formatDate(task.end)}
          </Typography>

          {/* Review Date - Only show for pending review tasks */}
          {isPendingReview && task.review_requested_at && (
            <Typography variant="body2" color="text.secondary">
              Submitted for review: {formatDate(task.review_requested_at)}
            </Typography>
          )}

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

          {/* Status Timeline */}
          {(task.created_at || task.review_requested_at || task.completed_at) && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Status Timeline</Typography>
              <Stack spacing={1} sx={{ pl: 1 }}>
                {task.created_at && (
                  <Box>
                    <Typography variant="body2">Created</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(task.created_at)}</Typography>
                  </Box>
                )}
                {isPendingReview && task.review_requested_at && (
                  <Box>
                    <Typography variant="body2">Submitted for Review</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(task.review_requested_at)}</Typography>
                  </Box>
                )}
                {task.completed_at && (
                  <Box>
                    <Typography variant="body2">Completed</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(task.completed_at)}</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Toggle for additional details */}
          <Button 
            variant="text" 
            size="small" 
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ alignSelf: 'flex-start', mt: 1, mb: 0.5 }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>

          {/* Collapsible Additional Details */}
          <Collapse in={showDetails}>
            <Stack spacing={1.5}>
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
              {task.updated_at && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                  Last updated: {formatDate(task.updated_at)}
                </Typography>
              )}
            </Stack>
          </Collapse>
        </Stack>

        {/* Manager-specific Action Section for Pending Review */}
        {isManager && isPendingReview && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Manager Review Required
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This task is awaiting your review and completion confirmation.
            </Typography>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<CheckCircleIcon />}
              onClick={onComplete ? () => onComplete(task) : null}
              sx={{ mt: 1 }}
            >
              Approve & Mark Completed
            </Button>
          </Box>
        )}
        
        {/* Actions */}
        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {/* Show Mark Completed button for staff with pending/scheduled tasks */}
          {(!isManager && ['pending','scheduled'].includes(String(task.status).toLowerCase())) && (
            <Button
              variant="contained"
              color="success"
              onClick={onComplete ? () => onComplete(task) : null}
              sx={{ mr: 1 }}
            >
              Mark Completed
            </Button>
          )}
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
  onComplete: PropTypes.func,
};
