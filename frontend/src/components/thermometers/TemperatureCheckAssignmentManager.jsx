import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, List, ListItem, ListItemText, Chip
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
  const [activeTimePeriod, setActiveTimePeriod] = useState('AM'); // For form selection

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
  }, [formData.id]); // Removed getStaffName from dependencies

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

    setLoading(true);
    try {
      const staffId = typeof formData.staff_member_id === 'string' 
        ? parseInt(formData.staff_member_id, 10) 
        : formData.staff_member_id;

      const assignmentPayload = {
        staff_member_id: staffId,
        department_id: formData.department_id,
        time_period: formData.time_period,
        notes: formData.notes || '',
        is_active: true, 
        assigned_date: format(formData.assigned_date, 'yyyy-MM-dd')
      };

      // Clear any previous messages
      setError('');
      setSuccessMessage('');
      
      if (formData.id) {
        await updateTemperatureCheckAssignment(formData.id, assignmentPayload);
        setSuccessMessage(`Temperature check assignment for ${getStaffName(staffId)} (${formData.time_period}) updated successfully`);
      } else {
        await createTemperatureCheckAssignment(assignmentPayload);
        setSuccessMessage(`Temperature check assignment for ${getStaffName(staffId)} (${formData.time_period}) created successfully`);
      }
      
      await fetchInitialData(); 
      setShowAssignmentForm(false);
      setFormData({
        id: null,
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
        time_period: activeTimePeriod,
        notes: '',
        assigned_date: new Date(),
      });

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
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '2rem' }} />
        <Typography variant="h5" component="div">
          Temperature Check Assignment Management
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Temperature Check Assignments</Typography>
        <Typography variant="body2" color="text.secondary">
          Assign staff members to perform temperature checks (AM/PM)
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      
      {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}

      {showAssignmentForm ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              {formData.id ? 'Edit Temperature Check Assignment' : 'Assign New Temperature Check Duty'}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmitAssignment}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="staff-member-label">Staff Member</InputLabel>
                  <Select
                    labelId="staff-member-label"
                    name="staff_member_id"
                    value={formData.staff_member_id}
                    onChange={handleChange}
                    label="Staff Member"
                  >
                    <MenuItem value="">
                      <em>Select Staff Member</em>
                    </MenuItem>
                    {staffUsers.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </MenuItem>
                    ))}
                  </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
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
                    name="notes"
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              <CardActions sx={{ justifyContent: 'flex-end', p: 0, pt: 2 }}>
                <Button onClick={handleCancelAssignment} color="inherit" sx={{ mr: 1 }}>
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
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Temperature Check Assignments
              </Typography>
              
              {todayAssignmentStatus.needsAttention ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReportProblemIcon sx={{ mr: 1 }} />
                    <Typography>{todayAssignmentStatus.message}</Typography>
                  </Box>
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                    <Typography>{todayAssignmentStatus.message}</Typography>
                  </Box>
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                        <Typography variant="h6">Morning (AM) Check</Typography>
                      </Box>
                      
                      {todayAssignmentStatus.amAssigned ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                            <Typography>
                              Assigned to: <strong>{todayAssignmentStatus.amStaffName}</strong>
                            </Typography>
                          </Box>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenAssignmentForm(todayAssignmentStatus.am, 'AM')}
                            sx={{ mt: 1 }}
                          >
                            Edit Assignment
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography color="text.secondary" sx={{ mb: 1 }}>
                            No staff assigned for morning temperature checks.
                          </Typography>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenAssignmentForm(null, 'AM')}
                            sx={{ mt: 1 }}
                          >
                            Assign Staff
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                        <Typography variant="h6">Afternoon (PM) Check</Typography>
                      </Box>
                      
                      {todayAssignmentStatus.pmAssigned ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                            <Typography>
                              Assigned to: <strong>{todayAssignmentStatus.pmStaffName}</strong>
                            </Typography>
                          </Box>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenAssignmentForm(todayAssignmentStatus.pm, 'PM')}
                            sx={{ mt: 1 }}
                          >
                            Edit Assignment
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography color="text.secondary" sx={{ mb: 1 }}>
                            No staff assigned for afternoon temperature checks.
                          </Typography>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenAssignmentForm(null, 'PM')}
                            sx={{ mt: 1 }}
                          >
                            Assign Staff
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Active Temperature Check Assignments
              </Typography>
              
              {allAssignments.length > 0 ? (
                <List>
                  {allAssignments.map(assignment => (
                    <ListItem 
                      key={assignment.id} 
                      divider 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="subtitle1">
                              {assignment.staff_member_name || assignment.staff_member_username}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarTodayIcon sx={{ mr: 1, fontSize: '0.875rem', color: theme.palette.text.secondary }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(assignment.assigned_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTimeIcon sx={{ mr: 1, fontSize: '0.875rem', color: theme.palette.text.secondary }} />
                              <Typography variant="body2" color="text.secondary">
                                {assignment.time_period === 'AM' ? 'Morning Check' : 'Afternoon Check'}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ flex: 1 }}
                      />
                      <Box sx={{ display: 'flex', mt: { xs: 1, sm: 0 } }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleOpenAssignmentForm(assignment, assignment.time_period)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No active temperature check assignments found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  );
};

export default TemperatureCheckAssignmentManager;
