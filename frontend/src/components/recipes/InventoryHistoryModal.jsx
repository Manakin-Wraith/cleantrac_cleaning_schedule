import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../services/api';

const InventoryHistoryModal = ({ open, onClose, item, departmentColor }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    reason: 'all',
    startDate: null,
    endDate: null,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (open && item) {
      fetchTransactionHistory();
    }
  }, [open, item, filters]);

  const fetchTransactionHistory = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      const params = {
        inventory_item: item.id
      };
      
      if (filters.type !== 'all') {
        params.transaction_type = filters.type;
      }
      
      if (filters.reason !== 'all') {
        params.reason = filters.reason;
      }
      
      if (filters.startDate) {
        params.start_date = filters.startDate.toISOString().split('T')[0];
      }
      
      if (filters.endDate) {
        params.end_date = filters.endDate.toISOString().split('T')[0];
      }
      
      if (filters.search) {
        params.search = filters.search;
      }
      
      const response = await api.get('/inventory-transactions/', { params });
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      reason: 'all',
      startDate: null,
      endDate: null,
      search: ''
    });
  };

  const getTransactionTypeChip = (type) => {
    if (type === 'add') {
      return <Chip 
        icon={<ArrowUpwardIcon />} 
        label="Stock Added" 
        color="success" 
        size="small" 
        variant="outlined"
      />;
    } else {
      return <Chip 
        icon={<ArrowDownwardIcon />} 
        label="Stock Removed" 
        color="error" 
        size="small" 
        variant="outlined"
      />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get unique reasons for filter
  const getUniqueReasons = () => {
    const reasons = transactions.map(t => t.reason).filter(Boolean);
    return [...new Set(reasons)];
  };

  // Calculate running balance
  const calculateRunningBalance = () => {
    let balance = parseFloat(item.current_stock);
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return sortedTransactions.map(transaction => {
      const quantity = parseFloat(transaction.quantity);
      if (transaction.transaction_type === 'add') {
        balance -= quantity;
      } else {
        balance += quantity;
      }
      return { ...transaction, balance };
    });
  };

  if (!item) return null;

  const transactionsWithBalance = calculateRunningBalance();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Transaction History - {item.name}
        </Typography>
        <Box>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-filter-label">Transaction Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={filters.type}
                    label="Transaction Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="add">Stock Added</MenuItem>
                    <MenuItem value="remove">Stock Removed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reason-filter-label">Reason</InputLabel>
                  <Select
                    labelId="reason-filter-label"
                    value={filters.reason}
                    label="Reason"
                    onChange={(e) => handleFilterChange('reason', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">All Reasons</MenuItem>
                    {getUniqueReasons().map((reason, index) => (
                      <MenuItem key={index} value={reason}>
                        {reason}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{
                      textField: { 
                        fullWidth: true, 
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{
                      textField: { 
                        fullWidth: true, 
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search notes, references..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={resetFilters} size="small">
                    Reset Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Stock
                </Typography>
                <Typography variant="h6">
                  {parseFloat(item.current_stock).toFixed(2)} {item.unit}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h6">
                  R {(parseFloat(item.current_stock) * parseFloat(item.cost_per_unit)).toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Transaction Count
                </Typography>
                <Typography variant="h6">
                  {transactions.length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell>Date & Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Running Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No transaction history found for this item.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{getTransactionTypeChip(transaction.transaction_type)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: transaction.transaction_type === 'add' ? 'success.main' : 'error.main',
                          fontWeight: 'medium'
                        }}
                      >
                        {transaction.transaction_type === 'add' ? '+' : '-'}{parseFloat(transaction.quantity).toFixed(2)} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.reference || '-'}</TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                    <TableCell>{transaction.created_by_name || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {parseFloat(transaction.balance).toFixed(2)} {item.unit}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryHistoryModal;
