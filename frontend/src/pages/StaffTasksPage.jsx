import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Grid, List, ListItem, ListItemText, Divider, Chip, Alert, Button, Card, CardContent, CardActions, Badge } from '@mui/material';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, updateTaskInstance } from '../services/taskService'; 
import { getThermometersNeedingVerification, getVerifiedThermometers, getTemperatureLogsByDate, getCurrentAssignment } from '../services/thermometerService'; 
import { formatDate } from '../utils/dateUtils'; 
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build'; // For Equipment
import ScienceIcon from '@mui/icons-material/Science'; // For Chemicals
import ListAltIcon from '@mui/icons-material/ListAlt'; // For Method
import NotesIcon from '@mui/icons-material/Notes'; // For Notes
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import ThermometerVerificationSection from '../components/thermometers/ThermometerVerificationSection';
import TemperatureLoggingSection from '../components/thermometers/TemperatureLoggingSection';

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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
    const [assignment, setAssignment] = useState(null);
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
            const [needingVerification, verified, todayLogsData, assignmentData] = await Promise.all([
                getThermometersNeedingVerification(),
                getVerifiedThermometers(),
                getTemperatureLogsByDate(today),
                getCurrentAssignment()
            ]);
            
            setThermometersNeedingVerification(needingVerification || []);
            setVerifiedThermometers(verified || []);
            setTodaysLogs(todayLogsData || []);
            setAssignment(assignmentData || null);
            
            // Process logs to get logged areas
            const loggedAreaIds = [...new Set(todayLogsData.map(log => log.area_unit_id))];
            setLoggedAreas(loggedAreaIds);
            
            // Set allowed time periods based on assignment
            if (assignmentData) {
                if (assignmentData.time_period === 'AM') {
                    setAllowedTimePeriods(['AM']);
                } else if (assignmentData.time_period === 'PM') {
                    setAllowedTimePeriods(['PM']);
                } else {
                    // BOTH - allow both time periods
                    setAllowedTimePeriods(['AM', 'PM']);
                }
            }
            
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
            {!loadingUser && !loadingThermometers && assignment && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Thermometer Verification Section */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Thermometer Verification</Typography>
                                <Box sx={{ ml: 2 }}>
                                    <Alert severity="info" icon={false} sx={{ py: 0, px: 1 }}>
                                        <Typography variant="caption">
                                            You are assigned to thermometer verification duties
                                        </Typography>
                                    </Alert>
                                </Box>
                            </Box>
                            {loadingThermometers ? (
                                <CircularProgress />
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
                    
                    {/* Temperature Logging Section */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Temperature Logging</Typography>
                                <Chip 
                                    label={assignment.time_period === 'AM' ? 'Morning (AM)' : 
                                           assignment.time_period === 'PM' ? 'Afternoon (PM)' : 'Both AM and PM'}
                                    color={assignment.time_period === 'BOTH' ? 'primary' : 'secondary'}
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
                                                <Grid item xs={12} sm={6} key={period}>
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
                </Grid>
            )}

            {/* Show a message when no assignment exists */}
            {!loadingUser && !loadingThermometers && !assignment && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 4 }}
                    icon={<DeviceThermostatIcon />}
                >
                    You are not currently assigned to thermometer verification or temperature logging duties.
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
