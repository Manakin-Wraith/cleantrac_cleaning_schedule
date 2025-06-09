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

import { getUsers } from '../../services/userService';
import { getCurrentUser } from '../../services/authService';
import { 
  getAllCurrentAssignments, 
  createVerificationAssignment, 
  updateVerificationAssignment 
} from '../../services/thermometerService';
import { useTheme } from '@mui/material/styles';

const ThermometerAssignmentManager = () => {
  const theme = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); 
  const [currentAssignment, setCurrentAssignment] = useState(null); 
  const [todayAssignmentStatus, setTodayAssignmentStatus] = useState({
    assignment: null,
    needsAttention: false,
    message: '',
    assigned: false,
    staffName: '',
  });
  const [formData, setFormData] = useState({
    id: null, 
    staff_member_id: '',
    department_id: '',
    notes: '',
    assigned_date: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

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

      const activeAssignments = await getAllCurrentAssignments();
      setAllAssignments(activeAssignments || []);

      const today = startOfDay(new Date());
      const todaysAssignment = (activeAssignments || []).find(a => 
        a.is_active && isToday(new Date(a.assigned_date))
      );

      const assigned = !!todaysAssignment;
      const staffName = todaysAssignment ? getStaffNameFromFetchedList(todaysAssignment.staff_member_actual_id, staffOnlyUsers) : '';

      let statusMessage = '';
      let needsAttention = false;

      if (assigned) {
        statusMessage = 'Thermometer verification assignment for today is covered.';
      } else {
        statusMessage = 'Thermometer verification needs assignment.';
        needsAttention = true;
      }

      setTodayAssignmentStatus({
        assignment: todaysAssignment,
        needsAttention,
        message: statusMessage,
        assigned,
        staffName,
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

  const handleOpenAssignmentForm = (assignmentToEdit = null) => {
    setError('');
    if (assignmentToEdit) {
      setFormData({
        id: assignmentToEdit.id,
        staff_member_id: assignmentToEdit.staff_member_actual_id || '',
        department_id: assignmentToEdit.department_id || currentUser?.profile?.department_id || '',
        notes: assignmentToEdit.notes || '',
        assigned_date: assignmentToEdit.assigned_date ? new Date(assignmentToEdit.assigned_date) : new Date(),
      });
    } else {
      setFormData({
        id: null,
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
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
      id: null, staff_member_id: '', department_id: currentUser?.profile?.department_id || '', 
      notes: '', assigned_date: new Date()
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
        notes: formData.notes || '',
        is_active: true, 
        assigned_date: format(formData.assigned_date, 'yyyy-MM-dd')
      };

      if (formData.id) {
        await updateVerificationAssignment(formData.id, assignmentPayload);
        console.log('Assignment updated successfully');
      } else {
        await createVerificationAssignment(assignmentPayload);
        console.log('Assignment created successfully');
      }
      
      await fetchInitialData(); 
      setShowAssignmentForm(false);
      setFormData({
        id: null,
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
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
        <AssignmentIndIcon sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '2rem' }} />
        <Typography variant="h5" component="div">
          Thermometer Verification Assignment Management
        </Typography>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
      {error && !showAssignmentForm && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {showAssignmentForm ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              {formData.id ? 'Edit Verification Assignment' : 'Assign New Verification Duty'}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* Show error inside form too */}
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
                      minDate={startOfDay(new Date())} // Ensure minDate is also start of day
                      maxDate={addDays(new Date(), 30)} 
                      
                      slotProps={{
                        textField: { fullWidth: true, required: true }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="department_id"
                    label="Department ID (Auto-filled)"
                    value={formData.department_id}
                    onChange={handleChange} // Should ideally be read-only or handled differently if editable
                    InputProps={{
                      readOnly: true, // Make department ID read-only on the form
                    }}
                    disabled // Visually indicate it's not for direct input
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
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : (formData.id ? 'Update Assignment' : 'Create Assignment')}
                </Button>
              </CardActions>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Assignment Status Alert */}
          {todayAssignmentStatus.message && (
            <Alert 
              severity={todayAssignmentStatus.needsAttention ? "warning" : "success"} 
              icon={todayAssignmentStatus.needsAttention ? <ReportProblemIcon /> : <CheckCircleOutlineIcon />}
              sx={{ mb: 2 }}
            >
              {todayAssignmentStatus.message}
            </Alert>
          )}

          {/* Action Button for Unassigned Verification */}
          {todayAssignmentStatus.needsAttention && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                onClick={() => handleOpenAssignmentForm(null)}
                startIcon={<PersonIcon />}
              >
                Assign Verification Duty
              </Button>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />

          {/* Today's Assignment Details */}
          <Typography variant="h6" gutterBottom>
            Today's Assignment Details ({format(new Date(), 'MMMM d, yyyy')})
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
              <ListItemText 
                primaryTypographyProps={{ fontWeight: 'medium' }}
                primary={<span>Assigned Staff: <Chip 
                  label={todayAssignmentStatus.staffName || 'Not Assigned'}
                  color={todayAssignmentStatus.assigned ? "success" : "default"}
                  size="small"
                  variant={todayAssignmentStatus.assigned ? "filled" : "outlined"}
                  icon={todayAssignmentStatus.assigned ? <CheckCircleOutlineIcon fontSize="small" /> : <PersonIcon fontSize="small"/>}
                /></span>}
                secondary={todayAssignmentStatus.assignment && `Dept: ${todayAssignmentStatus.assignment.department_name}`}
              />
              {todayAssignmentStatus.assigned && (
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => handleOpenAssignmentForm(todayAssignmentStatus.assignment)}
                >
                  Edit
                </Button>
              )}
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* General Action Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenAssignmentForm(null)} // Defaults to new assignment for today
            startIcon={<CalendarTodayIcon />}
            sx={{ mt: 1 }}
          >
            New/Manage Assignment
          </Button>
        </>
      )}
    </Paper>
  );
};

export default ThermometerAssignmentManager;
