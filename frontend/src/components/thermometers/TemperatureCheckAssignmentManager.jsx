import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, List, ListItem, ListItemText, Chip, Autocomplete,
  Stack, IconButton, Tooltip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, addDays, isToday, startOfDay } from 'date-fns';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

import { getUsers } from '../../services/userService';
import { getCurrentUser } from '../../services/authService';
import { 
  getAllCurrentTemperatureCheckAssignments, 
  createTemperatureCheckAssignment, 
  updateTemperatureCheckAssignment,
  getCurrentTemperatureCheckAssignments
} from '../../services/thermometerService';
import { useTheme } from '@mui/material/styles';

const TemperatureCheckAssignmentManager = () => {
  const theme = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); 
  const [todayAssignmentStatus, setTodayAssignmentStatus] = useState({
    am: null, 
    pm: null, 
    needsAttention: false,
    message: '',
    amAssigned: false,
    pmAssigned: false,
    amStaffName: '',
    pmStaffName: '',
  });
  const [formData, setFormData] = useState({
    id: null, 
    staff_member_id: '',
    department_id: '',
    time_period: 'AM',
    notes: '',
    assigned_date: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [activeTimePeriod, setActiveTimePeriod] = useState('AM');

  const getStaffName = useCallback((userId) => {
    if (!userId || !staffUsers.length) return 'Unknown Staff';
    const staff = staffUsers.find(user => user.id === userId);
    if (staff) {
      return staff.first_name && staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.username;
    }
    return 'Unknown Staff';
  }, [staffUsers]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      
      if (userData?.profile?.department_id && !formData.id) {
        setFormData(prev => ({ ...prev, department_id: userData.profile.department_id }));
      }
      
      const usersData = await getUsers();
      const staffOnlyUsers = usersData.filter(user => user.profile && user.profile.role === 'staff');
      setStaffUsers(staffOnlyUsers);
      
      const getStaffNameFromFetchedList = (userId, fetchedStaffList) => {
        if (!userId || !fetchedStaffList.length) return 'Unknown Staff';
        const staff = fetchedStaffList.find(user => user.id === userId);
        if (staff) {
          return staff.first_name && staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.username;
        }
        return 'Unknown Staff';
      };

      // Get all active assignments
      const activeAssignments = await getAllCurrentTemperatureCheckAssignments();
      setAllAssignments(activeAssignments || []);

      // Get current assignments specifically for today
      const currentAssignments = await getCurrentTemperatureCheckAssignments();
      
      const amAssignment = currentAssignments?.am_assignment || null;
      const pmAssignment = currentAssignments?.pm_assignment || null;

      const amAssigned = !!amAssignment;
      const pmAssigned = !!pmAssignment;
      const amStaffName = amAssignment ? getStaffNameFromFetchedList(amAssignment.staff_member_actual_id, staffOnlyUsers) : '';
      const pmStaffName = pmAssignment ? getStaffNameFromFetchedList(pmAssignment.staff_member_actual_id, staffOnlyUsers) : '';

      let statusMessage = '';
      let needsAttention = false;

      if (amAssigned && pmAssigned) {
        statusMessage = 'All temperature check assignments for today are covered.';
      } else if (!amAssigned && !pmAssigned) {
        statusMessage = 'Morning (AM) and Afternoon (PM) temperature checks need assignment.';
        needsAttention = true;
      } else if (!amAssigned) {
        statusMessage = 'Morning (AM) temperature check needs assignment.';
        needsAttention = true;
      } else { 
        statusMessage = 'Afternoon (PM) temperature check needs assignment.';
        needsAttention = true;
      }

      setTodayAssignmentStatus({
        am: amAssignment,
        pm: pmAssignment,
        needsAttention,
        message: statusMessage,
        amAssigned,
        pmAssigned,
        amStaffName,
        pmStaffName,
      });

    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to load data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [formData.id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (newDate) => {
    setFormData(prev => ({ ...prev, assigned_date: newDate ? startOfDay(newDate) : null }));
  };

  const handleOpenAssignmentForm = (assignmentToEdit = null, timePeriod = 'AM') => {
    setError('');
    setActiveTimePeriod(timePeriod);
    
    if (assignmentToEdit) {
      setFormData({
        id: assignmentToEdit.id,
        staff_member_id: assignmentToEdit.staff_member_actual_id || '',
        department_id: assignmentToEdit.department_id || currentUser?.profile?.department_id || '',
        time_period: assignmentToEdit.time_period || timePeriod,
        notes: assignmentToEdit.notes || '',
        assigned_date: assignmentToEdit.assigned_date ? new Date(assignmentToEdit.assigned_date) : new Date(),
      });
    } else {
      setFormData({
        id: null,
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
        time_period: timePeriod,
        notes: '',
        assigned_date: new Date(),
      });
    }
    setShowAssignmentForm(true);
  };

  const handleCancelAssignment = () => {
    setShowAssignmentForm(false);
    setError(''); 
    setFormData({
      id: null, 
      staff_member_id: '', 
      department_id: currentUser?.profile?.department_id || '', 
      time_period: activeTimePeriod, 
      notes: '', 
      assigned_date: new Date()
    });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.staff_member_id) {
      setError('Please select a staff member.');
      return;
    }
    if (!formData.assigned_date) {
      setError('Please select an assignment date.');
      return;
    }
    if (!formData.time_period) {
      setError('Please select a time period (AM/PM).');
      return;
    }
    if (!formData.department_id) {
      setError('Department ID is required.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        staff_member_id: formData.staff_member_id,
        department_id: formData.department_id,
        assigned_date: format(formData.assigned_date, 'yyyy-MM-dd'),
        time_period: formData.time_period,
        notes: formData.notes || ''
      };

      let response;
      
      if (formData.id) {
        // Update existing assignment
        response = await updateTemperatureCheckAssignment(formData.id, payload);
        setSuccessMessage(`Successfully updated ${formData.time_period} temperature check assignment.`);
      } else {
        // Create new assignment
        response = await createTemperatureCheckAssignment(payload);
        setSuccessMessage(`Successfully created ${formData.time_period} temperature check assignment.`);
      }
      
      // Reset form and refresh data
      setShowAssignmentForm(false);
      setFormData({
        id: null,
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
        time_period: activeTimePeriod,
        notes: '',
        assigned_date: new Date()
      });
      
      // Refresh data
      fetchInitialData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error("Failed to save assignment:", err);
      const errorDetail = err.response?.data?.detail || 
                         (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.response?.data) || 
                         err.message || 
                         'Failed to save assignment. Please try again.';
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h6">Temperature Check Assignment Management</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}

      {showAssignmentForm ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {formData.id ? 'Edit Temperature Check Assignment' : 'Assign New Temperature Check Duty'}
            </Typography>
            
            <form onSubmit={handleSubmitAssignment}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={staffUsers}
                    getOptionLabel={(option) => option.first_name && option.last_name ? `${option.first_name} ${option.last_name} (${option.username})` : option.username}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={staffUsers.find(u => u.id === formData.staff_member_id) || null}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, staff_member_id: newValue ? newValue.id : '' }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Staff Member" required helperText="Search by name or username" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Assigned Date"
                      value={formData.assigned_date}
                      onChange={handleDateChange}
                      minDate={startOfDay(new Date())}
                      maxDate={addDays(new Date(), 30)} 
                      slotProps={{
                        textField: { fullWidth: true, required: true }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="time-period-label">Time Period</InputLabel>
                    <Select
                      labelId="time-period-label"
                      name="time_period"
                      value={formData.time_period}
                      onChange={handleChange}
                      label="Time Period"
                    >
                      <MenuItem value="AM">Morning (AM)</MenuItem>
                      <MenuItem value="PM">Afternoon (PM)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField size="small"
                    fullWidth
                    name="department_id"
                    label="Department ID (Auto-filled)"
                    value={formData.department_id}
                    onChange={handleChange}
                    InputProps={{
                      readOnly: true,
                    }}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="notes"
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              <CardActions sx={{ justifyContent: 'flex-end', mt: 1 }}>
                <Button onClick={handleCancelAssignment} color="inherit" sx={{ mr: 1 }} size="small">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (formData.id ? 'Update Assignment' : 'Create Assignment')}
                </Button>
              </CardActions>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Assignments - Horizontal Layout */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Today's Temperature Check Assignments</Typography>
                {todayAssignmentStatus.needsAttention ? (
                  <Chip 
                    icon={<ReportProblemIcon />} 
                    label="Needs Attention" 
                    color="warning" 
                    variant="outlined" 
                  />
                ) : (
                  <Chip 
                    icon={<CheckCircleOutlineIcon />} 
                    label="All Covered" 
                    color="success" 
                    variant="outlined" 
                  />
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                          <Typography variant="subtitle1">Morning (AM) Check</Typography>
                        </Box>
                        {todayAssignmentStatus.amAssigned ? (
                          <Tooltip title="Edit Assignment">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenAssignmentForm(todayAssignmentStatus.am, 'AM')}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Assign Staff">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenAssignmentForm(null, 'AM')}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      
                      {todayAssignmentStatus.amAssigned ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: theme.palette.success.main, fontSize: '1rem' }} />
                          <Typography variant="body2">
                            Assigned to: <strong>{todayAssignmentStatus.amStaffName}</strong>
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          No staff assigned for morning temperature checks
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                          <Typography variant="subtitle1">Afternoon (PM) Check</Typography>
                        </Box>
                        {todayAssignmentStatus.pmAssigned ? (
                          <Tooltip title="Edit Assignment">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenAssignmentForm(todayAssignmentStatus.pm, 'PM')}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Assign Staff">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenAssignmentForm(null, 'PM')}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      
                      {todayAssignmentStatus.pmAssigned ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <PersonIcon sx={{ mr: 1, color: theme.palette.success.main, fontSize: '1rem' }} />
                          <Typography variant="body2">
                            Assigned to: <strong>{todayAssignmentStatus.pmStaffName}</strong>
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          No staff assigned for afternoon temperature checks
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  );
};

export default TemperatureCheckAssignmentManager;
