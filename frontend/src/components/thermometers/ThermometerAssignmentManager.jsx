import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, List, ListItem, ListItemText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format, addDays } from 'date-fns';
import { 
  getVerificationAssignments, 
  createVerificationAssignment,
  updateVerificationAssignment,
  getCurrentAssignment,
  getAllCurrentAssignments
} from '../../services/thermometerService';
import { getUsers } from '../../services/userService';
import { getCurrentUser } from '../../services/authService';

const ThermometerAssignmentManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [allAssignments, setAllAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    staff_member_id: '',
    department_id: '',
    time_period: 'BOTH',
    notes: '',
    assigned_date: new Date()
  });
  const theme = useTheme();

  useEffect(() => {
    const fetchStaffAndAssignments = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get current user for department info
        const userData = await getCurrentUser();
        setCurrentUser(userData);
        
        // Set department ID in form data
        if (userData?.profile?.department_id) {
          setFormData(prev => ({
            ...prev,
            department_id: userData.profile.department_id
          }));
        }
        
        // Get all staff users
        const usersData = await getUsers();
        const staffOnlyUsers = usersData.filter(user => 
          user.profile && user.profile.role === 'staff'
        );
        setStaffUsers(staffOnlyUsers);
        
        // Get all current thermometer verification assignments
        try {
          const assignments = await getAllCurrentAssignments();
          setAllAssignments(assignments || []);
          
          // For backward compatibility, also set currentAssignment
          const defaultAssignment = assignments.find(a => a.time_period === 'BOTH') || 
                                   assignments.find(a => a.time_period === 'AM') || 
                                   assignments[0];
          setCurrentAssignment(defaultAssignment || null);
        } catch (assignmentErr) {
          console.log('No current thermometer verification assignments found');
        }
      } catch (err) {
        console.error("Failed to load staff and assignment data:", err);
        setError(err.message || 'Failed to load staff and assignment data. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffAndAssignments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (newDate) => {
    setFormData(prev => ({ ...prev, assigned_date: newDate }));
  };

  const handleShowAssignmentForm = () => {
    setShowAssignmentForm(true);
    setFormData({
      staff_member_id: (currentAssignment && currentAssignment.staff_member != null) ? currentAssignment.staff_member : '',
      department_id: currentUser?.profile?.department_id || '',
      time_period: currentAssignment?.time_period || 'BOTH',
      notes: currentAssignment?.notes || '',
      assigned_date: currentAssignment?.assigned_date ? new Date(currentAssignment.assigned_date) : new Date()
    });
  };

  const handleCancelAssignment = () => {
    setShowAssignmentForm(false);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form data
    if (!formData.staff_member_id) {
      setError('Please select a staff member');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert staff_member_id to a number if it's a string
      const staffId = typeof formData.staff_member_id === 'string' 
        ? parseInt(formData.staff_member_id, 10) 
        : formData.staff_member_id;
      
      // Create the assignment data object
      const assignmentData = {
        staff_member_id: staffId,
        department_id: formData.department_id,
        time_period: formData.time_period || 'BOTH',
        notes: formData.notes || '',
        is_active: true,
        // Use the selected date from the date picker
        assigned_date: format(formData.assigned_date, 'yyyy-MM-dd')
      };
      
      console.log('Creating assignment with data:', assignmentData);
      
      // Check for existing assignments with the same time period
      const existingAssignments = allAssignments.filter(a => 
        (a.time_period === assignmentData.time_period || 
         a.time_period === 'BOTH' || 
         assignmentData.time_period === 'BOTH')
      );
      
      // Deactivate any conflicting assignments
      if (existingAssignments.length > 0) {
        try {
          await Promise.all(existingAssignments.map(assignment => 
            updateVerificationAssignment(assignment.id, { is_active: false })
          ));
        } catch (updateErr) {
          console.warn('Failed to update existing assignments, continuing with new assignment:', updateErr);
        }
      }
      
      // Create the new assignment
      const newAssignment = await createVerificationAssignment(assignmentData);
      
      console.log('Assignment created successfully:', newAssignment);
      
      // Refresh the assignments list
      const updatedAssignments = await getAllCurrentAssignments();
      setAllAssignments(updatedAssignments || []);
      
      // Reset the form
      setFormData({
        staff_member_id: '',
        department_id: currentUser?.profile?.department_id || '',
        time_period: 'BOTH',
        notes: ''
      });
      
      // Close the form
      setShowAssignmentForm(false);
    } catch (err) {
      console.error("Failed to create thermometer verification assignment:", err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
      }
      
      setError(
        err.response?.data?.detail || 
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.response?.data) || 
        err.message || 
        'Failed to create assignment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStaffName = (userId) => {
    const staff = staffUsers.find(user => user.id === userId);
    if (staff) {
      if (staff.first_name && staff.last_name) {
        return `${staff.first_name} ${staff.last_name}`;
      }
      return staff.username;
    }
    return 'Unknown Staff';
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AssignmentIndIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="h5" component="h2">
          Thermometer Verification Assignment
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <>
          {showAssignmentForm ? (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assign Staff to Thermometer Verification
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <form onSubmit={handleSubmitAssignment}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="staff-member-label">Staff Member</InputLabel>
                      <Select
                        labelId="staff-member-label"
                        id="staff_member_id"
                        name="staff_member_id"
                        value={formData.staff_member_id}
                        onChange={handleChange}
                        label="Staff Member"
                        required
                      >
                        {staffUsers.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.first_name && user.last_name ? 
                              `${user.first_name} ${user.last_name}` : 
                              user.username}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
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
                        <MenuItem value="BOTH">Both AM and PM</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                        Assignment Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Assignment Date"
                          value={formData.assigned_date}
                          onChange={handleDateChange}
                          minDate={new Date()}
                          maxDate={addDays(new Date(), 30)} // Allow scheduling up to 30 days in advance
                          renderInput={(params) => <TextField {...params} fullWidth />}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      </LocalizationProvider>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Schedule this assignment up to 30 days in advance
                      </Typography>
                    </Box>
                    
                    <TextField
                      name="notes"
                      label="Assignment Notes"
                      value={formData.notes}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                </form>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button 
                  onClick={handleCancelAssignment}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSubmitAssignment}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Assign Staff'}
                </Button>
              </CardActions>
            </Card>
          ) : (
            <>
              {currentAssignment ? (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="h6">
                        Current Assignment
                      </Typography>
                    </Box>
                    
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body1" component="span">
                              <strong>Assigned To:</strong> {getStaffName(currentAssignment.staff_member)}
                            </Typography>
                          }
                          secondary={
                            <Box component="div">
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Department:</strong> {currentAssignment.department_name}
                              </Typography>
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Time Period:</strong> {currentAssignment.time_period === 'AM' ? 'Morning (AM)' : 
                                                                   currentAssignment.time_period === 'PM' ? 'Afternoon (PM)' : 'Both AM and PM'}
                              </Typography>
                              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                <strong>Date Assigned:</strong> {format(new Date(currentAssignment.assigned_date), 'MMMM d, yyyy')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {currentAssignment.notes && (
                        <ListItem>
                          <ListItemText 
                            primary="Notes" 
                            secondary={currentAssignment.notes}
                          />
                        </ListItem>
                      )}
                    </List>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleShowAssignmentForm}
                      sx={{ mt: 2 }}
                    >
                      Change Assignment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No staff member is currently assigned to thermometer verification duties.
                  </Alert>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleShowAssignmentForm}
                  >
                    Assign Staff
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default ThermometerAssignmentManager;
