import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, Button, Typography, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress, Alert,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../services/departmentService';
import DepartmentFormModal from '../components/departments/DepartmentFormModal';
import { useAuth } from '../context/AuthContext';

const DepartmentManagementPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    // State for delete confirmation dialog
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const { enqueueSnackbar } = useSnackbar();
    const { currentUser, isLoading: authLoading } = useAuth();

    const fetchDepartments = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getDepartments();
            setDepartments(data || []);
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch departments';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
        }
        setLoading(false);
    }, [enqueueSnackbar, currentUser]);

    useEffect(() => {
        if (!authLoading && currentUser && (currentUser.is_superuser || currentUser.profile?.role === 'manager')) {
            fetchDepartments();
        }
    }, [fetchDepartments, currentUser, authLoading]);

    const handleOpenAddModal = () => {
        setEditingDepartment(null);
        setOpenModal(true);
    };

    const handleOpenEditModal = (department) => {
        setEditingDepartment(department);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingDepartment(null);
    };

    const handleSaveDepartment = async (departmentData) => {
        const isEditMode = Boolean(departmentData.id);
        const action = isEditMode ? 'update' : 'create';
        const successMessage = `Department ${isEditMode ? 'updated' : 'created'} successfully.`;
        const failureMessage = `Failed to ${action} department.`;

        try {
            if (isEditMode) {
                await updateDepartment(departmentData.id, { name: departmentData.name });
            } else {
                await createDepartment({ name: departmentData.name });
            }
            enqueueSnackbar(successMessage, { variant: 'success' });
            fetchDepartments();
            handleCloseModal();
        } catch (err) {
            enqueueSnackbar(err.message || failureMessage, { variant: 'error' });
        }
    };

    const handleDeleteDepartment = async (departmentId) => {
        // This function will now be called by the confirmation dialog's confirm button
        if (!departmentToDelete) return;

        try {
            await deleteDepartment(departmentToDelete.id);
            enqueueSnackbar(`Department "${departmentToDelete.name}" deleted successfully.`, { variant: 'success' });
            fetchDepartments(); 
        } catch (err) {
            enqueueSnackbar(err.message || 'Failed to delete department.', { variant: 'error' });
        }
        handleCloseDeleteConfirm(); // Close dialog after action
    };

    // Handlers for delete confirmation dialog
    const handleOpenDeleteConfirm = (dept) => {
        setDepartmentToDelete(dept);
        setOpenDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
        setDepartmentToDelete(null);
    };

    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentUser || (!currentUser.is_superuser && currentUser.profile?.role !== 'manager')) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">You do not have permission to view this page.</Alert>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && departments.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                {currentUser?.is_superuser && 
                    <Button variant="contained" onClick={handleOpenAddModal} sx={{ mt: 2 }}>
                        Add New Department
                    </Button>
                }
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Department Management</Typography>
            {currentUser?.is_superuser && 
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    sx={{ mb: 2 }}
                    onClick={handleOpenAddModal}
                >
                    Add New Department
                </Button>
            }
            {departments.length === 0 && !loading && !error && (
                 <Alert severity="info">No departments found. {currentUser?.is_superuser ? 'Add one to get started.' : ''}</Alert>
            )}
            {departments.length > 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                {currentUser?.is_superuser && <TableCell align="right">Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell>{dept.id}</TableCell>
                                    <TableCell>{dept.name}</TableCell>
                                    {currentUser?.is_superuser && (
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenEditModal(dept)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleOpenDeleteConfirm(dept)} color="error"> {/* Changed to open confirm dialog */}
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <DepartmentFormModal 
                open={openModal} 
                onClose={handleCloseModal} 
                onSave={handleSaveDepartment} 
                department={editingDepartment} 
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteConfirm}
                onClose={handleCloseDeleteConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Delete Department"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the department "{departmentToDelete?.name}"? 
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteDepartment} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DepartmentManagementPage;
