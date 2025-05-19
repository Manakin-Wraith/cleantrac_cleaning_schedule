import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Grid, Paper, CircularProgress, Button, Modal,
    TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Chip
} from '@mui/material';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, createTaskInstance } from '../services/taskService';
import { getCleaningItems } from '../services/cleaningItemService';
import { getUsers } from '../services/userService';
import { useSnackbar } from 'notistack';

const getTodayDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

function ManagerDashboardPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    // Data for task management
    const [departmentTasks, setDepartmentTasks] = useState([]);
    const [cleaningItems, setCleaningItems] = useState([]);
    const [staffUsers, setStaffUsers] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [dataError, setDataError] = useState('');

    // Modal and form state for creating tasks
    const [openCreateTaskModal, setOpenCreateTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        cleaning_item_id: '',
        assigned_to_id: '',
        due_date: getTodayDateString(),
        status: 'pending',
    });

    const fetchManagerData = useCallback(async (currentUser) => {
        if (!currentUser || !currentUser.profile || !currentUser.profile.department_id) {
            setDataError('User profile or department information is missing.');
            setLoadingData(false);
            return;
        }
        try {
            setLoadingData(true);
            setDataError('');
            
            const tasksParams = { cleaning_item__department: currentUser.profile.department_id }; 
            const tasks = await getTaskInstances(tasksParams);
            setDepartmentTasks(tasks);

            // Cleaning items are already filtered by manager's department by the backend
            const items = await getCleaningItems(); 
            setCleaningItems(items);

            // Users are filtered by manager's department by the backend
            // We might want to add { role: 'staff' } if API supports it and it's needed.
            const usersResponse = await getUsers(); // getUsers() call itself
            setStaffUsers(usersResponse.filter(u => u.profile?.role === 'staff')); // Further filter on client for 'staff'

        } catch (err) {
            console.error("Failed to load manager dashboard data:", err);
            setDataError(err.message || 'Failed to load department data.');
            enqueueSnackbar(err.message || 'Failed to load department data.', { variant: 'error' });
        } finally {
            setLoadingData(false);
        }
    }, [enqueueSnackbar]); // fetchManagerData depends only on enqueueSnackbar, as 'currentUser' is an argument.

    // Effect to load the current user ONCE on component mount
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                setLoadingUser(true);
                setError('');
                const currentUserData = await getCurrentUser();
                setUser(currentUserData);
                // setLoadingUser(false); // Set loadingUser false after user is set
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError('Failed to load user data. Please try refreshing.');
                enqueueSnackbar('Failed to load user data.', { variant: 'error' });
                // setUser(null); // Ensure user is null on error
            } finally {
                setLoadingUser(false); // Ensure loading is always set to false
            }
        };
        loadCurrentUser();
    }, []); // Dependencies for loading current user. Changed to [] to run once.

    // Effect to fetch manager-specific data once the user is loaded or changes
    useEffect(() => {
        console.log("Effect for fetchManagerData triggered. User object:", user);
        if (user && user.profile && user.profile.department_id) {
            console.log("User has department ID, calling fetchManagerData. Department ID:", user.profile.department_id);
            fetchManagerData(user); 
        } else {
            console.log("Condition not met for fetchManagerData. User:", user);
        }
        // This effect depends on 'user' (the loaded user state) and 'fetchManagerData' (the memoized function).
        // It runs when 'user' changes to a valid state, or if fetchManagerData's definition were to change.
    }, [user, fetchManagerData]);


    const handleOpenCreateTaskModal = () => setOpenCreateTaskModal(true);
    const handleCloseCreateTaskModal = () => {
        setOpenCreateTaskModal(false);
        // Reset form
        setNewTask({
            cleaning_item_id: '',
            assigned_to_id: '',
            due_date: getTodayDateString(),
            status: 'pending',
        });
    };

    const handleNewTaskChange = (event) => {
        const { name, value } = event.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTaskSubmit = async (event) => {
        event.preventDefault();
        if (!newTask.cleaning_item_id || !newTask.due_date || !newTask.status) {
            enqueueSnackbar('Cleaning item, due date, and status are required.', { variant: 'warning' });
            return;
        }
        // assigned_to_id is optional
        const taskPayload = { ...newTask };
        if (!taskPayload.assigned_to_id) {
            delete taskPayload.assigned_to_id; // Send as null or undefined if not set, backend handles it
        }

        try {
            await createTaskInstance(taskPayload);
            enqueueSnackbar('Task created successfully!', { variant: 'success' });
            handleCloseCreateTaskModal();
            // Refresh tasks list
            if(user) fetchManagerData(user);
        } catch (err) {
            console.error("Failed to create task:", err);
            enqueueSnackbar(err.message || 'Failed to create task.', { variant: 'error' });
        }
    };

    if (loadingUser) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
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

    // Original Dashboard Widgets (can be kept or moved to a different tab/section)
    const originalWidgets = (
        <Grid container spacing={3} sx={{ mb: 4}}>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>Today's Completion</Typography>
                    <Typography component="p" variant="h4">--%</Typography>
                    <Typography color="text.secondary" sx={{ flexGrow: 1 }}>-- / -- Tasks</Typography>
                    <Typography color="text.secondary">(Placeholder for Progress Bar/Donut)</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>Overdue Tasks</Typography>
                    <Typography component="p" variant="h4">--</Typography>
                    <Typography color="text.secondary" sx={{ flexGrow: 1 }}>(Placeholder for compact list)</Typography>
                    <Typography color="text.secondary">Link: View All Overdue</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>Completion By Staff (Today)</Typography>
                    <Typography color="text.secondary" sx={{ flexGrow: 1 }}>(Placeholder for Bar Chart)</Typography>
                </Paper>
            </Grid>
             {/* Quick Actions Widget can be removed or re-purposed for task management actions */}
        </Grid>
    );

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
                {departmentName} Dashboard
            </Typography>
            <Typography component="h2" variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                Task Management
            </Typography>

            {/* Original Widgets - uncomment if you want them displayed alongside task management */}
            {/* {originalWidgets} */}

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleOpenCreateTaskModal}>
                    Create New Task
                </Button>
            </Box>

            {dataError && <Alert severity="warning" sx={{ mb: 2 }}>{dataError}</Alert>}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Department Tasks</Typography>
                {loadingData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                ) : departmentTasks.length > 0 ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                        <Table stickyHeader aria-label="department tasks table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item Name</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    {/* Add Actions cell later for edit/delete */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {departmentTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell>{task.cleaning_item_name}</TableCell>
                                        <TableCell>{task.assigned_to_username || 'Unassigned'}</TableCell>
                                        <TableCell>{task.due_date}</TableCell>
                                        <TableCell>
                                            <Chip label={task.status} color={task.status === 'pending' ? 'warning' : task.status === 'completed' ? 'success' : task.status === 'overdue' ? 'error' : 'default'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography sx={{mt: 2, textAlign: 'center', color: 'text.secondary'}}>
                        No tasks found for this department or matching current filters.
                    </Typography>
                )}
            </Paper>

            <Modal
                open={openCreateTaskModal}
                onClose={handleCloseCreateTaskModal}
                aria-labelledby="create-task-modal-title"
                aria-describedby="create-task-modal-description"
            >
                <Box sx={style} component="form" onSubmit={handleCreateTaskSubmit} noValidate>
                    <Typography id="create-task-modal-title" variant="h6" component="h2" gutterBottom>
                        Create New Task
                    </Typography>
                    
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="cleaning-item-label">Cleaning Item</InputLabel>
                        <Select
                            labelId="cleaning-item-label"
                            id="cleaning_item_id"
                            name="cleaning_item_id"
                            value={newTask.cleaning_item_id}
                            label="Cleaning Item"
                            onChange={handleNewTaskChange}
                        >
                            {cleaningItems.map(item => (
                                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <InputLabel id="assigned-to-label">Assign To (Optional)</InputLabel>
                        <Select
                            labelId="assigned-to-label"
                            id="assigned_to_id"
                            name="assigned_to_id"
                            value={newTask.assigned_to_id}
                            label="Assign To (Optional)"
                            onChange={handleNewTaskChange}
                        >
                            <MenuItem value=""><em>Unassigned</em></MenuItem>
                            {staffUsers.map(staff => (
                                <MenuItem key={staff.id} value={staff.id}>{staff.username} ({staff.first_name} {staff.last_name})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="due_date"
                        label="Due Date"
                        name="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={handleNewTaskChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                            labelId="status-label"
                            id="status"
                            name="status"
                            value={newTask.status}
                            label="Status"
                            onChange={handleNewTaskChange}
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="overdue">Overdue</MenuItem> 
                            {/* Managers might not set to completed directly, but it's an option */}
                            {/* <MenuItem value="completed">Completed</MenuItem> */}
                        </Select>
                    </FormControl>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseCreateTaskModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Create Task</Button>
                    </Box>
                </Box>
            </Modal>

             {/* The original summary widgets are now commented out above. */}
             {/* They can be reintegrated, perhaps in a separate tab or section if desired. */}

        </Container>
    );
}

export default ManagerDashboardPage;
