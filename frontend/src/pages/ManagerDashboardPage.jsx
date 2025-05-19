import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Grid, Paper, CircularProgress, Button, Modal,
    TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Chip, IconButton, Tooltip
} from '@mui/material';
import { AddCircleOutline, Visibility as VisibilityIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, createTaskInstance } from '../services/taskService';
import { getCleaningItems } from '../services/cleaningItemService';
import { getUsers } from '../services/userService';
import { useSnackbar } from 'notistack';
import TaskDetailModal from '../components/modals/TaskDetailModal'; // Import TaskDetailModal

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

    // Selected date for filtering tasks
    const [selectedDate, setSelectedDate] = useState(new Date());

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
        due_date: getTodayDateString(selectedDate), // Initialize with selectedDate
        status: 'pending',
    });

    // State for detail modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

    const fetchManagerData = useCallback(async (currentUser, dateToFetch) => {
        if (!currentUser || !currentUser.profile || !currentUser.profile.department_id) {
            setDataError('User profile or department information is missing.');
            setLoadingData(false);
            return;
        }
        try {
            setLoadingData(true);
            setDataError('');
            
            const formattedDate = getTodayDateString(dateToFetch);
            const tasksParams = { 
                cleaning_item__department: currentUser.profile.department_id,
                due_date: formattedDate // Filter tasks by the selected due_date
            }; 

            // Fetch tasks, cleaning items, and users concurrently
            const [tasksResponse, itemsResponse, usersResponse] = await Promise.all([
                getTaskInstances(tasksParams),
                getCleaningItems(), // Assumes this is already filtered by department if needed, or fetches all for manager
                getUsers() // Assumes this fetches users for the manager's context or all relevant users
            ]);

            // Update states after all data is fetched
            setCleaningItems(itemsResponse);
            const filteredStaff = usersResponse.filter(u => u.profile?.role === 'staff');
            setStaffUsers(filteredStaff);
            setDepartmentTasks(tasksResponse); // Set tasks last or after dependent data is set

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
        if (user && user.profile && user.profile.department_id && selectedDate) {
            fetchManagerData(user, selectedDate); 
        } else {
        }
        // This effect depends on 'user' (the loaded user state) and 'fetchManagerData' (the memoized function).
        // It runs when 'user' changes to a valid state, or if fetchManagerData's definition were to change.
    }, [user, fetchManagerData, selectedDate]);

    const getItemName = useCallback((itemId) => {
        const item = cleaningItems.find(ci => ci.id === itemId);
        return item ? item.name : 'Unknown Item';
    }, [cleaningItems]);

    const getStaffName = useCallback((staffId) => {
        if (!staffId) return 'Unassigned';
        const staff = staffUsers.find(su => su.id === staffId);
        return staff ? `${staff.first_name} ${staff.last_name}`.trim() || staff.username : 'Unknown User';
    }, [staffUsers]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'warning';
            case 'in progress': return 'info';
            case 'completed': return 'success';
            case 'missed': return 'error';
            default: return 'default';
        }
    };

    const handleOpenCreateTaskModal = () => {
        setNewTask({
            cleaning_item_id: '',
            assigned_to_id: '',
            due_date: getTodayDateString(selectedDate), // Default to current page selectedDate
            status: 'pending',
        });
        setOpenCreateTaskModal(true);
    }
    const handleCloseCreateTaskModal = () => {
        setOpenCreateTaskModal(false);
        // Reset form - no need to reset here if handleOpen does it.
        // setNewTask({
        //     cleaning_item_id: '',
        //     assigned_to_id: '',
        //     due_date: getTodayDateString(selectedDate),
        //     status: 'pending',
        // });
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
            // Refresh tasks list for the currently selected date
            if(user) fetchManagerData(user, selectedDate);
        } catch (err) {
            console.error("Failed to create task:", err);
            enqueueSnackbar(err.message || 'Failed to create task.', { variant: 'error' });
        }
    };

    const handleOpenDetailModal = (task) => {
        setSelectedTaskForDetail(task);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTaskForDetail(null);
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

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography component="h1" variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
                {departmentName} Dashboard
            </Typography>
            <Typography component="h2" variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                Task Management
            </Typography>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                {departmentName} Department Tasks for {selectedDate.toLocaleDateString()}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Select Date"
                        value={selectedDate}
                        onChange={(newValue) => {
                            setSelectedDate(newValue || new Date());
                        }}
                        renderInput={(params) => <TextField {...params} sx={{ width: 'auto' }} />}
                    />
                </LocalizationProvider>
                <Button variant="contained" onClick={handleOpenCreateTaskModal}>
                    Create New Task
                </Button>
            </Box>

            {loadingData && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            )}
            {dataError && <Alert severity="error" sx={{ my: 2 }}>{dataError}</Alert>}
            {!loadingData && !dataError && (
                departmentTasks.length === 0 ? (
                    <Typography sx={{ my: 2 }}>No tasks found for your department on the selected date.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table aria-label="department tasks table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Item Name</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {departmentTasks.map((task, index) => {
                                    return (
                                        <TableRow key={task.id}>
                                            <TableCell>
                                                <Chip label={task.status || 'N/A'} color={getStatusColor(task.status)} size="small" />
                                            </TableCell>
                                            <TableCell>{task.cleaning_item_name || 'Unknown Item'}</TableCell>
                                            <TableCell>{task.assigned_to_username || 'Unassigned'}</TableCell>
                                            <TableCell>{task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details">
                                                    <IconButton onClick={() => handleOpenDetailModal(task)} size="small">
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => console.log('Edit task:', task.id)}>
                                                    Edit
                                                </Button>
                                                <Button size="small" variant="outlined" color="success" onClick={() => console.log('Complete task:', task.id)}>
                                                    Complete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}

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

            <TaskDetailModal 
                open={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                task={selectedTaskForDetail}
                cleaningItems={cleaningItems} // Pass all cleaning items for potential lookup
            />
        </Container>
    );
}

export default ManagerDashboardPage;
