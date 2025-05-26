import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Alert, Tabs, Tab,
  Paper, Button, Grid, Card, CardContent, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { getCurrentUser } from '../services/authService';
import ThermometerStatusDashboard from '../components/thermometers/ThermometerStatusDashboard';
import ThermometerAssignmentManager from '../components/thermometers/ThermometerAssignmentManager';
import ThermometerList from '../components/thermometers/ThermometerList';
import ThermometerForm from '../components/thermometers/ThermometerForm';
import VerificationRecordsList from '../components/thermometers/VerificationRecordsList';
import TemperatureLogsList from '../components/thermometers/TemperatureLogsList';

function ThermometerManagementPage() {
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
          Could not load thermometer management page. Please try again later.
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
          You do not have permission to access this page. Only managers can manage thermometers.
        </Alert>
      </Container>
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
        {departmentName} Thermometer Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="thermometer management tabs">
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
          <Tab 
            label="Temperature Logs" 
            value="logs" 
            icon={<DeviceThermostatIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {currentTab === 'dashboard' && (
        <>
          <ThermometerStatusDashboard />
          <ThermometerAssignmentManager />
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
            Verification Records
          </Typography>
          <VerificationRecordsList />
        </>
      )}

      {currentTab === 'logs' && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Temperature Logs
          </Typography>
          <TemperatureLogsList />
        </>
      )}
    </Container>
  );
}

export default ThermometerManagementPage;
