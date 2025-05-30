import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Alert, Tabs, Tab,
  Paper, Button, Grid, Card, CardContent, Divider, Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getCurrentUser } from '../services/authService';
import TemperatureCheckAssignmentManager from '../components/thermometers/TemperatureCheckAssignmentManager';
import TemperatureLogsList from '../components/thermometers/TemperatureLogsList';

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
          Could not load temperature checks page. Please try again later.
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
          You do not have permission to access this page. Only managers can manage temperature checks.
        </Alert>
      </Container>
    );
  }

  const departmentName = user?.profile?.department_name || 'Your';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
        {departmentName} Temperature Checks Management
      </Typography>

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
          {/* Notification Area */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid xs={12}>
                <Card variant="outlined" sx={{ borderColor: theme.palette.warning.light }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <ReportProblemIcon sx={{ color: theme.palette.warning.main, mr: 2, mt: 0.5 }} />
                      <Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>Temperature Check Assignment</Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Ensure temperature check responsibilities are assigned to staff members.
                          Unassigned duties may result in compliance issues.
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Alert severity="warning" sx={{ mb: 1 }} icon={<AccessTimeIcon />}>
                            <Typography variant="body2">
                              <strong>Temperature Checks:</strong> Assign staff for both AM and PM temperature checks daily.
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
          
          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Assignment Overview
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Temperature Checks (AM/PM)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Staff assigned to temperature checks must record temperatures for all required areas twice daily.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Frequency: Twice Daily (AM/PM)
                    </Typography>
                    <Chip 
                      label="Compliance Required" 
                      size="small" 
                      color="primary" 
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
                    <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">Temperature Checks (AM/PM)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assign staff members responsible for performing morning (AM) and afternoon (PM) temperature checks throughout the facility.
                  </Typography>
                </CardContent>
              </Card>
              <TemperatureCheckAssignmentManager />
            </Grid>
          </Grid>
        </>
      )}

      {currentTab === 'logs' && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Temperature Log Records
          </Typography>
          <TemperatureLogsList />
        </>
      )}
    </Container>
  );
}

export default TemperatureChecksPage;
