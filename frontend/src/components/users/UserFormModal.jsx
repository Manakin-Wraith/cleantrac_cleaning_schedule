// frontend/src/components/users/UserFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
    Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { getDepartments } from '../../services/departmentService';
import { createUser, updateUser } from '../../services/userService'; // We will add these functions

const initialFormData = {
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '', 
    role: '', 
    department_id: '',
};

function UserFormModal({ open, onClose, onSave, user, currentUserRole }) {
    const [formData, setFormData] = useState(initialFormData);
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const { enqueueSnackbar } = useSnackbar();

    const isEditMode = Boolean(user && user.id);

    const fetchDepartmentsCallback = useCallback(async () => {
        setLoadingDepartments(true);
        try {
            const data = await getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
            enqueueSnackbar(error.message || 'Failed to fetch departments for user form', { variant: 'error' });
        } finally {
            setLoadingDepartments(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchDepartmentsCallback();
    }, [fetchDepartmentsCallback]);

    useEffect(() => {
        if (open) { // Reset form and errors when modal opens
            setErrors({});
            if (user) {
                setFormData({
                    username: user.username || '',
                    password: '', 
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    phone_number: user.profile?.phone_number || '', 
                    role: user.profile?.role || 'staff', // Default to staff if not set
                    department_id: user.profile?.department_id || user.profile?.department || '', 
                });
            } else {
                setFormData({...initialFormData, role: 'staff'}); // Default new users to staff
            }
        }
    }, [user, open]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null}));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "Username is required.";
        if (!isEditMode && !formData.password) newErrors.password = "Password is required for new users.";
        if (formData.password && formData.password.length < 8) newErrors.password = "Password must be at least 8 characters long.";
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = "Phone number is required.";
        } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone_number)) { 
            newErrors.phone_number = "Invalid phone number format (e.g., +1234567890).";
        }
        if (!formData.role) newErrors.role = "Role is required.";
        // Department is not strictly required for superuser, but manager might need to assign one.
        // Backend handles department assignment for manager creating user in their own dept.
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            enqueueSnackbar('Please correct the form errors.', { variant: 'warning'});
            return;
        }
        setIsSaving(true);

        const payload = { ...formData };
        if (isEditMode && !payload.password) { 
            delete payload.password;
        }
        if (payload.department_id === '') { // Ensure department_id is null if not selected
             payload.department_id = null;
        }

        try {
            let response;
            if (isEditMode) {
                response = await updateUser(user.id, payload);
            } else {
                response = await createUser(payload);
            }
            enqueueSnackbar(`User ${isEditMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
            onSave(response); 
            onClose();
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} user:`, error);
            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                const backendErrors = {};
                for (const key in errorData) {
                    if (Array.isArray(errorData[key])) {
                        // Prefer 'password' field for password errors for consistency
                        const fieldKey = key === 'new_password' || key === 'non_field_errors' ? 'password' : key;
                        backendErrors[fieldKey] = errorData[key].join(' ');
                    }
                }
                setErrors(prev => ({...prev, ...backendErrors}));
                 enqueueSnackbar( `Failed to ${isEditMode ? 'update' : 'create'} user. Please check errors.`, { variant: 'error'});
            } else {
                 enqueueSnackbar(error.message || `An unknown error occurred.`, { variant: 'error'});
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    // Determine if department field should be disabled
    // Superusers can choose any department. Managers creating users might be restricted by backend.
    // For simplicity, allow selection. Backend will enforce rules.
    const departmentDisabled = loadingDepartments; 
    // Role selection can be limited too, e.g. manager can't create superuser.
    // Assuming current roles 'staff', 'manager' are fine. 'admin' role from serializer is actually superuser.

    console.log('UserFormModal RENDER: isEditMode:', isEditMode, 'user prop:', user, 'formData:', formData);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ onExited: () => setFormData(initialFormData) }}>
            <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {errors.non_field_errors && <Typography color="error" gutterBottom>{errors.non_field_errors}</Typography>}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="username"
                                label="Username"
                                value={formData.username}
                                onChange={handleChange}
                                fullWidth
                                required
                                margin="dense"
                                disabled={isEditMode}
                                InputProps={{ readOnly: isEditMode }} // Added for debugging
                                error={!!errors.username}
                                helperText={errors.username}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="phone_number" 
                                label="Phone Number" 
                                type="tel" 
                                value={formData.phone_number} 
                                onChange={handleChange}
                                fullWidth
                                required
                                margin="dense"
                                error={!!errors.phone_number} 
                                helperText={errors.phone_number} 
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="password"
                                label={isEditMode ? "New Password (min 8 chars, blank to keep current)" : "Password (min 8 characters)"}
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                required={!isEditMode}
                                margin="dense"
                                error={!!errors.password}
                                helperText={errors.password}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="first_name"
                                label="First Name"
                                value={formData.first_name}
                                onChange={handleChange}
                                fullWidth
                                margin="dense"
                                error={!!errors.first_name}
                                helperText={errors.first_name}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="last_name"
                                label="Last Name"
                                value={formData.last_name}
                                onChange={handleChange}
                                fullWidth
                                margin="dense"
                                error={!!errors.last_name}
                                helperText={errors.last_name}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense" required error={!!errors.role}>
                                <InputLabel id="role-select-label">Role</InputLabel>
                                <Select
                                    labelId="role-select-label"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    label="Role"
                                >
                                    <MenuItem value="staff">Staff</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                    {/* Superuser role ('admin') creation/assignment might be restricted */}
                                    {currentUserRole === 'superuser' && <MenuItem value="admin">Admin (Superuser)</MenuItem>}
                                </Select>
                                {errors.role && <Typography color="error" variant="caption">{errors.role}</Typography>}
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense" error={!!errors.department_id}>
                                <InputLabel id="department-select-label">Department</InputLabel>
                                <Select
                                    labelId="department-select-label"
                                    name="department_id"
                                    value={departments.some(dept => dept.id === formData.department_id) ? formData.department_id : ''}
                                    onChange={handleChange}
                                    label="Department"
                                    disabled={loadingDepartments || (formData.role === 'admin' && isEditMode) || (currentUserRole === 'manager' && isEditMode && user && user.profile && user.profile.role === 'manager')}
                                >
                                    {loadingDepartments ? (
                                        <MenuItem value="">
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : (
                                        [
                                            <MenuItem key="none" value="">
                                                <em>None (Required for Staff/Manager)</em>
                                            </MenuItem>,
                                            departments.map((dept) => (
                                                <MenuItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))
                                        ]
                                    )}
                                </Select>
                                {errors.department_id && <Typography color="error" variant="caption">{errors.department_id}</Typography>}
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
                        {isSaving ? <CircularProgress size={24} /> : (isEditMode ? 'Update User' : 'Add User')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default UserFormModal;