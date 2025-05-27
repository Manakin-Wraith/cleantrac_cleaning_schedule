import React, { useState } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

const ThermometerVerificationForm = ({ thermometer, onSubmit, onCancel }) => {
  const today = new Date();
  const [formData, setFormData] = useState({
    date_verified: today,
    calibrated_instrument_no: '',
    reading_after_verification: '',
    corrective_action: '',
    serial_number: '',
    model_identifier: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date_verified: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Validate form data
    const newErrors = {};
    let hasErrors = false;
    
    if (!formData.serial_number) {
      newErrors.serial_number = 'Serial number is required';
      hasErrors = true;
    }
    
    if (!formData.model_identifier) {
      newErrors.model_identifier = 'Model identifier is required';
      hasErrors = true;
    }
    
    if (!formData.calibrated_instrument_no) {
      newErrors.calibrated_instrument_no = 'Calibrated instrument number is required';
      hasErrors = true;
    }
    
    if (!formData.reading_after_verification) {
      newErrors.reading_after_verification = 'Reading after verification is required';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newErrors);
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      // Format date to YYYY-MM-DD for API
      const formattedData = {
        ...formData,
        date_verified: format(formData.date_verified, 'yyyy-MM-dd'),
        thermometer_id: thermometer.id
      };
      
      await onSubmit(formattedData);
    } catch (err) {
      if (err.response?.data) {
        // Handle field-specific errors from API
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'object') {
          setFieldErrors(apiErrors);
          setError('Verification failed. Please check the form for errors.');
        } else {
          setError(apiErrors || 'Failed to submit verification. Please try again.');
        }
      } else {
        setError(err.message || 'Failed to submit verification. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Verify Thermometer: {thermometer.serial_number}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                Verification Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Please verify the thermometer by confirming its serial number and model identifier.
              </Typography>
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                name="serial_number"
                label="Serial Number"
                value={formData.serial_number}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.serial_number}
                helperText={fieldErrors.serial_number || 'Enter the exact serial number as shown on the thermometer'}
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
              <TextField
                name="model_identifier"
                label="Model Identifier"
                value={formData.model_identifier}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.model_identifier}
                helperText={fieldErrors.model_identifier || 'Enter the exact model identifier as shown on the thermometer'}
              />
            </Grid>

            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                Calibration Information
              </Typography>
            </Grid>
            
            <Grid xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date Verified"
                  value={formData.date_verified}
                  onChange={handleDateChange}
                  maxDate={today}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!fieldErrors.date_verified,
                      helperText: fieldErrors.date_verified
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid xs={12} sm={6}>
              <TextField
                name="calibrated_instrument_no"
                label="Calibrated Instrument Number"
                value={formData.calibrated_instrument_no}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.calibrated_instrument_no}
                helperText={fieldErrors.calibrated_instrument_no}
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
              <TextField
                name="reading_after_verification"
                label="Reading After Verification (°C)"
                value={formData.reading_after_verification}
                onChange={handleChange}
                fullWidth
                required
                type="number"
                inputProps={{ step: "0.1" }}
                error={!!fieldErrors.reading_after_verification}
                helperText={fieldErrors.reading_after_verification}
              />
            </Grid>
            
            <Grid xs={12}>
              <TextField
                name="corrective_action"
                label="Corrective Action (if needed)"
                value={formData.corrective_action}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                error={!!fieldErrors.corrective_action}
                helperText={fieldErrors.corrective_action}
              />
            </Grid>
          </Grid>
        </form>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Verification'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ThermometerVerificationForm;
