import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  FormHelperText,
} from '@mui/material';
import { DesktopDatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
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
    end_time: dayjs().hour(10).minute(0),
    notes: '',
  });

  // recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrencePattern, setRecurrencePattern] = useState('');

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
  const handleEndTimeChange = (value) => setForm({ ...form, end_time: value });

  const handleSubmit = async () => {
    try {
      await createTaskInstance({
        cleaning_item_id_write: form.cleaning_item_id,
        assigned_to_id: form.assigned_to_id || null,
        due_date: form.due_date.format('YYYY-MM-DD'),
        start_time: form.start_time.format('HH:mm:ss'),
        duration_minutes: dayjs(form.end_time).diff(form.start_time, 'minute'),
        end_time: form.end_time.format('HH:mm:ss'),
        notes: form.notes,
        is_recurring: isRecurring,
        recurrence_type: recurrenceType,
        recurrence_pattern: recurrenceType !== 'none' ? recurrencePattern : null,
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
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>Schedule New Cleaning Task</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Cleaning Item */}
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
            {/* Assigned Staff */}
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
            {/* Due Date */}
            <DesktopDatePicker
              label="Due Date"
              value={form.due_date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
            {/* Start Time */}
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={handleStartTimeChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
            {/* End Time */}
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={handleEndTimeChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
            {/* Notes */}
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={form.notes}
              onChange={handleChange('notes')}
            />
            {/* Recurrence Options */}
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: isRecurring ? 'action.hover' : 'transparent' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body1" fontWeight={isRecurring ? 'medium' : 'normal'}>
                    Recurring Task
                  </Typography>
                }
              />
              {isRecurring && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Recurrence Type</InputLabel>
                    <Select
                      value={recurrenceType}
                      label="Recurrence Type"
                      onChange={(e) => setRecurrenceType(e.target.value)}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                  {recurrenceType === 'weekly' && (
                    <TextField
                      label="Day of Week (0=Sunday)"
                      type="number"
                      fullWidth
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      inputProps={{ min: 0, max: 6 }}
                    />
                  )}
                  {recurrenceType === 'monthly' && (
                    <TextField
                      label="Day of Month (1-31)"
                      type="number"
                      fullWidth
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      inputProps={{ min: 1, max: 31 }}
                    />
                  )}
                  {recurrenceType === 'daily' && (
                    <FormHelperText>This task will repeat every day</FormHelperText>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
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
