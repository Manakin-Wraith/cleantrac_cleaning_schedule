import React, { useState, useEffect } from 'react';
import { 
  Box, Tabs, Tab, Button, Grid
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
import { 
  DashboardLayout, 
  DashboardCard, 
  SectionTitle 
} from '../components/dashboard';

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

  // Check if user is a manager or superuser
  const isManagerOrAdmin = user && (
    user.is_superuser || 
    (user.profile && user.profile.role === 'manager')
  );
  
  // Prepare error message for non-managers
  const permissionError = !isManagerOrAdmin ? 
    'You do not have permission to access this page. Only managers can manage thermometer verification.' : '';
  
  // If there's a permission error or another error, or if still loading, use the dashboard layout to show the appropriate state
  if (loadingUser || error || permissionError) {
    return (
      <DashboardLayout
        title="Thermometer Verification Management"
        loading={loadingUser}
        error={error || permissionError}
        errorMessage="Could not load thermometer verification page. Please try again later."
      />
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';
  const title = `${departmentName} Thermometer Verification`;
  
  // No alerts needed

  return (
    <DashboardLayout
      title={title}
    >
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
          <ThermometerStatusDashboard />
          

          
          <SectionTitle title="Staff Assignment Management" />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ThermometerAssignmentManager />
            </Grid>
          </Grid>
        </>
      )}

      {currentTab === 'thermometers' && (
        <>
          <SectionTitle 
            title="Thermometer Inventory" 
            action={
              !showThermometerForm && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleShowThermometerForm}
                >
                  Add Thermometer
                </Button>
              )
            }
          />

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
          <SectionTitle title="Thermometer Verification Records" />
          <VerificationRecordsList />
        </>
      )}
    </DashboardLayout>
  );
}

export default ThermometerVerificationPage;
