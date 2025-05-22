import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { createCleaningItem, updateCleaningItem } from '../../services/itemService';

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'as_needed'];

const ItemFormModal = ({ open, onClose, onSave, item, departmentId }) => {
    const [formData, setFormData] = useState({
        name: '',
        frequency: 'daily',
        equipment: '',
        chemical: '',
        method: '',
        department: departmentId || null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                frequency: item.frequency || 'daily',
                equipment: item.equipment || '',
                chemical: item.chemical || '',
                method: item.method || '',
                department: item.department || departmentId, // Ensure department is correctly passed from item or props
            });
        } else {
            // Reset for new item, ensuring departmentId is set
            setFormData({
                name: '',
                frequency: 'daily',
                equipment: '',
                chemical: '',
                method: '',
                department: departmentId,
            });
        }
    }, [item, departmentId, open]); // Rerun when open changes to reset/populate form

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.department) {
            enqueueSnackbar('Department ID is missing. Cannot save item.', { variant: 'error' });
            setIsSubmitting(false); // Ensure submission stops
            return;
        }
        setIsSubmitting(true);
        try {
            if (item && item.id) { // Editing existing item
                // For update, ensure department is part of the payload if your backend expects it
                // or remove it if it's immutable or derived on backend.
                // Assuming backend can handle 'department' field in update payload.
                await updateCleaningItem(item.id, formData);
                enqueueSnackbar('Item updated successfully!', { variant: 'success' });
            } else { // Creating new item
                await createCleaningItem(formData); // formData already includes department
                enqueueSnackbar('Item created successfully!', { variant: 'success' });
            }
            onSave(); // Callback to refresh list and close modal
        } catch (error) {
            console.error('Failed to save item:', error);
            const errorMessage = error.response?.data?.detail || (typeof error.response?.data === 'string' ? error.response.data : null) || error.message || 'Failed to save item.';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{item ? 'Edit Cleaning Item' : 'Add New Cleaning Item'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <DialogContentText sx={{mb: 2}}>
                        Please fill in the details for the cleaning item.
                        {item && ` (Editing: ${item.name})`}
                    </DialogContentText>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                autoFocus
                                margin="dense"
                                name="name"
                                label="Item Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="dense" variant="outlined" required>
                                <InputLabel id="frequency-label">Frequency</InputLabel>
                                <Select
                                    labelId="frequency-label"
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleChange}
                                    label="Frequency"
                                >
                                    {FREQUENCY_OPTIONS.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                name="equipment"
                                label="Equipment Required (optional)"
                                type="text"
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                value={formData.equipment}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                name="chemical"
                                label="Chemicals Required (optional)"
                                type="text"
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                value={formData.chemical}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                name="method"
                                label="Method / Procedure"
                                type="text"
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                value={formData.method}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{p: '16px 24px'}}>
                    <Button onClick={onClose} color="secondary" disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (item ? 'Save Changes' : 'Create Item')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ItemFormModal;
