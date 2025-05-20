import React, { useState, useEffect } from 'react';
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

const EditTaskAssignmentModal = ({ open, onClose, task, staffUsers, cleaningItems, onTaskUpdated }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [assignedTo, setAssignedTo] = useState('');
    const [notes, setNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [cleaningItemDetail, setCleaningItemDetail] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setAssignedTo(task.assigned_to || '');
            setNotes(task.notes || '');
            setCurrentStatus(task.status || 'pending');
            
            // Find the full cleaning item details for frequency
            if (cleaningItems && (task.cleaning_item_id || task.cleaning_item)) {
                const itemId = task.cleaning_item_id || task.cleaning_item;
                const item = cleaningItems.find(ci => ci.id === itemId);
                setCleaningItemDetail(item || null);
            }

        } else {
            setAssignedTo('');
            setNotes('');
            setCurrentStatus('pending');
            setCleaningItemDetail(null);
        }
    }, [task, cleaningItems]);

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
            assigned_to: assignedTo || null, 
            notes: notes,
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
            <DialogTitle>Edit Task: {task.cleaning_item_name || 'Task'}</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ paddingTop: 1 }}>
                    <Grid container spacing={2}> 
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Item Name:</Typography>
                            <Typography variant="body1">{task.cleaning_item_name}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Due Date:</Typography>
                            <Typography variant="body1">{task.due_date ? formatDate(task.due_date) : 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Current Status:</Typography>
                            <Chip 
                                label={currentStatus ? currentStatus.replace('_', ' ').toUpperCase() : 'N/A'} 
                                color={getStatusChipColor(currentStatus)} 
                                size="small" 
                            />
                        </Grid>
                        {cleaningItemDetail && (
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>Frequency:</Typography>
                                <Typography variant="body1">{cleaningItemDetail.frequency || 'N/A'}</Typography>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <FormControl fullWidth margin="dense"> 
                                <InputLabel id="assign-to-label">Assign To</InputLabel>
                                <Select
                                    labelId="assign-to-label"
                                    value={assignedTo}
                                    label="Assign To"
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    displayEmpty
                                    sx={{ minWidth: 200 }}
                                >
                                    <MenuItem value="">
                                        <em>Unassign</em>
                                    </MenuItem>
                                    {staffUsers.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name} ({user.username})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
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
