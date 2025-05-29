import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardActions, Button, Grid,
  Chip, CircularProgress, Alert, Divider, IconButton, Tooltip,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeader } from '../../services/authService';

const DocumentTemplateList = ({ onGenerateDocument }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [templateTypes, setTemplateTypes] = useState({});
  const theme = useTheme();

  useEffect(() => {
    fetchTemplates();
    fetchTemplateTypes();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = `${API_URL}/document-templates/`;
      if (templateType) {
        url += `?template_type=${templateType}`;
      }
      
      const response = await axios.get(url, { headers: getAuthHeader() });
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching document templates:', err);
      setError('Failed to load document templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/document-templates/types/`, { 
        headers: getAuthHeader() 
      });
      setTemplateTypes(response.data);
    } catch (err) {
      console.error('Error fetching template types:', err);
    }
  };

  const handleTypeChange = (event) => {
    setTemplateType(event.target.value);
    // Refetch templates with the new type filter
    fetchTemplates();
  };

  const handleDownload = (template) => {
    // Create a link to download the template file
    const link = document.createElement('a');
    link.href = template.template_file;
    link.download = template.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/document-templates/${templateId}/`, {
        headers: getAuthHeader()
      });
      // Refresh the template list
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="template-type-label">Filter by Type</InputLabel>
          <Select
            labelId="template-type-label"
            value={templateType}
            label="Filter by Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(templateTypes).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {templates.length === 0 ? (
        <Alert severity="info">
          No document templates found. Click "Add Template" to create your first template.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={template.template_type_display} 
                    size="small" 
                    sx={{ mb: 2 }}
                    color={
                      template.template_type === 'temperature' ? 'primary' :
                      template.template_type === 'cleaning' ? 'secondary' :
                      template.template_type === 'verification' ? 'warning' : 'default'
                    }
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description || 'No description provided.'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" display="block">
                    Department: {template.department_name}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Created by: {template.created_by_username}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Last updated: {new Date(template.updated_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Download Template">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownload(template)}
                        color="primary"
                      >
                        <CloudDownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Template">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(template.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => onGenerateDocument(template)}
                  >
                    Generate Document
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DocumentTemplateList;
