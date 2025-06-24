import React, { useState, useEffect, useMemo } from 'react';
// DEBUG: confirm correct modal file is loaded
if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('%c[EditTaskAssignmentModal] module loaded', 'color: #4caf50');
}
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
import { getCleaningItems } from '../../services/cleaningItemService';
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
    // Local fallback list if parent did not pass cleaningItems
    const [localCleaningItems, setLocalCleaningItems] = useState([]);
    const effectiveCleaningItems = Array.isArray(cleaningItems) && cleaningItems.length > 0 ? cleaningItems : localCleaningItems;

    // Merge current value into options if missing (avoids out-of-range warning)
    const cleaningItemOptions = useMemo(() => {
        const idNum = editableCleaningItemId ? Number(editableCleaningItemId) : null;
        if (!idNum) return effectiveCleaningItems || [];
        const exists = effectiveCleaningItems?.some(ci => ci.id === idNum);
        if (exists) return effectiveCleaningItems;
        return [
            ...effectiveCleaningItems,
            { id: idNum, name: resolvedCleaningItemName || `Item ${idNum}` },
        ];
    }, [effectiveCleaningItems, editableCleaningItemId, resolvedCleaningItemName]);
    const [notes, setNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [cleaningItemDetail, setCleaningItemDetail] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [editableAssignedToId, setEditableAssignedToId] = useState('');
    const [editableCleaningItemId, setEditableCleaningItemId] = useState('');
    const [editableDueDate, setEditableDueDate] = useState('');
    const [editableStartTime, setEditableStartTime] = useState('');
    const [editableEndTime, setEditableEndTime] = useState('');

    // Fetch cleaning items for task's department if none provided
    useEffect(() => {
        if ((!cleaningItems || cleaningItems.length === 0) && task?.department_id) {
            getCleaningItems({ department_id: task.department_id })
                .then(setLocalCleaningItems)
                .catch(err => console.error('Failed to load cleaning items', err));
        }
    }, [cleaningItems, task?.department_id]);

    useEffect(() => {
        if (task) {
            setNotes(task.notes || '');
            setCurrentStatus(task.status || 'pending');

            setEditableDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
            setEditableStartTime(task.start_time ? task.start_time.substring(0, 5) : ''); 
            setEditableEndTime(task.end_time ? task.end_time.substring(0, 5) : '');     
            setEditableAssignedToId(task.assigned_to || task.assigned_to_id || '');
            setEditableCleaningItemId(String(task.cleaning_item_id || task.cleaning_item?.id || ''));
            if (!effectiveCleaningItems && (task.cleaning_item_id || task.cleaning_item)) {
                getCleaningItems({ department_id: task.department_id })
                    .then(data => {
                        const itemId = task.cleaning_item_id || task.cleaning_item;
                        const item = data.find(ci => ci.id === itemId);
                        setCleaningItemDetail(item || null);
                        setLocalCleaningItems(data);
                    })
                    .catch(err => console.error('Failed to load cleaning items', err));
            } else if (effectiveCleaningItems && (task.cleaning_item_id || task.cleaning_item)) {
                const itemId = task.cleaning_item_id || task.cleaning_item;
                const item = effectiveCleaningItems.find(ci => ci.id === itemId);
                setCleaningItemDetail(item || null);
            }
        } else {
            setNotes('');
            setCurrentStatus('pending');
            setCleaningItemDetail(null);
            setEditableDueDate('');
            setEditableStartTime('');
            setEditableEndTime('');
            setEditableAssignedToId('');
            setEditableCleaningItemId('');        }
    }, [task, effectiveCleaningItems]);

    const assignedUserName = useMemo(() => {
        if (!task) return 'N/A';
        const staffArr = Array.isArray(staffUsers) ? staffUsers : [];

        if (task.assigned_to_details) {
            const staffUser = staffArr.find(su => su.profile?.id === task.assigned_to_details.id);
            if (staffUser) return `${staffUser.first_name} ${staffUser.last_name}`.trim() || staffUser.username;
        }
        if (task.assigned_to) {
            const staffUser = staffArr.find(su => su.profile?.id === task.assigned_to);
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
        // Debug
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[EditTask] save: assignedTo', editableAssignedToId, 'cleaningItem', editableCleaningItemId);
        }
        const toNullableNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
        const updatedData = {
            notes: notes,
            due_date: editableDueDate || null, 
            start_time: editableStartTime ? `${editableStartTime}:00` : null, 
            end_time: editableEndTime ? `${editableEndTime}:00` : null,
            assigned_to_id: toNullableNumber(editableAssignedToId),
            // Send cleaning_item_id_write directly to avoid client-side remapping issues
            cleaning_item_id_write:
                editableCleaningItemId !== ''
                    ? Number(editableCleaningItemId)
                    : task.cleaning_item_id
                        ? Number(task.cleaning_item_id)
                        : task.cleaning_item?.id
                            ? Number(task.cleaning_item.id)
                            : null,
        };
        // Remove keys with null to avoid unnecessary updates
        // Only strip keys that are strictly null (allow 0)
        Object.keys(updatedData).forEach((k)=>{ if(updatedData[k] === null) delete updatedData[k]; });
        try {
            // DEBUG: inspect exact payload sent to backend
console.log('[EditTask] updatedData payload', updatedData);
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
                            <FormControl fullWidth margin="dense" disabled={isSaving}>
                                <InputLabel id="edit-cleaning-item-label">Cleaning Item</InputLabel>
                                <Select
                                    displayEmpty
                                    renderValue={(value) => {
                                        if (value === '' || value === undefined) {
                                            return <em>Select item</em>;
                                        }
                                        const sel = cleaningItemOptions.find(ci => String(ci.id) === String(value));
                                        return sel ? sel.name : value;
                                    }}
                                    labelId="edit-cleaning-item-label"
                                    value={String(editableCleaningItemId)}
                                    label="Cleaning Item"
                                    onChange={(e) => {
                                        console.log('[EditTask] dropdown picked', e.target.value);
                                        setEditableCleaningItemId(e.target.value);
                                    }}
                                >
                                    {Array.isArray(cleaningItemOptions) && cleaningItemOptions.map(ci=> (
                                        <MenuItem key={ci.id} value={String(ci.id)}>{ci.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid> 
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
