import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Alert, Tabs, Tab,
  Paper, Button, Grid, Card, CardContent, Divider, Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getCurrentUser } from '../services/authService';
import ThermometerStatusDashboard from '../components/thermometers/ThermometerStatusDashboard';
import ThermometerAssignmentManager from '../components/thermometers/ThermometerAssignmentManager';
import ThermometerList from '../components/thermometers/ThermometerList';
import ThermometerForm from '../components/thermometers/ThermometerForm';
import VerificationRecordsList from '../components/thermometers/VerificationRecordsList';

function ThermometerVerificationPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showThermometerForm, setShowThermometerForm] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        setError('');
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError(err.message || 'Failed to load user data. Please try refreshing.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Reset form visibility when changing tabs
    setShowThermometerForm(false);
  };

  const handleShowThermometerForm = () => {
    setShowThermometerForm(true);
  };

  const handleCancelThermometerForm = () => {
    setShowThermometerForm(false);
  };

  const handleThermometerCreated = () => {
    setShowThermometerForm(false);
    // Refresh data if needed
  };

  if (loadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography variant="h6" color="text.secondary" align="center">
          Could not load thermometer verification page. Please try again later.
        </Typography>
      </Container>
    );
  }

  // Check if user is a manager or superuser
  const isManagerOrAdmin = user && (
    user.is_superuser || 
    (user.profile && user.profile.role === 'manager')
  );

  if (!isManagerOrAdmin) {
    return (
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to access this page. Only managers can manage thermometer verification.
        </Alert>
      </Container>
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
        {departmentName} Thermometer Verification Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="thermometer verification tabs">
          <Tab 
            label="Dashboard" 
            value="dashboard" 
            icon={<ThermostatIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Thermometers" 
            value="thermometers" 
            icon={<DeviceThermostatIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Verification Records" 
            value="records" 
            icon={<AssignmentIndIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {currentTab === 'dashboard' && (
        <>
          {/* Notification Area */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid xs={12}>
                <Card variant="outlined" sx={{ borderColor: theme.palette.warning.light }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <ReportProblemIcon sx={{ color: theme.palette.warning.main, mr: 2, mt: 0.5 }} />
                      <Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>Thermometer Verification Assignment</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Ensure thermometer verification responsibilities are assigned to staff members.
                          Unassigned duties may result in compliance issues.
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Alert severity="warning" icon={<DeviceThermostatIcon />}>
                            <Typography variant="body2">
                              <strong>Thermometer Verification:</strong> Assign staff for daily thermometer verification.
                            </Typography>
                          </Alert>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <ThermometerStatusDashboard />
          
          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Assignment Overview
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DeviceThermostatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Thermometer Verification</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Staff assigned to verify thermometers must check calibration and record verification results.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Frequency: Daily
                    </Typography>
                    <Chip 
                      label="Critical Safety Task" 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Staff Assignment Management
          </Typography>
          
          <Grid container spacing={3}>
            <Grid xs={12}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DeviceThermostatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Thermometer Verification</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assign staff members responsible for verifying thermometers to ensure they are properly calibrated and ready for use.
                  </Typography>
                </CardContent>
              </Card>
              <ThermometerAssignmentManager />
            </Grid>
          </Grid>
        </>
      )}

      {currentTab === 'thermometers' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Thermometer Inventory
            </Typography>
            {!showThermometerForm && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleShowThermometerForm}
              >
                Add Thermometer
              </Button>
            )}
          </Box>

          {showThermometerForm ? (
            <ThermometerForm 
              onCancel={handleCancelThermometerForm}
              onSuccess={handleThermometerCreated}
            />
          ) : (
            <ThermometerList />
          )}
        </>
      )}

      {currentTab === 'records' && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Thermometer Verification Records
          </Typography>
          <VerificationRecordsList />
        </>
      )}
    </Container>
  );
}

export default ThermometerVerificationPage;
