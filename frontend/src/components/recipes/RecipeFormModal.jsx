import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  IconButton,
  Box,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RecipeFormModal = ({ open, onClose, onSubmit, recipe, isEditing, departmentColor }) => {
  const initialRecipeState = {
    name: '',
    product_code: '',
    description: '',
    yield: '',
    yield_unit: 'g',
    is_active: true,
    ingredients: []
  };

  const [formData, setFormData] = useState(initialRecipeState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newIngredient, setNewIngredient] = useState({
    ingredient_code: '',
    ingredient_name: '',
    pack_size: '',
    quantity: '',
    unit: 'g',
    cost: ''
  });
  const [ingredientErrors, setIngredientErrors] = useState({});
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isEditing && recipe) {
      // If editing, load recipe details including ingredients
      const loadRecipeDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/recipes/${recipe.id}/`);
          const recipeData = response.data;
          
          // Get ingredients for this recipe
          const ingredientsResponse = await api.get('/recipe-ingredients/', {
            params: { recipe: recipe.id }
          });
          
          setFormData({
            ...recipeData,
            ingredients: ingredientsResponse.data || []
          });
          setError(null);
        } catch (err) {
          console.error('Error loading recipe details:', err);
          setError('Failed to load recipe details. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      loadRecipeDetails();
    } else {
      // If adding new recipe, reset form
      setFormData(initialRecipeState);
    }
  }, [isEditing, recipe, open]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient({
      ...newIngredient,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (ingredientErrors[name]) {
      setIngredientErrors({
        ...ingredientErrors,
        [name]: null
      });
    }
  };

  const validateIngredient = () => {
    const newErrors = {};
    
    if (!newIngredient.ingredient_name.trim()) {
      newErrors.ingredient_name = 'Ingredient name is required';
    }
    
    if (!newIngredient.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(newIngredient.quantity) || Number(newIngredient.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    if (!newIngredient.cost) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(newIngredient.cost) || Number(newIngredient.cost) < 0) {
      newErrors.cost = 'Cost must be a non-negative number';
    }
    
    setIngredientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addIngredient = () => {
    if (validateIngredient()) {
      // Calculate total cost for this ingredient
      const quantity = parseFloat(newIngredient.quantity);
      const cost = parseFloat(newIngredient.cost);
      const totalCost = quantity * cost;
      
      const ingredientToAdd = {
        ...newIngredient,
        total_cost: totalCost
      };
      
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredientToAdd]
      });
      
      // Reset new ingredient form
      setNewIngredient({
        ingredient_code: '',
        ingredient_name: '',
        pack_size: '',
        quantity: '',
        unit: 'g',
        cost: ''
      });
    }
  };

  const removeIngredient = (index) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients.splice(index, 1);
    setFormData({
      ...formData,
      ingredients: updatedIngredients
    });
  };

  const calculateTotalCost = () => {
    if (!formData.ingredients.length) return 0;
    
    const totalCost = formData.ingredients.reduce(
      (sum, ingredient) => sum + parseFloat(ingredient.total_cost || 0), 
      0
    );
    
    return totalCost;
  };

  const calculateUnitCost = () => {
    const totalCost = calculateTotalCost();
    const yield_amount = parseFloat(formData.yield) || 1;
    return totalCost / yield_amount;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required';
    }
    
    if (!formData.product_code.trim()) {
      newErrors.product_code = 'Product code is required';
    }
    
    if (!formData.yield) {
      newErrors.yield = 'Yield is required';
    } else if (isNaN(formData.yield) || Number(formData.yield) <= 0) {
      newErrors.yield = 'Yield must be a positive number';
    }
    
    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Calculate unit cost
      const unitCost = calculateUnitCost();
      
      // Prepare data for submission
      const recipeData = {
        ...formData,
        unit_cost: unitCost,
        department: currentUser?.profile?.department?.id
      };
      
      // Handle ingredients separately if needed
      const ingredients = [...formData.ingredients];
      delete recipeData.ingredients;
      
      // Submit the recipe first
      const success = await onSubmit(recipeData);
      
      if (success && !isEditing) {
        // If this is a new recipe and it was saved successfully,
        // we would need to handle ingredients in a separate call
        // This would be handled by the parent component or API service
      }
      
      onClose();
    } catch (err) {
      console.error('Error submitting recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
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
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Recipe Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="product_code"
                  label="Product Code"
                  value={formData.product_code}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.product_code}
                  helperText={errors.product_code}
                  margin="normal"
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
                  rows={2}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="yield"
                  label="Yield"
                  type="number"
                  value={formData.yield}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.yield}
                  helperText={errors.yield}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <TextField
                          select
                          name="yield_unit"
                          value={formData.yield_unit}
                          onChange={handleInputChange}
                          SelectProps={{
                            native: true,
                          }}
                          sx={{ width: '70px' }}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="units">units</option>
                        </TextField>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Active Recipe"
                  sx={{ mt: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ingredients
                </Typography>
                
                {errors.ingredients && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.ingredients}
                  </Alert>
                )}
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        name="ingredient_code"
                        label="Ingredient Code"
                        value={newIngredient.ingredient_code}
                        onChange={handleIngredientChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        name="ingredient_name"
                        label="Ingredient Name"
                        value={newIngredient.ingredient_name}
                        onChange={handleIngredientChange}
                        fullWidth
                        required
                        error={!!ingredientErrors.ingredient_name}
                        helperText={ingredientErrors.ingredient_name}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        name="pack_size"
                        label="Pack Size"
                        value={newIngredient.pack_size}
                        onChange={handleIngredientChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        name="quantity"
                        label="Quantity"
                        type="number"
                        value={newIngredient.quantity}
                        onChange={handleIngredientChange}
                        fullWidth
                        required
                        error={!!ingredientErrors.quantity}
                        helperText={ingredientErrors.quantity}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <TextField
                                select
                                name="unit"
                                value={newIngredient.unit}
                                onChange={handleIngredientChange}
                                SelectProps={{
                                  native: true,
                                }}
                                sx={{ width: '60px' }}
                                size="small"
                              >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="L">L</option>
                                <option value="units">units</option>
                              </TextField>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        name="cost"
                        label="Unit Cost (R)"
                        type="number"
                        value={newIngredient.cost}
                        onChange={handleIngredientChange}
                        fullWidth
                        required
                        error={!!ingredientErrors.cost}
                        helperText={ingredientErrors.cost}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={addIngredient}
                        sx={{ 
                          bgcolor: departmentColor,
                          '&:hover': {
                            bgcolor: departmentColor,
                            opacity: 0.9
                          }
                        }}
                      >
                        Add Ingredient
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                        <TableCell>Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Pack Size</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Cost (R)</TableCell>
                        <TableCell>Total Cost (R)</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.ingredients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" sx={{ py: 2 }}>
                              No ingredients added yet. Add ingredients above.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.ingredients.map((ingredient, index) => (
                          <TableRow key={index}>
                            <TableCell>{ingredient.ingredient_code || '-'}</TableCell>
                            <TableCell>{ingredient.ingredient_name}</TableCell>
                            <TableCell>{ingredient.pack_size || '-'}</TableCell>
                            <TableCell>{`${ingredient.quantity} ${ingredient.unit}`}</TableCell>
                            <TableCell>R {parseFloat(ingredient.cost).toFixed(2)}</TableCell>
                            <TableCell>R {parseFloat(ingredient.total_cost).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => removeIngredient(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {formData.ingredients.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                            Total Recipe Cost:
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            R {calculateTotalCost().toFixed(2)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                      {formData.ingredients.length > 0 && formData.yield && (
                        <TableRow>
                          <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                            Unit Cost (per {formData.yield_unit}):
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            R {calculateUnitCost().toFixed(2)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || submitting}
          sx={{ 
            bgcolor: departmentColor,
            '&:hover': {
              bgcolor: departmentColor,
              opacity: 0.9
            }
          }}
        >
          {submitting ? <CircularProgress size={24} /> : (isEditing ? 'Update Recipe' : 'Save Recipe')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeFormModal;
