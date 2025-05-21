import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Box,
    Chip,
    IconButton,
    Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { formatDate } from '../../utils/dateUtils'; // Assuming you have a date formatter

const TaskDetailModal = ({ open, onClose, task, cleaningItems, getStaffName, resolvedCleaningItemName }) => {
    useEffect(() => {
        if (open) { // Only log if the modal is open
            if (task && Object.keys(task).length > 0) {
                console.log('[TaskDetailModal] useEffect triggered. Received task prop:', JSON.stringify(task, null, 2));
            } else if (task === null) {
                console.log('[TaskDetailModal] Received null task prop.');
            } else if (task === undefined) {
                console.log('[TaskDetailModal] Received undefined task prop.');
            } else if (typeof task === 'object' && Object.keys(task).length === 0) {
                console.log('[TaskDetailModal] Received empty task object.');
            } else {
                console.log('[TaskDetailModal] Received task prop with unexpected state:', task);
            }
        }
    }, [task, open]); // Add 'open' to dependency array

    // Log the task's time properties as soon as the component receives props
    if (task) {
        console.log('[TaskDetailModal] Received task:', task.id, 'Start Time:', task.start_time, 'End Time:', task.end_time, 'Raw Task Object:', task);
    } else if (open) { // Only log this path if task is null AND modal is open
        console.log('[TaskDetailModal] Received null task prop (render path check).');
    }

    if (!task && open) { // If modal is open but task is truly null/undefined, show loading or error
        console.warn("[TaskDetailModal] Render: Task prop is null or undefined but modal is open.");
    }

    if (!task) {
        return null;
    }

    // Find the full cleaning item details if an ID is available
    // Ensure task.cleaning_item exists and is the ID, not the full object yet
    const cleaningItemDetail = cleaningItems && task.cleaning_item_id 
        ? cleaningItems.find(item => item.id === task.cleaning_item_id) // Use task.cleaning_item_id if that's the foreign key field name
        : (task.cleaning_item && typeof task.cleaning_item === 'number' // Or if task.cleaning_item is the ID
            ? cleaningItems.find(item => item.id === task.cleaning_item)
            : null);

    // Helper function to create a Date object for time display
    // Assumes timeStr is "HH:MM:SS" and dateStr is an ISO string or can be used to get a date part.
    const createDisplayTime = (dateStr, timeStr) => {
        if (!timeStr) return null;
        let baseDate = new Date().toISOString().split('T')[0]; // Default to today's date part
        if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                baseDate = d.toISOString().split('T')[0];
            }
        }
        const dateTime = new Date(`${baseDate}T${timeStr}`);
        return isNaN(dateTime.getTime()) ? null : dateTime;
    };

    const formatTime = (dateObj) => {
        return dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
    };

    const startDateObj = createDisplayTime(task.due_date, task.start_time);
    const endDateObj = createDisplayTime(task.due_date, task.end_time);

    let timeSlotText = 'Time not set';
    if (startDateObj) {
        timeSlotText = formatTime(startDateObj);
        if (endDateObj) {
            timeSlotText += ` - ${formatTime(endDateObj)}`;
        }
    } else if (task.start_time) { // If start_time was present but resulted in invalid date
        timeSlotText = 'Invalid time format';
    }

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'missed': return 'error';
            default: return 'default';
        }
    };

    const theme = useTheme();

    // Helper to format date and time consistently
    const formatDateTime = (dateString, timeString) => {
        if (!dateString) return 'N/A';
        let datePart = format(parseISO(dateString), 'PPP'); // e.g., May 20, 2025
        if (timeString) {
            // Assuming timeString is 'HH:MM:SS' or 'HH:MM'
            const [hours, minutes] = timeString.split(':');
            // Create a date object just to format time part, date itself is from dateString
            const timeDate = new Date();
            timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            return `${datePart} at ${format(timeDate, 'p')}`; // e.g., May 20, 2025 at 8:00 AM
        }
        return datePart; // Just date if no time
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle id="task-detail-modal-title">
                Task Details - {resolvedCleaningItemName || 'Details'}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: theme.spacing(1),
                        top: theme.spacing(1),
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Cleaning Item:</Typography>
                        <Typography variant="body1">{resolvedCleaningItemName || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Assigned To:</Typography>
                        <Typography variant="body1">
                            {task.assigned_to_details?.id && getStaffName 
                                ? getStaffName(task.assigned_to_details.id) 
                                : 'Unassigned'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Status:</Typography>
                        <Chip 
                            label={task.status ? task.status.replace(/_/g, ' ') : 'N/A'}
                            color={getStatusChipColor(task.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Due Date:</Typography>
                        <Typography variant="body1">{task.due_date ? format(parseISO(task.due_date), 'PPP') : 'N/A'}</Typography>
                    </Grid>
                    
                    {/* Add Timeslot display */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Time Slot:</Typography>
                        <Typography variant="body1">
                            {timeSlotText}
                        </Typography>
                    </Grid>

                    {cleaningItemDetail && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>Frequency:</Typography>
                                <Typography variant="body1">{cleaningItemDetail.frequency || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>Equipment:</Typography>
                                <Typography variant="body1">{cleaningItemDetail.equipment_required || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>Chemical:</Typography>
                                <Typography variant="body1">{cleaningItemDetail.chemical_required || 'N/A'}</Typography>
                            </Grid>
                             <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>Method Statement:</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {cleaningItemDetail.method_statement_link ? 
                                        <a href={cleaningItemDetail.method_statement_link} target="_blank" rel="noopener noreferrer">View Method</a> 
                                        : 'N/A'}
                                </Typography>
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{task.notes || 'No notes provided.'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Created At:</Typography>
                        <Typography variant="body1">{task.created_at ? formatDate(task.created_at, true) : 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Last Updated:</Typography>
                        <Typography variant="body1">{task.updated_at ? formatDate(task.updated_at, true) : 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Task ID:</Typography>
                        <Typography variant="body1">{task.id || 'N/A'}</Typography>
                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDetailModal;