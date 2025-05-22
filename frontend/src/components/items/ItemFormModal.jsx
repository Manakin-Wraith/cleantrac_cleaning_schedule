import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
    TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, CircularProgress,
    InputAdornment, Divider, Paper, Typography, Box, Chip, OutlinedInput, 
    Checkbox, ListItemText  
} from '@mui/material';
import {
    DriveFileRenameOutline as DriveFileRenameOutlineIcon,
    Build as BuildIcon,
    Science as ScienceIcon,
    ListAlt as ListAltIcon,
    EventRepeat as EventRepeatIcon,
    Group as GroupIcon 
} from '@mui/icons-material'; 
import { useSnackbar } from 'notistack';
import { createCleaningItem, updateCleaningItem } from '../../services/itemService';
import { getUsersByDepartment } from '../../services/userService'; 

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'as_needed'];
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const ItemFormModal = ({ open, onClose, onSave, item, departmentId }) => {
    const [formData, setFormData] = useState({
        name: '',
        frequency: 'daily',
        equipment: '',
        chemical: '',
        method: '',
        department: departmentId || null,
        default_assigned_staff: [], 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departmentStaff, setDepartmentStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchStaff = async () => {
            if (departmentId && open) {
                setLoadingStaff(true);
                try {
                    const staff = await getUsersByDepartment(departmentId, { role: 'staff' }); 
                    setDepartmentStaff(staff || []);
                } catch (error) {
                    console.error('Failed to fetch department staff:', error);
                    enqueueSnackbar('Failed to load staff for selection.', { variant: 'warning' });
                    setDepartmentStaff([]);
                } finally {
                    setLoadingStaff(false);
                }
            }
        };

        fetchStaff();

        if (item) {
            setFormData({
                name: item.name || '',
                frequency: item.frequency || 'daily',
                equipment: item.equipment || '',
                chemical: item.chemical || '',
                method: item.method || '',
                department: item.department || departmentId,
                default_assigned_staff: item.default_assigned_staff || [], 
            });
        } else {
            setFormData(prev => ({ 
                ...prev,
                name: '',
                frequency: 'daily',
                equipment: '',
                chemical: '',
                method: '',
                department: departmentId || prev.department, 
                default_assigned_staff: [],
            }));
        }
    }, [item, departmentId, open, enqueueSnackbar]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'default_assigned_staff') {
            setFormData(prev => ({ 
                ...prev, 
                [name]: typeof value === 'string' ? value.split(',') : value, 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDeleteStaffChip = (staffIdToRemove) => {
        setFormData(prev => ({
            ...prev,
            default_assigned_staff: prev.default_assigned_staff.filter(id => id !== staffIdToRemove),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.department) {
            enqueueSnackbar('Department ID is missing. Cannot save item.', { variant: 'error' });
            setIsSubmitting(false);
            return;
        }
        setIsSubmitting(true);

        // Prepare the payload for the backend
        const submissionPayload = {
            ...formData,
            department_id: formData.department, // Rename department to department_id
        };
        delete submissionPayload.department; // Remove the old 'department' key

        try {
            if (item && item.id) {
                await updateCleaningItem(item.id, submissionPayload);
                enqueueSnackbar('Item updated successfully!', { variant: 'success' });
            } else { 
                await createCleaningItem(submissionPayload);
                enqueueSnackbar('Item created successfully!', { variant: 'success' });
            }
            onSave(); 
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
            <DialogTitle sx={{ pb: 1 }}>{item ? 'Edit Cleaning Item' : 'Add New Cleaning Item'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{pt: 1}}>
                    <DialogContentText sx={{mb: 2}}>
                        Please fill in the details for the cleaning item.
                        {item && ` (Editing: ${item.name})`}
                    </DialogContentText>

                    {/* Section 1: Basic Information */}
                    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{mb: 2, fontSize: '1.1rem'}}>
                            Basic Information
                        </Typography>
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DriveFileRenameOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
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
                                        startAdornment={ 
                                            <InputAdornment position="start">
                                                <EventRepeatIcon color="action" />
                                            </InputAdornment>
                                        }
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
                                <FormControl fullWidth margin="dense" variant="outlined">
                                    <InputLabel id="default-staff-label">Default Assigned Staff (Optional)</InputLabel>
                                    <Select
                                        labelId="default-staff-label"
                                        name="default_assigned_staff"
                                        multiple
                                        value={formData.default_assigned_staff}
                                        onChange={handleChange}
                                        input={<OutlinedInput id="select-multiple-chip" label="Default Assigned Staff (Optional)" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((userId) => {
                                                    const staffMember = departmentStaff.find(s => s.id === userId);
                                                    return (
                                                        <Chip 
                                                            key={userId} 
                                                            label={staffMember ? `${staffMember.first_name} ${staffMember.last_name}`.trim() || staffMember.username : userId} 
                                                            size="small" 
                                                            onDelete={() => handleDeleteStaffChip(userId)}
                                                            onMouseDown={(event) => { // Prevent dropdown from opening when clicking chip's delete icon
                                                                event.stopPropagation();
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                        MenuProps={MenuProps}
                                        startAdornment={ 
                                            <InputAdornment position="start">
                                                <GroupIcon color="action" />
                                            </InputAdornment>
                                        }
                                        disabled={loadingStaff}
                                    >
                                        {loadingStaff ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
                                        ) : departmentStaff.length > 0 ? (
                                            departmentStaff.map((staff) => (
                                                <MenuItem key={staff.id} value={staff.id}>
                                                    <Checkbox checked={formData.default_assigned_staff.indexOf(staff.id) > -1} />
                                                    <ListItemText primary={`${staff.first_name} ${staff.last_name}`.trim() || staff.username} />
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No staff found for this department or role.</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Section 2: Resources */}
                    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{mb: 2, fontSize: '1.1rem'}}>
                            Resources
                        </Typography>
                        <Grid container spacing={2}>
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BuildIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ScienceIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Section 3: Procedure */}
                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}> 
                        <Typography variant="h6" gutterBottom sx={{mb: 2, fontSize: '1.1rem'}}>
                            Cleaning Procedure
                        </Typography>
                        <Grid container spacing={1}> 
                            <Grid item xs={12}>
                                <TextField
                                    margin="dense"
                                    name="method"
                                    label="Method / Procedure Steps"
                                    type="text"
                                    fullWidth
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    value={formData.method}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ListAltIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                </DialogContent>
                <Divider sx={{ mt: 0, mb:0 }} /> 
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
