import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress, Alert } from '@mui/material';
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
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await deleteDepartment(departmentId);
                enqueueSnackbar('Department deleted successfully.', { variant: 'success' });
                fetchDepartments();
            } catch (err) {
                enqueueSnackbar(err.message || 'Failed to delete department.', { variant: 'error' });
            }
        }
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
                                            <IconButton onClick={() => handleDeleteDepartment(dept.id)} color="error">
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
        </Box>
    );
};

export default DepartmentManagementPage;
