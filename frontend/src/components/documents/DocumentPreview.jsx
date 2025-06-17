import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, Alert,
  Button, Divider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { API_URL } from '../../config';
import axios from 'axios';
import { getAuthHeader } from '../../services/authService';

/**
 * Component for previewing document data before final generation
 */
const DocumentPreview = ({ template, parameters, onProceed, onCancel }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationResults, setValidationResults] = useState(null);

  useEffect(() => {
    fetchPreviewData();
  }, [template, parameters]);

  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      setError('');

      // Request preview data from the backend
      const response = await axios.post(
        `${API_URL}/document-templates/${template.id}/preview/`, 
        { parameters },
        { headers: getAuthHeader() }
      );
      
      setPreviewData(response.data.preview_data);
      setValidationResults(response.data.validation_results);
    } catch (err) {
      console.error('Error fetching preview data:', err);
      setError(err.response?.data?.detail || 'Failed to generate preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getValidationStatusIcon = (isValid) => {
    return isValid ? 
      <CheckCircleIcon color="success" fontSize="small" /> : 
      <ErrorIcon color="error" fontSize="small" />;
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PreviewIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          Document Preview
        </Typography>
      </Box>

      <Typography variant="subtitle1" gutterBottom>
        Template: {template.name}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Preview of data that will be included in the generated document.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Validation Results */}
      {validationResults && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Validation Results
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Check</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(validationResults.checks).map(([check, result]) => (
                  <TableRow key={check}>
                    <TableCell>{check}</TableCell>
                    <TableCell>
                      {getValidationStatusIcon(result.passed)}
                    </TableCell>
                    <TableCell>{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {!validationResults.is_valid && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              There are validation issues with this document. You can still proceed, but the generated document may not contain all expected data.
            </Alert>
          )}
        </Box>
      )}

      {/* Preview Data */}
      {previewData && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Data Preview
          </Typography>
          
          {template.template_type === 'verification' && previewData.verifications && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Thermometer</TableCell>
                    <TableCell>Verified By</TableCell>
                    <TableCell>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.verifications.slice(0, 5).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.thermometer}</TableCell>
                      <TableCell>{record.verified_by}</TableCell>
                      <TableCell>{record.reading}</TableCell>
                    </TableRow>
                  ))}
                  {previewData.verifications.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          ... and {previewData.verifications.length - 5} more records
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {template.template_type === 'temperature' && previewData.temperature_logs && (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Area/Unit</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Temperature</TableCell>
                      <TableCell>Target Range</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.temperature_logs.slice(0, 5).map((log, index) => {
                      // Determine temperature status
                      let status = 'Unknown';
                      let statusColor = 'inherit';
                      
                      if (log.in_range === true) {
                        status = 'Within Range';
                        statusColor = 'success.main';
                      } else if (log.in_range === false) {
                        status = 'Out of Range';
                        statusColor = 'error.main';
                      }
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>{log.area_name}</TableCell>
                          <TableCell>{log.time_period}</TableCell>
                          <TableCell>
                            <Typography 
                              sx={{ 
                                color: log.in_range === false ? 'error.main' : 'inherit',
                                fontWeight: log.in_range === false ? 'bold' : 'normal'
                              }}
                            >
                              {log.temperature}°C
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.min_temp && log.max_temp ? 
                              `${log.min_temp}°C - ${log.max_temp}°C` : 
                              'Not set'}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: statusColor }}>
                              {status}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {previewData.temperature_logs.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            ... and {previewData.temperature_logs.length - 5} more temperature logs
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Temperature Summary */}
              {previewData.temperature_summary && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Temperature Summary
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Readings
                      </Typography>
                      <Typography variant="h6">
                        {previewData.temperature_summary.total_readings}
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        Within Range
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {previewData.temperature_summary.in_range_count} 
                        ({Math.round(previewData.temperature_summary.in_range_percentage)}%)
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        Out of Range
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {previewData.temperature_summary.out_of_range_count}
                        ({Math.round(previewData.temperature_summary.out_of_range_percentage)}%)
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
              
              {/* HMR Temperature Checklist specific information */}
              {template.name.includes('HMR') && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    HMR Temperature Checklist Format
                  </Typography>
                  <Typography variant="body2">
                    The generated document will follow the HMR Temperature checklist format with:
                    <ul>
                      <li>Color-coded temperature readings (red for out-of-range)</li>
                      <li>Organized by date and area</li>
                      <li>Target temperature ranges included</li>
                      <li>Staff information and thermometer details</li>
                    </ul>
                  </Typography>
                </Alert>
              )}
            </>
          )}
          
          {template.template_type === 'cleaning' && previewData.cleaning_tasks && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Task</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.cleaning_tasks.slice(0, 5).map((task, index) => (
                    <TableRow key={index}>
                      <TableCell>{task.date}</TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.status}</TableCell>
                      <TableCell>{task.assigned_to}</TableCell>
                    </TableRow>
                  ))}
                  {previewData.cleaning_tasks.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          ... and {previewData.cleaning_tasks.length - 5} more tasks
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {(!previewData.verifications && !previewData.cleaning_tasks && !previewData.temperature_logs) && (
            <Alert severity="info">
              No preview data available. The document will be generated based on the selected parameters.
            </Alert>
          )}

          {previewData.sections && previewData.sections.length === 0 && (
            <Alert severity="info">No preview data available.</Alert>
          )}
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          startIcon={<ErrorIcon />}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={onProceed}
          startIcon={<CheckCircleIcon />}
          disabled={validationResults && !validationResults.is_valid && validationResults.has_critical_issues}
        >
          Proceed with Generation
        </Button>
      </Box>
    </Paper>
  );
};

export default DocumentPreview;
