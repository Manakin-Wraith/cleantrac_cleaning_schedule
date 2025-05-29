import React, { useState, useEffect } from 'react';
import Spreadsheet from 'react-spreadsheet';
import * as ExcelJS from 'exceljs';
import { 
  Button, Box, TextField, Typography, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader } from '../../services/authService';
import { getCurrentUser } from '../../services/authService';

const TemplateEditor = ({ templateId, onSave, onCancel }) => {
  const [data, setData] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('verification');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  
  // Load user data and departments
  useEffect(() => {
    const fetchUserAndDepartments = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Set default department if user has one
        if (userData?.profile?.department_id) {
          setDepartmentId(userData.profile.department_id);
        }
        
        // Fetch departments
        const departmentsResponse = await axios.get(`${API_URL}/departments/`, {
          headers: getAuthHeader()
        });
        setDepartments(departmentsResponse.data);
      } catch (error) {
        console.error('Error fetching user or departments:', error);
        setError('Failed to load user data or departments.');
      }
    };
    
    fetchUserAndDepartments();
  }, []);
  
  // Load template if editing existing one
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      // Initialize with empty template structure
      setData(createEmptyTemplate());
    }
  }, [templateId]);
  
  const loadTemplate = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/document-templates/${id}/`, {
        headers: getAuthHeader(),
        responseType: 'arraybuffer'
      });
      
      // Convert Excel to spreadsheet data
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(response.data);
      
      // Get template metadata
      const metadataResponse = await axios.get(`${API_URL}/document-templates/${id}/`, {
        headers: getAuthHeader()
      });
      
      setTemplateName(metadataResponse.data.name);
      setTemplateType(metadataResponse.data.template_type || 'verification');
      setDepartmentId(metadataResponse.data.department_id);
      
      // Convert first worksheet to spreadsheet data
      const worksheet = workbook.getWorksheet(1);
      const spreadsheetData = [];
      
      worksheet.eachRow((row, rowIndex) => {
        const dataRow = [];
        row.eachCell((cell, colIndex) => {
          dataRow.push({ value: cell.value?.toString() || '' });
        });
        spreadsheetData[rowIndex - 1] = dataRow;
      });
      
      setData(spreadsheetData);
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Failed to load template. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }
    
    if (!departmentId) {
      setError('Please select a department');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Convert spreadsheet data to Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      // Add data to worksheet
      data.forEach((row, rowIndex) => {
        if (!row) return; // Skip undefined rows
        
        const excelRow = worksheet.getRow(rowIndex + 1);
        row.forEach((cell, colIndex) => {
          if (cell) {
            excelRow.getCell(colIndex + 1).value = cell.value || '';
          }
        });
      });
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('name', templateName);
      formData.append('template_type', templateType);
      formData.append('department_id', departmentId);
      formData.append('template_file', new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      }), `${templateName.replace(/\s+/g, '_')}.xlsx`);
      
      // Save to server
      const url = templateId 
        ? `${API_URL}/document-templates/${templateId}/` 
        : `${API_URL}/document-templates/`;
      
      const method = templateId ? 'put' : 'post';
      
      await axios({
        method,
        url,
        data: formData,
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Template saved successfully');
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const createEmptyTemplate = () => {
    // Create a basic structure for thermometer verification form
    // 20 rows x 10 columns of empty cells
    return Array(20).fill().map(() => Array(10).fill().map(() => ({ value: '' })));
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Template Editor</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          required
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="template-type-label">Template Type</InputLabel>
          <Select
            labelId="template-type-label"
            value={templateType}
            label="Template Type"
            onChange={(e) => setTemplateType(e.target.value)}
            required
          >
            <MenuItem value="verification">Thermometer Verification</MenuItem>
            <MenuItem value="temperature">Temperature Log</MenuItem>
            <MenuItem value="cleaning">Cleaning Schedule</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="department-label">Department</InputLabel>
          <Select
            labelId="department-label"
            value={departmentId}
            label="Department"
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ border: '1px solid #ddd', p: 1, overflowX: 'auto' }}>
          <Spreadsheet 
            data={data} 
            onChange={setData}
          />
        </Box>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={saveTemplate}
          disabled={loading}
        >
          Save Template
        </Button>
      </Box>
    </Box>
  );
};

export default TemplateEditor;
