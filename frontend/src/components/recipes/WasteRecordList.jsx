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
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../../context/AuthContext';
import WasteRecordFormModal from './WasteRecordFormModal';
import WasteAnalyticsModal from './WasteAnalyticsModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import api from '../../services/api';

const WasteRecordList = ({ departmentColor }) => {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [reasonFilter, setReasonFilter] = useState('all');
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openAnalyticsModal, setOpenAnalyticsModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reasons, setReasons] = useState([]);
  const { currentUser } = useAuth();

  const fetchWasteRecords = async () => {
    setLoading(true);
    try {
      const params = {
        department_id: currentUser?.profile?.department?.id,
        search: searchTerm || undefined
      };
      
      if (reasonFilter !== 'all') {
        params.reason = reasonFilter;
      }
      
      if (dateFilter) {
        params.date = dateFilter.toISOString().split('T')[0];
      }
      
      const response = await api.get('/waste-records/', { params });
      setWasteRecords(response.data);
      
      // Extract unique reasons for filter
      const uniqueReasons = [...new Set(response.data.map(record => record.reason))].filter(Boolean);
      setReasons(uniqueReasons);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching waste records:', err);
      setError('Failed to load waste records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteRecords();
  }, [currentUser, searchTerm, dateFilter, reasonFilter]);

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

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    setPage(0);
  };

  const handleReasonFilterChange = (event) => {
    setReasonFilter(event.target.value);
    setPage(0);
  };

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsEditing(false);
    setOpenFormModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setIsEditing(true);
    setOpenFormModal(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setOpenConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/waste-records/${selectedRecord.id}/`);
      fetchWasteRecords();
      setOpenConfirmDelete(false);
    } catch (err) {
      console.error('Error deleting waste record:', err);
      setError('Failed to delete waste record. Please try again later.');
    }
  };

  const handleFormSubmit = async (recordData) => {
    try {
      if (isEditing) {
        await api.put(`/waste-records/${selectedRecord.id}/`, recordData);
      } else {
        await api.post('/waste-records/', {
          ...recordData,
          department: currentUser?.profile?.department?.id,
          recorded_by: currentUser.id
        });
      }
      fetchWasteRecords();
      setOpenFormModal(false);
    } catch (err) {
      console.error('Error saving waste record:', err);
      setError('Failed to save waste record. Please try again later.');
      return false;
    }
    return true;
  };

  const handleViewAnalytics = () => {
    setOpenAnalyticsModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    return `R ${parseFloat(value).toFixed(2)}`;
  };

  const canManageWasteRecords = currentUser?.is_superuser || 
                               currentUser?.profile?.role === 'manager';

  // Calculate total waste value
  const calculateTotalWasteValue = () => {
    return wasteRecords.reduce((total, record) => {
      return total + (parseFloat(record.cost_value) || 0);
    }, 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Waste Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={handleViewAnalytics}
          >
            Analytics
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRecord}
            sx={{ 
              bgcolor: departmentColor,
              '&:hover': {
                bgcolor: departmentColor,
                opacity: 0.9
              }
            }}
          >
            Record Waste
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
              placeholder="Search waste records..."
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
              <InputLabel id="reason-filter-label">Reason</InputLabel>
              <Select
                labelId="reason-filter-label"
                value={reasonFilter}
                label="Reason"
                onChange={handleReasonFilterChange}
              >
                <MenuItem value="all">All Reasons</MenuItem>
                {reasons.map((reason, index) => (
                  <MenuItem key={index} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Filter by Date"
                value={dateFilter}
                onChange={handleDateFilterChange}
                slotProps={{
                  textField: { 
                    fullWidth: true, 
                    size: "small",
                    InputProps: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Waste Records
              </Typography>
              <Typography variant="h5">
                {wasteRecords.length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Waste Value
              </Typography>
              <Typography variant="h5" color="error.main">
                {formatCurrency(calculateTotalWasteValue())}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Most Common Reason
              </Typography>
              <Typography variant="h5">
                {reasons.length > 0 ? reasons[0] : 'N/A'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="waste records table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Date</TableCell>
              <TableCell>Item/Recipe</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Cost Value</TableCell>
              <TableCell>Recorded By</TableCell>
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
            ) : wasteRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    {searchTerm || reasonFilter !== 'all' || dateFilter
                      ? 'No waste records match your search criteria.'
                      : 'No waste records found. Start by recording waste!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              wasteRecords
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {record.recipe_name || record.inventory_item_name || 'N/A'}
                      {record.is_recipe && (
                        <Chip 
                          label="Recipe" 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>{parseFloat(record.amount).toFixed(2)}</TableCell>
                    <TableCell>{record.unit}</TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell>{formatCurrency(record.cost_value)}</TableCell>
                    <TableCell>{record.recorded_by_name || 'Unknown'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {canManageWasteRecords && (
                          <>
                            <Tooltip title="Edit Record">
                              <IconButton onClick={() => handleEditRecord(record)} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Record">
                              <IconButton onClick={() => handleDeleteClick(record)} size="small" color="error">
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
        count={wasteRecords.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Modals */}
      <WasteRecordFormModal
        open={openFormModal}
        onClose={() => setOpenFormModal(false)}
        onSubmit={handleFormSubmit}
        record={selectedRecord}
        isEditing={isEditing}
        departmentColor={departmentColor}
      />

      <WasteAnalyticsModal
        open={openAnalyticsModal}
        onClose={() => setOpenAnalyticsModal(false)}
        departmentColor={departmentColor}
      />

      <ConfirmDialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Waste Record"
        content={`Are you sure you want to delete this waste record? This action cannot be undone.`}
      />
    </Box>
  );
};

export default WasteRecordList;
