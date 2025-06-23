import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
    Container, Typography,
    Paper,
    Grid,
    Button,
    Divider,
    Chip,

    // Container, // Removed duplicate
    Box,
    Alert as MuiAlert,
    CircularProgress,
    Stack, LinearProgress, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton, Link
} from '@mui/material';

import RestaurantIcon from '@mui/icons-material/Restaurant'; // For Production Schedule
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For Alerts
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For Tasks
 // For View Reports
 // For Download Reports
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'; // Cleaning icon
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // For status dots
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // For yellow alerts
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'; // For red alerts
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CloseIcon from '@mui/icons-material/Close';

// Placeholder for actual API calls
import { getCurrentUser } from '../services/authService';
import ReceivingTableGrid from '../features/receiving/ReceivingTableGrid';
import { getTemperatureLoggingManagerSummary, getCurrentTemperatureCheckAssignments } from '../services/thermometerService';
import dayjs from 'dayjs';
import { getProductionSchedules } from '../services/productionScheduleService';
import { getTaskInstances } from '../services/taskService';
// Future: import { getProductionSchedules } from '../services/productionService';

const doneStatus = (s) => ['completed','done'].includes((s||'').toLowerCase());

const cardBaseStyles = {
    p: 2.5, 
    borderRadius: 3,
    width: '100%', height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        transform: 'translateY(-3px)'
    }
};

function ManagerDashboardPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [metrics, setMetrics] = useState({ active: 0, completedToday: 0, overdue: 0 });
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [recipeMetrics, setRecipeMetrics] = useState({ active: 0, completedToday: 0, overdue: 0 });
    const [loadingRecipeMetrics, setLoadingRecipeMetrics] = useState(true);
    const [tempMetrics, setTempMetrics] = useState({ total: 0, logged: 0, outOfRange: 0, period: 'AM', staffName: '' });
    const [outOfRangeAreas, setOutOfRangeAreas] = useState([]);
    const [outDialogOpen, setOutDialogOpen] = useState(false);
    const [filterMode, setFilterMode] = useState('all'); // all|high|low
    const [loadingTempMetrics, setLoadingTempMetrics] = useState(true);

    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                setLoadingUser(true);
                setError('');
                const currentUserData = await getCurrentUser();
                setUser(currentUserData);
            } catch (err) {
                console.error("Failed to fetch user data for dashboard:", err);
                setError('Failed to load user data. Please try refreshing.');
                enqueueSnackbar('Failed to load user data.', { variant: 'error' });
                setUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        loadCurrentUser();
    }, [enqueueSnackbar]);

    // Fetch dashboard metrics (active, completed today, overdue)
    useEffect(() => {
        const fetchMetrics = async () => {
            setLoadingMetrics(true);
            try {
                const todayStr = dayjs().format('YYYY-MM-DD');
                const tasksToday = await getTaskInstances({ date: todayStr });
                const now = dayjs();
                let active = 0, completedToday = 0, overdue = 0;
                tasksToday.forEach(t => {
                    const isDone = doneStatus(t.status);
                    const end = t.end || t.scheduled_end_time || t.end_time || t.due_date;
                    if (isDone) {
                        completedToday += 1;
                    } else {
                        active += 1;
                        if (end && dayjs(end).isBefore(now)) overdue += 1;
                    }
                });
                setMetrics({ active, completedToday, overdue });
            } catch (err) {
                console.error('Failed to load dashboard metrics:', err);
                enqueueSnackbar('Failed to load today\'s metrics', { variant: 'error' });
            } finally {
                setLoadingMetrics(false);
            }
        };
        fetchMetrics();
    }, [enqueueSnackbar]);

    // Fetch recipe production metrics (active, completed today, overdue)
    useEffect(() => {
        const fetchRecipeMetrics = async () => {
            setLoadingRecipeMetrics(true);
            try {
                const todayStr = dayjs().format('YYYY-MM-DD');
                const schedulesResp = await getProductionSchedules({ date: todayStr });
                const schedules = Array.isArray(schedulesResp.results) ? schedulesResp.results : schedulesResp;
                const now = dayjs();
                let active = 0, completedToday = 0, overdue = 0;
                schedules.forEach(ps => {
                    const isDone = doneStatus(ps.status);
                    const end = ps.end || ps.scheduled_end_time || ps.end_time || ps.due_date;
                    if (isDone) {
                        completedToday += 1;
                    } else {
                        active += 1;
                        if (end && dayjs(end).isBefore(now)) overdue += 1;
                    }
                });
                setRecipeMetrics({ active, completedToday, overdue });
            } catch (err) {
                console.error('Failed to load recipe production metrics:', err);
                enqueueSnackbar('Failed to load recipe metrics', { variant: 'error' });
            } finally {
                setLoadingRecipeMetrics(false);
            }
        };
        fetchRecipeMetrics();
    }, [enqueueSnackbar]);

    // Temperature compliance metrics
    useEffect(() => {
        const fetchTemp = async () => {
            try {
                setLoadingTempMetrics(true);
                const data = await getTemperatureLoggingManagerSummary();
                const summary = data?.summary || {};
                // Expected summary: { compliance_rate, failed_today, longest_open_minutes }
                const nowHour = dayjs().hour();
                const isMorning = nowHour < 12;
                const keyPrefix = isMorning ? 'am' : 'pm';
                let staffName = 'Not assigned';
                    let outAreas = [];
                try {
                    const assignments = await getCurrentTemperatureCheckAssignments();
                    const assignmentObj = assignments?.[`${keyPrefix}_assignment`];
                    staffName = assignmentObj?.staff_member_name || assignmentObj?.staff_member_display || staffName;
                } catch(e) {
                    console.warn('Failed to fetch temperature check assignments', e);
                }
                // derive out-of-range areas list based on current period
                    const areas = data?.areas || [];
                    outAreas = areas.filter(area => {
                        if (keyPrefix === 'am') return area.am_logged && area.am_in_range === false;
                        return area.pm_logged && area.pm_in_range === false;
                    }).map(area => {
                        const temp = keyPrefix==='am' ? area.am_temperature : area.pm_temperature;
                        const min = area.target_min;
                        const max = area.target_max;
                        const diff = temp < min ? min - temp : temp - max;
                        const status = temp < min ? 'Low' : 'High';
                        return {
                            id: area.id,
                            name: area.name,
                            temp,
                            time: keyPrefix==='am' ? area.am_logged_at : area.pm_logged_at,
                            min,
                            max,
                            status,
                            diff
                        };
                    });

                    setTempMetrics({
                    period: isMorning ? 'AM' : 'PM',
                    total: summary.total_areas || 0,
                    logged: summary[`${keyPrefix}_logged_count`] || 0,
                    outOfRange: summary[`${keyPrefix}_out_of_range_count`] || 0,
                    staffName
                 });
                 // sort by diff desc then time
                 outAreas.sort((a,b)=> b.diff - a.diff || dayjs(b.time).unix()-dayjs(a.time).unix());
                 setOutOfRangeAreas(outAreas);
            } catch (err) {
                console.error('Failed to load temperature metrics', err);
            } finally { setLoadingTempMetrics(false); }
        };
        fetchTemp();
    }, []);

    
    if (loadingUser) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!user || !user.profile) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="warning">
                    User profile not fully loaded. Cannot display dashboard content.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={(theme) => ({ mt: 2, mb: 5, px: { xs: 2, sm: 3 }, bgcolor: theme.palette.primary.main, minHeight: '100vh', boxShadow: 1, borderRadius: 2 })}>
            {/* Top Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
                <Box>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mt: 2, mb: 2 }}>
                        Welcome {user?.first_name || user?.username || ''}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                        Here’s a snapshot of your department today.
                    </Typography>
                </Box>
            </Box>

            {/* Main Content Grid: Tasks, Team, Alerts */}
            <Grid container spacing={4} justifyContent="center" sx={{ mt: 16, mb: 6 }}>
                {/* Tasks At A Glance Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>Cleaning At A Glance</Typography>
                            <CleaningServicesIcon sx={{ color: 'primary.main', fontSize: '20px' }} />
                        </Box>
                        {loadingMetrics ? (
                                <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:120 }}>
                                    <CircularProgress size={24}/>
                                </Box>
                            ) : (
                                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {[ { label: 'Complete', count: metrics.completedToday, color: 'success.light', textColor: 'success.darker' },
                               { label: 'Active', count: metrics.active, color: 'warning.light', textColor: 'warning.darker' },
                               { label: 'Overdue', count: metrics.overdue, color: 'error.light', textColor: 'error.darker' },
                            ] .map(task => (
                                <Grid item xs={4} key={task.label}>
                                    <Paper elevation={0} sx={{ bgcolor: task.color, p: 2, textAlign: 'center', borderRadius: '8px' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: task.textColor }}>{task.count}</Typography>
                                        <Typography variant="caption" sx={{ color: task.textColor }}>{task.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        )}
                        <Box sx={{ textAlign: 'right' }}>
                            <Button size="small" color="primary" onClick={() => navigate('/manager-schedule')} sx={{ textTransform: 'none' }}>
                                View All Tasks →
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Recipe Production At A Glance Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>Recipe Production At A Glance</Typography>
                            <RestaurantIcon sx={{ color: 'primary.main', fontSize: '20px' }} />
                        </Box>
                        {loadingRecipeMetrics ? (
                            <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:120 }}>
                                <CircularProgress size={24}/>
                            </Box>
                        ) : (
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {[ { label:'Complete', count: recipeMetrics.completedToday, color:'success.light', textColor:'success.darker' },
                               { label:'Active', count: recipeMetrics.active, color:'warning.light', textColor:'warning.darker' },
                               { label:'Overdue', count: recipeMetrics.overdue, color:'error.light', textColor:'error.darker' },
                            ].map(item=> (
                                <Grid item xs={4} key={item.label}>
                                    <Paper elevation={0} sx={{ bgcolor:item.color, p:2, textAlign:'center', borderRadius:'8px' }}>
                                        <Typography variant="h5" sx={{ fontWeight:'bold', color:item.textColor }}>{item.count}</Typography>
                                        <Typography variant="caption" sx={{ color:item.textColor }}>{item.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        )}
                        <Box sx={{ textAlign:'right' }}>
                            <Button size="small" color="primary" onClick={() => navigate('/manager-schedule')} sx={{ textTransform:'none' }}>
                                View All Recipes →
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Temperature Compliance Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>Temperature Compliance</Typography>
                            <ThermostatIcon sx={{ color: tempMetrics.outOfRange? 'error.main':'info.main', fontSize: '20px' }} />
                        </Box>
                        {loadingTempMetrics ? (
                            <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:120 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <Box sx={{ mb:2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb:0.5 }}>
                                    {dayjs().format('ddd, DD MMM YYYY • HH:mm')}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight:'bold', color:'success.main', mb:1 }}>
                                    {tempMetrics.logged} / {tempMetrics.total} {tempMetrics.period}
                                </Typography>
                                <LinearProgress variant="determinate" value={tempMetrics.total ? (tempMetrics.logged/tempMetrics.total)*100 : 0} sx={{ height:8, borderRadius:4, mb:1 }} />
                                <Typography
                                    variant="subtitle2"
                                    color={tempMetrics.outOfRange ? 'error.main' : 'text.secondary'}
                                    sx={{ mb:0.5, cursor: tempMetrics.outOfRange ? 'pointer' : 'default', textDecoration: tempMetrics.outOfRange ? 'underline' : 'none' }}
                                    onClick={() => tempMetrics.outOfRange && setOutDialogOpen(true)}
                                >
                                    Out of range: {tempMetrics.outOfRange}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Assigned: {tempMetrics.staffName}</Typography>
                            </Box>
                        )}

                    </Paper>
                </Grid>
            </Grid>

            {/* Out-of-Range Details Dialog */}
            <Dialog open={outDialogOpen} onClose={() => setOutDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 500, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>Areas Out of Range – {tempMetrics.period}</span>
                    <IconButton onClick={()=>setOutDialogOpen(false)} size="small"><CloseIcon fontSize="small"/></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {/* filter chips */}
                    <Box sx={{ p:1, display:'flex', gap:1 }}>
                        {['all','high','low'].map(mode=> (
                            <Chip
                                key={mode}
                                label={mode.charAt(0).toUpperCase()+mode.slice(1)}
                                color={filterMode===mode? 'primary':'default'}
                                size="small"
                                onClick={()=>setFilterMode(mode)}
                            />
                        ))}
                    </Box>
                    {outOfRangeAreas.length === 0 ? (
                        <Box sx={{ p: 3 }}>
                            <Typography>No areas are out of range 🎉</Typography>
                        </Box>
                    ) : (
                        <List dense>
                            {outOfRangeAreas
                                .filter(a=> filterMode==='all' || a.status.toLowerCase()===filterMode)
                                .map((area, idx) => (
                                <ListItem key={idx} divider button onClick={()=>navigate(`/temperature-checks?area=${area.id}`)} sx={{ bgcolor: area.status==='High'? 'error.lighter':'info.lighter' }}>
                                    <ListItemText 
                                            primary={area.name}
                                            secondary={`Reading: ${area.temp}°C  (Target ${area.min}–${area.max}°C) • ${dayjs(area.time).format('HH:mm')}`} 
                                        />
                                        <Chip label={area.status} color={area.status==='High'?'error':'info'} size="small" sx={{ ml:1 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* Receiving Records Table */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 500, mb: 2 }}>
                    Recieved Products
                </Typography>
                <ReceivingTableGrid pageSize={25} />
            </Box>
        </Container>
    );
}

export default ManagerDashboardPage;
