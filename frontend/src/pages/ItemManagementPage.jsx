import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Box, Button, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, CircularProgress, Alert, IconButton, Tooltip,
    TableSortLabel // Added TableSortLabel
} from '@mui/material';
import { visuallyHidden } from '@mui/utils'; // Added for accessibility with TableSortLabel
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { getCleaningItems, deleteCleaningItem } from '../services/itemService'; 
import { getCurrentUser } from '../services/authService';
import ItemFormModal from '../components/items/ItemFormModal'; 

const ItemManagementPage = () => {
    const [items, setItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // State for table sorting
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    const fetchCurrentUserAndItems = useCallback(async () => {
        setLoading(true);
        setError(''); 
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            if (currentUser && currentUser.profile && currentUser.profile.department_id) {
                const fetchedItems = await getCleaningItems({ department_id: currentUser.profile.department_id });
                setItems(fetchedItems || []); 
            } else {
                setError('User department information is missing. Cannot load items.');
                setItems([]);
            }
        } catch (err) {
            console.error("Failed to load user or items:", err);
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to load data.';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            setItems([]); 
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchCurrentUserAndItems();
    }, [fetchCurrentUserAndItems]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveItem = async () => {
        handleCloseModal(); 
        enqueueSnackbar('Processing... please wait.', { variant: 'info' });
        await fetchCurrentUserAndItems(); 
        // Snackbar for success/failure is handled within ItemFormModal
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            try {
                await deleteCleaningItem(itemId); 
                enqueueSnackbar('Item deleted successfully', { variant: 'success' });
                fetchCurrentUserAndItems(); 
            } catch (err) {
                console.error('Failed to delete item:', err);
                const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete item.';
                enqueueSnackbar(errorMessage, { variant: 'error' });
            }
        }
    };

    // Helper functions for sorting
    function descendingComparator(a, b, orderBy) {
        let valA = a[orderBy];
        let valB = b[orderBy];

        // Handle null or undefined values by treating them as less than actual values
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1; // nulls go last when ascending, so first when descending
        if (valB == null) return -1;

        // Ensure consistent comparison for strings, case-insensitive
        if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valB < valA) {
            return -1;
        }
        if (valB > valA) {
            return 1;
        }
        return 0;
    }

    function getComparator(order, orderBy) {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    }

    // This method is created bystableSort() above and is not needed
    // It's stable since we are sorting strings by their values after converting them to lowercase.
    // For numeric values, a more complex stable sort might be needed if browsers don't provide it.
    function stableSort(array, comparator) {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) {
                return order;
            }
            return a[1] - b[1]; // stabilize by original index if values are equal
        });
        return stabilizedThis.map((el) => el[0]);
    }

    const headCells = [
        { id: 'name', numeric: false, disablePadding: false, label: 'Item Name' },
        { id: 'frequency', numeric: false, disablePadding: false, label: 'Frequency' },
        { id: 'equipment', numeric: false, disablePadding: false, label: 'Equipment' },
        { id: 'chemical', numeric: false, disablePadding: false, label: 'Chemical' },
        { id: 'method', numeric: false, disablePadding: false, label: 'Method' },
        { id: 'actions', numeric: false, disablePadding: false, label: 'Actions', sortable: false },
    ];

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    if (loading && !items.length) { 
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
                    onClick={() => handleOpenModal()} 
                    sx={{backgroundColor: 'primary.main'}}
                >
                    Add New Item
                </Button>
            </Box>

            {error && !items.length && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} 
            
            {loading && items.length > 0 && <CircularProgress sx={{ display: 'block', margin: '20px auto'}}/>}
            
            <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 650 }} aria-label="cleaning items table">
                    <TableHead sx={{ backgroundColor: 'grey.200' }}>
                        <TableRow>
                            {headCells.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    padding={headCell.disablePadding ? 'none' : 'normal'}
                                    sortDirection={orderBy === headCell.id ? order : false}
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {headCell.sortable === false ? (
                                        headCell.label
                                    ) : (
                                        <TableSortLabel
                                            active={orderBy === headCell.id}
                                            direction={orderBy === headCell.id ? order : 'asc'}
                                            onClick={(event) => handleRequestSort(event, headCell.id)}
                                        >
                                            {headCell.label}
                                            {orderBy === headCell.id ? (
                                                <Box component="span" sx={visuallyHidden}>
                                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                                </Box>
                                            ) : null}
                                        </TableSortLabel>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!loading && items.length === 0 && !error && (
                             <TableRow>
                                <TableCell colSpan={headCells.length} align="center">No items found for this department. Click 'Add New Item' to create one.</TableCell>
                            </TableRow>
                        )}
                        {stableSort(items, getComparator(order, orderBy)).map((item) => (
                            <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">
                                    {item.name}
                                </TableCell>
                                <TableCell>{item.frequency ? item.frequency.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</TableCell>
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
                                        <IconButton onClick={() => handleOpenModal(item)} color="primary" size="small">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Item">
                                        <IconButton onClick={() => handleDeleteItem(item.id)} color="error" size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {isModalOpen && (
                <ItemFormModal 
                    open={isModalOpen} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveItem} 
                    item={editingItem} 
                    departmentId={user?.profile?.department_id}
                />
            )}
            
        </Container>
    );
};

export default ItemManagementPage;
