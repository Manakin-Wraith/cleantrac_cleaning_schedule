import React, { useState } from 'react';
import { 
  Typography, Box, Button, CircularProgress, Alert,
  TextField, Grid, Card, CardContent, CardActions, Divider,
  InputAdornment, Avatar, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const ThermometerVerificationForm = ({ thermometer, onSubmit, onCancel }) => {
  const today = new Date();
  const [formData, setFormData] = useState({
    date_verified: today,
    calibrated_instrument_no: '',
    reading_after_verification: '',
    
    serial_number: thermometer?.serial_number || '',
    model_identifier: thermometer?.model_identifier || ''
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
    <Card variant="outlined" sx={{ mb: 3, bgcolor: theme => theme.palette.background.default, borderRadius: 2, p:{ xs:2.5, sm:3 } }}>
      <CardContent>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:1, mb:2 }}>
          <Box sx={{ display:'flex', alignItems:'center' }}>
            <Avatar sx={{ bgcolor:'grey.200', width:32, height:32 }}>
              <ThermostatIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{fontWeight:600, ml:1}}>
              Verify Thermometer
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml:'auto' }}>
            Serial #: {thermometer.serial_number}
          </Typography>
        </Box>
        <Divider />
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                Thermometer Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Please verify the thermometer by confirming its serial number and model identifier.
              </Typography>
            </Grid>

            <Grid xs={12} sm={4}>
              <TextField
                label="Serial Number"
                value={thermometer.serial_number}
                fullWidth
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                label="Model Identifier"
                value={thermometer.model_identifier}
                fullWidth
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                Verification Data
              </Typography>
            </Grid>

            <Grid xs={12} sm={4}>
              <FormControl fullWidth required error={!!fieldErrors.calibrated_instrument_no}>
                <InputLabel id="calibrated-select-label">Calibrated Instrument</InputLabel>
                <Select
                  labelId="calibrated-select-label"
                  name="calibrated_instrument_no"
                  label="Calibrated Instrument"
                  value={formData.calibrated_instrument_no}
                  onChange={handleChange}
                  IconComponent={ArrowDropDownIcon}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={"Instrument 1"}>Instrument 1</MenuItem>
                  <MenuItem value={"Instrument 2"}>Instrument 2</MenuItem>
                  <MenuItem value={"Instrument 3"}>Instrument 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12} sm={4}>
              <TextField
                name="reading_after_verification"
                label="Temperature (°C)"
                value={formData.reading_after_verification}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.reading_after_verification}
                type="number"
                inputProps={{ step:'0.1', inputMode:'decimal' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <ThermostatIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                helperText={fieldErrors.reading_after_verification}
              />
            </Grid>

            <Grid xs={12} sm={4}>
              <TextField
                label="Date Verified"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarTodayIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                value={format(today, 'yyyy/MM/dd')}
                fullWidth
              />
            </Grid>
          </Grid>
        </form>
        <Divider sx={{ mt:3 }} />
      </CardContent>
      
      <CardActions sx={{ justifyContent: { xs:'center', sm:'flex-end' }, flexWrap:'wrap', gap:1, p: 2 }}>
        <Button variant="contained" sx={{ bgcolor:'grey.300', color:'text.primary', '&:hover':{ bgcolor:'grey.400' } }} onClick={onCancel} disabled={loading}>
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
