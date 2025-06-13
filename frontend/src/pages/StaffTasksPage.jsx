import React, { useState, useEffect, useCallback } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Chip, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Badge, Card, CardContent, CardActions } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { getTaskInstances, updateTaskInstance } from '../services/taskService';
import { getCurrentUser } from '../services/authService';
import {
    getVerifiedThermometers,
    getThermometersNeedingVerification,
    getTemperatureLogsByDate,
    getCurrentAssignment,
    getMyTemperatureCheckAssignments,
    getTemperatureLogsByArea,
    getAreaUnits
} from '../services/thermometerService';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import ThermometerVerificationSection from '../components/thermometers/ThermometerVerificationSection';
import TemperatureLoggingSection from '../components/thermometers/TemperatureLoggingSection';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build'; // For Equipment
import ScienceIcon from '@mui/icons-material/Science'; // For Chemicals
import ListAltIcon from '@mui/icons-material/ListAlt'; // For Method
import NotesIcon from '@mui/icons-material/Notes'; // For Notes
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function StaffTasksPage() {
    const [user, setUser] = useState(null);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false); 
    const [error, setError] = useState(''); // General page error
    const [updatingTask, setUpdatingTask] = useState(null);
    const theme = useTheme();

    // New state for thermometer data
    const [thermometersNeedingVerification, setThermometersNeedingVerification] = useState([]);
    const [verifiedThermometers, setVerifiedThermometers] = useState([]);
    const [loadingThermometers, setLoadingThermometers] = useState(true);
    const [thermometerError, setThermometerError] = useState('');
    
    // State for temperature logging data
    const [todaysLogs, setTodaysLogs] = useState([]);
    const [loggedAreas, setLoggedAreas] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [areaUnits, setAreaUnits] = useState([]);
    const [verificationAssignment, setVerificationAssignment] = useState(null);
    const [temperatureCheckAssignment, setTemperatureCheckAssignment] = useState(null);
    const [allowedTimePeriods, setAllowedTimePeriods] = useState(['AM', 'PM']);

    // Function to fetch both types of thermometer lists and temperature logs
    const fetchThermometerData = useCallback(async () => {
        if (!user || !user.id) return; // Ensure user context is available

        setLoadingThermometers(true);
        setLoadingLogs(true);
        setThermometerError('');
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Fetch all required data in parallel
            const [needingVerification, verified, todayLogsData, verificationData, temperatureCheckData] = await Promise.all([
                getThermometersNeedingVerification(),
                getVerifiedThermometers(),
                getTemperatureLogsByDate(today),
                getCurrentAssignment(),
                getMyTemperatureCheckAssignments()
            ]);
            
            setThermometersNeedingVerification(needingVerification || []);
            setVerifiedThermometers(verified || []);
            setTodaysLogs(todayLogsData || []);
            
            // Only set verification assignment if the user is actually assigned to it
            // verificationData will be an empty object if user is not assigned
            setVerificationAssignment(verificationData && verificationData.id ? verificationData : null);
            
            // Process temperature check assignments - handle AM/PM assignments properly
            const temperatureChecks = temperatureCheckData || {};
            
            // The API returns an object with am_assignment and pm_assignment properties
            const amAssignment = temperatureChecks.am_assignment || null;
            const pmAssignment = temperatureChecks.pm_assignment || null;
            
            // Determine which assignment to use based on current time or if only one is available
            const currentHour = new Date().getHours();
            const isPM = currentHour >= 12;
            
            // Set the appropriate assignment based on time of day or availability
            if (isPM && pmAssignment) {
                setTemperatureCheckAssignment(pmAssignment);
            } else if (!isPM && amAssignment) {
                setTemperatureCheckAssignment(amAssignment);
            } else if (pmAssignment) {
                setTemperatureCheckAssignment(pmAssignment);
            } else if (amAssignment) {
                setTemperatureCheckAssignment(amAssignment);
            } else {
                setTemperatureCheckAssignment(null);
            }
            
            // Process logs to get logged areas
            const loggedAreaIds = [...new Set(todayLogsData.map(log => log.area_unit_id))];
            setLoggedAreas(loggedAreaIds);
            
            // Set allowed time periods based on temperature check assignments
            const allowedPeriods = [];
            if (amAssignment) {
                allowedPeriods.push('AM');
            }
            if (pmAssignment) {
                allowedPeriods.push('PM');
            }
            
            // If we have assignments, set the allowed periods; otherwise, empty array
            setAllowedTimePeriods(allowedPeriods.length > 0 ? allowedPeriods : []);
            
            // Extract area units from logs
            const areas = [...new Set(todayLogsData.map(log => ({
                id: log.area_unit_id,
                name: log.area_unit_name,
                target_temperature_min: log.target_temperature_min,
                target_temperature_max: log.target_temperature_max
            })))];
            setAreaUnits(areas);
            
        } catch (err) {
            console.error('Error fetching thermometer data:', err);
            setThermometerError('Failed to load thermometer data. Please refresh the page.');
        } finally {
            setLoadingThermometers(false);
        }
    }, [user]); // Dependency on user ensures it runs when user is loaded

    useEffect(() => {
        const fetchUserDataAndTasks = async () => {
            try {
                setLoadingUser(true);
                setError('');
                const userData = await getCurrentUser();
                setUser(userData);
                // setLoadingUser(false); // Moved user loading to finally block

                if (userData && userData.id) {
                    setLoadingTasks(true);
                    const todayStr = getTodayDateString();
                    const params = {
                        assigned_to: userData.id,
                        due_date: todayStr,
                    };
                    const tasks = await getTaskInstances(params);
                    console.log('Fetched tasks for staff page:', tasks);
                    setTodaysTasks(tasks || []);
                    
                    // Fetch thermometer data after user is loaded
                    // await fetchThermometerData(); // fetchThermometerData will be called in its own useEffect triggered by user change
                }
            } catch (err) {
                console.error("Failed to load page data:", err);
                setError(err.message || 'Failed to load page data. Please try refreshing.');
                setTodaysTasks([]); // Ensure tasks is an array on error
            } finally {
                setLoadingUser(false); 
                setLoadingTasks(false);
            }
        };
        fetchUserDataAndTasks();
    }, []); // Initial fetch for user and tasks

    // useEffect to fetch thermometer data when user is loaded or fetchThermometerData function reference changes
    useEffect(() => {
        if (user && user.id) {
            fetchThermometerData();
        }
    }, [user, fetchThermometerData]); // Re-run if user or the callback itself changes

    const handleSubmitForReview = async (taskId) => {
        setUpdatingTask(taskId);
        setError('');
        try {
            await updateTaskInstance(taskId, { status: 'pending_review' });
            setTodaysTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId ? { ...task, status: 'pending_review' } : task
                )
            );
        } catch (err) {
            console.error(`Failed to submit task ${taskId} for review:`, err);
            setError(err.response?.data?.detail || err.message || 'Failed to update task. Please try again.');
        } finally {
            setUpdatingTask(null);
        }
    };

    if (loadingUser) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !todaysTasks.length) { 
        return (
            <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                 <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Typography variant="h6" color="text.secondary" align="center">
                    Could not load dashboard. Please try again later.
                </Typography>
            </Container>
        );
    }

    const departmentName = user?.profile?.department_name || 'Your';
    const userName = user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) : 'My';

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                {userName}'s Tasks - {departmentName} - Today ({getTodayDateString()})
            </Typography>
            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
            {thermometerError && <Alert severity="error" sx={{ mb: 2 }}>{thermometerError}</Alert>}
            {/* Thermometer Sections - Only shown when assigned */}
            {!loadingUser && !loadingThermometers && (verificationAssignment || temperatureCheckAssignment) && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Thermometer Verification Section - Only shown when user has verification assignment */}
                    {verificationAssignment && (
                        <Grid container={false} spacing={0} sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Thermometer Verification</Typography>
                                    <Chip 
                                        label="Assigned to you"
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                                
                                {loadingThermometers ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : thermometerError ? (
                                    <Alert severity="error">{thermometerError}</Alert>
                                ) : user && user.id ? (
                                    <ThermometerVerificationSection 
                                        thermometers={thermometersNeedingVerification}
                                        onVerificationSuccess={fetchThermometerData}
                                        isLoading={loadingThermometers}
                                        departmentId={user.profile?.department}
                                    />
                                ) : (
                                    <Typography>User data not available.</Typography>
                                )}
                            </Paper>
                        </Grid>
                    )}
                    
                    {/* Temperature Logging Section - Only shown when user has temperature check assignment */}
                    {temperatureCheckAssignment && (
                        <Grid container={false} spacing={0} sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Paper elevation={2} sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Temperature Logging</Typography>
                                    <Chip 
                                        label={temperatureCheckAssignment.time_period === 'AM' ? 'Morning (AM)' : 
                                               temperatureCheckAssignment.time_period === 'PM' ? 'Afternoon (PM)' : 'Both AM and PM'}
                                        color={temperatureCheckAssignment.time_period === 'BOTH' ? 'primary' : 'secondary'}
                                        size="small"
                                    />
                                </Box>
                    
                            {/* Temperature Logging Summary */}
                            {!loadingLogs && todaysLogs.length > 0 && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.success.light, 0.1), borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <DeviceThermostatIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                            Today's Logged Areas ({loggedAreas.length})
                                        </Typography>
                                    </Box>
                                    
                                    <Grid container spacing={1} sx={{ mt: 1 }}>
                                        {allowedTimePeriods.map(period => {
                                            // Filter logs for this time period
                                            const periodLogs = todaysLogs.filter(log => log.time_period === period);
                                            const periodAreaIds = [...new Set(periodLogs.map(log => log.area_unit_id))];
                                            
                                            return (
                                                <Grid container={false} spacing={0} sx={{ width: { xs: '100%', sm: '50%' }, p: 0.5 }} key={period}>
                                                    <Box sx={{ 
                                                        p: 1.5, 
                                                        bgcolor: theme.palette.background.paper,
                                                        borderRadius: 1,
                                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                                    }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                            {period === 'AM' ? 'Morning' : 'Afternoon'} ({periodAreaIds.length} areas)
                                                        </Typography>
                                                        
                                                        {periodAreaIds.length > 0 ? (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                {periodAreaIds.map(areaId => {
                                                                    const areaLog = periodLogs.find(log => log.area_unit_id === areaId);
                                                                    const isWithinRange = areaLog && 
                                                                        parseFloat(areaLog.temperature_reading) >= parseFloat(areaLog.target_temperature_min) && 
                                                                        parseFloat(areaLog.temperature_reading) <= parseFloat(areaLog.target_temperature_max);
                                                                    
                                                                    return (
                                                                        <Chip 
                                                                            key={areaId}
                                                                            size="small"
                                                                            label={areaLog?.area_unit_name || `Area ${areaId}`}
                                                                            sx={{ 
                                                                                bgcolor: isWithinRange ? alpha(theme.palette.success.light, 0.2) : alpha(theme.palette.error.light, 0.2),
                                                                                color: isWithinRange ? theme.palette.success.dark : theme.palette.error.dark,
                                                                                '& .MuiBadge-badge': {
                                                                                    bgcolor: isWithinRange ? theme.palette.success.main : theme.palette.error.main,
                                                                                    color: 'white'
                                                                                }
                                                                            }}
                                                                            icon={<DeviceThermostatIcon fontSize="small" />}
                                                                        />
                                                                    );
                                                                })}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No areas logged for this time period.
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            )}
                            
                            {loadingUser || loadingThermometers ? (
                                <CircularProgress />
                            ) : user && user.id ? (
                                <TemperatureLoggingSection 
                                    verifiedThermometers={verifiedThermometers}
                                    isLoading={loadingThermometers}
                                    departmentId={user.profile?.department}
                                    staffId={user.id}
                                    currentUser={user}
                                />
                            ) : (
                                <Typography>User data not available.</Typography>
                            )}
                        </Paper>
                    </Grid>
                    )}
                </Grid>
            )}
            {/* Temperature Responsibilities Summary */}
            {!loadingUser && !loadingThermometers && (verificationAssignment || temperatureCheckAssignment) && (
                <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Your Temperature Responsibilities</Typography>
                    <Grid container spacing={2}>
                        <Grid container={false} spacing={0} sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Card variant={verificationAssignment ? "outlined" : ""} 
                                  sx={{ 
                                      p: 2, 
                                      bgcolor: verificationAssignment ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.grey[300], 0.5),
                                      height: '100%'
                                  }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <DeviceThermostatIcon sx={{ mr: 1, color: verificationAssignment ? theme.palette.primary.main : theme.palette.text.disabled }} />
                                    <Typography variant="subtitle1" color={verificationAssignment ? 'textPrimary' : 'textSecondary'}>
                                        Thermometer Verification
                                    </Typography>
                                </Box>
                                {verificationAssignment ? (
                                    <>
                                        <Chip 
                                            label="Assigned to you" 
                                            color="primary" 
                                            size="small" 
                                            sx={{ mb: 1 }}
                                        />
                                        <Typography variant="body2">
                                            You are responsible for verifying thermometers in your department.
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        You are not assigned to thermometer verification duties.
                                    </Typography>
                                )}
                            </Card>
                        </Grid>
                        <Grid container={false} spacing={0} sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                            <Card variant={temperatureCheckAssignment ? "outlined" : ""} 
                                  sx={{ 
                                      p: 2, 
                                      bgcolor: temperatureCheckAssignment ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.grey[300], 0.5),
                                      height: '100%'
                                  }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <AccessTimeIcon sx={{ mr: 1, color: temperatureCheckAssignment ? theme.palette.secondary.main : theme.palette.text.disabled }} />
                                    <Typography variant="subtitle1" color={temperatureCheckAssignment ? 'textPrimary' : 'textSecondary'}>
                                        Temperature Checks
                                    </Typography>
                                </Box>
                                {temperatureCheckAssignment ? (
                                    <>
                                        <Chip 
                                            label={temperatureCheckAssignment.time_period === 'AM' ? 'Morning (AM)' : 
                                                   temperatureCheckAssignment.time_period === 'PM' ? 'Afternoon (PM)' : 'Both AM and PM'}
                                            color="secondary" 
                                            size="small" 
                                            sx={{ mb: 1 }}
                                        />
                                        <Typography variant="body2">
                                            You are responsible for logging temperatures during your assigned time period(s).
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        You are not assigned to temperature logging duties.
                                    </Typography>
                                )}
                            </Card>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            {/* Show a message when no assignments exist */}
            {!loadingUser && !loadingThermometers && !verificationAssignment && !temperatureCheckAssignment && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 4 }}
                >
                    You are not currently assigned to any thermometer or temperature logging duties. Please contact your manager if you believe this is incorrect.
                </Alert>
            )}
            {loadingTasks ? (
                <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : todaysTasks.length > 0 ? (
                <Grid container spacing={3} sx={{ mt: 2 }}> 
                    {todaysTasks.map(task => (
                        <Grid item xs={12} sm={6} md={4} key={task.id}>
                            <Card sx={{
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between', 
                                height: '100%',
                                ...(task.status === 'completed' && {
                                    backgroundColor: theme.palette.grey[100], 
                                }),
                                ...(task.status === 'pending_review' && {
                                    backgroundColor: alpha(theme.palette.info.main, 0.12), 
                                }),
                                // 'pending' tasks will use the default card background
                            }}>
                                <CardContent sx={{ flexGrow: 1, padding: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography 
                                            variant="h6" 
                                            component="div" 
                                            sx={{
                                                ...(task.status === 'completed' && {
                                                    textDecoration: 'line-through', 
                                                    color: theme.palette.text.disabled 
                                                }),
                                            }}
                                        >
                                            {task.cleaning_item?.name || 'Unnamed Task'}
                                        </Typography>
                                        <Chip 
                                            label={task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            size="small"
                                            color={task.status === 'completed' ? 'success' : task.status === 'pending' ? 'warning' : 'default'}
                                            sx={{ fontWeight: 'medium' }}
                                        />
                                        {task.status === 'completed' && <CheckCircleOutlineIcon sx={{ color: theme.palette.success.main, ml: 1 }} />}
                                    </Box>

                                    <Box sx={{ my: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <EventIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Scheduled Date:</strong> {task.due_date ? formatDate(task.due_date) : 'N/A'}
                                            </Typography>
                                        </Box>
                                        {(task.start_time || task.end_time || task.timeslot) && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Timeslot:</strong> {task.start_time && task.end_time ? `${task.start_time.substring(0,5)} - ${task.end_time.substring(0,5)}` : (task.timeslot || 'N/A')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />
                                    
                                    <Box sx={{ mb: 1 }}>
                                        {task.cleaning_item?.equipment && (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                                                <BuildIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Equipment:</strong> {task.cleaning_item.equipment}
                                                </Typography>
                                            </Box>
                                        )}
                                        {task.cleaning_item?.chemical && (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                                                <ScienceIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Chemicals:</strong> {task.cleaning_item.chemical}
                                                </Typography>
                                            </Box>
                                        )}
                                        {task.cleaning_item?.method && (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                                                <ListAltIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Method:</strong> {task.cleaning_item.method}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {task.notes && (
                                        <>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                                <NotesIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Notes:</strong> {task.notes}
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                                {task.status !== 'completed' && task.status !== 'pending_review' && (
                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            size="small"
                                            onClick={() => handleSubmitForReview(task.id)}
                                            disabled={updatingTask === task.id}
                                        >
                                            {updatingTask === task.id ? <CircularProgress size={20} color="inherit" /> : 'Submit for Review'}
                                        </Button>
                                    </CardActions>
                                )}
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Paper elevation={1} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1">No tasks assigned for today.</Typography>
                </Paper>
            )}
        </Container>
    );
}

export default StaffTasksPage;
