import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Grid, List, ListItem, ListItemText, Divider, Chip, Alert, Button, Card, CardContent, CardActions } from '@mui/material';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, updateTaskInstance } from '../services/taskService'; 
import { getThermometersNeedingVerification, getVerifiedThermometers } from '../services/thermometerService'; 
import { getTemperatureLogs } from '../services/temperatureLogService'; 
import { formatDate } from '../utils/dateUtils'; 
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build'; // For Equipment
import ScienceIcon from '@mui/icons-material/Science'; // For Chemicals
import ListAltIcon from '@mui/icons-material/ListAlt'; // For Method
import NotesIcon from '@mui/icons-material/Notes'; // For Notes
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

    // New state for today's temperature logs
    const [todaysTemperatureLogs, setTodaysTemperatureLogs] = useState([]);
    const [loadingTodaysLogs, setLoadingTodaysLogs] = useState(true);
    const [todaysLogsError, setTodaysLogsError] = useState('');

    // Function to fetch both types of thermometer lists
    const fetchThermometerData = useCallback(async () => {
        if (!user || !user.id) return; // Ensure user context is available

        setLoadingThermometers(true);
        setThermometerError('');
        try {
            const [needingVerification, verified] = await Promise.all([
                getThermometersNeedingVerification(),
                getVerifiedThermometers(),
            ]);
            setThermometersNeedingVerification(needingVerification || []);
            setVerifiedThermometers(verified || []);
            console.log('Fetched thermometers needing verification:', needingVerification);
            console.log('Fetched verified thermometers:', verified);
        } catch (err) {
            console.error("Failed to load thermometer data:", err);
            setThermometerError(err.message || 'Failed to load thermometer data.');
            // Set to empty arrays on error to prevent rendering issues with undefined
            setThermometersNeedingVerification([]);
            setVerifiedThermometers([]);
        } finally {
            setLoadingThermometers(false);
        }
    }, [user]); // Dependency on user ensures it runs when user is loaded

    // Function to fetch today's temperature logs
    const fetchTodaysTemperatureLogs = useCallback(async () => {
        if (!user || !user.profile?.department_id) { 
            console.log('fetchTodaysTemperatureLogs: Pre-conditions not met. User:', user ? 'exists' : 'null', 'Profile:', user?.profile ? 'exists' : 'null/undefined', 'Department ID:', user?.profile?.department_id ? user.profile.department_id : 'null/undefined');
            return;
        }

        console.log('fetchTodaysTemperatureLogs: Attempting to fetch logs for department ID:', user.profile.department_id);
        setLoadingTodaysLogs(true); 
        setTodaysLogsError('');
        try {
            const todayStr = getTodayDateString();
            const params = {
                department: user.profile.department_id, 
                date: todayStr,
            };
            console.log('fetchTodaysTemperatureLogs: Params for getTemperatureLogs:', params);
            const logs = await getTemperatureLogs(params);
            setTodaysTemperatureLogs(logs || []);
            console.log('Fetched today\'s temperature logs:', logs); 
        } catch (err) {
            console.error("Failed to load today's temperature logs (in StaffTasksPage catch):", err);
            setTodaysLogsError(err.message || 'Failed to load today\'s temperature logs.');
            setTodaysTemperatureLogs([]);
        } finally {
            console.log('fetchTodaysTemperatureLogs: Setting loadingTodaysLogs to false in finally block.');
            setLoadingTodaysLogs(false);
        }
    }, [user]); // Dependency on user

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
            console.log('User object in useEffect for fetching logs & thermometers:', JSON.stringify(user, null, 2));
            fetchThermometerData();
            fetchTodaysTemperatureLogs(); // Fetch logs when user is available
        }
    }, [user, fetchThermometerData, fetchTodaysTemperatureLogs]); // Re-run if user or the callbacks change

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
            {todaysLogsError && <Alert severity="error" sx={{ mb: 2 }}>{todaysLogsError}</Alert>} 

            {/* Thermometer Sections */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Thermometer Verification</Typography>
                        {loadingUser || loadingThermometers ? (
                            <CircularProgress />
                        ) : user && user.id ? (
                            <ThermometerVerificationSection 
                                thermometers={thermometersNeedingVerification}
                                onVerificationSuccess={fetchThermometerData} // Pass the callback here
                                isLoading={loadingThermometers}
                                // error={thermometerError} // Error is handled globally or could be more specific if needed
                                departmentId={user.profile?.department} // Pass departmentId if needed by the component
                            />
                        ) : (
                            <Typography>User data not available.</Typography>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Temperature Logging</Typography>
                        {loadingUser || loadingThermometers || loadingTodaysLogs ? (
                            <CircularProgress />
                        ) : user && user.id ? (
                            <TemperatureLoggingSection 
                                verifiedThermometers={verifiedThermometers}
                                isLoading={loadingThermometers || loadingTodaysLogs} // Combine loading states
                                // error={thermometerError || todaysLogsError} // Combine errors or handle separately in component
                                departmentId={user.profile?.department}
                                staffId={user.id}
                                todaysTemperatureLogs={todaysTemperatureLogs} // Pass today's logs
                                onLogSuccess={fetchTodaysTemperatureLogs} // Pass refresh function
                            />
                        ) : (
                            <Typography>User data not available.</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

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
