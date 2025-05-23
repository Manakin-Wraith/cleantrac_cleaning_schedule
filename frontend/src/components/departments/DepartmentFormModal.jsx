import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Box } from '@mui/material';

const DepartmentFormModal = ({ open, onClose, onSave, department }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const isEditMode = Boolean(department && department.id);

    useEffect(() => {
        if (open) {
            if (isEditMode) {
                setName(department.name || '');
            } else {
                setName(''); // Reset for new department
            }
            setError(''); // Reset error on open
        }
    }, [open, department, isEditMode]);

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Department name is required.');
            return;
        }
        setError('');
        onSave({ id: department?.id, name });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditMode ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Department Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={Boolean(error)}
                        helperText={error}
                        required
                        sx={{ mt: 1 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {isEditMode ? 'Save Changes' : 'Create Department'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DepartmentFormModal;
