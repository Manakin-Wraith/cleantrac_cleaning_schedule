import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, Stepper, Step, StepLabel,
  Chip, alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { 
  getVerifiedThermometers, 
  getAreaUnits,
  createTemperatureLog,
  getCurrentAssignment,
  getTemperatureLogsByDate,
  getAreasWithLogStatus
} from '../../services/thermometerService';

const TemperatureLoggingSection = ({ 
  verifiedThermometers, 
  isLoading: isLoadingFromProps,
  staffId, // Prop from StaffTasksPage
  departmentId, // Prop from StaffTasksPage
  currentUser // Prop from StaffTasksPage
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [componentLoading, setComponentLoading] = useState(true); // For areaUnits fetch
  const [submitLoading, setSubmitLoading] = useState(false); // For log submission
  const [error, setError] = useState('');
  const [areaUnits, setAreaUnits] = useState([]);
  const [loggedAreas, setLoggedAreas] = useState([]);
  const [todaysLogs, setTodaysLogs] = useState({});
  const [selectedThermometer, setSelectedThermometer] = useState(null);
  const [selectedAreaUnit, setSelectedAreaUnit] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [formData, setFormData] = useState({
    temperature_reading: '',
    time_period: 'AM',
    corrective_action: ''
  });
  const [allowedTimePeriods, setAllowedTimePeriods] = useState(['AM', 'PM']);
  const [newlyLoggedAreaId, setNewlyLoggedAreaId] = useState(null);
  const theme = useTheme();

  const steps = ['Select Thermometer', 'Select Area', 'Log Temperature'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setComponentLoading(true);
        setError('');
        
        // Get areas with their logged status
        try {
          const areasWithStatusData = await getAreasWithLogStatus();
          
          // Set area units with enhanced status information
          setAreaUnits(areasWithStatusData || []);
          
          // Create a map of area IDs to their logs for backward compatibility
          const logsMap = {};
          const loggedAreaIds = [];
          
          areasWithStatusData.forEach(area => {
            // If area has been logged in either AM or PM, add to logged areas
            if (area.am_logged || area.pm_logged) {
              loggedAreaIds.push(area.id);
              
              // Create entries in the logs map
              logsMap[area.id] = [];
              
              if (area.am_log_details) {
                logsMap[area.id].push({
                  ...area.am_log_details,
                  area_unit_id: area.id,
                  area_unit_name: area.name,
                  target_temperature_min: area.target_temperature_min,
                  target_temperature_max: area.target_temperature_max
                });
              }
              
              if (area.pm_log_details) {
                logsMap[area.id].push({
                  ...area.pm_log_details,
                  area_unit_id: area.id,
                  area_unit_name: area.name,
                  target_temperature_min: area.target_temperature_min,
                  target_temperature_max: area.target_temperature_max
                });
              }
            }
          });
          
          setTodaysLogs(logsMap);
          setLoggedAreas(loggedAreaIds);
        } catch (areasErr) {
          console.error('Failed to fetch areas with status:', areasErr);
          
          // Fallback to original approach if new endpoint fails
          const areasData = await getAreaUnits();
          setAreaUnits(areasData || []);
          
          // Get today's temperature logs
          const today = new Date().toISOString().split('T')[0];
          try {
            const logsData = await getTemperatureLogsByDate(today);
            
            // Create a map of area IDs to their logs
            const logsMap = {};
            logsData.forEach(log => {
              if (!logsMap[log.area_unit_id]) {
                logsMap[log.area_unit_id] = [];
              }
              logsMap[log.area_unit_id].push(log);
            });
            
            setTodaysLogs(logsMap);
            
            // Set logged areas
            const loggedAreaIds = Object.keys(logsMap).map(id => parseInt(id));
            setLoggedAreas(loggedAreaIds);
          } catch (logsErr) {
            console.log('Failed to fetch today\'s temperature logs:', logsErr);
          }
        }
        
        // Get current thermometer assignment to determine allowed time periods
        try {
          const assignmentData = await getCurrentAssignment();
          setCurrentAssignment(assignmentData);
          
          // Set allowed time periods based on assignment
          if (assignmentData) {
            if (assignmentData.time_period === 'AM') {
              setAllowedTimePeriods(['AM']);
              setFormData(prev => ({ ...prev, time_period: 'AM' }));
            } else if (assignmentData.time_period === 'PM') {
              setAllowedTimePeriods(['PM']);
              setFormData(prev => ({ ...prev, time_period: 'PM' }));
            } else {
              // BOTH - allow both time periods
              setAllowedTimePeriods(['AM', 'PM']);
            }
          }
        } catch (assignmentErr) {
          console.log('No current thermometer verification assignment found');
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err.message || 'Failed to load necessary data. Please try refreshing.');
        setAreaUnits([]); // Ensure areaUnits is an array on error
      } finally {
        setComponentLoading(false);
      }
    };

    fetchData();
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
      
      const response = await createTemperatureLog({
        thermometer_used_id: selectedThermometer.id,
        area_unit_id: selectedAreaUnit.id,
        log_datetime: formattedDateTime,
        // staff_id: staffId, // Backend uses request.user for logged_by_id
        department_id: departmentId, // Include departmentId if your backend expects it
        ...formData
      });
      
      // Refresh data using the new API endpoint
      try {
        // Get areas with their logged status
        const areasWithStatusData = await getAreasWithLogStatus();
        
        // Set area units with enhanced status information
        setAreaUnits(areasWithStatusData || []);
        
        // Create a map of area IDs to their logs for backward compatibility
        const logsMap = {};
        const loggedAreaIds = [];
        
        areasWithStatusData.forEach(area => {
          // If area has been logged in either AM or PM, add to logged areas
          if (area.am_logged || area.pm_logged) {
            loggedAreaIds.push(area.id);
            
            // Create entries in the logs map
            logsMap[area.id] = [];
            
            if (area.am_log_details) {
              logsMap[area.id].push({
                ...area.am_log_details,
                area_unit_id: area.id,
                area_unit_name: area.name,
                target_temperature_min: area.target_temperature_min,
                target_temperature_max: area.target_temperature_max
              });
            }
            
            if (area.pm_log_details) {
              logsMap[area.id].push({
                ...area.pm_log_details,
                area_unit_id: area.id,
                area_unit_name: area.name,
                target_temperature_min: area.target_temperature_min,
                target_temperature_max: area.target_temperature_max
              });
            }
          }
        });
        
        setTodaysLogs(logsMap);
        setLoggedAreas(loggedAreaIds);
      } catch (refreshErr) {
        console.error("Failed to refresh data after log submission:", refreshErr);
        
        // Fallback: Update logged areas state locally
        setLoggedAreas(prev => {
          if (!prev.includes(selectedAreaUnit.id)) {
            return [...prev, selectedAreaUnit.id];
          }
          return prev;
        });
        
        // Fallback: Update today's logs locally
        setTodaysLogs(prev => {
          const updatedLogs = { ...prev };
          if (!updatedLogs[selectedAreaUnit.id]) {
            updatedLogs[selectedAreaUnit.id] = [];
          }
          updatedLogs[selectedAreaUnit.id].push(response);
          return updatedLogs;
        });
      }
      
      // Set newly logged area for animation
      setNewlyLoggedAreaId(selectedAreaUnit.id);
      
      // Clear newly logged area ID after animation duration
      setTimeout(() => {
        setNewlyLoggedAreaId(null);
      }, 2000);
      
      // Move to success step
      handleNext();
    } catch (err) {
      console.error("Failed to submit temperature log:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit temperature log. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Helper function to check if temperature is within range
  const isTemperatureWithinRange = (temperature, minTemp, maxTemp) => {
    const temp = parseFloat(temperature);
    return temp >= parseFloat(minTemp) && temp <= parseFloat(maxTemp);
  };

  // Helper function to get the most recent log for an area
  const getMostRecentLog = (areaId) => {
    if (!todaysLogs[areaId] || todaysLogs[areaId].length === 0) return null;
    
    return todaysLogs[areaId].reduce((latest, current) => {
      return new Date(current.log_datetime) > new Date(latest.log_datetime) ? current : latest;
    });
  };

  // Helper function to check if an area has been logged for a specific time period
  const hasLoggedForTimePeriod = (areaId, timePeriod) => {
    if (!todaysLogs[areaId]) return false;
    
    return todaysLogs[areaId].some(log => log.time_period === timePeriod);
  };

  // Handle clicking 'Log Again' for an area
  const handleLogAgain = (area) => {
    setSelectedAreaUnit(area);
    setActiveStep(2); // Jump to the temperature logging step
  };

  // Handle viewing history for an area
  const viewHistory = (areaId) => {
    // This would typically navigate to a history view or open a modal
    console.log(`View history for area ${areaId}`);
    // For now, we'll just alert the user
    alert(`This would show the temperature log history for ${areaUnits.find(a => a.id === areaId)?.name}`);
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
                        <Typography component="span" variant="body2" color="text.secondary">
                          Model: {thermometer.model_identifier}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Last Verified: {thermometer.last_verification_date}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
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
              <>
                {/* Areas with logs today */}
                {loggedAreas.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                      Today's Logged Areas ({loggedAreas.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {areaUnits.filter(area => loggedAreas.includes(area.id)).map((area) => {
                        const recentLog = getMostRecentLog(area.id);
                        const isWithinRange = recentLog ? 
                          isTemperatureWithinRange(
                            recentLog.temperature_reading, 
                            area.target_temperature_min, 
                            area.target_temperature_max
                          ) : false;
                        
                        const isLoggedAM = hasLoggedForTimePeriod(area.id, 'AM');
                        const isLoggedPM = hasLoggedForTimePeriod(area.id, 'PM');
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={area.id}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                position: 'relative',
                                borderLeft: '4px solid',
                                borderColor: isWithinRange ? theme.palette.success.main : theme.palette.error.main,
                                backgroundColor: alpha(isWithinRange ? theme.palette.success.light : theme.palette.error.light, 0.05),
                                transition: 'all 0.3s ease',
                                animation: newlyLoggedAreaId === area.id ? 'pulseComplete 0.5s ease-in-out' : 'none',
                                '@keyframes pulseComplete': {
                                  '0%': { transform: 'scale(1)' },
                                  '50%': { transform: 'scale(1.03)' },
                                  '100%': { transform: 'scale(1)' }
                                }
                              }}
                            >
                              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                <Chip 
                                  size="small"
                                  label={isWithinRange ? "In Range" : "Out of Range"}
                                  color={isWithinRange ? "success" : "error"}
                                />
                              </Box>
                              
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {area.name}
                                </Typography>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {area.description}
                                </Typography>
                                
                                {recentLog && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mt: 2,
                                    p: 1,
                                    backgroundColor: theme.palette.background.default,
                                    borderRadius: 1
                                  }}>
                                    <DeviceThermostatIcon sx={{ mr: 1, color: isWithinRange ? theme.palette.success.main : theme.palette.error.main }} />
                                    <Typography variant="h4" component="span" sx={{ fontWeight: 'bold' }}>
                                      {recentLog.temperature_reading}°C
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                  <Chip 
                                    size="small" 
                                    label="AM" 
                                    color={isLoggedAM ? "primary" : "default"} 
                                    variant={isLoggedAM ? "filled" : "outlined"}
                                  />
                                  <Chip 
                                    size="small" 
                                    label="PM" 
                                    color={isLoggedPM ? "primary" : "default"}
                                    variant={isLoggedPM ? "filled" : "outlined"}
                                  />
                                </Box>
                                
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2">
                                  Target Range: {area.target_temperature_min}°C - {area.target_temperature_max}°C
                                </Typography>
                                
                                {recentLog && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Last logged at {new Date(recentLog.log_datetime).toLocaleTimeString()}
                                  </Typography>
                                )}
                              </CardContent>
                              
                              <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                                <Button size="small" startIcon={<RefreshIcon />} onClick={() => handleLogAgain(area)}>
                                  Log Again
                                </Button>
                                <Button size="small" startIcon={<HistoryIcon />} onClick={() => viewHistory(area.id)}>
                                  History
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}
                
                {/* Areas needing temperature logs */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <DeviceThermostatIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                    {loggedAreas.length > 0 ? 'Areas Needing Temperature Logs' : 'Select an area to log temperature for:'}
                  </Typography>
                  
                  {/* Tabs to filter by time period */}
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {allowedTimePeriods.map(period => (
                      <Chip
                        key={period}
                        label={period === 'AM' ? 'Morning (AM)' : 'Afternoon (PM)'}
                        color={formData.time_period === period ? 'primary' : 'default'}
                        onClick={() => setFormData(prev => ({ ...prev, time_period: period }))}
                        sx={{ mr: 1 }}
                      />
                    ))}
                  </Box>
                  
                  <Grid container spacing={2}>
                    {areaUnits
                      .filter(area => {
                        // For AM period, show areas not logged in AM
                        if (formData.time_period === 'AM') {
                          return !area.am_logged;
                        }
                        // For PM period, show areas not logged in PM
                        else if (formData.time_period === 'PM') {
                          return !area.pm_logged;
                        }
                        // Fallback to old behavior if area doesn't have am_logged/pm_logged properties
                        return !loggedAreas.includes(area.id);
                      })
                      .map((area) => {
                        // Check if the area has been logged in the other time period
                        const loggedInOtherPeriod = 
                          (formData.time_period === 'AM' && area.pm_logged) || 
                          (formData.time_period === 'PM' && area.am_logged);
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={area.id}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                cursor: 'pointer',
                                borderLeft: loggedInOtherPeriod ? '4px solid' : 'none',
                                borderColor: loggedInOtherPeriod ? theme.palette.info.main : 'inherit',
                                '&:hover': { 
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: 1
                                }
                              }}
                              onClick={() => handleSelectArea(area)}
                            >
                              {loggedInOtherPeriod && (
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                  <Chip 
                                    size="small"
                                    label={formData.time_period === 'AM' ? 'PM Logged' : 'AM Logged'}
                                    color="info"
                                  />
                                </Box>
                              )}
                              
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {area.name}
                                </Typography>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {area.description}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2">
                                  Target Range: {area.target_temperature_min}°C - {area.target_temperature_max}°C
                                </Typography>
                                
                                {/* Show AM/PM status indicators */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                  <Chip 
                                    size="small" 
                                    label="AM" 
                                    color={area.am_logged ? "success" : "default"} 
                                    variant={area.am_logged ? "filled" : "outlined"}
                                    icon={area.am_logged ? <CheckCircleIcon fontSize="small" /> : undefined}
                                  />
                                  <Chip 
                                    size="small" 
                                    label="PM" 
                                    color={area.pm_logged ? "success" : "default"}
                                    variant={area.pm_logged ? "filled" : "outlined"}
                                    icon={area.pm_logged ? <CheckCircleIcon fontSize="small" /> : undefined}
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })
                    }
                  </Grid>
                </Box>
              </>
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
                    <Typography component="span" variant="body2" color="text.secondary">
                      Thermometer:
                    </Typography>
                    <Typography variant="body1">
                      {selectedThermometer.serial_number} ({selectedThermometer.model_identifier})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography component="span" variant="body2" color="text.secondary">
                      Area:
                    </Typography>
                    <Typography variant="body1">
                      {selectedAreaUnit.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography component="span" variant="body2" color="text.secondary">
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
                      disabled={allowedTimePeriods.length === 1}
                    >
                      {allowedTimePeriods.includes('AM') && (
                        <MenuItem value="AM">Morning</MenuItem>
                      )}
                      {allowedTimePeriods.includes('PM') && (
                        <MenuItem value="PM">Afternoon</MenuItem>
                      )}
                    </Select>
                    {allowedTimePeriods.length === 1 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        You are only assigned to {allowedTimePeriods[0] === 'AM' ? 'morning' : 'afternoon'} temperature logging.
                      </Typography>
                    )}
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
