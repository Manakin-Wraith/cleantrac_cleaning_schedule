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
  Autocomplete,
  Checkbox,
  Chip
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
    department_ids: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [countryOptions] = useState([
    'South Africa', 'United States', 'United Kingdom', 'China', 'Germany', 
    'France', 'Japan', 'Australia', 'Canada', 'Brazil', 'India'
  ]);
  
  const { currentUser } = useAuth();
  
  // Fetch all departments when the modal opens
  useEffect(() => {
    if (open) {
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
  }, [open]);
  
  // Set form data when editing an existing supplier
  useEffect(() => {
    // Get the department ID from the user's profile
    const userDepartmentId = currentUser?.profile?.department_id;
    
    if (supplier) {
      // Editing an existing supplier
      const departmentIds = supplier.department_ids || [];
      console.log('Setting department_ids for existing supplier:', departmentIds);
      
      setFormData({
        supplier_code: supplier.supplier_code || '',
        supplier_name: supplier.supplier_name || '',
        contact_info: supplier.contact_info || '',
        address: supplier.address || '',
        country_of_origin: supplier.country_of_origin || 'South Africa',
        department_ids: departmentIds
      });
    } else {
      // Creating a new supplier
      // For new suppliers, pre-select the user's department if they're not a superuser
      const initialDepartmentIds = userDepartmentId && !currentUser?.is_superuser ? [userDepartmentId] : [];
      console.log('Setting department_ids for new supplier:', initialDepartmentIds);
      
      setFormData({
        supplier_code: '',
        supplier_name: '',
        contact_info: '',
        address: '',
        country_of_origin: 'South Africa',
        department_ids: initialDepartmentIds
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
    
    // At least one department is required
    if (!formData.department_ids || formData.department_ids.length === 0) {
      newErrors.department_ids = 'At least one department must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Prepare data for API
      // If user is not a superuser and no departments are selected, add their department
      let departmentIds = [...formData.department_ids];
      if (departmentIds.length === 0 && !currentUser?.is_superuser && currentUser?.profile?.department_id) {
        departmentIds = [currentUser.profile.department_id];
      }
      
      console.log('Selected department IDs:', departmentIds);
      
      const supplierData = {
        ...formData,
        department_ids: departmentIds
      };
      
      // Convert any string department IDs to numbers
      supplierData.department_ids = supplierData.department_ids.map(id => 
        typeof id === 'string' ? parseInt(id, 10) : id
      );
      
      // Ensure at least one department is selected
      if (supplierData.department_ids.length === 0) {
        throw new Error('At least one department must be selected');
      }
      
      console.log('Final supplier data being sent to API:', supplierData);
      
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
                slotProps={{
                  textField: {
                    label: "Country of Origin",
                    helperText: "Default: South Africa",
                    disabled: loading
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.department_ids}>
                <InputLabel id="departments-label">Departments</InputLabel>
                <Select
                  labelId="departments-label"
                  name="department_ids"
                  multiple
                  value={formData.department_ids || []}
                  onChange={handleChange}
                  label="Departments"
                  disabled={!currentUser?.is_superuser && !currentUser?.profile?.is_manager}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const dept = departments.find(d => d.id === value);
                        return <Chip key={value} label={dept ? dept.name : value} />
                      })}
                    </Box>
                  )}
                >
                  {/* For regular managers, show only their department if no departments are loaded */}
                  {departments.length === 0 && !currentUser?.is_superuser && currentUser?.profile?.department_id && (
                    <MenuItem value={currentUser.profile.department_id}>
                      <Checkbox checked={formData.department_ids.indexOf(currentUser.profile.department_id) > -1} />
                      {currentUser.profile.department_name || `Department ${currentUser.profile.department_id}`}
                    </MenuItem>
                  )}
                  
                  {/* Show all available departments */}
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>
                      <Checkbox checked={formData.department_ids.indexOf(dept.id) > -1} />
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department_ids && (
                  <Typography variant="caption" color="error">
                    {errors.department_ids}
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
