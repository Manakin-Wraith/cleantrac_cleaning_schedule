import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchCleaningItemsForDepartment, submitDailyCleaningRecord } from '../../services/foodSafetyService';

const AddDailyCleaningRecordForm = ({ departmentId, onSuccess, onCancel }) => {
  const [cleaningItemId, setCleaningItemId] = useState('');
  const [dateRecorded, setDateRecorded] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);
  const [comment, setComment] = useState('');
  
  const [cleaningItems, setCleaningItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCleaningItems = async () => {
      if (!departmentId) {
        setError('Department ID is required to load cleaning items.');
        setCleaningItems([]);
        return;
      }
      setIsLoadingItems(true);
      setError('');
      try {
        const items = await fetchCleaningItemsForDepartment(departmentId);
        setCleaningItems(items || []);
        if (items && items.length > 0) {
          // Optionally pre-select the first item or leave blank
          // setCleaningItemId(items[0].id); 
        } else if (!items || items.length === 0) {
            setError('No cleaning items found for this department. Please ensure items are configured.');
        }
      } catch (err) {
        console.error('Failed to fetch cleaning items:', err);
        setError(err.message || 'Failed to load cleaning items.');
        setCleaningItems([]);
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadCleaningItems(); 
  }, [departmentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); 

    if (!cleaningItemId) {
      setError('Please select a cleaning item.');
      return;
    }
    if (!dateRecorded) {
      setError('Please select a date.');
      return;
    }

    const formData = {
      cleaning_item_id: cleaningItemId, 
      date_recorded: dateRecorded.toISOString().split('T')[0], 
      is_completed: isCompleted,
      comment,
      department: departmentId, 
    };

    setIsSubmitting(true);
    try {
      await submitDailyCleaningRecord(formData);
      if (onSuccess) {
        onSuccess(); 
      }
    } catch (submissionError) {
      console.error('Failed to submit daily cleaning record:', submissionError);
      setError(submissionError.message || 'Failed to submit record. Please check input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, p: { xs: 1, sm: 2}, border: '1px solid #ddd', borderRadius: '4px' }}>
        <Typography variant="h6" gutterBottom sx={{mb: 2}}>
          Add Daily Cleaning Record
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth margin="normal" required disabled={isLoadingItems || isSubmitting}>
          <InputLabel id="cleaning-item-label">Cleaning Item</InputLabel>
          <Select
            labelId="cleaning-item-label"
            id="cleaning-item"
            value={cleaningItemId}
            label="Cleaning Item"
            onChange={(e) => setCleaningItemId(e.target.value)}
          >
            {isLoadingItems ? (
              <MenuItem value="" disabled><CircularProgress size={20} sx={{mr:1}} /> Loading items...</MenuItem>
            ) : cleaningItems.length === 0 && !error ? (
              <MenuItem value="" disabled>No cleaning items available for your department.</MenuItem>
            ) : cleaningItems.length === 0 && error && !error.includes('Failed to load cleaning items') ? (
              <MenuItem value="" disabled>No cleaning items available for your department.</MenuItem>
            ) : (
              cleaningItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <DatePicker
          label="Date Recorded"
          value={dateRecorded}
          onChange={(newValue) => setDateRecorded(newValue)}
          renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
          disabled={isSubmitting}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              name="isCompleted"
              color="primary"
              disabled={isSubmitting}
            />
          }
          label="Mark as Completed"
          sx={{ mt: 1, mb: 1 }}
        />

        <TextField
          margin="normal"
          fullWidth
          id="comment"
          label="Comment (Optional)"
          name="comment"
          multiline
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} sx={{ mr: 1 }} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoadingItems || isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Submit Record'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AddDailyCleaningRecordForm;
