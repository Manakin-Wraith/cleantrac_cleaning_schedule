import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, CircularProgress, Alert, 
  Grid, Divider, Chip, Tooltip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, IconButton, Collapse
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getTemperatureLoggingManagerSummary } from '../../services/thermometerService';

/**
 * TemperatureLoggingSummary - A component for managers to see temperature logging status
 * Displays a summary of which areas have been logged for AM and PM periods
 */
const TemperatureLoggingSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchSummaryData();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(fetchSummaryData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const data = await getTemperatureLoggingManagerSummary();
      setSummaryData(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch temperature logging summary:', err);
      setError('Failed to load temperature logging data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <DeviceThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Temperature Logging Status
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <DeviceThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Temperature Logging Status
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!summaryData) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <DeviceThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Temperature Logging Status
        </Typography>
        <Alert severity="info">No temperature logging data available.</Alert>
      </Paper>
    );
  }

  const { summary, areas } = summaryData;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          <DeviceThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Temperature Logging Status
        </Typography>
        <IconButton onClick={toggleExpandedView} size="small">
          {expandedView ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.light, 0.1),
              borderLeft: '4px solid',
              borderColor: theme.palette.primary.main
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Morning (AM) Logging
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'medium', mr: 2 }}>
                  {summary.am_completion_percentage}%
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={summary.am_completion_percentage} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Tooltip title="Areas logged">
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${summary.am_logged_count}/${summary.total_areas} Areas`} 
                    color="primary" 
                    size="small"
                  />
                </Tooltip>
                
                {summary.am_out_of_range_count > 0 && (
                  <Tooltip title="Areas with temperatures out of range">
                    <Chip 
                      icon={<ErrorIcon />} 
                      label={`${summary.am_out_of_range_count} Out of Range`} 
                      color="error" 
                      size="small"
                    />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              bgcolor: alpha(theme.palette.secondary.light, 0.1),
              borderLeft: '4px solid',
              borderColor: theme.palette.secondary.main
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Afternoon (PM) Logging
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'medium', mr: 2 }}>
                  {summary.pm_completion_percentage}%
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={summary.pm_completion_percentage} 
                    color="secondary"
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Tooltip title="Areas logged">
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${summary.pm_logged_count}/${summary.total_areas} Areas`} 
                    color="secondary" 
                    size="small"
                  />
                </Tooltip>
                
                {summary.pm_out_of_range_count > 0 && (
                  <Tooltip title="Areas with temperatures out of range">
                    <Chip 
                      icon={<ErrorIcon />} 
                      label={`${summary.pm_out_of_range_count} Out of Range`} 
                      color="error" 
                      size="small"
                    />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Area Status Table */}
      <Collapse in={expandedView}>
        <Typography variant="subtitle1" gutterBottom>
          Detailed Area Status
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                <TableCell>Area</TableCell>
                <TableCell align="center">AM Status</TableCell>
                <TableCell align="center">AM Temp</TableCell>
                <TableCell align="center">PM Status</TableCell>
                <TableCell align="center">PM Temp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {area.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {area.target_min}°C - {area.target_max}°C
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    {area.am_logged ? (
                      <Chip 
                        size="small"
                        label="Logged" 
                        color={area.am_in_range ? "success" : "error"}
                        icon={area.am_in_range ? <CheckCircleIcon /> : <ErrorIcon />}
                      />
                    ) : (
                      <Chip 
                        size="small"
                        label="Pending" 
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    {area.am_temperature ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: area.am_in_range ? theme.palette.success.main : theme.palette.error.main
                        }}
                      >
                        {area.am_temperature}°C
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    {area.pm_logged ? (
                      <Chip 
                        size="small"
                        label="Logged" 
                        color={area.pm_in_range ? "success" : "error"}
                        icon={area.pm_in_range ? <CheckCircleIcon /> : <ErrorIcon />}
                      />
                    ) : (
                      <Chip 
                        size="small"
                        label="Pending" 
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    {area.pm_temperature ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: area.pm_in_range ? theme.palette.success.main : theme.palette.error.main
                        }}
                      >
                        {area.pm_temperature}°C
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
          
          <Chip 
            label="Refresh" 
            size="small"
            icon={<RefreshIcon />}
            onClick={fetchSummaryData}
            variant="outlined"
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default TemperatureLoggingSummary;
