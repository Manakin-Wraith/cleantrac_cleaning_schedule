import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Grid, List, ListItem, ListItemText, Divider, Chip, Alert } from '@mui/material';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances } from '../services/taskService'; 

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
                    };
                    const tasks = await getTaskInstances(params);
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

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                My {departmentName} Tasks for Today ({getTodayDateString()})
            </Typography>

            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>} 

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Today's Assigned Tasks</Typography>
                        {loadingTasks ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : todaysTasks.length > 0 ? (
                            <List>
                                {todaysTasks.map((task, index) => (
                                    <React.Fragment key={task.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={task.cleaning_item_name}
                                                secondary={`Status: ${task.status}`}
                                            />
                                            <Chip label={task.status} color={task.status === 'pending' ? 'warning' : task.status === 'completed' ? 'success' : 'default'} size="small" />
                                        </ListItem>
                                        {index < todaysTasks.length - 1 && <Divider variant="inset" component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography sx={{mt: 2, textAlign: 'center', color: 'text.secondary'}}>
                                No tasks assigned to you for today, or all tasks are completed.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default StaffTasksPage;
