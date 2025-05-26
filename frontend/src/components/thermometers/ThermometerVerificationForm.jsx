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
    corrective_action: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    
    // Validate form data
    if (!formData.calibrated_instrument_no) {
      setError('Calibrated instrument number is required');
      return;
    }
    
    if (!formData.reading_after_verification) {
      setError('Reading after verification is required');
      return;
    }
    
    try {
      setLoading(true);
      // Format date to YYYY-MM-DD for API
      const formattedData = {
        ...formData,
        date_verified: format(formData.date_verified, 'yyyy-MM-dd')
      };
      
      await onSubmit(formattedData);
    } catch (err) {
      setError(err.message || 'Failed to submit verification. Please try again.');
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
