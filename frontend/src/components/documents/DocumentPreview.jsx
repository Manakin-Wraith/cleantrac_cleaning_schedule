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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Preview
          </Typography>

          {previewData.sections.map((section, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {section.title}
              </Typography>
              
              {section.data && section.data.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {section.columns.map((column, colIndex) => (
                          <TableCell key={colIndex}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {section.data.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {section.columns.map((column, colIndex) => (
                            <TableCell key={colIndex}>
                              {row[column] !== undefined ? String(row[column]) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No data available for this section.</Alert>
              )}
              
              {section.data && section.data.length > 5 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Showing 5 of {section.data.length} rows...
                </Typography>
              )}
            </Box>
          ))}

          {previewData.sections.length === 0 && (
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
