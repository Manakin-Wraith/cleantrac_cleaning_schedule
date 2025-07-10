import React, { useState, useEffect, useCallback } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Chip, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Badge, Card, CardContent, CardActions, Stack, Fade } from '@mui/material';

import { useTheme, alpha } from '@mui/material/styles';
import { getTaskInstances, updateTaskInstance } from '../services/taskService';
import { updateProductionSchedule } from '../services/productionScheduleService';
import { getRecipe } from '../services/recipeService';
// Legacy modal import removed – recipe tasks now use the new TaskDrawer
// import RecipeIngredientsDialog from '../components/recipes/RecipeIngredientsDialog';
import TaskSection from '../components/tasks/TaskSection';
import TaskDrawer from '../components/tasks/TaskDrawer';
import { getProductionSchedules } from '../services/productionScheduleService';
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
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function StaffTasksPage() {
    const [user, setUser] = useState(null);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false); 
    const [todaysRecipeTasks, setTodaysRecipeTasks] = useState([]);

    // Tablet simple view flag & drawer state
    const tabletSimpleView = import.meta.env.VITE_TABLET_SIMPLE_VIEW === 'true';
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTask, setDrawerTask] = useState(null);
    const [drawerRecipe, setDrawerRecipe] = useState(null);
    const [loadingDrawerRecipe, setLoadingDrawerRecipe] = useState(false);
    const [error, setError] = useState(''); // General page error
    const [successMsg, setSuccessMsg] = useState('');
    const [updatingTask, setUpdatingTask] = useState(null);
    // Helper to render a task card (cleaning or recipe)
    const renderTaskCard = (task) => (
        <Card
            onClick={() => handleCardClick(task)}
            sx={{
                cursor: task.__type === 'recipe' ? 'pointer' : 'default',
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
            }}
        >
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
                        {task.__type === 'recipe' ? (task.recipe_details?.name || task.recipe?.name || 'Unnamed Recipe') : (task.cleaning_item?.name || 'Unnamed Task')}
                    </Typography>
                    <Chip 
                        label={(task.status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                            <strong>Scheduled Date:</strong> {task.__type === 'recipe' ? (task.scheduled_date ? formatDate(task.scheduled_date) : 'N/A') : (task.due_date ? formatDate(task.due_date) : 'N/A')}
                        </Typography>
                    </Box>
                    {(task.start_time || task.end_time || task.timeslot || task.scheduled_start_time) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Timeslot:</strong> {task.__type === 'recipe' ? (
                                    task.start_time && task.end_time ? `${task.start_time.substring(0, 5)} - ${task.end_time.substring(0, 5)}` :
                                    task.scheduled_start_time && task.scheduled_end_time ? `${task.scheduled_start_time.substring(11, 16)} - ${task.scheduled_end_time.substring(11, 16)}` : 'N/A'
                                ) : (
                                    task.start_time && task.end_time ? `${task.start_time.substring(0, 5)} - ${task.end_time.substring(0, 5)}` : (task.timeslot || 'N/A')
                                )}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ mb: 1 }}>
                    {task.__type === 'cleaning' && task.cleaning_item?.equipment && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                            <BuildIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Equipment:</strong> {task.cleaning_item.equipment}
                            </Typography>
                        </Box>
                    )}
                    {task.__type === 'cleaning' && task.cleaning_item?.chemical && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                            <ScienceIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Chemicals:</strong> {task.cleaning_item.chemical}
                            </Typography>
                        </Box>
                    )}
                    {task.__type === 'cleaning' && task.cleaning_item?.method && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                            <ListAltIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Method:</strong> {task.cleaning_item.method}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {task.__type === 'recipe' && (
                    <Typography variant="body2" color="text.secondary">
                        <strong>Quantity:</strong> {task.batch_size ? `${task.batch_size} ${task.batch_unit || ''}` : (task.quantity || task.batch_quantity || 'N/A')}
                    </Typography>
                )}

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
            {['pending', 'in_progress'].includes(task.status) && (
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleSubmitForReview(task); }}
                        disabled={updatingTask === task.id}
                    >
                        {updatingTask === task.id ? <CircularProgress size={20} color="inherit" /> : 'Completed'}
                    </Button>
                </CardActions>
            )}
        </Card>
    );

    // dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [dialogRecipe, setDialogRecipe] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const theme = useTheme();

    // New state for thermometer data
    const [thermometersNeedingVerification, setThermometersNeedingVerification] = useState([]);
    const [verifiedThermometers, setVerifiedThermometers] = useState([]);
    const [loadingThermometers, setLoadingThermometers] = useState(true);
    const [thermometerError, setThermometerError] = useState('');
    
    // State for temperature logging data
    const [todaysLogs, setTodaysLogs] = useState([]);
    const [loggedAreas, setLoggedAreas] = useState([]);

    // Callback when a temperature log is successfully submitted in child component
    const handleLoggingSuccess = (areaId) => {
        setLoggedAreas(prev => (prev.includes(areaId) ? prev : [...prev, areaId]));
    };
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [areaUnits, setAreaUnits] = useState([]);
    const [verificationAssignment, setVerificationAssignment] = useState(null);
    const [temperatureCheckAssignment, setTemperatureCheckAssignment] = useState(null);
    const [allowedTimePeriods, setAllowedTimePeriods] = useState(['AM', 'PM']);
    // UI toggles for inline wizards
    const [activeThermometerTask, setActiveThermometerTask] = useState(null); // null | 'verification' | 'logging'

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

                    const prodParams = {
                        assigned_to: userData.id,
                        scheduled_date: todayStr,
                    };
                    const prodResp = await getProductionSchedules(prodParams);
                    const recipeTasks = prodResp?.results || prodResp || [];

                    // Show only today's instance for recurring tasks
                    const filteredTasks = (tasks || []).filter(t => !t.recurrence_type || t.due_date === todayStr);
                    const filteredRecipeTasks = (recipeTasks || []).filter(t => !t.recurrence_type || t.scheduled_date === todayStr);

                    setTodaysTasks(filteredTasks);
                    setTodaysRecipeTasks(filteredRecipeTasks);
                    setLoadingTasks(false);
                }
            } catch (err) {
                console.error('Failed to load page data:', err);
                setError(err.message || 'Failed to load page data. Please try refreshing.');
                setTodaysTasks([]);
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

    // Row/card click handlers
    const handleTaskSelect = async (task) => {
        setDrawerTask(task);
        setDrawerOpen(true);
        if (task.__type === 'recipe') {
            setLoadingDrawerRecipe(true);
            try {
                const data = await getRecipe(task.recipe_details.id, { expand: 'ingredients' });
                setDrawerRecipe(data);
            } catch (err) {
                console.error('Failed to load recipe:', err);
            } finally {
                setLoadingDrawerRecipe(false);
            }
        } else {
            setDrawerRecipe(null);
        }
    };


    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setDrawerTask(null);
        setDrawerRecipe(null);
    };

    // Unified click handler – open drawer for both cleaning and recipe tasks
    const handleCardClick = (task) => {
        handleTaskSelect(task);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setDialogRecipe(null);
        setSelectedTask(null);
    };

    const handleSubmitForReview = async (taskObj) => {
        const taskId = taskObj.id;
        const isRecipe = taskObj.__type === 'recipe';
        setUpdatingTask(taskId);
        let updatedTaskObj = null;
        setError('');
        try {
            if (isRecipe) {
                await updateProductionSchedule(taskId, { status: 'pending_review' });
                updatedTaskObj = { ...taskObj, status: 'pending_review' };
                setTodaysRecipeTasks(prev => prev.map(t => t.id === taskId ? updatedTaskObj : t));
            } else {
                await updateTaskInstance(taskId, { status: 'pending_review' });
                updatedTaskObj = { ...taskObj, status: 'pending_review' };
                setTodaysTasks(prev => prev.map(t => t.id === taskId ? updatedTaskObj : t));
            }
            // reflect in drawer if open
            if (drawerTask && drawerTask.id === taskId) {
                setDrawerTask(updatedTaskObj);
            }
            // feedback & close
            setSuccessMsg('Task submitted for review');
            setTimeout(() => setDrawerOpen(false), 800);
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

    // Handlers to toggle inline wizards
    const openVerification = () => setActiveThermometerTask('verification');
    const openLogging = () => setActiveThermometerTask('logging');
    const closeThermometerTask = () => setActiveThermometerTask(null);

    const departmentName = user?.profile?.department_name || 'Your';
    const userName = user ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) : 'My';

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Fade in timeout={350}>
                <Paper elevation={0} sx={{ px: 3, py: 2, mb:4, mx: 'auto', maxWidth: 600, backdropFilter: 'blur(8px)', backgroundColor: (t)=>t.palette.surfaceHigh, textAlign: 'center', position: 'relative' }}>
                    <PieChartOutlineIcon sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: 32 }} />
                    <Stack spacing={0.5}>
                        <Typography variant="h4" fontWeight={600}>{userName}'s Tasks</Typography>
                        <Typography variant="subtitle1" color="text.secondary">{departmentName} · Today ({getTodayDateString()})</Typography>
                    </Stack>
                </Paper>
            </Fade>
            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
            {thermometerError && <Alert severity="error" sx={{ mb: 2 }}>{thermometerError}</Alert>}
            {/* Thermometer Tasks Summary */}
            {!loadingUser && !loadingThermometers && (verificationAssignment || temperatureCheckAssignment) && (
                <Box sx={{ mb: 4 }}>
                    
                        {activeThermometerTask === null && (
                        <Paper elevation={2} sx={{ p: 2, width:'100%', maxWidth:'100%', flexGrow:1, display:'block', boxSizing:'border-box' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Thermometer &amp; Temperature Checks</Typography>
                                {temperatureCheckAssignment && (
                                    <Chip 
                                        label={temperatureCheckAssignment.time_period === 'AM' ? 'Morning (AM)' : 
                                               temperatureCheckAssignment.time_period === 'PM' ? 'Afternoon (PM)' : 'Both AM & PM'}
                                        size="small"
                                    />
                                )}
                            </Box>
                            <Stack spacing={1}>
                                {/* Verification row */}
                                <Box onClick={openVerification} sx={{ cursor:'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.grey[200], 0.3) }}>
                                    <Typography variant="body2">Verification</Typography>
                                    <Chip label={`${verifiedThermometers.length}/${verifiedThermometers.length + thermometersNeedingVerification.length}`} size="small" color={thermometersNeedingVerification.length === 0 ? 'success' : 'warning'} />
                                </Box>
                                {/* Logging row */}
                                <Box onClick={openLogging} sx={{ cursor:'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.grey[200], 0.3) }}>
                                    <Typography variant="body2">Logging</Typography>
                                    <Chip label={`${loggedAreas.length}/${allowedTimePeriods.length}`} size="small" color={loggedAreas.length === allowedTimePeriods.length ? 'success' : 'warning'} />
                                </Box>
                            </Stack>
                        </Paper>)}

                        {activeThermometerTask === 'verification' && (
                            <Paper elevation={2} sx={{ p:2, width:'100%', maxWidth:'100%', flexGrow:1, display:'block', boxSizing:'border-box' }}>
                                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                                    <Typography variant="h6">Thermometer Verification</Typography>
                                    <Button size="small" onClick={closeThermometerTask}>Back</Button>
                                </Box>
                                <ThermometerVerificationSection
                                    thermometers={thermometersNeedingVerification}
                                    onVerificationSuccess={()=>{fetchThermometerData(); closeThermometerTask();}}
                                    isLoading={loadingThermometers}
                                    departmentId={user?.profile?.department}
                                />
                            </Paper>
                        )}

                        {activeThermometerTask === 'logging' && (
                            <Paper elevation={2} sx={{ p:2, width:'100%', maxWidth:'100%', flexGrow:1, display:'block', boxSizing:'border-box' }}>
                                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                                    <Typography variant="h6">Temperature Logging</Typography>
                                    <Button size="small" onClick={closeThermometerTask}>Back</Button>
                                </Box>
                                <TemperatureLoggingSection
                                    verifiedThermometers={verifiedThermometers}
                                    isLoading={loadingThermometers}
                                    departmentId={user?.profile?.department}
                                    staffId={user?.id}
                                    currentUser={user}
                                    onLoggingSuccess={handleLoggingSuccess}
                                />
                            </Paper>
                        )}
                    </Box>
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
            ) : (todaysTasks.length + todaysRecipeTasks.length) > 0 ? (
                <Box>
                    {tabletSimpleView && (
                            <>
                                {todaysTasks.length > 0 && (
                                    <TaskSection
                                        title="Cleaning Tasks"
                                        tasks={todaysTasks.map(t => ({ ...t, __type: 'cleaning' })).sort((a,b)=>(a.due_date||'').localeCompare(b.due_date||''))}
                                        onSelect={handleTaskSelect}
                                        defaultExpanded
                                    />
                                )}
                                {todaysRecipeTasks.length > 0 && (
                                    <TaskSection
                                        title="Recipe Production"
                                        tasks={todaysRecipeTasks.map(t => ({ ...t, __type: 'recipe' })).sort((a,b)=>(a.scheduled_date||'').localeCompare(b.scheduled_date||''))}
                                        onSelect={handleTaskSelect}
                                    />
                                )}
                            </>
                        )}

                        {!tabletSimpleView && todaysTasks.length > 0 && (
                        <>
                            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>Cleaning Tasks ({todaysTasks.length})</Typography>
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                {todaysTasks.map(t => ({ ...t, __type: 'cleaning' }))
                                    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
                                    .map(task => (
                                        <Grid item xs={12} sm={6} md={4} key={`clean_${task.id}`}>
                                            {renderTaskCard(task)}
                                        </Grid>
                                    ))}
                            </Grid>
                        </>
                    )}
                    {!tabletSimpleView && todaysRecipeTasks.length > 0 && (
                        <>
                            <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>Recipe Production ({todaysRecipeTasks.length})</Typography>
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                {todaysRecipeTasks.map(t => ({ ...t, __type: 'recipe' }))
                                    .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''))
                                    .map(task => (
                                        <Grid item xs={12} sm={6} md={4} key={`recipe_${task.id}`}>
                                            {renderTaskCard(task)}
                                        </Grid>
                                    ))}
                            </Grid>
                        </>
                    )}
                </Box>
            ) : (
                <Paper elevation={1} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1">No tasks assigned for today.</Typography>
                </Paper>
            )}
            {/* Detail drawer for task */}
            <TaskDrawer
                open={drawerOpen}
                onClose={handleDrawerClose}
                onOpen={() => {}}
                task={drawerTask}
                onMarkDone={handleSubmitForReview}
                updating={updatingTask}
                recipe={drawerRecipe}
                loadingRecipe={loadingDrawerRecipe}
            />

        </Container>
    );
}

export default StaffTasksPage;
