import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Grid, Paper, CircularProgress, Button, Modal,
    TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Chip, IconButton, Tooltip,
    Tabs, Tab // Added Tabs and Tab
} from '@mui/material';
import {
    AddCircleOutline, Visibility as VisibilityIcon, Edit as EditIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getCurrentUser } from '../services/authService';
import { getTaskInstances, createTaskInstance, updateTaskInstance, markTaskAsComplete } from '../services/taskService';
import { getCleaningItems } from '../services/cleaningItemService';
import { getUsers } from '../services/userService';
import { useSnackbar } from 'notistack';
import TaskDetailModal from '../components/modals/TaskDetailModal'; 
import EditTaskAssignmentModal from '../components/modals/EditTaskAssignmentModal'; // Import EditTaskAssignmentModal
import TaskSchedulerCalendar from '../components/calendar/TaskSchedulerCalendar'; // Import TaskSchedulerCalendar

const getTodayDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to format Date object to HH:MM:SS string
const formatTime = (date) => {
    if (!date) return null;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
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
        department_id: '', // Added: will be set from user profile
        start_time: null, // Added for future use in modal
        end_time: null,   // Added for future use in modal
        notes: '',        // Added for future use in modal
    });

    // State for detail modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

    // State for edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null); 

    // State for view toggle (list vs scheduler)
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'scheduler'

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
            // For the calendar, we want all tasks for the department, not just a specific due_date.
            // The calendar will handle displaying them based on their due_dates.
            // The list view might still use a date filter, but this fetch is for the general data pool.
            const tasksParams = { 
                // department: currentUser.profile.department_id, // Backend view now filters by user's department if manager
                // No specific date filter here for fetching all tasks for the calendar range
            }; 

            // Fetch tasks, cleaning items, and users concurrently
            const [tasksResponse, itemsResponse, usersResponse] = await Promise.all([
                getTaskInstances(tasksParams), // Pass modified or empty params
                getCleaningItems(), 
                getUsers()
            ]);

            console.log('Fetched tasks for calendar/dashboard:', tasksResponse); // DEBUG: Log fetched tasks

            // Update states after all data is fetched
            setCleaningItems(itemsResponse);
            const filteredStaff = usersResponse.filter(u => u.profile?.role === 'staff');
            console.log('Filtered staff users (for resources):', JSON.stringify(filteredStaff, null, 2));
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

    // staffId is expected to be UserProfile.id, as obtained from task.assigned_to_details.id
    const getStaffName = useCallback((staffProfileId) => {
        console.log('[getStaffName] Received staffProfileId:', staffProfileId, 'Type:', typeof staffProfileId);
        if (!staffProfileId) {
            console.log('[getStaffName] staffProfileId is null/undefined, returning Unassigned');
            return 'Unassigned';
        }
        // staffUsers is an array of User objects. Each User object has a `profile` (UserProfile).
        const staffUserObject = staffUsers.find(su => su.profile?.id === staffProfileId); 
        console.log('[getStaffName] Found staffUserObject:', staffUserObject);
        return staffUserObject ? `${staffUserObject.first_name} ${staffUserObject.last_name}`.trim() || staffUserObject.username : 'Unknown User';
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
            department_id: user?.profile?.department_id || '', // Set department from current user's profile
            start_time: null,
            end_time: null,
            notes: '',
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
        // Ensure department_id is set, especially if not relying solely on backend perform_create
        const taskPayload = { 
            ...newTask,
            department_id: newTask.department_id || user?.profile?.department_id, // Ensure department_id is included
        };

        if (!taskPayload.cleaning_item_id || !taskPayload.due_date || !taskPayload.status || !taskPayload.department_id) {
            enqueueSnackbar('Cleaning item, due date, status, and department are required.', { variant: 'warning' });
            return;
        }

        // assigned_to_id is optional
        // const taskPayload = { ...newTask }; // Original line
        if (!taskPayload.assigned_to_id) {
            delete taskPayload.assigned_to_id; // Remove if null/empty to avoid sending empty string if backend expects null or omission
        }

        // Remove null start_time/end_time if backend expects omission or has defaults
        if (taskPayload.start_time === null) delete taskPayload.start_time;
        if (taskPayload.end_time === null) delete taskPayload.end_time;

        console.log('Submitting new task with payload:', taskPayload); // DEBUG: Log payload

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

    const handleOpenEditModal = (task) => {
        setSelectedTaskForEdit(task);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedTaskForEdit(null);
        // Data refresh will be handled by the modal's onTaskUpdated callback
    };

    const handleTaskUpdated = () => {
        fetchManagerData(user, selectedDate); // Re-fetch data to reflect updates
    };

    const handleMarkComplete = async (taskId) => {
        try {
            await markTaskAsComplete(taskId);
            enqueueSnackbar('Task marked as complete!', { variant: 'success' });
            fetchManagerData(user, selectedDate); // Refresh the task list
        } catch (error) {
            console.error('Failed to mark task as complete:', error);
            enqueueSnackbar(error.message || 'Failed to mark task as complete. Please try again.', { variant: 'error' });
        }
    };

    const handleViewChange = (event, newValue) => {
        setCurrentView(newValue);
    };

    const handleEventDrop = async (info) => {
        const { event, oldEvent, revert, view } = info;
        const taskId = event.id;
        let updatedFields = {};
        const changeDescription = [];

        const newDueDate = getTodayDateString(event.start); // YYYY-MM-DD format from event.start
        const oldDueDate = getTodayDateString(oldEvent.start); // YYYY-MM-DD format from oldEvent.start

        if (newDueDate !== oldDueDate) {
            updatedFields.due_date = newDueDate;
            changeDescription.push(`date to ${newDueDate}`);
        }

        // Handle assignee change (resource change)
        const newResourceId = event.getResources()?.[0]?.id; // New staff ID from resource
        const oldResourceId = oldEvent.getResources()?.[0]?.id; // Old staff ID from resource

        if (newResourceId !== oldResourceId) {
            updatedFields.assigned_to_id = newResourceId ? parseInt(newResourceId, 10) : null;
            const newAssigneeName = newResourceId ? staffUsers.find(s => s.id.toString() === newResourceId)?.username : 'Unassigned';
            changeDescription.push(`assignee to ${newAssigneeName}`);
        }

        // Handle start_time and end_time based on view type
        if (view.type.includes('TimeGrid')) { // e.g., resourceTimeGridDay, resourceTimeGridWeek
            updatedFields.start_time = formatTime(event.start);
            // FullCalendar's event.end might be null if it's a timed event without a specific end (e.g., dragged to a slot)
            // Or it might be the end of the slot. Backend should handle end_time if it's duration based or similar.
            // For now, if event.end is significantly different from event.start, use it.
            // If event.allDay became false (dragged from all-day to timed slot), this implies times are now relevant.
            if (event.end && event.end.getTime() !== event.start.getTime()) { // Check if end time is distinct
                updatedFields.end_time = formatTime(event.end);
            } else {
                // If no explicit end_time, or it's same as start, consider it null or derive based on a default duration later.
                updatedFields.end_time = null; // Or calculate a default end_time, e.g., start_time + 1 hour
            }
            if (changeDescription.length === 0 && updatedFields.start_time !== formatTime(oldEvent.start)) {
                 changeDescription.push(`time to ${updatedFields.start_time}`);
            }
        } else { // For DayGrid views (e.g., dayGridMonth)
            updatedFields.start_time = null;
            updatedFields.end_time = null;
            // If it was a timed event dragged to an all-day slot, this implicitly makes it all-day.
        }

        if (Object.keys(updatedFields).length === 0) {
            console.log('No change detected in date, assignee, or time.');
            // Optionally call revert() if you want to visually snap back, but FullCalendar often does this if no change.
            return; 
        }

        try {
            console.log(`Updating task ${taskId} with fields:`, updatedFields);
            await updateTaskInstance(taskId, updatedFields);
            enqueueSnackbar(`Task '${event.title}' updated: ${changeDescription.join(', ')}.`, { variant: 'success' });
            fetchManagerData(user, selectedDate); // Refetch all data to ensure consistency
        } catch (error) {
            console.error('Failed to update task via drag-and-drop:', error);
            enqueueSnackbar('Failed to update task. ' + (error.response?.data?.detail || error.message), { variant: 'error' });
            revert(); // Revert the event to its original position on failure
            // fetchManagerData(currentUser, selectedDate); // Already called in finally or here to revert UI state
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentView} onChange={handleViewChange} aria-label="dashboard view tabs">
                    <Tab label="Task List" value="list" />
                    <Tab label="Scheduler" value="scheduler" />
                </Tabs>
            </Box>

            {currentView === 'list' && (
                <Grid container spacing={3}>
                    {/* Date Picker and Create Task Button */}
                    <Grid xs={12} md={8} lg={9}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Select Date"
                                value={selectedDate}
                                onChange={(newValue) => {
                                    setSelectedDate(newValue || new Date());
                                }}
                                slots={{ textField: TextField }}
                                slotProps={{
                                    textField: {
                                        sx: { width: 'auto', mr: 2 },
                                    },
                                }}
                                enableAccessibleFieldDOMStructure={false} // Add this prop
                            />
                        </LocalizationProvider>
                        <Button variant="contained" onClick={handleOpenCreateTaskModal}>
                            Create New Task
                        </Button>
                    </Grid>

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
                                                    <TableCell>
                                                        {(() => {
                                                            const staffId = task.assigned_to_details?.id ?? null;
                                                            console.log(`[Task List Render] Attempting to call getStaffName for task ${task.id} with staffId: ${staffId}, Type: ${typeof staffId}`);
                                                            return getStaffName(staffId);
                                                        })()}
                                                    </TableCell>
                                                    <TableCell>{task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : 'N/A'}</TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="View Details">
                                                            <IconButton onClick={() => handleOpenDetailModal(task)} size="small">
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Assignment/Notes">
                                                            <IconButton onClick={() => handleOpenEditModal(task)} size="small">
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined" 
                                                            sx={{ mr: 1 }} 
                                                            onClick={() => handleMarkComplete(task.id)} 
                                                            disabled={task.status === 'completed'} // Disable if already completed
                                                        >
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
                </Grid>
            )}

            {currentView === 'scheduler' && (
                <TaskSchedulerCalendar 
                    tasks={departmentTasks}
                    staffUsers={staffUsers}
                    selectedDate={selectedDate} // Pass the selectedDate from ManagerDashboardPage
                    onEventDrop={handleEventDrop} // Pass the handler
                    // onEventClick={handleEventClick} // To be implemented in Phase 3
                />
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
                open={!!selectedTaskForDetail} // Controls modal visibility
                onClose={handleCloseDetailModal}
                task={selectedTaskForDetail}
                cleaningItems={cleaningItems} // Pass all cleaning items for potential lookup
                staffUsers={staffUsers} // Pass staffUsers
                getStaffName={getStaffName} // Pass the getStaffName function
            />
            <EditTaskAssignmentModal
                open={isEditModalOpen}
                onClose={handleCloseEditModal}
                task={selectedTaskForEdit}
                staffUsers={staffUsers}
                cleaningItems={cleaningItems} // Pass cleaningItems
                onTaskUpdated={handleTaskUpdated} // Pass callback to refresh data
            />
        </Container>
    );
}

export default ManagerDashboardPage;
