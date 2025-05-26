import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, Stepper, Step, StepLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WarningIcon from '@mui/icons-material/Warning';
import { 
  getVerifiedThermometers, 
  getAreaUnits,
  createTemperatureLog
} from '../../services/thermometerService';

const TemperatureLoggingSection = ({ 
  verifiedThermometers, 
  isLoading: isLoadingFromProps,
  staffId, // Prop from StaffTasksPage
  departmentId // Prop from StaffTasksPage
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [componentLoading, setComponentLoading] = useState(true); // For areaUnits fetch
  const [submitLoading, setSubmitLoading] = useState(false); // For log submission
  const [error, setError] = useState('');
  const [areaUnits, setAreaUnits] = useState([]);
  const [selectedThermometer, setSelectedThermometer] = useState(null);
  const [selectedAreaUnit, setSelectedAreaUnit] = useState(null);
  const [formData, setFormData] = useState({
    temperature_reading: '',
    time_period: 'AM',
    corrective_action: ''
  });
  const theme = useTheme();

  const steps = ['Select Thermometer', 'Select Area', 'Log Temperature'];

  useEffect(() => {
    const fetchAreaUnits = async () => {
      try {
        setComponentLoading(true);
        setError('');
        // Get area units
        const areasData = await getAreaUnits();
        setAreaUnits(areasData || []);
      } catch (err) {
        console.error("Failed to load area units:", err);
        setError(err.message || 'Failed to load area units. Please try refreshing.');
        setAreaUnits([]); // Ensure areaUnits is an array on error
      } finally {
        setComponentLoading(false);
      }
    };

    fetchAreaUnits();
    // Verified thermometers are now passed as props, no need to fetch them here.
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedThermometer(null);
    setSelectedAreaUnit(null);
    setFormData({
      temperature_reading: '',
      time_period: 'AM',
      corrective_action: ''
    });
  };

  const handleSelectThermometer = (thermometer) => {
    setSelectedThermometer(thermometer);
    handleNext();
  };

  const handleSelectArea = (areaUnit) => {
    setSelectedAreaUnit(areaUnit);
    handleNext();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form data
    if (!formData.temperature_reading) {
      setError('Temperature reading is required');
      return;
    }
    if (!selectedThermometer) {
      setError('A thermometer must be selected.');
      return;
    }
    if (!selectedAreaUnit) {
      setError('An area unit must be selected.');
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      // Current date and time for log_datetime
      const now = new Date();
      const formattedDateTime = now.toISOString();
      
      await createTemperatureLog({
        thermometer_used_id: selectedThermometer.id,
        area_unit_id: selectedAreaUnit.id,
        log_datetime: formattedDateTime,
        // staff_id: staffId, // Backend uses request.user for logged_by_id
        department_id: departmentId, // Include departmentId if your backend expects it
        ...formData
      });
      
      // Move to success step
      handleNext();
    } catch (err) {
      console.error("Failed to submit temperature log:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit temperature log. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Select a verified thermometer to use:
            </Typography>
            
            {isLoadingFromProps ? (
              <CircularProgress />
            ) : verifiedThermometers && verifiedThermometers.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                No verified thermometers available. Please verify a thermometer first.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {verifiedThermometers && verifiedThermometers.map((thermometer) => (
                  <Grid item xs={12} sm={6} md={4} key={thermometer.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          borderColor: theme.palette.primary.main,
                          boxShadow: 1
                        }
                      }}
                      onClick={() => handleSelectThermometer(thermometer)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {thermometer.serial_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Model: {thermometer.model_identifier}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last Verified: {thermometer.last_verification_date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expires: {thermometer.verification_expiry_date}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Select an area to log temperature for:
            </Typography>
            
            {componentLoading ? (
              <CircularProgress />
            ) : areaUnits.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                No area units available. Please contact your manager.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {areaUnits.map((area) => (
                  <Grid item xs={12} sm={6} md={4} key={area.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          borderColor: theme.palette.primary.main,
                          boxShadow: 1
                        }
                      }}
                      onClick={() => handleSelectArea(area)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {area.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {area.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          Target Temperature Range:
                        </Typography>
                        <Typography variant="body1" color="primary">
                          {area.target_temperature_min}°C - {area.target_temperature_max}°C
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Log Temperature Reading:
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Thermometer:
                    </Typography>
                    <Typography variant="body1">
                      {selectedThermometer.serial_number} ({selectedThermometer.model_identifier})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Area:
                    </Typography>
                    <Typography variant="body1">
                      {selectedAreaUnit.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Target Temperature Range:
                    </Typography>
                    <Typography variant="body1" color="primary">
                      {selectedAreaUnit.target_temperature_min}°C - {selectedAreaUnit.target_temperature_max}°C
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="temperature_reading"
                    label="Temperature Reading (°C)"
                    value={formData.temperature_reading}
                    onChange={handleChange}
                    fullWidth
                    required
                    type="number"
                    inputProps={{ step: "0.1" }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="time-period-label">Time Period</InputLabel>
                    <Select
                      labelId="time-period-label"
                      name="time_period"
                      value={formData.time_period}
                      onChange={handleChange}
                      label="Time Period"
                    >
                      <MenuItem value="AM">Morning (AM)</MenuItem>
                      <MenuItem value="PM">Afternoon (PM)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
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
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Temperature Log Submitted Successfully!
            </Typography>
            <Typography variant="body1">
              You have successfully logged a temperature of {formData.temperature_reading}°C
              for {selectedAreaUnit.name} using thermometer {selectedThermometer.serial_number}.
            </Typography>
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ mt: 3 }}
            >
              Log Another Temperature
            </Button>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DeviceThermostatIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.secondary.main }} />
        <Typography variant="h5" component="h2">
          Temperature Logging
        </Typography>
      </Box>

      {isLoadingFromProps || componentLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error && activeStep < steps.length -1 ? ( // Show general error only if not on success step
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <Box sx={{ width: '100%' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            {renderStepContent(activeStep)}
          </Box>
          
          {activeStep !== 0 && activeStep !== 3 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              {activeStep === 2 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TemperatureLoggingSection;
