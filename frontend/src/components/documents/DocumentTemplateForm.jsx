import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  FormControl, InputLabel, Select, MenuItem, Alert, 
  CircularProgress, FormHelperText
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader, getCurrentUser } from '../../services/authService';

const DocumentTemplateForm = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    template_type: 'general',
    template_file: null
  });
  const [templateTypes, setTemplateTypes] = useState({
    'temperature': 'Temperature Log',
    'cleaning': 'Cleaning Schedule',
    'verification': 'Thermometer Verification',
    'general': 'General Purpose'
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchTemplateTypes();
    fetchDepartments();
    fetchCurrentUser();
  }, []);

  const fetchTemplateTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/document-templates/types/`, { 
        headers: getAuthHeader() 
      });
      setTemplateTypes(response.data);
    } catch (err) {
      console.error('Error fetching template types:', err);
      setError('Failed to load template types. Please try again.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments/`, { 
        headers: getAuthHeader() 
      });
      setDepartments(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      
      // If user has a department, pre-select it
      if (userData?.profile?.department_id) {
        setFormData(prev => ({
          ...prev,
          department_id: userData.profile.department_id
        }));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setFileError('');
      setFormData(prev => ({ ...prev, template_file: null }));
      return;
    }
    
    // Check if file is an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setFileError('Only Excel files (.xlsx, .xls) are allowed.');
      setFormData(prev => ({ ...prev, template_file: null }));
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size should not exceed 5MB.');
      setFormData(prev => ({ ...prev, template_file: null }));
      return;
    }
    
    setFileError('');
    setFormData(prev => ({ ...prev, template_file: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.department_id || !formData.template_type || !formData.template_file) {
      setError('Please fill in all required fields and upload a template file.');
      return;
    }
    
    if (fileError) {
      setError('Please fix the file error before submitting.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('department_id', formData.department_id);
      submitData.append('template_type', formData.template_type);
      submitData.append('template_file', formData.template_file);
      
      // Submit the form
      await axios.post(`${API_URL}/document-templates/`, submitData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error creating document template:', err);
      setError(err.response?.data?.detail || 'Failed to create template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Add New Document Template
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Template Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                label="Department"
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="template-type-label">Template Type</InputLabel>
              <Select
                labelId="template-type-label"
                name="template_type"
                value={formData.template_type}
                onChange={handleInputChange}
                label="Template Type"
              >
                {Object.entries(templateTypes).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Upload Template File (.xlsx)
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {formData.template_file && (
              <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                File selected: {formData.template_file.name}
              </Typography>
            )}
            {fileError && (
              <FormHelperText error>{fileError}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onCancel}
              startIcon={<CancelIcon />}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Template'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default DocumentTemplateForm;
