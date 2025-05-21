import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Container, Typography, Box, Grid, Paper, CircularProgress, Button, Modal,
    TextField, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Chip, IconButton, Tooltip,
    Tabs, Tab 
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; 
import {
    AddCircleOutline, Visibility as VisibilityIcon, Edit as EditIcon, CheckCircle,
    RateReview as RateReviewIcon 
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
import EditTaskAssignmentModal from '../components/modals/EditTaskAssignmentModal'; 
import TaskSchedulerCalendar from '../components/calendar/TaskSchedulerCalendar'; 
import { Draggable } from '@fullcalendar/interaction'; 

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
    const theme = useTheme(); 

    // Selected date for filtering tasks
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Data for task management
    const [departmentTasks, setDepartmentTasks] = useState([]);
    const [cleaningItems, setCleaningItems] = useState([]);
    const [staffUsers, setStaffUsers] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [dataError, setDataError] = useState('');
    const [calendarResources, setCalendarResources] = useState([]); 

    // Modal and form state for creating tasks
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
    const [newTask, setNewTask] = useState({
        cleaning_item_id: '',
        assigned_to_id: '',
        due_date: getTodayDateString(selectedDate), 
        status: 'pending',
        department_id: '', 
        start_time: null, 
        end_time: null,   
        notes: '',        
    });

    // State for detail modal
    const [selectedTaskDetailData, setSelectedTaskDetailData] = useState({ task: null, resolvedItemName: '' });
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // State for edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [selectedTaskEditData, setSelectedTaskEditData] = useState({ task: null, resolvedItemName: '' });

    // State for view toggle (list vs scheduler)
    const [currentView, setCurrentView] = useState('scheduler'); 

    const externalEventsRef = useRef(null); 

    // Function to determine row style based on task status
    const getRowStyle = (taskStatus) => {
        if (taskStatus === 'completed') {
            return { backgroundColor: theme.palette.success.light + '33', opacity: 0.7 }; // Light green with opacity
        }
        if (taskStatus === 'pending_review') {
            return { backgroundColor: theme.palette.info.light + '33' }; // Light blue/purple for pending review
        }
        if (taskStatus === 'missed') {
            return { backgroundColor: theme.palette.error.light + '33', textDecoration: 'line-through' }; 
        }
        if (taskStatus === 'requires_attention') {
            return { backgroundColor: theme.palette.warning.light + '33' }; 
        }
        return {}; // Default no style
    };

    // Helper function to get cleaning item name robustly
    const getResolvedCleaningItemName = (task) => {
        if (task.cleaning_item && typeof task.cleaning_item === 'object' && task.cleaning_item.name) {
            return task.cleaning_item.name;
        }
        // Fallback: task.cleaning_item might be an ID, or task.cleaning_item_id might exist directly on the task
        const itemIdToLookup = (typeof task.cleaning_item === 'number') 
            ? task.cleaning_item 
            : task.cleaning_item_id; // Assuming task.cleaning_item_id might exist if cleaning_item is not the ID itself
        
        if (itemIdToLookup) {
            const foundItem = cleaningItems.find(ci => ci.id === itemIdToLookup);
            if (foundItem && foundItem.name) {
                return foundItem.name;
            }
        }
        return null; // Return null if not found, let caller decide 'Unknown Item' or 'N/A'
    };

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
                due_date: formattedDate // Filter tasks by the selected date
            }; 

            const [tasksResponse, itemsResponse, usersResponse] = await Promise.all([
                getTaskInstances(tasksParams), 
                getCleaningItems(), 
                getUsers()
            ]);

            console.log('Fetched tasks for calendar/dashboard:', tasksResponse); 
            if (tasksResponse && tasksResponse.length > 0) {
                console.log('Inspecting first fetched task raw structure:', JSON.stringify(tasksResponse[0], null, 2));
            }

            const filteredStaff = usersResponse.filter(u => u.profile?.role === 'staff');
            console.log('Filtered staff users (for resources):', JSON.stringify(filteredStaff, null, 2));
            setStaffUsers(filteredStaff);
            setDepartmentTasks(tasksResponse); 
            console.log('[ManagerDashboardPage] departmentTasks set in fetchManagerData:', JSON.stringify(tasksResponse, null, 2)); 
            setCleaningItems(itemsResponse); 

        } catch (err) {
            console.error("Failed to load manager dashboard data:", err);
            setDataError(err.message || 'Failed to load department data.');
            enqueueSnackbar(err.message || 'Failed to load department data.', { variant: 'error' });
        } finally {
            setLoadingData(false);
        }
    }, [enqueueSnackbar]); 

    // Effect to load the current user ONCE on component mount
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                setLoadingUser(true);
                setError('');
                const currentUserData = await getCurrentUser();
                setUser(currentUserData);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError('Failed to load user data. Please try refreshing.');
                enqueueSnackbar('Failed to load user data.', { variant: 'error' });
                setUser(null); // Ensure user is null on error
            } finally {
                setLoadingUser(false); // Ensure loading is always set to false
            }
        };
        loadCurrentUser();
    }, [enqueueSnackbar]); // Added enqueueSnackbar as it's used in catch

    // Effect to fetch manager-specific data once the user is loaded or selectedDate changes
    useEffect(() => {
        if (user && user.profile && user.profile.department_id) {
            fetchManagerData(user, selectedDate);
        } else if (!loadingUser && !user) {
            // If user loading is finished and there's no user, set an error or clear data
            setDataError('User not found. Cannot load department data.');
            setDepartmentTasks([]);
            setCleaningItems([]);
            setStaffUsers([]);
        }
        // This effect depends on 'user', 'selectedDate', and 'fetchManagerData'.
    }, [user, selectedDate, fetchManagerData, loadingUser]);

    // Effect to transform staffUsers to calendar resources format
    useEffect(() => {
        if (staffUsers && staffUsers.length > 0) {
            const resources = staffUsers.map(staff => ({
                id: staff.profile.id.toString(), // Ensure ID is a string for FullCalendar
                title: staff.first_name || staff.username
            }));
            setCalendarResources(resources);
            console.log('Calendar resources:', JSON.stringify(resources, null, 2));
        } else {
            setCalendarResources([]); // Clear resources if no staff users
        }
    }, [staffUsers]);

    // Effect to initialize draggable cleaning items
    useEffect(() => {
        let draggable = null;
        if (externalEventsRef.current && cleaningItems.length > 0 && currentView === 'scheduler') {
            draggable = new Draggable(externalEventsRef.current, {
                itemSelector: '.draggable-cleaning-item',
                eventData: function(eventEl) {
                    const eventDataString = eventEl.getAttribute('data-event');
                    if (eventDataString) {
                        try {
                            const parsedData = JSON.parse(eventDataString);
                            return {
                                title: parsedData.title,
                                duration: parsedData.duration || '01:00', 
                                extendedProps: { 
                                    cleaning_item_id: parsedData.cleaning_item_id,
                                    isExternal: true 
                                },
                            };
                        } catch (e) {
                            console.error("Failed to parse event data from draggable item:", e);
                            return {};
                        }
                    }
                    return {}; 
                }
            });
        }
        return () => {
            if (draggable) {
                draggable.destroy();
            }
        };
    }, [cleaningItems, currentView]);

    const getItemName = useCallback((itemId) => {
        const item = cleaningItems.find(ci => ci.id === itemId);
        return item ? item.name : 'Unknown Item';
    }, [cleaningItems]);

    const getStaffName = useCallback((staffProfileId) => {
        console.log('[getStaffName] Received staffProfileId:', staffProfileId, 'Type:', typeof staffProfileId);
        if (!staffProfileId) {
            console.log('[getStaffName] staffProfileId is null/undefined, returning Unassigned');
            return 'Unassigned';
        }
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
            case 'pending_review': return 'info'; // Color for pending_review
            default: return 'default';
        }
    };

    const handleNewTaskChange = (event) => {
        const { name, value } = event.target;
        let processedValue = value;

        // Parse IDs to integers if a value is selected, otherwise keep as empty string for form state
        if (name === 'cleaning_item_id' || name === 'assigned_to_id' || name === 'department_id') {
            processedValue = value === '' ? '' : parseInt(value, 10);
        } else if ((name === 'start_time' || name === 'end_time') && value === '') {
            // Convert time values to null if empty for backend, otherwise keep as string for TimePicker
            processedValue = null;
        }

        setNewTask(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleCreateTaskSubmit = async (event) => {
        event.preventDefault();

        const currentDepartmentId = newTask.department_id || user?.profile?.department_id;

        // Prepare the payload, renaming cleaning_item_id and ensuring IDs are correctly formatted
        const payload = {
            ...newTask,
            cleaning_item_id_write: newTask.cleaning_item_id, // Rename
            department_id: typeof currentDepartmentId === 'string' && currentDepartmentId !== '' ? parseInt(currentDepartmentId, 10) : currentDepartmentId,
            assigned_to_id: newTask.assigned_to_id === '' || isNaN(newTask.assigned_to_id) ? null : newTask.assigned_to_id, // Convert '' or NaN to null
        };
        delete payload.cleaning_item_id; // Remove the original key after using its value for cleaning_item_id_write

        // Validation for required fields
        if (payload.cleaning_item_id_write === '' || payload.cleaning_item_id_write === null || isNaN(payload.cleaning_item_id_write)) {
            enqueueSnackbar('Cleaning item is required.', { variant: 'warning' });
            return;
        }
        if (payload.department_id === '' || payload.department_id === null || isNaN(payload.department_id)) {
            enqueueSnackbar('Department is required.', { variant: 'warning' });
            return;
        }
        if (!payload.due_date || !payload.status) {
            enqueueSnackbar('Due date and status are required.', { variant: 'warning' });
            return;
        }
        
        // Remove time fields if they are null (already handled by processedValue in handleNewTaskChange)
        if (payload.start_time === null) delete payload.start_time;
        if (payload.end_time === null) delete payload.end_time;

        console.log('Submitting new task with payload:', payload); 

        try {
            await createTaskInstance(payload);
            enqueueSnackbar('Task created successfully!', { variant: 'success' });
            handleCloseCreateTaskModal();
            if(user) fetchManagerData(user, selectedDate); // Refresh data
        } catch (err) {
            console.error("Failed to create task:", err); 
            enqueueSnackbar(err.message || 'Failed to create task. Check console for details.', { variant: 'error' });
        }
    };

    const handleOpenCreateTaskModal = () => {
        setNewTask({
            cleaning_item_id: '',
            assigned_to_id: '',
            due_date: getTodayDateString(selectedDate), 
            status: 'pending',
            department_id: user?.profile?.department_id || '', 
            start_time: null, 
            end_time: null,   
            notes: '',        
        });
        setIsCreateModalOpen(true);
    }

    const handleCloseCreateTaskModal = () => {
        setIsCreateModalOpen(false);
    }

    const handleOpenDetailModal = (task) => {
        console.log('[ManagerDashboardPage] handleOpenDetailModal called with task:', JSON.stringify(task, null, 2));
        if (task && Object.keys(task).length > 0) {
            const resolvedName = getResolvedCleaningItemName(task);
            setSelectedTaskDetailData({ task: task, resolvedItemName: resolvedName });
            setIsDetailModalOpen(true);
            console.log('[ManagerDashboardPage] TaskDetailModal will open. selectedTaskForDetail set, isDetailModalOpen set to true.');
        } else {
            console.warn('[ManagerDashboardPage] handleOpenDetailModal: Attempted to open with null, undefined, or empty task. Modal will not open or will be forced closed.');
            setSelectedTaskDetailData({ task: null, resolvedItemName: '' }); // Ensure it's explicitly null
            setIsDetailModalOpen(false); // Ensure modal isn't told to open or stays open
        }
    };

    const handleOpenEditModal = (task) => {
        const resolvedName = getResolvedCleaningItemName(task);
        setSelectedTaskEditData({ task: task, resolvedItemName: resolvedName });
        setIsEditModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        console.log('[ManagerDashboardPage] handleCloseDetailModal called.');
        setIsDetailModalOpen(false);
        // It's good practice to clear the selected task when the modal is explicitly closed.
        setSelectedTaskDetailData({ task: null, resolvedItemName: '' });
        console.log('[ManagerDashboardPage] TaskDetailModal closed. isDetailModalOpen set to false, selectedTaskForDetail set to null.');
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedTaskEditData({ task: null, resolvedItemName: '' });
    };

    const handleTaskUpdated = () => {
        fetchManagerData(user, selectedDate); 
    };

    const handleMarkComplete = async (taskId) => {
        try {
            await markTaskAsComplete(taskId);
            enqueueSnackbar('Task marked as complete!', { variant: 'success' });
            fetchManagerData(user, selectedDate); 
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
        
        const newDueDate = getTodayDateString(event.start); 
        const oldDueDate = oldEvent ? getTodayDateString(oldEvent.start) : null; 

        if (newDueDate && oldDueDate && newDueDate !== oldDueDate) {
            updatedFields.due_date = newDueDate;
            changeDescription.push(`date to ${newDueDate}`);
        }

        const newResourceId = event.getResources()?.[0]?.id; 
        const oldResourceId = oldEvent ? oldEvent.getResources()?.[0]?.id : null; 

        if (newResourceId !== oldResourceId) {
            updatedFields.assigned_to_id = newResourceId ? parseInt(newResourceId, 10) : null;
            const newAssigneeName = newResourceId ? staffUsers.find(s => s.profile?.id.toString() === newResourceId)?.username : 'Unassigned'; 
            changeDescription.push(`assignee to ${newAssigneeName}`);
        }

        if (view.type.includes('TimeGrid')) { 
            const newStartTime = formatTime(event.start);
            const oldStartTime = oldEvent ? formatTime(oldEvent.start) : null;
            if (newStartTime !== oldStartTime) {
                updatedFields.start_time = newStartTime;
                changeDescription.push(`start time to ${newStartTime}`);
            }

            if (event.end) { 
                const newEndTime = formatTime(event.end);
                const oldEndTime = (oldEvent && oldEvent.end) ? formatTime(oldEvent.end) : null;
                if (newEndTime !== oldEndTime) {
                    updatedFields.end_time = newEndTime;
                    changeDescription.push(`end time to ${newEndTime}`);
                }
            } else { 
                const oldEndTime = (oldEvent && oldEvent.end) ? formatTime(oldEvent.end) : null;
                if (oldEndTime !== null) { 
                    updatedFields.end_time = null;
                    changeDescription.push('end time removed');
                }
            }
        } else { 
            const newEndDate = event.end ? getTodayDateString(new Date(event.end.getTime() - 1)) : newDueDate; 
            const oldEndDate = oldEvent && oldEvent.end ? getTodayDateString(new Date(oldEvent.end.getTime() - 1)) : oldDueDate;
            if (newEndDate !== oldEndDate) {
                changeDescription.push(`all-day event duration changed to end on ${newEndDate}`);
                if (!updatedFields.due_date) updatedFields.due_date = newDueDate; 
            }
        }

        if (Object.keys(updatedFields).length === 0) {
            console.log('No significant change detected in date, assignee, or time during drop.');
            return; 
        }

        console.log(`Attempting to update task ${taskId} with:`, updatedFields, "Description:", changeDescription.join(', '));

        try {
            await updateTaskInstance(taskId, updatedFields);
            enqueueSnackbar(`Task ${event.title || taskId} updated: ${changeDescription.join(', ')}`, { variant: 'success' });
            fetchManagerData(user, selectedDate); 
        } catch (error) {
            console.error('Failed to update task on drop:', error);
            enqueueSnackbar(`Failed to update task ${event.title || taskId}: ${error.message || 'Unknown error'}`, { variant: 'error' });
            revert(); 
        }
    };

    const handleEventResize = async (info) => {
        const { event, oldEvent, revert, view } = info;
        const taskId = event.id;
        let updatedFields = {};
        const changeDescription = [];
        
        const newDueDate = getTodayDateString(event.start); 
        const oldDueDate = oldEvent ? getTodayDateString(oldEvent.start) : null; 

        if (newDueDate !== oldDueDate) {
            updatedFields.due_date = newDueDate;
            changeDescription.push(`date to ${newDueDate}`);
        }

        if (view.type.includes('TimeGrid')) { 
            const newStartTime = formatTime(event.start);
            const oldStartTime = oldEvent ? formatTime(oldEvent.start) : null;
            if (newStartTime !== oldStartTime) {
                updatedFields.start_time = newStartTime;
                changeDescription.push(`start time to ${newStartTime}`);
            }

            if (event.end) { 
                const newEndTime = formatTime(event.end);
                const oldEndTime = (oldEvent && oldEvent.end) ? formatTime(oldEvent.end) : null;
                if (newEndTime !== oldEndTime) {
                    updatedFields.end_time = newEndTime;
                    changeDescription.push(`end time to ${newEndTime}`);
                }
            } else { 
                const oldEndTime = (oldEvent && oldEvent.end) ? formatTime(oldEvent.end) : null;
                if (oldEndTime !== null) { 
                    updatedFields.end_time = null;
                    changeDescription.push('end time removed');
                }
            }
        } else { 
            const newEndDate = event.end ? getTodayDateString(new Date(event.end.getTime() - 1)) : newDueDate; 
            const oldEndDate = oldEvent && oldEvent.end ? getTodayDateString(new Date(oldEvent.end.getTime() - 1)) : oldDueDate;
            if (newEndDate !== oldEndDate) {
                changeDescription.push(`all-day event duration changed to end on ${newEndDate}`);
                if (!updatedFields.due_date) updatedFields.due_date = newDueDate; 
            }
        }

        if (Object.keys(updatedFields).length === 0) {
            console.log('No significant change detected in resize.');
            return;
        }

        console.log(`Attempting to update task ${taskId} (resize) with:`, updatedFields, "Description:", changeDescription.join(', '));

        try {
            await updateTaskInstance(taskId, updatedFields);
            enqueueSnackbar(`Task ${event.title || taskId} duration updated: ${changeDescription.join(', ')}`, { variant: 'success' });
            fetchManagerData(user, selectedDate); 
        } catch (error) {
            console.error('Failed to update task on resize:', error);
            enqueueSnackbar(`Failed to update task ${event.title || taskId} duration: ${error.message || 'Unknown error'}`, { variant: 'error' });
            revert();
        }
    };

    const handleEventClickCalendar = (clickInfo) => {
        const clickedEvent = clickInfo.event;
        console.log('Calendar event clicked:', clickedEvent, 'ID:', clickedEvent.id);

        // Prevent opening detail modal for external events (placeholders from drag-and-drop)
        if (clickedEvent.extendedProps && clickedEvent.extendedProps.isExternal) {
            console.log('Clicked event is an external placeholder. Detail modal will not open.');
            // Optionally, you could open the create modal if the item is a draggable one not yet saved.
            // For now, just preventing detail modal for these seems appropriate as create modal opens on drop.
            return;
        }

        // Attempt to find the full task object from the departmentTasks state
        // Assuming event.id from FullCalendar matches task.id from your backend/state
        const task = departmentTasks.find(t => String(t.id) === String(clickedEvent.id));

        if (task) {
            console.log('Found matching task in departmentTasks, opening detail modal for:', task);
            handleOpenDetailModal(task);
        } else {
            console.warn(`Task with ID ${clickedEvent.id} not found in departmentTasks. Detail modal will not open. Clicked event details:`, clickedEvent);
            // Fallback or error message if needed
            // For instance, if it's an event that should have a task but doesn't, it might indicate a sync issue.
            // Sometimes, extendedProps might contain enough data for a minimal display, but it's better to use the full task object.
            // const taskData = clickedEvent.extendedProps;
            // handleOpenDetailModal(taskData); // This was the old behavior, prone to issues
        }
    };

    const handleEventReceive = (dropInfo) => {
        console.log('External event received (raw dropInfo):', dropInfo); 
        const newCalendarEvent = dropInfo.event; // This is the event instance created by FullCalendar

        console.log('New Calendar Event object (dropInfo.event):', newCalendarEvent);
        if (newCalendarEvent && newCalendarEvent.extendedProps) {
            console.log('Extended props from newCalendarEvent (dropInfo.event.extendedProps):', newCalendarEvent.extendedProps);
        }
        // Log original dragged element's properties if available for debugging
        if (dropInfo.draggedEl && dropInfo.draggedEl.fcSeg && dropInfo.draggedEl.fcSeg.eventRange && dropInfo.draggedEl.fcSeg.eventRange.def) {
            console.log('Original external event definition (from draggedEl):', dropInfo.draggedEl.fcSeg.eventRange.def);
        }

        const droppedDate = newCalendarEvent ? newCalendarEvent.start : null; // Date/time where the event was dropped
        const calendarResources = newCalendarEvent ? newCalendarEvent.getResources() : []; // Array of resource objects
        const primaryResource = calendarResources && calendarResources.length > 0 ? calendarResources[0] : null;

        console.log('Dropped Date from newCalendarEvent.start:', droppedDate, '(type:', typeof droppedDate, ', isDate:', droppedDate instanceof Date, ')');
        console.log('Primary Resource from newCalendarEvent.getResources():', primaryResource ? `ID: ${primaryResource.id}, Title: ${primaryResource.title}` : primaryResource);

        const cleaningItemId = newCalendarEvent && newCalendarEvent.extendedProps ? newCalendarEvent.extendedProps.cleaning_item_id : '';
        const assigneeId = primaryResource ? primaryResource.id : ''; 
        
        const dueDateStr = getTodayDateString(droppedDate); 
        const startTimeStr = formatTime(droppedDate);       

        let endTimeStr = null;
        if (newCalendarEvent && newCalendarEvent.end) { 
            endTimeStr = formatTime(newCalendarEvent.end);
        } else if (newCalendarEvent && newCalendarEvent.extendedProps && newCalendarEvent.extendedProps.duration) { 
            if (droppedDate && startTimeStr) { 
                 const startDateObj = new Date(`${dueDateStr}T${startTimeStr}`);
                 if (typeof newCalendarEvent.extendedProps.duration === 'string') {
                    const parts = newCalendarEvent.extendedProps.duration.split(':');
                    if (parts.length >= 2) {
                        const hours = parseInt(parts[0], 10);
                        const minutes = parseInt(parts[1], 10);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            const durationMs = (hours * 60 + minutes) * 60000;
                            const endDateObj = new Date(startDateObj.getTime() + durationMs);
                            endTimeStr = formatTime(endDateObj);
                        } else {
                             console.warn('Could not parse duration from extendedProps:', newCalendarEvent.extendedProps.duration);
                        }
                    } else {
                        console.warn('Duration format in extendedProps is not HH:MM:', newCalendarEvent.extendedProps.duration);
                    }
                 } else {
                    console.warn('extendedProps.duration is not a string:', newCalendarEvent.extendedProps.duration);
                 }
            } else {
                console.warn('Cannot calculate end time because droppedDate or startTimeStr is invalid.');
            }
        }
        
        console.log(`Preparing to open CreateNewTaskModal with: cleaning_item_id=${cleaningItemId}, assigned_to_id=${assigneeId}, due_date=${dueDateStr}, start_time=${startTimeStr}, end_time=${endTimeStr}`);
        console.log(`Actual values being set to newTask: cleaning_item_id=${cleaningItemId}, assigned_to_id=${assigneeId}, due_date=${dueDateStr}, start_time=${startTimeStr}, end_time=${endTimeStr}`);

        setNewTask(prev => ({
            ...prev,
            cleaning_item_id: cleaningItemId,
            assigned_to_id: assigneeId,
            due_date: dueDateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            status: 'pending',
            department_id: user?.profile?.department_id || '', // Ensure department_id is set
            notes: '', // Re-added notes initialization
        }));

        setIsCreateModalOpen(true);
        newCalendarEvent.remove(); 
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

                {currentView === 'scheduler' && (
                    <>
                        {cleaningItems.length > 0 && (
                            <Paper elevation={3} sx={{ mb: 2 }}>
                                <Box id="external-events" ref={externalEventsRef} sx={{ p: 2, border: '1px dashed grey', maxHeight: '200px', overflowY: 'auto', userSelect: 'none' }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Available Tasks (Drag to Schedule)
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {cleaningItems.map(item => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                                                <Box
                                                    className="draggable-cleaning-item"
                                                    sx={{
                                                        p: 1,
                                                        backgroundColor: theme.palette.info.light, 
                                                        color: theme.palette.info.contrastText,
                                                        borderRadius: 1,
                                                        cursor: 'grab',
                                                        textAlign: 'center',
                                                        fontSize: '0.875rem',
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.info.main,
                                                        }
                                                    }}
                                                    data-event={JSON.stringify({
                                                        title: item.name,
                                                        cleaning_item_id: item.id,
                                                        duration: item.default_duration || "01:00" 
                                                    })}
                                                >
                                                    {item.name}
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </Paper>
                        )}
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <TaskSchedulerCalendar 
                                events={departmentTasks.map(task => {
                                    const resolvedItemName = getResolvedCleaningItemName(task);
                                    const title = resolvedItemName || 'Unknown Item';

                                    if (title === 'Unknown Item' && task.id) { // Log if name is missing
                                        if (task.cleaning_item && typeof task.cleaning_item === 'object') {
                                            console.warn(`[ManagerDashboardPage] Calendar Event (Task ID: ${task.id}): cleaning_item object found, but name is missing or falsy. Name resolved to: ${resolvedItemName}. cleaning_item content:`, JSON.stringify(task.cleaning_item));
                                        } else if (task.cleaning_item) {
                                            console.warn(`[ManagerDashboardPage] Calendar Event (Task ID: ${task.id}): cleaning_item is not an object or is unexpected. Name resolved to: ${resolvedItemName}. cleaning_item content:`, JSON.stringify(task.cleaning_item), `task.cleaning_item_id: ${task.cleaning_item_id}`);
                                        } else {
                                            console.warn(`[ManagerDashboardPage] Calendar Event (Task ID: ${task.id}): cleaning_item is null or undefined. Name resolved to: ${resolvedItemName}. task.cleaning_item_id: ${task.cleaning_item_id}`);
                                        }
                                    }
                                    return {
                                        id: task.id.toString(),
                                        title: title, 
                                        start: task.due_date + (task.start_time ? `T${task.start_time}` : ''),
                                        end: task.due_date + (task.end_time ? `T${task.end_time}` : ''),
                                        allDay: !task.start_time,
                                        resourceId: task.assigned_to ? task.assigned_to.toString() : undefined, 
                                        extendedProps: {
                                            ...task,
                                            itemName: resolvedItemName || 'Unknown Item', 
                                            staffName: task.assigned_to_details ? (staffUsers.find(su => su.profile.id === task.assigned_to)?.username || 'Unassigned') : 'Unassigned',
                                            status: task.status,
                                            departmentId: task.department_id, 
                                            notes: task.notes,
                                        },
                                        className: `task-status-${task.status?.toLowerCase()}`,
                                        borderColor: theme.palette[getStatusColor(task.status)]?.dark || theme.palette.grey[500],
                                        backgroundColor: theme.palette[getStatusColor(task.status)]?.main || theme.palette.grey[300],
                                        textColor: theme.palette[getStatusColor(task.status)]?.contrastText || theme.palette.text.primary
                                    };
                                })}
                                onEventClick={handleEventClickCalendar}
                                onEventDrop={handleEventDrop}
                                onEventResize={handleEventResize} 
                                currentDate={selectedDate} 
                                onDateChange={(newDate) => setSelectedDate(newDate)} 
                                resources={calendarResources} 
                                onEventReceive={handleEventReceive} 
                            />
                        </Paper>
                    </>
                )}

                {currentView === 'list' && (
                    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom component="div">
                            Task List for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'}
                        </Typography>
                        {loadingData && <CircularProgress />}
                        {!loadingData && departmentTasks.length === 0 && (
                            <Typography>No tasks scheduled for this day.</Typography>
                        )}
                        {!loadingData && departmentTasks.length > 0 && (
                            <TableContainer>
                                <Table stickyHeader aria-label="department tasks table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Cleaning Item</TableCell>
                                            <TableCell>Assigned To</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Start Time</TableCell>
                                            <TableCell>End Time</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {departmentTasks.map((task) => (
                                            <TableRow key={task.id} sx={getRowStyle(task.status)}>
                                                <TableCell>{getResolvedCleaningItemName(task) || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {task.assigned_to_details 
                                                        ? `${task.assigned_to_details.first_name || ''} ${task.assigned_to_details.last_name || ''}`.trim() || task.assigned_to_details.username 
                                                        : 'Unassigned'}
                                                </TableCell>
                                                <TableCell>{task.due_date}</TableCell>
                                                <TableCell>{task.start_time ? task.start_time.substring(0,5) : 'N/A'}</TableCell>
                                                <TableCell>{task.end_time ? task.end_time.substring(0,5) : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={task.status.replace('_', ' ')}
                                                        color={
                                                            task.status === 'pending' ? 'warning' :
                                                            task.status === 'in_progress' ? 'secondary' :
                                                            task.status === 'completed' ? 'success' :
                                                            task.status === 'pending_review' ? 'info' : // Color for pending_review
                                                            task.status === 'missed' ? 'error' :
                                                            task.status === 'requires_attention' ? 'warning' : // Can be same as pending or different
                                                            'default'
                                                        }
                                                        size="small"
                                                        icon={task.status === 'pending_review' ? <RateReviewIcon fontSize="small" /> : null}
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View Details">
                                                        <IconButton size="small" onClick={() => handleOpenDetailModal(task)}>
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Task">
                                                        <IconButton size="small" onClick={() => handleOpenEditModal(task)} disabled={task.status === 'completed'}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Mark Complete">
                                                        <span> {/* Span for Tooltip when button is disabled */} 
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleMarkComplete(task.id)}
                                                                disabled={task.status === 'completed'} // Disabled if already completed
                                                                color={task.status === 'pending_review' ? "info" : "default"} // Highlight if pending review
                                                            >
                                                                <CheckCircle />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                )}

                <Modal
                    open={isCreateModalOpen}
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
                    task={selectedTaskDetailData.task}
                    resolvedCleaningItemName={selectedTaskDetailData.resolvedItemName}
                    cleaningItems={cleaningItems} 
                    staffUsers={staffUsers} 
                    getStaffName={getStaffName} 
                />
                <EditTaskAssignmentModal
                    open={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    task={selectedTaskEditData.task}
                    resolvedCleaningItemName={selectedTaskEditData.resolvedItemName}
                    staffUsers={staffUsers}
                    cleaningItems={cleaningItems} 
                    onTaskUpdated={handleTaskUpdated} 
                />
            </Container>
        </LocalizationProvider>
    );
}

export default ManagerDashboardPage;
