import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, CircularProgress, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { 
  getThermometers,
  updateThermometer,
  deleteThermometer
} from '../../services/thermometerService';
import ThermometerForm from './ThermometerForm';

const ThermometerList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [thermometers, setThermometers] = useState([]);
  const [editingThermometer, setEditingThermometer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thermometerToDelete, setThermometerToDelete] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchThermometers();
  }, []);

  const fetchThermometers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getThermometers();
      setThermometers(data);
    } catch (err) {
      console.error("Failed to load thermometers:", err);
      setError(err.message || 'Failed to load thermometers. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditThermometer = (thermometer) => {
    setEditingThermometer(thermometer);
  };

  const handleCancelEdit = () => {
    setEditingThermometer(null);
  };

  const handleUpdateSuccess = () => {
    setEditingThermometer(null);
    fetchThermometers();
  };

  const handleDeleteThermometer = (thermometer) => {
    setThermometerToDelete(thermometer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!thermometerToDelete) return;
    try {
      setLoading(true);
      await deleteThermometer(thermometerToDelete.id);
      fetchThermometers();
    } catch (err) {
      console.error("Failed to delete thermometer:", err);
      setError(err.message || 'Failed to delete thermometer. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setThermometerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setThermometerToDelete(null);
  };

  const getStatusChip = (thermometer) => {
    if (thermometer.status === 'verified') {
      return (
        <Chip 
          label="Verified"
          color="success"
          icon={<VerifiedIcon />}
          size="small"
        />
      );
    } else if (thermometer.status === 'needs_verification') {
      return (
        <Chip 
          label="Needs Verification"
          color="error"
          icon={<ErrorIcon />}
          size="small"
        />
      );
    } else if (thermometer.days_until_expiry && thermometer.days_until_expiry <= 7) {
      return (
        <Chip 
          label={`Expires in ${thermometer.days_until_expiry} days`}
          color="warning"
          icon={<WarningIcon />}
          size="small"
        />
      );
    }
    
    return (
      <Chip 
        label={thermometer.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        size="small"
      />
    );
  };

  if (editingThermometer) {
    return (
      <ThermometerForm 
        thermometer={editingThermometer}
        onCancel={handleCancelEdit}
        onSuccess={handleUpdateSuccess}
      />
    );
  }

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : thermometers.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No thermometers found. Add a thermometer to get started.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell><strong>Serial Number</strong></TableCell>
                <TableCell><strong>Model</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Last Verified</strong></TableCell>
                <TableCell><strong>Expiry Date</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {thermometers.map((thermometer) => (
                <TableRow key={thermometer.id}>
                  <TableCell>{thermometer.serial_number}</TableCell>
                  <TableCell>{thermometer.model_identifier}</TableCell>
                  <TableCell>{thermometer.department_name}</TableCell>
                  <TableCell>{getStatusChip(thermometer)}</TableCell>
                  <TableCell>{thermometer.last_verification_date || 'Never'}</TableCell>
                  <TableCell>
                    {thermometer.verification_expiry_date || 'N/A'}
                    {thermometer.days_until_expiry && thermometer.days_until_expiry <= 7 && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        Expires soon!
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Thermometer">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditThermometer(thermometer)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Thermometer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteThermometer(thermometer)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Thermometer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this thermometer{thermometerToDelete ? ` (Serial: ${thermometerToDelete.serial_number})` : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ThermometerList;
