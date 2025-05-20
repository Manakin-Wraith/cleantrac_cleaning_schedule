import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Box,
    Chip
} from '@mui/material';
import { formatDate } from '../../utils/dateUtils'; // Assuming you have a date formatter

const TaskDetailModal = ({ open, onClose, task, cleaningItems, getStaffName }) => {
    // Log the task's time properties as soon as the component receives props
    if (task) {
        console.log('[TaskDetailModal] Received task:', task.id, 'Start Time:', task.start_time, 'End Time:', task.end_time, 'Raw Task Object:', task);
    } else {
        console.log('[TaskDetailModal] Received null task prop.');
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Task Details - {task.cleaning_item_name || 'N/A'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Item Name:</Typography>
                        <Typography variant="body1">{task.cleaning_item_name || 'N/A'}</Typography>
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
                        <Chip label={task.status ? task.status.replace('_', ' ').toUpperCase() : 'N/A'} color={getStatusChipColor(task.status)} size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Due Date:</Typography>
                        <Typography variant="body1">{task.due_date ? formatDate(task.due_date) : 'N/A'}</Typography>
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