import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert,
  Chip, List, ListItemButton, ListItemText, ListItemIcon, Divider, Card, CardContent, CardActions, TextField, Grid
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { Badge } from '@mui/material';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  getMyAssignment,
  createVerificationRecord,
  getThermometers
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
  const [allThermometers, setAllThermometers] = useState([]);
  const [selectedThermometer, setSelectedThermometer] = useState(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setComponentLoading(true);
        setError('');
        const [assignmentData, allThermometersData] = await Promise.all([
          getMyAssignment(),
          getThermometers()
        ]);
        setAssignment(assignmentData);
        setAllThermometers(allThermometersData.results || []);
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
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        mb: { xs: 2.5, sm: 3 },
        gap: { xs: 1.5, sm: 2 },
      }}>
        <Box sx={{display:'flex',alignItems:'center'}}>
        <ThermostatIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" component="h2" sx={{fontWeight:600}}>
              Thermometer Verification
            </Typography>
        </Box>
        {thermometersFromProps.length ? (
          <Badge
            badgeContent={thermometersFromProps.length}
            color="warning"
            overlap="rectangular"
            sx={{
              '.MuiBadge-badge': {
                right: -6,
                top: 6,
                fontWeight: 600,
              },
            }}
          >
            <Chip
              label="Pending"
              variant="outlined"
              size="small"
              sx={(theme) => ({
                fontWeight: 600,
                bgcolor: theme.palette.warning.light,
                color: theme.palette.getContrastText(theme.palette.warning.light),
                borderColor: 'transparent',
                borderRadius: 9999,
              })}
            />
          </Badge>
        ) : (
          <Chip
            label="All Verified"
            variant="outlined"
            size="small"
            sx={(theme) => ({
              fontWeight: 600,
              bgcolor: theme.palette.success.light,
              color: theme.palette.getContrastText(theme.palette.success.light),
              borderColor: 'transparent',
              borderRadius: 9999,
            })}
          />
        )}
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
            <Alert severity="info" sx={{ my: { xs: 2.5, sm: 3 } }}>
              You are assigned to thermometer verification duties for the {assignment.department_name} department.
            </Alert>
          )}

          {showVerificationForm ? (
            <ThermometerVerificationForm 
              thermometer={selectedThermometer}
              calibratedInstruments={allThermometers.filter(t => t.id !== selectedThermometer.id)}
              onSubmit={handleVerificationSubmit}
              onCancel={handleCancelVerification}
            />
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: { xs: 2.5, sm: 3 } }}>
                Thermometers Requiring Verification
              </Typography>
              
              {thermometersFromProps.length === 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  All thermometers are currently verified. Great job!
                </Alert>
              ) : (
                <List disablePadding sx={{ mb: { xs: 1, sm: 2 } }}>
                  {thermometersFromProps.map((thermometer) => (
                    <ListItemButton
                      key={thermometer.id}
                      onClick={() => handleSelectThermometer(thermometer)}
                      divider
                      sx={(theme) => ({
                        my: { xs: 0.5, sm: 1 },
                        display: 'flex',
                        alignItems: 'center',
                        borderLeft: '4px solid transparent',
                        transition: 'all .2s',
                        '&:hover, &.Mui-focusVisible': {
                          backgroundColor: `${alpha(theme.palette.primary.main, 0.32)} !important`,
                          borderLeftColor: `${theme.palette.primary.dark} !important`,
                          '.fade-icon': { opacity: 1 },
                        },
                        '&.Mui-focusVisible': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                        },
                      })}
                    >
                      <ListItemIcon>
                        <DeviceThermostatIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={thermometer.serial_number || thermometer.model_identifier}
                        secondary={`Last verified: ${thermometer.last_verification_date || 'Never'}`}
                      />
                      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
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
                        <ChevronRightIcon className="fade-icon" sx={{ opacity: 0, transition: 'opacity 0.2s', color:'text.secondary' }} />
                      </Box>
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
