import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DesktopDatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { createTaskInstance } from '../../services/taskService';
import api from '../../services/api';

/**
 * Temporary stub modal for creating a new cleaning task.
 * Shows a placeholder message so managers can differentiate from the recipe-production modal.
 * Replace with full form implementation during the cleaning-task refactor.
 */
export default function NewCleaningTaskModal({ open, onClose, departmentId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [cleaningItems, setCleaningItems] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const [form, setForm] = useState({
    cleaning_item_id: '',
    assigned_to_id: '',
    due_date: dayjs(),
    start_time: dayjs().hour(9).minute(0),
    duration_minutes: 60,
    notes: '',
  });

  // fetch cleaning items and staff for dept
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([
          api.get('/cleaningitems/', { params: { department_id: departmentId } }),
          api.get('/users/', { params: { department_id: departmentId } }),
        ]);
        setCleaningItems(itemsRes.data);
        setStaffUsers(usersRes.data);
      } catch (e) {
        console.error(e);
        enqueueSnackbar('Failed to load form data', { variant: 'error' });
      }
    };
    fetchData();
  }, [open, departmentId, enqueueSnackbar]);

  const handleChange = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const handleDateChange = (value) => setForm({ ...form, due_date: value });
  const handleStartTimeChange = (value) => setForm({ ...form, start_time: value });

  const handleSubmit = async () => {
    try {
      await createTaskInstance({
        cleaning_item_id_write: form.cleaning_item_id,
        assigned_to_id: form.assigned_to_id || null,
        due_date: form.due_date.format('YYYY-MM-DD'),
        start_time: form.start_time.format('HH:mm:ss'),
        duration_minutes: form.duration_minutes,
        notes: form.notes,
        status: 'pending',
        department_id: departmentId,
      });
      enqueueSnackbar('Task scheduled', { variant: 'success' });
      onClose();
    } catch (e) {
      enqueueSnackbar(e.message || 'Failed to create task', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule New Cleaning Task</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="cleaning-item-label">Cleaning Item</InputLabel>
                <Select
                  labelId="cleaning-item-label"
                  label="Cleaning Item"
                  value={form.cleaning_item_id}
                  onChange={handleChange('cleaning_item_id')}
                >
                  {cleaningItems.map((ci) => (
                    <MenuItem key={ci.id} value={ci.id}>
                      {ci.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="assigned-to-label">Assigned Staff</InputLabel>
                <Select
                  labelId="assigned-to-label"
                  label="Assigned Staff"
                  value={form.assigned_to_id}
                  onChange={handleChange('assigned_to_id')}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {staffUsers.map((u) => (
                    <MenuItem key={u.id} value={u.profile.id}>
                      {u.first_name} {u.last_name || ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DesktopDatePicker
                label="Due Date"
                value={form.due_date}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Start Time"
                value={form.start_time}
                onChange={handleStartTimeChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (min)"
                type="number"
                fullWidth
                value={form.duration_minutes}
                onChange={handleChange('duration_minutes')}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                multiline
                rows={3}
                fullWidth
                value={form.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.cleaning_item_id}>
          Schedule Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

NewCleaningTaskModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  departmentId: PropTypes.number.isRequired,
};
