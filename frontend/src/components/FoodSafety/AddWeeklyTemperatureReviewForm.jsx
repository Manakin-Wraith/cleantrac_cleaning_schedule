// frontend/src/components/FoodSafety/AddWeeklyTemperatureReviewForm.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { submitWeeklyTemperatureReview } from '../../services/foodSafetyService'; // Import the service

// Renamed onSubmit to onSuccess to match parent's prop name for clarity
const AddWeeklyTemperatureReviewForm = ({ departmentId, onSuccess, onCancel }) => {
  const [weekStartDate, setWeekStartDate] = useState(''); // Store as string 'YYYY-MM-DD'
  const [overallComment, setOverallComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!departmentId || !weekStartDate) {
      setError('Department and Week Start Date are required.');
      return;
    }

    // Ensure weekStartDate is in 'YYYY-MM-DD' format (already handled by input type="date")
    const formData = {
      department_id: departmentId, // Ensure field name matches backend (usually department_id or department)
      week_start_date: weekStartDate, 
      overall_status: 'Reviewed', // Default status, or make it a field if variable
      comments: overallComment,
      // reviewed_by will be set by the backend based on the authenticated user
    };

    setIsSubmitting(true);
    try {
      await submitWeeklyTemperatureReview(formData);
      // alert('Weekly Temperature Review submitted successfully!'); // Or use a more integrated notification
      if (onSuccess) {
        onSuccess(); // Call the success callback passed from parent
      }
    } catch (submissionError) {
      console.error('Failed to submit weekly temperature review:', submissionError);
      setError(submissionError.message || 'Failed to submit review. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2}}>
        Add New Weekly Temperature Review
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="weekStartDate"
          label="Week Start Date"
          name="weekStartDate"
          type="date" // Uses browser's native date picker
          InputLabelProps={{ shrink: true }}
          value={weekStartDate}
          onChange={(e) => setWeekStartDate(e.target.value)} // Value is already YYYY-MM-DD string
          disabled={isSubmitting}
        />
        <TextField
          margin="normal"
          fullWidth
          id="overallComment"
          label="Overall Comment (Optional)"
          name="overallComment"
          multiline
          rows={3}
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={isSubmitting}
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2, mb: 1 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} sx={{ mr: 1 }} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AddWeeklyTemperatureReviewForm;
