import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, CircularProgress, Alert,
  Grid, Card, CardContent, Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getCurrentUser } from '../services/authService';

function ThermometerManagementPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();

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
  
  const handleNavigate = (path) => {
    navigate(path);
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
      <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        {departmentName} Temperature Management Hub
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
        Select a temperature management area to access
      </Typography>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Thermometer Management Card */}
        <Grid xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                cursor: 'pointer'
              }
            }}
            onClick={() => handleNavigate('/manager-thermometers')}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <DeviceThermostatIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Thermometer Inventory
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Manage your thermometer inventory, add new thermometers, and track their status
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 'auto' }}
              >
                Access Inventory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Thermometer Verification Card */}
        <Grid xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                cursor: 'pointer'
              }
            }}
            onClick={() => handleNavigate('/manager-thermometer-verification')}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <DeviceThermostatIcon sx={{ fontSize: 60, color: theme.palette.error.main, mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Thermometer Verification
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Assign staff for thermometer verification duties and track verification records
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 'auto' }}
              >
                Manage Verification
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Temperature Checks Card */}
        <Grid xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                cursor: 'pointer'
              }
            }}
            onClick={() => handleNavigate('/manager-temperature-checks')}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <AccessTimeIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Temperature Checks
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Assign staff for AM/PM temperature checks and view temperature log records
              </Typography>
              <Button 
                variant="outlined" 
                color="secondary" 
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 'auto' }}
              >
                Manage Temperature Checks
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body1">
          <strong>Note:</strong> The thermometer verification and temperature checks features have been separated to improve clarity and workflow efficiency. 
          Use the navigation links above to access the specific functionality you need.
        </Typography>
      </Alert>
    </Container>
  );
}

export default ThermometerManagementPage;
