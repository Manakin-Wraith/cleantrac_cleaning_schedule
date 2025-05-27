import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider, Card, CardContent, CardActions, TextField, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ThermostatIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h5" component="h2">
          Thermometer Verification
        </Typography>
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
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell><strong>Serial Number</strong></TableCell>
                        <TableCell><strong>Model</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Last Verified</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {thermometersFromProps.map((thermometer) => (
                        <TableRow key={thermometer.id}>
                          <TableCell>{thermometer.serial_number}</TableCell>
                          <TableCell>{thermometer.model_identifier}</TableCell>
                          <TableCell>
                            <Chip 
                              label={thermometer.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              size="small"
                              color="warning"
                              icon={<WarningIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            {thermometer.last_verification_date || 'Never'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSelectThermometer(thermometer)}
                            >
                              Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default ThermometerVerificationSection;
