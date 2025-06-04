import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Typography
} from '@mui/material';
import { updateTaskInstance } from '../../services/taskService'; // API service

const taskStatuses = [
  'Scheduled',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
];

const ProductionChangeStatusModal = ({ open, onClose, task, onChangeStatus }) => {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setNewStatus(task.status || '');
      setNotes(''); // Reset notes when modal opens or task changes
    } else {
      setNewStatus('');
      setNotes('');
    }
  }, [task, open]);

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  const handleSubmit = async () => {
    if (!newStatus || !task || !task.id) {
      // Optionally, add some validation feedback to the user
      console.error('New status or task ID is missing.');
      // Consider showing an alert or a more user-friendly message here
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        status: newStatus,
        // Assuming 'notes' can be updated on the task object directly.
        // If notes are part of an activity log, this might need a different approach (e.g., separate API call or backend handling).
        notes: notes, // Send notes if the backend task model supports a 'notes' field for general updates.
      };
      // If the backend expects notes to be appended to a log, or handled differently,
      // the payload or service call might need adjustment.
      // For instance, some systems might have a dedicated endpoint for adding comments/notes.

      const updatedTask = await updateTaskInstance(task.id, payload);
      onChangeStatus(updatedTask); // Pass the full updated task object from the API response
      onClose();
    } catch (error) {
      console.error('Failed to change task status:', error.response?.data || error.message || error);
      // TODO: Implement more user-friendly error feedback (e.g., Snackbar/Toast)
      alert(`Error changing status: ${error.response?.data?.detail || error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Task Status</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Task: <strong>{task.title}</strong>
        </Typography>
        <Typography variant="body2" gutterBottom sx={{mb: 2}}>
          Current Status: <strong>{task.status}</strong>
        </Typography>
        <TextField
          select
          label="New Status"
          value={newStatus}
          onChange={handleStatusChange}
          fullWidth
          margin="normal"
          required
        >
          {taskStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Notes (Optional)"
          multiline
          rows={3}
          value={notes}
          onChange={handleNotesChange}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading || !newStatus}>
          {isLoading ? <CircularProgress size={24} /> : 'Save Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionChangeStatusModal;
