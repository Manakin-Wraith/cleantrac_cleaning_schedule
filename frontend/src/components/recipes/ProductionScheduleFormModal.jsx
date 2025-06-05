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
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ProductionScheduleFormModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  schedule, 
  isEditing, 
  departmentColor 
}) => {
  const initialFormState = {
    recipe: '',
    scheduled_date: new Date(),
    quantity: '',
    notes: '',
    assigned_to: '',
    status: 'pending'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [recipes, setRecipes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (open) {
      fetchRecipesAndStaff();
      
      if (isEditing && schedule) {
        setFormData({
          recipe: schedule.recipe,
          scheduled_date: new Date(schedule.scheduled_date),
          quantity: schedule.quantity,
          notes: schedule.notes || '',
          assigned_to: schedule.assigned_to || '',
          status: schedule.status
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [open, isEditing, schedule]);

  const fetchRecipesAndStaff = async () => {
    setLoading(true);
    try {
      // Fetch recipes for the department
      const recipesResponse = await api.get('/recipes/', {
        params: { 
          department_id: currentUser?.profile?.department?.id,
          is_active: true
        }
      });
      setRecipes(recipesResponse.data);

      // Fetch staff for the department
      const staffResponse = await api.get('/staff/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      setStaff(staffResponse.data);
      
      setFetchError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setFetchError('Failed to load required data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, scheduled_date: date }));
    
    // Clear error when date is updated
    if (errors.scheduled_date) {
      setErrors(prev => ({ ...prev, scheduled_date: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.recipe) {
      newErrors.recipe = 'Recipe is required';
    }
    
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required';
    } else if (new Date(formData.scheduled_date) < new Date(new Date().setHours(0, 0, 0, 0))) {
      newErrors.scheduled_date = 'Scheduled date cannot be in the past';
    }
    
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const selectedRecipe = recipes.find(r => r.id === formData.recipe);
    
    const scheduleData = {
      recipe: formData.recipe,
      scheduled_date: formData.scheduled_date.toISOString().split('T')[0],
      quantity: parseFloat(formData.quantity),
      notes: formData.notes,
      assigned_to: formData.assigned_to || null,
      status: formData.status,
      department: currentUser?.profile?.department?.id
    };
    
    const success = await onSubmit(scheduleData);
    if (success) {
      setFormData(initialFormState);
      setErrors({});
    }
  };

  const getSelectedRecipeDetails = () => {
    if (!formData.recipe) return null;
    return recipes.find(recipe => recipe.id === formData.recipe);
  };

  const selectedRecipe = getSelectedRecipeDetails();

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
          {isEditing ? 'Edit Production Schedule' : 'Schedule New Production'}
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
        ) : fetchError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.recipe}>
                <InputLabel id="recipe-select-label">Recipe</InputLabel>
                <Select
                  labelId="recipe-select-label"
                  name="recipe"
                  value={formData.recipe}
                  onChange={handleChange}
                  label="Recipe"
                  disabled={isEditing}
                >
                  {recipes.map(recipe => (
                    <MenuItem key={recipe.id} value={recipe.id}>
                      {recipe.name} ({recipe.product_code})
                    </MenuItem>
                  ))}
                </Select>
                {errors.recipe && <FormHelperText>{errors.recipe}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {selectedRecipe && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recipe Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Yield:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecipe.yield} {selectedRecipe.yield_unit}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Unit Cost:
                      </Typography>
                      <Typography variant="body1">
                        R {typeof selectedRecipe.unit_cost === 'number' ? selectedRecipe.unit_cost.toFixed(2) : '0.00'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Total Cost (Estimated):
                      </Typography>
                      <Typography variant="body1">
                        R {formData.quantity && typeof selectedRecipe.unit_cost === 'number' ? (selectedRecipe.unit_cost * parseFloat(formData.quantity)).toFixed(2) : '0.00'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Scheduled Date"
                  value={formData.scheduled_date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      error={!!errors.scheduled_date}
                      helperText={errors.scheduled_date}
                    />
                  )}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      error: !!errors.scheduled_date,
                      helperText: errors.scheduled_date
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                error={!!errors.quantity}
                helperText={errors.quantity}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="assigned-to-label">Assigned To</InputLabel>
                <Select
                  labelId="assigned-to-label"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  label="Assigned To"
                >
                  <MenuItem value="">
                    <em>Not Assigned</em>
                  </MenuItem>
                  {staff.map(person => (
                    <MenuItem key={person.id} value={person.id}>
                      {person.user.first_name} {person.user.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Add any special instructions or notes about this production run..."
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
          disabled={loading}
          sx={{ 
            bgcolor: departmentColor,
            '&:hover': {
              bgcolor: departmentColor,
              opacity: 0.9
            }
          }}
        >
          {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Schedule' : 'Create Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionScheduleFormModal;
