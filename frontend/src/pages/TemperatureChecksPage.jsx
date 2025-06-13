import React, { useState, useEffect } from 'react';
import { 
  Box, Tabs, Tab, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getCurrentUser } from '../services/authService';
import TemperatureCheckAssignmentManager from '../components/thermometers/TemperatureCheckAssignmentManager';
import TemperatureLogsList from '../components/thermometers/TemperatureLogsList';
import TemperatureLoggingSummary from '../components/thermometers/TemperatureLoggingSummary';
import { 
  DashboardLayout, 
  DashboardCard, 
  SectionTitle 
} from '../components/dashboard';

function TemperatureChecksPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
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
  };

  // Check if user is a manager or superuser
  const isManagerOrAdmin = user && (
    user.is_superuser || 
    (user.profile && user.profile.role === 'manager')
  );
  
  // Prepare error message for non-managers
  const permissionError = !isManagerOrAdmin ? 
    'You do not have permission to access this page. Only managers can manage temperature checks.' : '';
  
  // If there's a permission error or another error, or if still loading, use the dashboard layout to show the appropriate state
  if (loadingUser || error || permissionError) {
    return (
      <DashboardLayout
        title="Temperature Checks Management"
        loading={loadingUser}
        error={error || permissionError}
        errorMessage="Could not load temperature checks page. Please try again later."
      />
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';
  const title = `${departmentName} Temperature Checks`;
  
  // No alerts needed

  return (
    <DashboardLayout
      title={title}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="temperature checks tabs">
          <Tab 
            label="Dashboard" 
            value="dashboard" 
            icon={<DeviceThermostatIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Temperature Logs" 
            value="logs" 
            icon={<AssignmentIndIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {currentTab === 'dashboard' && (
        <>
          <SectionTitle title="Overall Temperature Logging Status" />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <DashboardCard>
                <TemperatureLoggingSummary />
              </DashboardCard>
            </Grid>
          </Grid>
          
          <SectionTitle title="Staff Assignment Management" />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TemperatureCheckAssignmentManager />
            </Grid>
          </Grid>
        </>
      )}

      {currentTab === 'logs' && (
        <>
          <SectionTitle title="Temperature Log Records" />
          <TemperatureLogsList />
        </>
      )}
    </DashboardLayout>
  );
}

export default TemperatureChecksPage;
