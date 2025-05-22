import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { getCleaningItems, /* deleteCleaningItem */ } from '../services/itemService'; // Assuming itemService.js will exist
import { getCurrentUser } from '../services/authService';
// import ItemFormModal from '../components/items/ItemFormModal'; // To be created

const ItemManagementPage = () => {
    const [items, setItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [editingItem, setEditingItem] = useState(null);

    const fetchCurrentUserAndItems = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            if (currentUser && currentUser.profile && currentUser.profile.department_id) {
                const fetchedItems = await getCleaningItems({ department_id: currentUser.profile.department_id });
                setItems(fetchedItems);
            } else {
                setError('User department information is missing. Cannot load items.');
                setItems([]);
            }
        } catch (err) {
            console.error("Failed to load user or items:", err);
            setError(err.message || 'Failed to load data.');
            enqueueSnackbar(err.message || 'Failed to load data.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchCurrentUserAndItems();
    }, [fetchCurrentUserAndItems]);

    // const handleOpenModal = (item = null) => {
    //     setEditingItem(item);
    //     setIsModalOpen(true);
    // };

    // const handleCloseModal = () => {
    //     setIsModalOpen(false);
    //     setEditingItem(null);
    // };

    // const handleSaveItem = async () => {
    //     fetchCurrentUserAndItems(); // Refresh list after save
    // };

    // const handleDeleteItem = async (itemId) => {
    //     if (window.confirm('Are you sure you want to delete this item?')) {
    //         try {
    //             // await deleteCleaningItem(itemId); // Assumes deleteCleaningItem service exists
    //             enqueueSnackbar('Item deleted successfully', { variant: 'success' });
    //             fetchCurrentUserAndItems(); // Refresh list
    //         } catch (err) {
    //             console.error('Failed to delete item:', err);
    //             enqueueSnackbar(err.message || 'Failed to delete item.', { variant: 'error' });
    //         }
    //     }
    // };

    if (loading) {
        return (
            <Container component={Paper} sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {user?.profile?.department_name ? `${user.profile.department_name} - ` : ''}Item Management
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddCircleOutlineIcon />} 
                    // onClick={() => handleOpenModal()} 
                    sx={{backgroundColor: 'primary.main'}}
                >
                    Add New Item
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 650 }} aria-label="cleaning items table">
                    <TableHead sx={{ backgroundColor: 'grey.200' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Equipment</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Chemical</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                            {/* <TableCell sx={{ fontWeight: 'bold' }}>Default Staff</TableCell> */}
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.length > 0 ? items.map((item) => (
                            <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">
                                    {item.name}
                                </TableCell>
                                <TableCell>{item.frequency || 'N/A'}</TableCell>
                                <TableCell>{item.equipment || 'N/A'}</TableCell>
                                <TableCell>{item.chemical || 'N/A'}</TableCell>
                                <TableCell>
                                    <Tooltip title={item.method || ''} placement="top-start">
                                        <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.method || 'N/A'}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                {/* <TableCell>{item.default_assigned_staff_details ? item.default_assigned_staff_details.map(s => s.username).join(', ') : 'N/A'}</TableCell> */}
                                <TableCell>
                                    <Tooltip title="Edit Item">
                                        <IconButton /* onClick={() => handleOpenModal(item)} */ color="primary" size="small">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Item">
                                        <IconButton /* onClick={() => handleDeleteItem(item.id)} */ color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No items found for this department.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* 
            {isModalOpen && (
                <ItemFormModal 
                    open={isModalOpen} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveItem} 
                    item={editingItem} 
                    departmentId={user?.profile?.department_id}
                />
            )}
            */}
        </Container>
    );
};

export default ItemManagementPage;
