import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  FormHelperText,
  Divider,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProductionRecordFormModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  schedule, 
  departmentColor 
}) => {
  const initialFormState = {
    actual_yield: '',
    quality_rating: 5,
    notes: '',
    issues_encountered: '',
    waste_amount: '0',
    waste_reason: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { currentUser } = useAuth();

  useEffect(() => {
    if (open && schedule) {
      // Pre-populate with scheduled quantity
      setFormData({
        ...initialFormState,
        actual_yield: schedule.quantity.toString()
      });
    }
  }, [open, schedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.actual_yield) {
      newErrors.actual_yield = 'Actual yield is required';
    } else if (isNaN(formData.actual_yield) || parseFloat(formData.actual_yield) < 0) {
      newErrors.actual_yield = 'Actual yield must be a non-negative number';
    }
    
    if (!formData.quality_rating) {
      newErrors.quality_rating = 'Quality rating is required';
    } else if (isNaN(formData.quality_rating) || parseInt(formData.quality_rating) < 1 || parseInt(formData.quality_rating) > 10) {
      newErrors.quality_rating = 'Quality rating must be between 1 and 10';
    }
    
    if (formData.waste_amount && (isNaN(formData.waste_amount) || parseFloat(formData.waste_amount) < 0)) {
      newErrors.waste_amount = 'Waste amount must be a non-negative number';
    }
    
    if (parseFloat(formData.waste_amount) > 0 && !formData.waste_reason) {
      newErrors.waste_reason = 'Waste reason is required when waste amount is specified';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const recordData = {
      actual_yield: parseFloat(formData.actual_yield),
      quality_rating: parseInt(formData.quality_rating),
      notes: formData.notes,
      issues_encountered: formData.issues_encountered,
      completed_by: currentUser.id,
      completed_at: new Date().toISOString()
    };
    
    // If waste was recorded, create a waste record as well
    if (parseFloat(formData.waste_amount) > 0) {
      recordData.waste = {
        amount: parseFloat(formData.waste_amount),
        reason: formData.waste_reason,
        recipe: schedule.recipe,
        department: currentUser?.profile?.department?.id
      };
    }
    
    const success = await onSubmit(recordData);
    if (success) {
      setFormData(initialFormState);
      setErrors({});
    }
  };

  if (!schedule) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Complete Production Record
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Production Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Recipe:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {schedule.recipe_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Date:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled Quantity:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {schedule.quantity} {schedule.recipe_yield_unit}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Production Results
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Yield"
                name="actual_yield"
                value={formData.actual_yield}
                onChange={handleChange}
                type="number"
                InputProps={{ 
                  inputProps: { min: 0, step: "0.1" },
                  endAdornment: schedule.recipe_yield_unit
                }}
                error={!!errors.actual_yield}
                helperText={errors.actual_yield}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quality Rating (1-10)"
                name="quality_rating"
                value={formData.quality_rating}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 1, max: 10, step: 1 } }}
                error={!!errors.quality_rating}
                helperText={errors.quality_rating || "1 = Poor, 10 = Excellent"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Production Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Add any notes about this production run..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issues Encountered"
                name="issues_encountered"
                value={formData.issues_encountered}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Describe any issues or challenges encountered during production..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Waste Recording
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Waste Amount"
                name="waste_amount"
                value={formData.waste_amount}
                onChange={handleChange}
                type="number"
                InputProps={{ 
                  inputProps: { min: 0, step: "0.1" },
                  endAdornment: schedule.recipe_yield_unit
                }}
                error={!!errors.waste_amount}
                helperText={errors.waste_amount}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Waste Reason"
                name="waste_reason"
                value={formData.waste_reason}
                onChange={handleChange}
                disabled={parseFloat(formData.waste_amount) <= 0}
                error={!!errors.waste_reason}
                helperText={errors.waste_reason}
                placeholder="e.g., Quality issues, Overproduction, Expiration..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          startIcon={<CheckCircleIcon />}
          disabled={loading}
          sx={{ 
            bgcolor: departmentColor,
            '&:hover': {
              bgcolor: departmentColor,
              opacity: 0.9
            }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Complete Production'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionRecordFormModal;
