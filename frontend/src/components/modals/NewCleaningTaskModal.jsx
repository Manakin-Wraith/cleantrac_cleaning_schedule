import React, { useEffect, useState } from 'react';
// DEBUG: confirm correct NewCleaningTaskModal module is loaded
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('%c[NewCleaningTaskModal] module loaded', 'color: #2196f3');
}
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
import { createTaskInstance, updateTaskInstance } from '../../services/taskService';
import api from '../../services/api';

/**
 * Temporary stub modal for creating a new cleaning task.
 * Shows a placeholder message so managers can differentiate from the recipe-production modal.
 * Replace with full form implementation during the cleaning-task refactor.
 */
export default function NewCleaningTaskModal({ open, onClose, departmentId, editMode = false, task = null, onSave }) {
  const { enqueueSnackbar } = useSnackbar();
  const [cleaningItems, setCleaningItems] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const initialFormState = {
    cleaning_item_id: '',
    assigned_to_id: '',
    due_date: dayjs(),
    start_time: dayjs().hour(9).minute(0),
    end_time: dayjs().hour(10).minute(0),
    notes: '',
  };

  const [form, setForm] = useState(initialFormState);

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
        const fetchedItems = itemsRes.data;
        const fetchedUsers = usersRes.data;

        // Ensure currently selected values exist in options to avoid MUI out-of-range warnings
        if (editMode && task) {
          const cid = typeof task.cleaning_item === 'object' ? task.cleaning_item?.id : task.cleaning_item_id || task.cleaning_item;
          if (cid && !fetchedItems.some(ci => String(ci.id) === String(cid))) {
            fetchedItems.push({ id: cid, name: task.cleaning_item?.name || 'Selected Item' });
          }

          const uid = task.assigned_to || task.assigned_to_id;
          if (uid && !fetchedUsers.some(u => String(u.profile?.id) === String(uid))) {
            fetchedUsers.push({ id: uid, profile: { id: uid }, first_name: 'Assigned', last_name: 'User' });
          }
        }

        setCleaningItems(fetchedItems);
        setStaffUsers(fetchedUsers);
      } catch (e) {
        console.error(e);
        enqueueSnackbar('Failed to load form data', { variant: 'error' });
      }
    };
    fetchData();
  }, [open, departmentId, enqueueSnackbar]);

  // populate form when editing
  useEffect(() => {
    if (open && editMode && task) {
      setForm({
        cleaning_item_id: task.cleaning_item_id || (typeof task.cleaning_item === 'object' ? task.cleaning_item.id : task.cleaning_item) || '',
        assigned_to_id: task.assigned_to || task.assigned_to_id || '',
        due_date: task.due_date ? dayjs(task.due_date) : dayjs(),
        start_time: task.start_time ? dayjs(`1970-01-01T${task.start_time}`) : dayjs().hour(9).minute(0),
        end_time: task.end_time ? dayjs(`1970-01-01T${task.end_time}`) : dayjs().hour(10).minute(0),
        notes: task.notes || '',
      });
      setIsRecurring(Boolean(task.is_recurring));
      setRecurrenceType(task.recurrence_type || 'none');
      setRecurrencePattern(task.recurrence_pattern || '');
    } else if (!open) {
      // reset when closed
      setForm(initialFormState);
      setIsRecurring(false);
      setRecurrenceType('none');
      setRecurrencePattern('');
    }
  }, [open, editMode, task]);

  const handleChange = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const handleDateChange = (value) => setForm({ ...form, due_date: value });
  const handleStartTimeChange = (value) => setForm({ ...form, start_time: value });
  const handleEndTimeChange = (value) => setForm({ ...form, end_time: value });

  const handleSubmit = async () => {
    try {
      const toNullableNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

      let payload;
      if (editMode && task) {
        payload = {};
        // compare each editable field; add only if changed
        const origAssigned = task.assigned_to || task.assigned_to_id || null;
        if (toNullableNumber(form.assigned_to_id) !== toNullableNumber(origAssigned)) {
          payload.assigned_to_id = toNullableNumber(form.assigned_to_id);
        }

        if (!dayjs(form.due_date).isSame(task.due_date, 'day')) {
          payload.due_date = form.due_date.format('YYYY-MM-DD');
        }

        const origStart = dayjs(`1970-01-01T${task.start_time}`);
        if (!form.start_time.isSame(origStart, 'minute')) {
          payload.start_time = form.start_time.format('HH:mm:ss');
        }

        const origEnd = dayjs(`1970-01-01T${task.end_time}`);
        if (!form.end_time.isSame(origEnd, 'minute')) {
          payload.end_time = form.end_time.format('HH:mm:ss');
          payload.duration_minutes = dayjs(form.end_time).diff(form.start_time, 'minute');
        }

        // Cleaning Item change
const origCleaning = (typeof task.cleaning_item === 'object' ? task.cleaning_item?.id : task.cleaning_item_id || task.cleaning_item || null);
if (toNullableNumber(form.cleaning_item_id) !== toNullableNumber(origCleaning)) {
  payload.cleaning_item_id_write = toNullableNumber(form.cleaning_item_id);
}

if ((task.notes || '') !== (form.notes || '')) {
          payload.notes = form.notes;
        }

        // Recurrence fields
        if (task.is_recurring !== isRecurring) payload.is_recurring = isRecurring;
        if (task.recurrence_type !== recurrenceType) payload.recurrence_type = recurrenceType;
        if ((task.recurrence_pattern || '') !== (recurrencePattern || '')) payload.recurrence_pattern = recurrencePattern;

        // remove null/undefined
        Object.keys(payload).forEach((k) => (payload[k] == null ? delete payload[k] : null));
      } else {
        payload = {
          assigned_to_id: toNullableNumber(form.assigned_to_id),
          due_date: form.due_date.format('YYYY-MM-DD'),
          start_time: form.start_time.format('HH:mm:ss'),
          duration_minutes: dayjs(form.end_time).diff(form.start_time, 'minute'),
          end_time: form.end_time.format('HH:mm:ss'),
          notes: form.notes,
          is_recurring: isRecurring,
          recurrence_type: recurrenceType,
          recurrence_pattern: recurrenceType !== 'none' ? recurrencePattern : null,
          status: 'pending',
          cleaning_item_id_write: toNullableNumber(form.cleaning_item_id),
          department_id: departmentId,
        };
      }

      let saved;
      if (editMode && task?.id) {
        // DEBUG: inspect payload for edit mode
console.log('[NewCleaningTaskModal] update payload', payload);
saved = await updateTaskInstance(task.id, payload);
        enqueueSnackbar('Task updated', { variant: 'success' });
      } else {
        saved = await createTaskInstance(payload);
        enqueueSnackbar('Task scheduled', { variant: 'success' });
      }

      if (onSave) onSave(saved);
      onClose();
    } catch (e) {
      enqueueSnackbar(e.message || 'Failed to save task', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{editMode ? 'Edit Cleaning Task' : 'Schedule New Cleaning Task'}</DialogTitle>
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Cleaning Item */}
            <FormControl fullWidth required>
              <InputLabel id="cleaning-item-label">Cleaning Item</InputLabel>
              <Select
                labelId="cleaning-item-label"
                label="Cleaning Item"
                value={String(form.cleaning_item_id || '')}
                onChange={handleChange('cleaning_item_id')}
              >
                {cleaningItems.map((ci) => (
                  <MenuItem key={ci.id} value={String(ci.id)}>
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
                value={String(form.assigned_to_id || '')}
                onChange={handleChange('assigned_to_id')}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {staffUsers.map((u) => (
                  <MenuItem key={u.profile?.id || u.id} value={String(u.profile?.id || u.id)}>
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
          {editMode ? 'Save Changes' : 'Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

NewCleaningTaskModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  departmentId: PropTypes.number.isRequired,
  editMode: PropTypes.bool,
  task: PropTypes.object,
  onSave: PropTypes.func,
};
