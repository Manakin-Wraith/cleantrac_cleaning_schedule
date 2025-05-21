import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Grid, List, ListItem, ListItemText, Divider, Chip, Alert, Button, Card, CardContent, CardActions } from '@mui/material';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, updateTaskInstance } from '../services/taskService'; 
import { formatDate } from '../utils/dateUtils'; 
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build'; // For Equipment
import ScienceIcon from '@mui/icons-material/Science'; // For Chemicals
import ListAltIcon from '@mui/icons-material/ListAlt'; // For Method
import NotesIcon from '@mui/icons-material/Notes'; // For Notes

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
    const [error, setError] = useState('');
    const [updatingTask, setUpdatingTask] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        const fetchUserDataAndTasks = async () => {
            try {
                setLoadingUser(true);
                setError('');
                const userData = await getCurrentUser();
                setUser(userData);
                setLoadingUser(false);

                if (userData && userData.id) {
                    setLoadingTasks(true);
                    const todayStr = getTodayDateString();
                    const params = {
                        assigned_to: userData.id,
                        due_date: todayStr,
                        // status: 'pending', // Optionally filter for only pending tasks initially
                    };
                    const tasks = await getTaskInstances(params);
                    console.log('Fetched tasks for staff page:', tasks); // For debugging nested structure
                    setTodaysTasks(tasks);
                }
            } catch (err) {
                console.error("Failed to load page data:", err);
                setError(err.message || 'Failed to load page data. Please try refreshing.');
            } finally {
                setLoadingUser(false); 
                setLoadingTasks(false);
            }
        };
        fetchUserDataAndTasks();
    }, []);

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
