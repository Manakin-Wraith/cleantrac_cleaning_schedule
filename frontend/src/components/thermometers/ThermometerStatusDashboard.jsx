import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, CircularProgress, Alert, 
  Grid, Card, CardContent, Chip, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { 
  getThermometers,
  getThermometersNeedingVerification,
  getThermometersExpiringVerification,
  getCurrentAssignment,
  getAllCurrentAssignments
} from '../../services/thermometerService';

const ThermometerStatusDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    needsVerification: 0,
    expiringVerification: 0
  });
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [allAssignments, setAllAssignments] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    const fetchThermometerStats = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use Promise.allSettled to handle potential API failures gracefully
        const [allThermometersResult, needsVerificationResult, expiringVerificationResult] = 
          await Promise.allSettled([
            getThermometers(),
            getThermometersNeedingVerification(),
            getThermometersExpiringVerification()
          ]);
        
        // Extract data or use empty arrays for failed requests
        const allThermometers = allThermometersResult.status === 'fulfilled' ? allThermometersResult.value : [];
        const needsVerificationThermometers = needsVerificationResult.status === 'fulfilled' ? needsVerificationResult.value : [];
        const expiringVerificationThermometers = expiringVerificationResult.status === 'fulfilled' ? expiringVerificationResult.value : [];
        
        // Calculate verified thermometers
        const verifiedCount = Math.max(0, allThermometers.length - needsVerificationThermometers.length);
        
        setStats({
          total: allThermometers.length,
          verified: verifiedCount,
          needsVerification: needsVerificationThermometers.length,
          expiringVerification: expiringVerificationThermometers.length
        });
        
        // Get all current thermometer verification assignments
        try {
          const assignments = await getAllCurrentAssignments();
          setAllAssignments(assignments || []);
          
          // For backward compatibility, also set currentAssignment
          const defaultAssignment = assignments.find(a => a.time_period === 'BOTH') || 
                                   assignments.find(a => a.time_period === 'AM') || 
                                   assignments[0];
          setCurrentAssignment(defaultAssignment || null);
        } catch (assignmentErr) {
          console.log('No current thermometer verification assignments found');
        }
      } catch (err) {
        console.error("Failed to load thermometer stats:", err);
        setError(err.message || 'Failed to load thermometer statistics. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchThermometerStats();
  }, []);

  const getStatusColor = (type) => {
    switch (type) {
      case 'verified':
        return theme.palette.success.main;
      case 'needsVerification':
        return theme.palette.error.main;
      case 'expiringVerification':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'verified':
        return <CheckCircleIcon sx={{ color: getStatusColor(type) }} />;
      case 'needsVerification':
        return <ErrorIcon sx={{ color: getStatusColor(type) }} />;
      case 'expiringVerification':
        return <WarningIcon sx={{ color: getStatusColor(type) }} />;
      default:
        return <ThermostatIcon sx={{ color: getStatusColor(type) }} />;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ThermostatIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h5" component="h2">
          Thermometer Status
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Thermometers
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', backgroundColor: theme.palette.success.light }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="h6">
                      Verified
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.success.dark }}>
                    {stats.verified}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% of total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', backgroundColor: theme.palette.warning.light }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                    <Typography variant="h6">
                      Expiring Soon
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.warning.dark }}>
                    {stats.expiringVerification}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verification expiring within 7 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', backgroundColor: theme.palette.error.light }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ErrorIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                    <Typography variant="h6">
                      Needs Verification
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.error.dark }}>
                    {stats.needsVerification}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.total > 0 ? Math.round((stats.needsVerification / stats.total) * 100) : 0}% of total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Current Assignments
            </Typography>
            
            {allAssignments.length > 0 ? (
              <Grid container spacing={2}>
                {/* Morning Assignment */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label="Morning (AM)"
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      
                      {allAssignments.find(a => a.time_period === 'AM' || a.time_period === 'BOTH') ? (
                        <>
                          {allAssignments
                            .filter(a => a.time_period === 'AM' || a.time_period === 'BOTH')
                            .map(assignment => (
                              <Box key={assignment.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                  <Typography variant="h6">
                                    {assignment.staff_member_name || assignment.staff_member_username}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Assigned on {new Date(assignment.assigned_date).toLocaleDateString()}
                                </Typography>
                                {assignment.notes && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Notes:</strong> {assignment.notes}
                                  </Typography>
                                )}
                              </Box>
                            ))
                          }
                        </>
                      ) : (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No staff member assigned for morning verification.
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Afternoon Assignment */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label="Afternoon (PM)"
                          size="small"
                          color="secondary"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      
                      {allAssignments.find(a => a.time_period === 'PM' || a.time_period === 'BOTH') ? (
                        <>
                          {allAssignments
                            .filter(a => a.time_period === 'PM' || a.time_period === 'BOTH')
                            .map(assignment => (
                              <Box key={assignment.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                  <Typography variant="h6">
                                    {assignment.staff_member_name || assignment.staff_member_username}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Assigned on {new Date(assignment.assigned_date).toLocaleDateString()}
                                </Typography>
                                {assignment.notes && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Notes:</strong> {assignment.notes}
                                  </Typography>
                                )}
                              </Box>
                            ))
                          }
                        </>
                      ) : (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No staff member assigned for afternoon verification.
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                No staff members are currently assigned to thermometer verification duties.
              </Alert>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ThermometerStatusDashboard;
