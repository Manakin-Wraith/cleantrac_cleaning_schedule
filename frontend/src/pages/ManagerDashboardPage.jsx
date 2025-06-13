import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
    Container, Typography,
    Paper,
    Grid,
    Button,
    Divider,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    // Container, // Removed duplicate
    Box,
    Alert as MuiAlert,
    CircularProgress,
    Stack
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RestaurantIcon from '@mui/icons-material/Restaurant'; // For Production Schedule
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // For Alerts
import GroupIcon from '@mui/icons-material/Group'; // For Team Activity
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For Tasks
import BarChartIcon from '@mui/icons-material/BarChart'; // For View Reports
import DownloadIcon from '@mui/icons-material/Download'; // For Download Reports
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // For status dots
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // For members icon
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // For yellow alerts
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'; // For red alerts
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

// Placeholder for actual API calls
import { getCurrentUser } from '../services/authService';
// import { getDashboardSummary } from '../services/dashboardService'; // Assuming a service for dashboard data

const cardBaseStyles = {
    p: 2.5, 
    borderRadius: 3,
    height: '100%',
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
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

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
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, sm: 3 } }}>
            {/* Top Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        Manager Dashboard
                        {/* HMR part is dev specific, omitting. Department can be added if needed */}
                        {/* {user.profile.department_name ? ` - ${user.profile.department_name}` : ''} */}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                        Welcome back! Here's what's happening today.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        href="/manager-schedule" 
                        startIcon={<CalendarTodayIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', px: 2, py: 0.75 }}
                    >
                        Task Scheduler
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        href="/reports" 
                        startIcon={<BarChartIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', borderColor: 'grey.400', color: 'text.primary', px: 2, py: 0.75 }}
                    >
                        View Reports
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        // href="/download-reports" // Assuming a new route or handler
                        onClick={() => enqueueSnackbar('Download Reports clicked (handler not implemented)', { variant: 'info' })}
                        startIcon={<DownloadIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', borderColor: 'grey.400', color: 'text.primary', px: 2, py: 0.75 }}
                    >
                        Download Reports
                    </Button>
                </Stack>
            </Box>

            {/* Main Content Grid: Tasks, Team, Alerts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Tasks At A Glance Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>Tasks At A Glance</Typography>
                            <FiberManualRecordIcon sx={{ color: 'success.main', fontSize: '12px' }} />
                        </Box>
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {[ { label: 'Complete', count: 8, color: 'success.light', textColor: 'success.darker' },
                               { label: 'Pending', count: 2, color: 'warning.light', textColor: 'warning.darker' },
                               { label: 'Overdue', count: 1, color: 'error.light', textColor: 'error.darker' },
                            ].map(task => (
                                <Grid item xs={4} key={task.label}>
                                    <Paper elevation={0} sx={{ bgcolor: task.color, p: 2, textAlign: 'center', borderRadius: '8px' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: task.textColor }}>{task.count}</Typography>
                                        <Typography variant="caption" sx={{ color: task.textColor }}>{task.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ textAlign: 'right' }}>
                            <Button size="small" color="primary" href="/tasks" sx={{ textTransform: 'none' }}>
                                View All Tasks →
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Team Activity Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>Team Activity</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                            <PeopleAltIcon sx={{ fontSize: '16px', mr: 0.5 }} /> 
                            <Typography variant="caption">5 members</Typography>
                        </Box>
                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                            {[ { name: 'John D', role: 'Manager', initials: 'JD', avatarColor: 'primary.main', status: 'success.main' },
                               { name: 'Sarah M', role: 'Lead', initials: 'SM', avatarColor: 'success.main', status: 'warning.main' },
                               { name: 'Mike R', role: 'Dev', initials: 'MR', avatarColor: 'warning.main', status: 'error.main' },
                               { name: 'Lisa K', role: 'QA', initials: 'LK', avatarColor: 'secondary.main', status: 'success.main' },
                               { name: 'Tom W', role: 'Ops', initials: 'TW', avatarColor: 'info.main', status: 'grey.500' },
                            ].map(member => (
                                <Box key={member.initials} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: member.avatarColor, width: 32, height: 32, fontSize: '0.875rem', mr: 1.5 }}>{member.initials}</Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{member.role}</Typography>
                                    </Box>
                                    <FiberManualRecordIcon sx={{ color: member.status, fontSize: '10px' }} />
                                </Box>
                            ))}
                        </Stack>
                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>John D completed Deep Cleaning</Typography>
                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 2 }}>Sarah M verified AM Temperature Log</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                            <Button size="small" color="primary" href="/team-activity" sx={{ textTransform: 'none' }}>
                                View All Activity →
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Alerts Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>Recent Alerts</Typography>
                            <FiberManualRecordIcon sx={{ color: 'error.main', fontSize: '12px' }} />
                        </Box>
                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                            <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'warning.lighter', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                <WarningAmberIcon sx={{ color: 'warning.main', mr: 1 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.darker' }}>External Reports are out of range</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>2 min ago</Typography>
                                </Box>
                            </Paper>
                            <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'error.lighter', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                <ReportProblemOutlinedIcon sx={{ color: 'error.main', mr: 1 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.darker' }}>Production scheduling overdue</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>5 min ago</Typography>
                                </Box>
                            </Paper>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                            <Button size="small" color="primary" href="/alerts" sx={{ textTransform: 'none' }}>
                                View All Alerts →
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* KPI Cards Section */}
            <Grid container spacing={3}>
                {[ { title: 'Active Tasks', value: '24', color: 'primary.main' },
                   { title: 'Completion Rate', value: '98%', color: 'success.main' },
                   { title: 'Reports Generated', value: '12', color: 'info.main' },
                   { title: 'Pending Reviews', value: '3', color: 'warning.main' },
                ].map(kpi => (
                    <Grid item xs={12} sm={6} md={3} key={kpi.title}>
                        <Paper elevation={1} sx={{ p: 2.5, textAlign: 'center', borderRadius: '12px', height: '100%' }}>
                            <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', color: kpi.color, mb: 1 }}>
                                {kpi.value}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                {kpi.title}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default ManagerDashboardPage;
