import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select, List, ListItem, ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { format } from 'date-fns';
import { 
  getVerificationAssignments, 
  createVerificationAssignment,
  updateVerificationAssignment,
  getCurrentAssignment
} from '../../services/thermometerService';
import { getUsers } from '../../services/userService';
import { getCurrentUser } from '../../services/authService';

const ThermometerAssignmentManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    staff_member_id: '',
    department_id: '',
    notes: ''
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
        
        // Get current thermometer verification assignment
        try {
          const assignmentData = await getCurrentAssignment();
          setCurrentAssignment(assignmentData);
        } catch (assignmentErr) {
          // It's okay if there's no current assignment
          console.log('No current thermometer verification assignment found');
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

  const handleShowAssignmentForm = () => {
    setShowAssignmentForm(true);
    setFormData({
      staff_member_id: (currentAssignment && currentAssignment.staff_member != null) ? currentAssignment.staff_member : '',
      department_id: currentUser?.profile?.department_id || '',
      notes: currentAssignment?.notes || ''
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
        notes: formData.notes || '',
        is_active: true,
        // Add date in YYYY-MM-DD format to avoid datetime issues
        assignment_date: format(new Date(), 'yyyy-MM-dd')
      };
      
      console.log('Creating assignment with data:', assignmentData);
      
      if (currentAssignment) {
        // If there's a current assignment, update it to inactive first
        try {
          await updateVerificationAssignment(currentAssignment.id, {
            is_active: false
          });
        } catch (updateErr) {
          console.warn('Failed to update existing assignment, continuing with new assignment:', updateErr);
        }
      }
      
      // Create the new assignment
      const newAssignment = await createVerificationAssignment(assignmentData);
      
      console.log('Assignment created successfully:', newAssignment);
      setCurrentAssignment(newAssignment);
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
                    <FormControl fullWidth required>
                      <InputLabel id="staff-member-label">Staff Member</InputLabel>
                      <Select
                        labelId="staff-member-label"
                        name="staff_member_id"
                        value={formData.staff_member_id}
                        onChange={handleChange}
                        label="Staff Member"
                      >
                        {staffUsers.map(staff => (
                          <MenuItem key={staff.id} value={staff.id}>
                            {staff.first_name && staff.last_name 
                              ? `${staff.first_name} ${staff.last_name}` 
                              : staff.username}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
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
                          primary="Assigned Staff" 
                          secondary={getStaffName(currentAssignment.staff_member)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Assigned Date" 
                          secondary={new Date(currentAssignment.assigned_date).toLocaleDateString()}
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
