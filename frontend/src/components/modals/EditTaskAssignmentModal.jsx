import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    Typography,
    Box,
    Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { updateTaskInstance } from '../../services/taskService';
import { formatDate } from '../../utils/dateUtils'; // For displaying dates if needed

const EditTaskAssignmentModal = ({ 
    open, 
    onClose, 
    task, 
    resolvedCleaningItemName, 
    staffUsers, 
    cleaningItems, 
    onTaskUpdated 
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [notes, setNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [cleaningItemDetail, setCleaningItemDetail] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [editableDueDate, setEditableDueDate] = useState('');
    const [editableStartTime, setEditableStartTime] = useState('');
    const [editableEndTime, setEditableEndTime] = useState('');

    useEffect(() => {
        if (task) {
            setNotes(task.notes || '');
            setCurrentStatus(task.status || 'pending');

            setEditableDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
            setEditableStartTime(task.start_time ? task.start_time.substring(0, 5) : ''); 
            setEditableEndTime(task.end_time ? task.end_time.substring(0, 5) : '');     

            if (cleaningItems && (task.cleaning_item_id || task.cleaning_item)) {
                const itemId = task.cleaning_item_id || task.cleaning_item;
                const item = cleaningItems.find(ci => ci.id === itemId);
                setCleaningItemDetail(item || null);
            }
        } else {
            setNotes('');
            setCurrentStatus('pending');
            setCleaningItemDetail(null);
            setEditableDueDate('');
            setEditableStartTime('');
            setEditableEndTime('');
        }
    }, [task, cleaningItems]);

    const assignedUserName = useMemo(() => {
        if (!task) return 'N/A';
        if (task.assigned_to_details) {
            const staffUser = staffUsers.find(su => su.profile?.id === task.assigned_to_details.id);
            if (staffUser) return `${staffUser.first_name} ${staffUser.last_name}`.trim() || staffUser.username;
        }
        if (task.assigned_to && staffUsers) {
            const staffUser = staffUsers.find(su => su.profile?.id === task.assigned_to);
            if (staffUser) return `${staffUser.first_name} ${staffUser.last_name}`.trim() || staffUser.username;
        }
        return 'Unassigned';
    }, [task, staffUsers]);

    if (!task) {
        return null;
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

    const handleSave = async () => {
        setIsSaving(true);
        const updatedData = {
            notes: notes,
            due_date: editableDueDate || null, 
            start_time: editableStartTime ? `${editableStartTime}:00` : null, 
            end_time: editableEndTime ? `${editableEndTime}:00` : null,     
        };

        try {
            await updateTaskInstance(task.id, updatedData);
            enqueueSnackbar('Task updated successfully!', { variant: 'success' });
            if (onTaskUpdated) {
                onTaskUpdated();
            }
            onClose();
        } catch (error) {
            console.error('Failed to update task:', error);
            enqueueSnackbar(error.message || 'Failed to update task. Please try again.', { variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !isSaving && onClose()} maxWidth="sm" fullWidth>
            <DialogTitle>
                Edit Task: {resolvedCleaningItemName || 'Item Details'}
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ paddingTop: 1 }}>
                    <Grid container spacing={2.5}> 
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Cleaning Item:</Typography>
                            <Typography variant="body1" sx={{ minHeight: '24px' }}>{resolvedCleaningItemName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Assigned To:</Typography>
                            <Typography variant="body1" sx={{ minHeight: '24px' }}>{assignedUserName}</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Due Date"
                                type="date"
                                value={editableDueDate}
                                onChange={(e) => setEditableDueDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                margin="dense"
                                disabled={isSaving}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Start Time"
                                type="time"
                                value={editableStartTime}
                                onChange={(e) => setEditableStartTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                margin="dense"
                                disabled={isSaving}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="End Time"
                                type="time"
                                value={editableEndTime}
                                onChange={(e) => setEditableEndTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                margin="dense"
                                disabled={isSaving}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>Current Status:</Typography>
                            <Chip 
                                label={currentStatus ? currentStatus.replace(/_/g, ' ').toUpperCase() : 'N/A'} 
                                color={getStatusChipColor(currentStatus)} 
                                size="small" 
                            />
                        </Grid>
                        
                        {cleaningItemDetail && (
                            <Grid item xs={12} md={12}> 
                                <Typography variant="subtitle2" gutterBottom>Frequency:</Typography>
                                <Typography variant="body1">{cleaningItemDetail.frequency || 'N/A'}</Typography>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                margin="dense" 
                                label="Notes"
                                multiline
                                rows={3} 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                variant="outlined"
                                disabled={isSaving}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => !isSaving && onClose()} color="inherit" disabled={isSaving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditTaskAssignmentModal;
