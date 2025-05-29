import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  FormControl, InputLabel, Select, MenuItem, Alert, 
  CircularProgress, FormHelperText, Divider, Chip,
  Stepper, Step, StepLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PreviewIcon from '@mui/icons-material/Preview';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader, getCurrentUser } from '../../services/authService';
import DocumentPreview from './DocumentPreview';

const DocumentGenerationForm = ({ template, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    includeTemperatureLogs: template?.template_type === 'temperature',
    includeCleaningTasks: template?.template_type === 'cleaning',
    includeThermometerVerifications: template?.template_type === 'verification',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [parameters, setParameters] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate form
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    
    // Ensure end date is not before start date
    if (formData.endDate < formData.startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    
    // If we're on the first step, prepare parameters and move to preview
    if (activeStep === 0) {
      // Prepare parameters for document generation
      const newParameters = {
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        includeTemperatureLogs: formData.includeTemperatureLogs,
        includeCleaningTasks: formData.includeCleaningTasks,
        includeThermometerVerifications: formData.includeThermometerVerifications,
      };
      
      setParameters(newParameters);
      setActiveStep(1); // Move to preview step
      return;
    }
    
    // If we're on the preview step, proceed with actual generation
    try {
      setLoading(true);
      setError('');
      
      // Create the document generation request
      const response = await axios.post(`${API_URL}/generated-documents/`, {
        template_id: template.id,
        department_id: user?.profile?.department_id || template.department_id,
        parameters: parameters
      }, {
        headers: getAuthHeader()
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error generating document:', err);
      setError(err.response?.data?.detail || 'Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    setActiveStep(0);
  };

  if (!template) {
    return (
      <Alert severity="error">
        No template selected. Please select a template to generate a document.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          Generate Document from Template
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Template: {template.name}
        </Typography>
        <Chip 
          label={template.template_type_display} 
          size="small" 
          sx={{ mb: 1 }}
          color={
            template.template_type === 'temperature' ? 'primary' :
            template.template_type === 'cleaning' ? 'secondary' :
            template.template_type === 'verification' ? 'warning' : 'default'
          }
        />
        <Typography variant="body2" color="text.secondary">
          {template.description || 'No description provided.'}
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Configure Parameters</StepLabel>
        </Step>
        <Step>
          <StepLabel>Preview & Generate</StepLabel>
        </Step>
      </Stepper>
      
      <Divider sx={{ mb: 3 }} />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {activeStep === 0 ? (
        <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
          
          {template.template_type === 'temperature' && (
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormHelperText>Data to Include</FormHelperText>
                <Grid container>
                  <Grid item xs={12}>
                    <label>
                      <input
                        type="checkbox"
                        name="includeTemperatureLogs"
                        checked={formData.includeTemperatureLogs}
                        onChange={handleInputChange}
                      />
                      {' '}Include Temperature Logs
                    </label>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          )}
          
          {template.template_type === 'cleaning' && (
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormHelperText>Data to Include</FormHelperText>
                <Grid container>
                  <Grid item xs={12}>
                    <label>
                      <input
                        type="checkbox"
                        name="includeCleaningTasks"
                        checked={formData.includeCleaningTasks}
                        onChange={handleInputChange}
                      />
                      {' '}Include Cleaning Tasks
                    </label>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          )}
          
          {template.template_type === 'verification' && (
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormHelperText>Data to Include</FormHelperText>
                <Grid container>
                  <Grid item xs={12}>
                    <label>
                      <input
                        type="checkbox"
                        name="includeThermometerVerifications"
                        checked={formData.includeThermometerVerifications}
                        onChange={handleInputChange}
                      />
                      {' '}Include Thermometer Verifications
                    </label>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          )}
          
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
              startIcon={<PreviewIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Preview Document'}
            </Button>
          </Grid>
        </Grid>
      </form>
      ) : (
        <>
          {parameters && (
            <DocumentPreview 
              template={template} 
              parameters={parameters}
              onProceed={handleSubmit}
              onCancel={handleBack}
            />
          )}
        </>
      )}
    </Paper>
  );
};

export default DocumentGenerationForm;
