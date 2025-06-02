import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Autocomplete
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SupplierFormModal = ({ open, onClose, onSave, supplier }) => {
  const [formData, setFormData] = useState({
    supplier_code: '',
    supplier_name: '',
    contact_info: '',
    address: '',
    country_of_origin: 'South Africa',
    department_id: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [countryOptions] = useState([
    'South Africa', 'United States', 'United Kingdom', 'China', 'Germany', 
    'France', 'Japan', 'Australia', 'Canada', 'Brazil', 'India'
  ]);
  
  const { currentUser } = useAuth();
  
  // Fetch departments for superusers who can assign to any department
  useEffect(() => {
    if (open && currentUser?.is_superuser) {
      const fetchDepartments = async () => {
        try {
          const response = await api.get('/departments/');
          setDepartments(response.data);
        } catch (err) {
          console.error('Error fetching departments:', err);
        }
      };
      fetchDepartments();
    }
  }, [open, currentUser]);
  
  // Set form data when editing an existing supplier
  useEffect(() => {
    // Get the department ID from the user's profile
    // The department information is directly in the profile object, not nested under department
    const userDepartmentId = currentUser?.profile?.department_id;
    console.log('User department ID (from profile.department_id):', userDepartmentId);
    console.log('User department name (from profile.department_name):', currentUser?.profile?.department_name);
    console.log('Full user profile:', currentUser?.profile);
    
    if (supplier) {
      // Editing an existing supplier
      const departmentId = supplier.department_id || userDepartmentId || '';
      console.log('Setting department_id for existing supplier:', departmentId);
      
      setFormData({
        supplier_code: supplier.supplier_code || '',
        supplier_name: supplier.supplier_name || '',
        contact_info: supplier.contact_info || '',
        address: supplier.address || '',
        country_of_origin: supplier.country_of_origin || 'South Africa',
        department_id: departmentId
      });
    } else {
      // Creating a new supplier
      console.log('Setting department_id for new supplier:', userDepartmentId);
      
      setFormData({
        supplier_code: '',
        supplier_name: '',
        contact_info: '',
        address: '',
        country_of_origin: 'South Africa',
        department_id: userDepartmentId || ''
      });
    }
    setErrors({});
  }, [supplier, open, currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleCountryChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      country_of_origin: newValue || 'South Africa'
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.supplier_code.trim()) {
      newErrors.supplier_code = 'Supplier code is required';
    }
    
    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier name is required';
    }
    
    // Department is required for all users
    // Check if department_id is available either in form data or from user profile
    if (!formData.department_id && !currentUser?.profile?.department_id) {
      newErrors.department_id = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Prepare data for API
      // Get department_id from form or from user profile
      const departmentId = formData.department_id || currentUser?.profile?.department_id;
      
      // Log detailed information about department ID
      console.log('Department ID from form:', formData.department_id);
      console.log('Department ID from user profile:', currentUser?.profile?.department_id);
      console.log('Department name from user profile:', currentUser?.profile?.department_name);
      console.log('Selected department ID:', departmentId);
      
      const supplierData = {
        ...formData,
        department_id: departmentId
      };
      
      // Convert department_id to number if it's a string
      if (supplierData.department_id && typeof supplierData.department_id === 'string') {
        supplierData.department_id = parseInt(supplierData.department_id, 10);
      }
      
      // Ensure department_id is included and is a number
      if (!supplierData.department_id) {
        throw new Error('Department ID is required but not available');
      }
      
      console.log('Final supplier data being sent to API:', supplierData);
      console.log('department_id type:', typeof supplierData.department_id);
      
      await onSave(supplierData);
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
      
      // Handle validation errors from the API
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          setErrors(error.response.data.errors);
          console.log('API validation errors:', error.response.data.errors);
        } else if (error.response.data.message) {
          setErrors({ general: error.response.data.message });
          console.log('API error message:', error.response.data.message);
        } else {
          console.error('API error response:', error.response.data);
          console.error('Error status:', error.response?.status);
          console.error('Error headers:', error.response?.headers);
          setErrors({ general: 'Failed to save supplier. Please check the console for details.' });
        }
      } else {
        // Generic error
        setErrors({ general: error.message || 'Failed to save supplier. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="supplier_code"
                label="Supplier Code *"
                fullWidth
                value={formData.supplier_code}
                onChange={handleChange}
                error={!!errors.supplier_code}
                helperText={errors.supplier_code || 'Unique code for this supplier'}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="supplier_name"
                label="Supplier Name *"
                fullWidth
                value={formData.supplier_name}
                onChange={handleChange}
                error={!!errors.supplier_name}
                helperText={errors.supplier_name}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="contact_info"
                label="Contact Information"
                fullWidth
                multiline
                rows={2}
                value={formData.contact_info}
                onChange={handleChange}
                helperText="Phone numbers, email addresses, contact person names"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                fullWidth
                multiline
                rows={3}
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={formData.country_of_origin}
                onChange={handleCountryChange}
                options={countryOptions}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country of Origin"
                    helperText="Default: South Africa"
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.department_id}>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleChange}
                  label="Department"
                  disabled={!currentUser?.is_superuser} // Only superusers can change department
                >
                  {/* For regular managers, show only their department */}
                  {!currentUser?.is_superuser && currentUser?.profile?.department_id && (
                    <MenuItem value={currentUser.profile.department_id}>
                      {currentUser.profile.department_name || `Department ${currentUser.profile.department_id}`}
                    </MenuItem>
                  )}
                  
                  {/* For superusers, show all departments */}
                  {currentUser?.is_superuser && departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department_id && (
                  <Typography variant="caption" color="error">
                    {errors.department_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierFormModal;
