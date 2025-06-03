import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import InventoryFormModal from './InventoryFormModal';
import InventoryTransactionModal from './InventoryTransactionModal';
import InventoryHistoryModal from './InventoryHistoryModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import api from '../../services/api';

const InventoryList = ({ departmentColor }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const { currentUser } = useAuth();

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = {
        department_id: currentUser?.profile?.department?.id,
        search: searchTerm || undefined
      };
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (stockFilter !== 'all') {
        params.stock_status = stockFilter;
      }
      
      const response = await api.get('/api/inventory-items/', { params });
      setInventory(response.data);
      
      // Extract unique categories for filter
      const uniqueCategories = [...new Set(response.data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentUser, searchTerm, categoryFilter, stockFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
  };

  const handleStockFilterChange = (event) => {
    setStockFilter(event.target.value);
    setPage(0);
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setOpenFormModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsEditing(true);
    setOpenFormModal(true);
  };

  const handleAddStock = (item) => {
    setSelectedItem(item);
    setTransactionType('add');
    setOpenTransactionModal(true);
  };

  const handleRemoveStock = (item) => {
    setSelectedItem(item);
    setTransactionType('remove');
    setOpenTransactionModal(true);
  };

  const handleViewHistory = (item) => {
    setSelectedItem(item);
    setOpenHistoryModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/inventory-items/${selectedItem.id}/`);
      fetchInventory();
      setOpenConfirmDelete(false);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setError('Failed to delete inventory item. Please try again later.');
    }
  };

  const handleFormSubmit = async (itemData) => {
    try {
      if (isEditing) {
        await api.put(`/api/inventory-items/${selectedItem.id}/`, itemData);
      } else {
        await api.post('/api/inventory-items/', {
          ...itemData,
          department: currentUser?.profile?.department?.id
        });
      }
      fetchInventory();
      setOpenFormModal(false);
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setError('Failed to save inventory item. Please try again later.');
      return false;
    }
    return true;
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      await api.post('/api/inventory-transactions/', {
        ...transactionData,
        inventory_item: selectedItem.id,
        transaction_type: transactionType,
        department: currentUser?.profile?.department?.id
      });
      fetchInventory();
      setOpenTransactionModal(false);
    } catch (err) {
      console.error('Error recording inventory transaction:', err);
      setError('Failed to record inventory transaction. Please try again later.');
      return false;
    }
    return true;
  };

  const getStockStatusChip = (item) => {
    const stockLevel = parseFloat(item.current_stock);
    const reorderLevel = parseFloat(item.reorder_level);
    
    if (stockLevel <= 0) {
      return <Chip label="Out of Stock" color="error" size="small" />;
    } else if (stockLevel <= reorderLevel) {
      return <Chip label="Low Stock" color="warning" size="small" />;
    } else {
      return <Chip label="In Stock" color="success" size="small" />;
    }
  };

  const canManageInventory = currentUser?.is_superuser || 
                            currentUser?.profile?.role === 'manager';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            sx={{ 
              bgcolor: departmentColor,
              '&:hover': {
                bgcolor: departmentColor,
                opacity: 0.9
              }
            }}
          >
            Add Inventory Item
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={handleCategoryFilterChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="stock-filter-label">Stock Status</InputLabel>
              <Select
                labelId="stock-filter-label"
                value={stockFilter}
                label="Stock Status"
                onChange={handleStockFilterChange}
              >
                <MenuItem value="all">All Stock Levels</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="inventory table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Item Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Cost per Unit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                      ? 'No inventory items match your search criteria.'
                      : 'No inventory items found. Add your first inventory item!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              inventory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.item_code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{parseFloat(item.current_stock).toFixed(2)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>R {parseFloat(item.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell>{getStockStatusChip(item)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Add Stock">
                          <IconButton onClick={() => handleAddStock(item)} size="small" color="success">
                            <AddCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Stock">
                          <IconButton 
                            onClick={() => handleRemoveStock(item)} 
                            size="small" 
                            color="warning"
                            disabled={parseFloat(item.current_stock) <= 0}
                          >
                            <RemoveCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton onClick={() => handleViewHistory(item)} size="small">
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        {canManageInventory && (
                          <>
                            <Tooltip title="Edit Item">
                              <IconButton onClick={() => handleEditItem(item)} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Item">
                              <IconButton onClick={() => handleDeleteClick(item)} size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={inventory.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Modals */}
      <InventoryFormModal
        open={openFormModal}
        onClose={() => setOpenFormModal(false)}
        onSubmit={handleFormSubmit}
        item={selectedItem}
        isEditing={isEditing}
        departmentColor={departmentColor}
      />

      <InventoryTransactionModal
        open={openTransactionModal}
        onClose={() => setOpenTransactionModal(false)}
        onSubmit={handleTransactionSubmit}
        item={selectedItem}
        transactionType={transactionType}
        departmentColor={departmentColor}
      />

      <InventoryHistoryModal
        open={openHistoryModal}
        onClose={() => setOpenHistoryModal(false)}
        item={selectedItem}
        departmentColor={departmentColor}
      />

      <ConfirmDialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        content={`Are you sure you want to delete "${selectedItem?.name}"? This will also delete all transaction history for this item. This action cannot be undone.`}
      />
    </Box>
  );
};

export default InventoryList;
