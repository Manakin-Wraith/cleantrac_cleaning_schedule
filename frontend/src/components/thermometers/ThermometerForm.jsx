import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Button, CircularProgress, Alert, 
  TextField, Grid, Card, CardContent, CardActions, Divider,
  FormControl, InputLabel, MenuItem, Select
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  createThermometer,
  updateThermometer
} from '../../services/thermometerService';
import { getDepartments } from '../../services/departmentService';
import { getCurrentUser } from '../../services/authService';

const ThermometerForm = ({ thermometer, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    model_identifier: '',
    department_id: '',
    // status is intentionally omitted here, will be added for edit mode
  });
  const theme = useTheme();
  const isEditMode = !!thermometer;

  useEffect(() => {
    const fetchUserAndDepartments = async () => {
      try {
        setLoadingDepartments(true);
        
        const userData = await getCurrentUser();
        setUser(userData);
        
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
        
        if (isEditMode && thermometer) {
          setFormData({
            serial_number: thermometer.serial_number || '',
            model_identifier: thermometer.model_identifier || '',
            department_id: thermometer.department_id || '',
            status: thermometer.status || 'needs_verification' // Default status for edit mode if not set
          });
        } else {
          // For new thermometer or if thermometer object is not valid
          setFormData({
            serial_number: '',
            model_identifier: '',
            department_id: userData?.profile?.department_id || '',
            // No status for new thermometers
          });
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError(err.message || 'Failed to load initial data. Please try refreshing.');
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchUserAndDepartments();
  }, [isEditMode, thermometer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form data
    if (!formData.serial_number) {
      setError('Serial number is required');
      return;
    }
    if (!formData.model_identifier) {
      setError('Model identifier is required');
      return;
    }
    if (!formData.department_id) {
      setError('Department is required');
      return;
    }
    // No validation for status if not in edit mode, as it won't be submitted
    
    try {
      setLoading(true);
      
      // Base payload without status
      let payloadToSend = {
        serial_number: formData.serial_number,
        model_identifier: formData.model_identifier,
        department_id: formData.department_id,
      };

      if (isEditMode) {
        // Add status only for edit mode, ensuring it's a valid value from formData
        payloadToSend.status = formData.status || 'needs_verification'; // Fallback if somehow undefined
        await updateThermometer(thermometer.id, payloadToSend);
      } else {
        // For create mode, status is NOT included in payloadToSend
        await createThermometer(payloadToSend);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to save thermometer:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to save thermometer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditMode ? 'Edit Thermometer' : 'Add New Thermometer'}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loadingDepartments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6}>
              <TextField
                name="serial_number"
                label="Serial Number"
                value={formData.serial_number}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
              <TextField
                name="model_identifier"
                label="Model Identifier"
                value={formData.model_identifier}
                onChange={handleChange}
                fullWidth
                required
                helperText="E.g., 110681-1, Zonde, etc."
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  label="Department"
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {isEditMode && (
              <Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status || ''} // Default to empty if undefined
                    onChange={handleChange}
                    label="Status"
                  >
                    {/* Options available in edit mode */}                    
                    <MenuItem value="needs_verification">Needs Verification</MenuItem>
                    <MenuItem value="verified">Verified</MenuItem>
                    <MenuItem value="out_of_service">Out of Service</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  onClick={onCancel}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : isEditMode ? 'Update Thermometer' : 'Add Thermometer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </Paper>
  );
};

export default ThermometerForm;
