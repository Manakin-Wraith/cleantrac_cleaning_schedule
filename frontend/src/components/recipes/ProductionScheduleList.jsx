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
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ProductionScheduleFormModal from './ProductionScheduleFormModal';
import ProductionRecordFormModal from './ProductionRecordFormModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import api from '../../services/api';

const ProductionScheduleList = ({ departmentColor }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openRecordModal, setOpenRecordModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();

  // Fetch staff data to map IDs to names
  const [staffMembers, setStaffMembers] = useState({});

  const fetchStaffData = async () => {
    try {
      const response = await api.get('/users/');
      const userData = Array.isArray(response.data) ? response.data : 
                      (response.data?.results || []);
      
      // Create a map of staff IDs to names
      const staffMap = {};
      userData.forEach(user => {
        staffMap[user.id] = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Staff Member';
      });
      
      setStaffMembers(staffMap);
      console.log('Staff data loaded:', staffMap);
    } catch (err) {
      console.error('Error fetching staff data:', err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = {
        department_id: currentUser?.profile?.department?.id,
        search: searchTerm || undefined
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (dateFilter) {
        params.scheduled_date = dateFilter.toISOString().split('T')[0];
      }
      
      const response = await api.get('/production-schedules/', { params });
      
      // Process the schedules to add staff names
      const processedSchedules = Array.isArray(response.data) ? response.data : 
                               (response.data?.results || []);
      
      // Enhance schedules with staff names and handle time fields
      processedSchedules.forEach(schedule => {
        // Handle staff assignments
        schedule.assigned_staff_names = []; // Initialize
        schedule.assigned_staff_name = undefined; // Initialize

        if (schedule.assigned_staff_details && Array.isArray(schedule.assigned_staff_details) && schedule.assigned_staff_details.length > 0) {
          schedule.assigned_staff_names = schedule.assigned_staff_details.map(staffDetail => {
            // Prefer the name directly from assigned_staff_details if available
            // Otherwise, fall back to looking up by ID in staffMembers (though API sends name directly here)
            return staffDetail.name || staffMembers[staffDetail.id] || `Staff ID: ${staffDetail.id}`; 
          }).filter(name => name); // Filter out any undefined/null names

          // If only one staff member, also populate assigned_staff_name for simpler display cases or single assignment scenarios
          if (schedule.assigned_staff_names.length === 1) {
            schedule.assigned_staff_name = schedule.assigned_staff_names[0];
          }
        } else {
          // Fallback for older data structures if necessary, or if API might send these fields
          if (schedule.assigned_staff_id) { 
            schedule.assigned_staff_name = staffMembers[schedule.assigned_staff_id] || 'Unknown Staff';
            if (schedule.assigned_staff_name !== 'Unknown Staff') {
              schedule.assigned_staff_names = [schedule.assigned_staff_name];
            }
          }
          
          if (schedule.assigned_staff_ids && Array.isArray(schedule.assigned_staff_ids) && schedule.assigned_staff_ids.length > 0 && schedule.assigned_staff_names.length === 0) { 
            schedule.assigned_staff_names = schedule.assigned_staff_ids
              .map(id => staffMembers[id] || `Staff ID: ${id}`)
              .filter(name => name);
            if (schedule.assigned_staff_names.length === 1 && !schedule.assigned_staff_name) {
              schedule.assigned_staff_name = schedule.assigned_staff_names[0];
            }
          }
        }

        // Handle time fields - convert database fields to expected frontend fields
        // For RecipeProductionTask model (uses scheduled_start_time and scheduled_end_time as DateTimeField)
        if (schedule.scheduled_start_time === undefined && schedule.start_time !== undefined) {
          // If we have start_time from ProductionSchedule model, convert it to ISO format with the scheduled_date
          if (schedule.start_time) {
            const dateStr = schedule.scheduled_date;
            const timeStr = schedule.start_time;
            // Create a datetime string by combining date and time
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
              // Format: YYYY-MM-DDT{time string}
              schedule.scheduled_start_time = `${dateStr}T${timeStr}`;
            }
          }
        }

        if (schedule.scheduled_end_time === undefined && schedule.end_time !== undefined) {
          // If we have end_time from ProductionSchedule model, convert it to ISO format with the scheduled_date
          if (schedule.end_time) {
            const dateStr = schedule.scheduled_date;
            const timeStr = schedule.end_time;
            // Create a datetime string by combining date and time
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
              // Format: YYYY-MM-DDT{time string}
              schedule.scheduled_end_time = `${dateStr}T${timeStr}`;
            }
          }
        }
      });
      
      console.log('Processed schedules with staff names and times:', JSON.parse(JSON.stringify(processedSchedules))); // DEBUGGING: Log a deep copy
      setSchedules(processedSchedules);
      setError(null);
    } catch (err) {
      console.error('Error fetching production schedules:', err);
      setError('Failed to load production schedules. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff data when component mounts or user changes
  useEffect(() => {
    fetchStaffData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  
  // Fetch schedules when filters change or after staff data is loaded
  useEffect(() => {
    // Only fetch schedules if currentUser is loaded (for department_id) 
    // and staffMembers has been populated.
    if (currentUser && Object.keys(staffMembers).length > 0) {
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, searchTerm, statusFilter, dateFilter, staffMembers]);

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

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    setPage(0);
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setIsEditing(false);
    setOpenFormModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsEditing(true);
    setOpenFormModal(true);
  };

  const handleCompleteSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setOpenRecordModal(true);
  };

  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setOpenConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/production-schedules/${selectedSchedule.id}/`);
      fetchSchedules();
      setOpenConfirmDelete(false);
    } catch (err) {
      console.error('Error deleting production schedule:', err);
      setError('Failed to delete production schedule. Please try again later.');
    }
  };

  const handleFormSubmit = async (scheduleData) => {
    try {
      if (isEditing) {
        await api.put(`/production-schedules/${selectedSchedule.id}/`, scheduleData);
      } else {
        await api.post('/production-schedules/', {
          ...scheduleData,
          department: currentUser?.profile?.department?.id
        });
      }
      fetchSchedules();
      setOpenFormModal(false);
    } catch (err) {
      console.error('Error saving production schedule:', err);
      setError('Failed to save production schedule. Please try again later.');
      return false;
    }
    return true;
  };

  const handleRecordSubmit = async (recordData) => {
    try {
      // Create production record
      await api.post('/production-records/', {
        ...recordData,
        production_schedule: selectedSchedule.id
      });
      
      // Update schedule status to completed
      await api.patch(`/api/production-schedules/${selectedSchedule.id}/`, {
        status: 'completed'
      });
      
      fetchSchedules();
      setOpenRecordModal(false);
    } catch (err) {
      console.error('Error saving production record:', err);
      setError('Failed to save production record. Please try again later.');
      return false;
    }
    return true;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="default" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="primary" size="small" />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const canManageSchedules = currentUser?.is_superuser || 
                            currentUser?.profile?.role === 'manager';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
      return new Date(dateTimeString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Production Schedule
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSchedule}
            sx={{ 
              bgcolor: departmentColor,
              '&:hover': {
                bgcolor: departmentColor,
                opacity: 0.9
              }
            }}
          >
            Schedule Production
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
              placeholder="Search recipes..."
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
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="production schedules table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Recipe</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Assigned To</TableCell>
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
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    {searchTerm || statusFilter !== 'all' || dateFilter
                      ? 'No production schedules match your search criteria.'
                      : 'No production schedules found. Schedule your first production!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              schedules
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((schedule) => (
                  <TableRow key={schedule.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.recipe_details?.name || schedule.recipe_name || 'Unnamed Recipe'}
                      </Typography>
                      {schedule.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {schedule.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(schedule.scheduled_date)}
                    </TableCell>
                    <TableCell>
                      {formatTime(schedule.scheduled_start_time)}
                    </TableCell>
                    <TableCell>
                      {formatTime(schedule.scheduled_end_time)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {schedule.batch_size || schedule.quantity || '0'} 
                        {schedule.recipe_details?.yield_unit || schedule.recipe_yield_unit || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {schedule.assigned_staff_names?.join(', ') || 
                         schedule.assigned_staff_name || 
                         schedule.assigned_to_name || 
                         (schedule.assigned_staff_ids?.length > 0 ? 
                           (staffMembers[schedule.assigned_staff_ids[0]] || 'Staff #' + schedule.assigned_staff_ids[0]) : 
                           'Unassigned')}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(schedule.status || 'scheduled')}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
                          <Tooltip title="Mark as Completed">
                            <IconButton onClick={() => handleCompleteSchedule(schedule)} size="small" color="success">
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canManageSchedules && schedule.status !== 'completed' && (
                          <>
                            <Tooltip title="Edit Schedule">
                              <IconButton onClick={() => handleEditSchedule(schedule)} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Schedule">
                              <IconButton onClick={() => handleDeleteClick(schedule)} size="small" color="error">
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
        count={schedules.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Modals */}
      <ProductionScheduleFormModal
        open={openFormModal}
        onClose={() => setOpenFormModal(false)}
        onSubmit={handleFormSubmit}
        schedule={selectedSchedule}
        isEditing={isEditing}
        departmentColor={departmentColor}
      />

      <ProductionRecordFormModal
        open={openRecordModal}
        onClose={() => setOpenRecordModal(false)}
        onSubmit={handleRecordSubmit}
        schedule={selectedSchedule}
        departmentColor={departmentColor}
      />

      <ConfirmDialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Production Schedule"
        content={`Are you sure you want to delete the production schedule for "${selectedSchedule?.recipe_name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ProductionScheduleList;
