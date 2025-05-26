// frontend/src/pages/UserManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, Typography, Button, Paper, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import PageLayout from '../components/PageLayout';
import UserFormModal from '../components/users/UserFormModal'; 
import { getUsers, deleteUser } from '../services/userService'; // deleteUser added
import { useAuth } from '../context/AuthContext'; // To get current user role

function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openUserModal, setOpenUserModal] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const { user: loggedInUser } = useAuth(); // Get logged-in user context

    const { enqueueSnackbar } = useSnackbar();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Determine if we need a more specific fetch (e.g., by current manager's department)
            // For now, getUsers() should respect backend permissions.
            const data = await getUsers(); 
            setUsers(data || []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError(err.message || 'Failed to fetch users');
            enqueueSnackbar(err.message || 'Failed to fetch users', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenUserModal = (user = null) => {
        setCurrentUserToEdit(user);
        setOpenUserModal(true);
    };

    const handleCloseUserModal = () => {
         setOpenUserModal(false);
         setCurrentUserToEdit(null);
    };

    const handleSaveUser = (savedUser) => { // savedUser is the response from create/update
        fetchUsers(); // Refresh list after save
        // Optionally, you could update the local state more selectively
        // if (currentUserToEdit) { //
        //   setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
        // } else {
        //   setUsers([savedUser, ...users]);
        // }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await deleteUser(userId);
                enqueueSnackbar('User deleted successfully', { variant: 'success' });
                fetchUsers(); // Refresh list
            } catch (err) {
                console.error("Failed to delete user:", err);
                enqueueSnackbar(err.response?.data?.detail || err.message || 'Failed to delete user', { variant: 'error' });
            }
        }
    };


    if (loading) {
        return <PageLayout title="User Management"><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><CircularProgress /></Box></PageLayout>;
    }

    if (error) {
        return <PageLayout title="User Management"><Typography color="error">Error: {error}</Typography></PageLayout>;
    }

    return (
        <PageLayout title="User Management">
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenUserModal()} // Connect handler
                // disabled // Remove disabled
            >
                Add New User
            </Button>
        </Box>
            <Paper elevation={3}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="user management table">
                        <TableHead sx={{ backgroundColor: 'primary.main' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Username</TableCell>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Full Name</TableCell>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Phone Number</TableCell>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Department</TableCell>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ color: 'common.white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length > 0 ? users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }, '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">{user.username}</TableCell>
                                    <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                                    <TableCell>{user.profile?.phone_number || '-'}</TableCell>
                                    <TableCell>{user.profile?.department_name || 'N/A'}</TableCell>
                                    <TableCell>{user.profile?.role ? user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1) : 'N/A'}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit User">
                                            <IconButton 
                                                onClick={() => handleOpenUserModal(user)} 
                                                color="primary" 
                                                
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete User">
                                            <IconButton 
                                                onClick={() => handleDeleteUser(user.id)} 
                                                color="error"
                                                disabled={loggedInUser && loggedInUser.id === user.id}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            {openUserModal && (
                <UserFormModal
                    open={openUserModal}
                    onClose={handleCloseUserModal}
                    onSave={handleSaveUser}
                    user={currentUserToEdit}
                    currentUserRole={loggedInUser?.profile?.role}
                />
            )} 
        </PageLayout>
    );
}

export default UserManagementPage;
