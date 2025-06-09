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
    status: 'scheduled'
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
    } else {
      // Reset form and errors when modal is closed
      setFormData(initialFormState);
      setErrors({});
      setFetchError(null);
      // Consider resetting submitError here if it's part of this modal's state
      // setSubmitError(null); 
    }
  }, [open]); // schedule and isEditing are used within fetchRecipesAndStaff

  const fetchRecipesAndStaff = async () => {
    // Pass `isEditing` and `schedule` if they are needed from the outer scope and not directly available
    // For now, assuming they are accessible from the component's scope where fetchRecipesAndStaff is defined.
    setLoading(true);
    
    if (isEditing && schedule) {
      console.log('Schedule data:', JSON.stringify(schedule, null, 2));
    }
    
    try {
      // Fetch recipes for the department
      const recipesResponse = await api.get('/recipes/', {
        params: { 
          department_id: currentUser?.profile?.department?.id,
          is_active: true
        }
      });
      
      // Log recipes response for debugging
      console.log('Recipes loaded:', recipesResponse.data.length);
      console.log('Recipe IDs:', recipesResponse.data.map(r => r.id));
      
      // Fetch staff for the department
      const staffResponse = await api.get('/users/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      
      // Update state with fetched data
      setRecipes(recipesResponse.data);
      setStaff(staffResponse.data);
      setFetchError(null); // Clear previous fetch error

      // Now that recipes and staff are fetched, set form data
      if (isEditing && schedule) {
        const recipeId = schedule.recipe_details?.id || '';
        console.log('Setting recipe ID:', recipeId);
        
        // Verify the recipe ID exists in the fetched recipes
        const recipeExists = recipesResponse.data.some(recipe => recipe.id === recipeId);
        console.log('Recipe exists in options:', recipeExists);
        
        // If recipe doesn't exist in options but we have a valid ID, add it to the recipes array
        if (!recipeExists && recipeId && schedule.recipe_details) {
          console.log('Adding missing recipe to options:', schedule.recipe_details);
          setRecipes(prevRecipes => [...prevRecipes, schedule.recipe_details]);
        }
        
        setFormData({
          recipe: recipeId, // Always set the recipe ID from the schedule
          scheduled_date: schedule.scheduled_date ? new Date(schedule.scheduled_date) : new Date(),
          quantity: schedule.batch_size || '',
          notes: schedule.notes || '',
          assigned_to: schedule.assigned_staff_details?.[0]?.id || schedule.assigned_to || '', 
          status: schedule.status || 'scheduled'
        });
      } else if (!isEditing) { // If opening for a new schedule, ensure it's reset after fetches
        setFormData(initialFormState);
      }
      setErrors({}); // Reset validation errors after successful data load and form setup
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

  const titleId = 'production-schedule-dialog-title';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby={titleId}
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle id={titleId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isEditing ? 'Edit Production Schedule' : 'Schedule New Production'}
          </Typography>
          <IconButton 
            aria-label="close"
            onClick={onClose}
            size="small"
            // sx prop for IconButton can be removed if default positioning is fine, or adjusted
          >
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
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
            <Box sx={{ gridColumn: 'span 2' }}>
              <FormControl fullWidth error={!!errors.recipe}>
                <InputLabel id="recipe-select-label">Recipe</InputLabel>
                <Select
                  labelId="recipe-select-label"
                  name="recipe"
                  value={recipes.length > 0 ? formData.recipe : ''}
                  onChange={handleChange}
                  label="Recipe"
                  disabled={isEditing}
                >
                  {recipes.length === 0 ? (
                    <MenuItem value="">Loading recipes...</MenuItem>
                  ) : (
                    recipes.map(recipe => (
                      <MenuItem key={recipe.id} value={recipe.id}>
                        {recipe.name} ({recipe.product_code})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.recipe && <FormHelperText>{errors.recipe}</FormHelperText>}
              </FormControl>
            </Box>
            
            {selectedRecipe && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recipe Details
                  </Typography>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Yield:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecipe.yield} {selectedRecipe.yield_unit}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Unit Cost:
                      </Typography>
                      <Typography variant="body1">
                        R {typeof selectedRecipe.unit_cost === 'number' ? selectedRecipe.unit_cost.toFixed(2) : '0.00'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Cost (Estimated):
                      </Typography>
                      <Typography variant="body1">
                        R {formData.quantity && typeof selectedRecipe.unit_cost === 'number' ? (selectedRecipe.unit_cost * parseFloat(formData.quantity)).toFixed(2) : '0.00'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            
            <Box>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Scheduled Date"
                  value={formData.scheduled_date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      error: !!errors.scheduled_date,
                      helperText: errors.scheduled_date
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
            
            <Box>
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
            </Box>
            
            <Box>
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
                      {person.user ? `${person.user.first_name || ''} ${person.user.last_name || ''}`.trim() : person.first_name ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Unknown Staff'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box>
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
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ gridColumn: 'span 2' }}>
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
            </Box>
          </Box>
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
