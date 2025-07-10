import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert,
  Chip, List, ListItemButton, ListItemText, ListItemIcon, Divider, Card, CardContent, CardActions, TextField, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  getMyAssignment,
  createVerificationRecord
} from '../../services/thermometerService';
import ThermometerVerificationForm from './ThermometerVerificationForm';

const ThermometerVerificationSection = ({ 
  thermometers: thermometersFromProps, 
  onVerificationSuccess, 
  isLoading: isLoadingFromProps, 
}) => {
  const [componentLoading, setComponentLoading] = useState(true); 
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState(null);
  const [selectedThermometer, setSelectedThermometer] = useState(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setComponentLoading(true);
        setError('');
        const assignmentData = await getMyAssignment();
        setAssignment(assignmentData);
      } catch (err) {
        console.error("Failed to load thermometer assignment data:", err);
        if (err.response?.status === 404) {
          setAssignment(null); 
        } else {
          setError(err.message || 'Failed to load assignment data.');
        }
      } finally {
        setComponentLoading(false);
      }
    };

    fetchAssignment();
  }, []);

  const handleSelectThermometer = (thermometer) => {
    setSelectedThermometer(thermometer);
    setShowVerificationForm(true);
  };

  const handleVerificationSubmit = async (formData) => {
    try {
      setError(''); 
      // formData already contains thermometer_id from the ThermometerVerificationForm
      await createVerificationRecord(formData);
      
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      
      setShowVerificationForm(false);
      setSelectedThermometer(null);
    } catch (err) {
      console.error("Failed to submit verification record:", err);
      // Let the form handle the error display for field-specific errors
      throw err;
    } 
  };

  const handleCancelVerification = () => {
    setShowVerificationForm(false);
    setSelectedThermometer(null);
  };

  if (!componentLoading && !assignment && !error && !isLoadingFromProps && thermometersFromProps.length === 0) {
    if (!assignment) return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', mb: 2 }}>
        <Box sx={{display:'flex',alignItems:'center'}}>
        <ThermostatIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="h2" sx={{fontWeight:600}}>
              Thermometer Verification
            </Typography>
        </Box>
        <Chip
          label={thermometersFromProps.length ? `${thermometersFromProps.length} Pending` : 'All Verified'}
          variant="outlined"
          size="small"
          sx={(theme) => ({
            fontWeight: 600,
            bgcolor: thermometersFromProps.length ? theme.palette.warning.light : theme.palette.success.light,
            color: thermometersFromProps.length
              ? theme.palette.getContrastText(theme.palette.warning.light)
              : theme.palette.getContrastText(theme.palette.success.light),
            borderColor: 'transparent',
          })}
        />
      </Box>
      {isLoadingFromProps || componentLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <>
          {assignment && (
            <Alert severity="info" sx={{ mb: 3 }}>
              You are assigned to thermometer verification duties for the {assignment.department_name} department.
            </Alert>
          )}

          {showVerificationForm ? (
            <ThermometerVerificationForm 
              thermometer={selectedThermometer}
              onSubmit={handleVerificationSubmit}
              onCancel={handleCancelVerification}
            />
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Thermometers Requiring Verification
              </Typography>
              
              {thermometersFromProps.length === 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  All thermometers are currently verified. Great job!
                </Alert>
              ) : (
                <List disablePadding sx={{ mb:2 }}>
                  {thermometersFromProps.map((thermometer) => (
                    <ListItemButton
                      key={thermometer.id}
                      onClick={() => handleSelectThermometer(thermometer)}
                      divider
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          bgcolor: theme.palette.action.selected,
                        },
                      }}
                    >
                      <ListItemIcon>
                        <DeviceThermostatIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={thermometer.serial_number || thermometer.model_identifier}
                        secondary={`Last verified: ${thermometer.last_verification_date || 'Never'}`}
                      />
                      <Chip
                        label="Pending"
                        size="small"
                        variant="outlined"
                        sx={(theme) => ({
                          bgcolor: theme.palette.warning.light,
                          color: theme.palette.getContrastText(theme.palette.warning.light),
                          fontWeight: 600,
                        })}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default ThermometerVerificationSection;
