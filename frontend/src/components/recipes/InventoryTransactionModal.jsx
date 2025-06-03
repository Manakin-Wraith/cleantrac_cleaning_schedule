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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InventoryTransactionModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  item, 
  transactionType, 
  departmentColor 
}) => {
  const initialFormState = {
    quantity: '',
    reason: '',
    notes: '',
    reference: '',
    supplier_invoice: '',
    recipe: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recipes, setRecipes] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (open && item) {
      setFormData(initialFormState);
      fetchRecipes();
    }
  }, [open, item, transactionType]);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/api/recipes/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      setRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    } else if (transactionType === 'remove' && parseFloat(formData.quantity) > parseFloat(item.current_stock)) {
      newErrors.quantity = `Cannot remove more than current stock (${item.current_stock} ${item.unit})`;
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const transactionData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      transaction_type: transactionType,
      inventory_item: item.id,
      department: currentUser?.profile?.department?.id,
      created_by: currentUser.id
    };
    
    const success = await onSubmit(transactionData);
    if (success) {
      setFormData(initialFormState);
      setErrors({});
    }
  };

  const getReasonOptions = () => {
    if (transactionType === 'add') {
      return [
        'Purchase',
        'Return to Inventory',
        'Stock Adjustment',
        'Transfer In',
        'Initial Stock',
        'Other'
      ];
    } else {
      return [
        'Production Use',
        'Spoilage',
        'Expiration',
        'Damage',
        'Transfer Out',
        'Stock Adjustment',
        'Other'
      ];
    }
  };

  if (!item) return null;

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
          {transactionType === 'add' ? 'Add Stock' : 'Remove Stock'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Item Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Item:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {item.name} ({item.item_code})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Current Stock:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {parseFloat(item.current_stock).toFixed(2)} {item.unit}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Cost per Unit:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    R {parseFloat(item.cost_per_unit).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Quantity to ${transactionType === 'add' ? 'Add' : 'Remove'}`}
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              type="number"
              InputProps={{ 
                inputProps: { min: 0, step: "0.01" },
                endAdornment: item.unit,
                startAdornment: transactionType === 'add' ? <AddCircleIcon color="success" sx={{ mr: 1 }} /> : <RemoveCircleIcon color="error" sx={{ mr: 1 }} />
              }}
              required
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.reason}>
              <InputLabel id="reason-label">Reason</InputLabel>
              <Select
                labelId="reason-label"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                label="Reason"
              >
                <MenuItem value="">
                  <em>Select a reason</em>
                </MenuItem>
                {getReasonOptions().map((reason, index) => (
                  <MenuItem key={index} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
              {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {transactionType === 'add' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Invoice"
                name="supplier_invoice"
                value={formData.supplier_invoice}
                onChange={handleChange}
                placeholder="Invoice number or reference"
              />
            </Grid>
          )}
          
          {transactionType === 'remove' && formData.reason === 'Production Use' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="recipe-label">Recipe</InputLabel>
                <Select
                  labelId="recipe-label"
                  name="recipe"
                  value={formData.recipe}
                  onChange={handleChange}
                  label="Recipe"
                >
                  <MenuItem value="">
                    <em>Select a recipe</em>
                  </MenuItem>
                  {recipes.map(recipe => (
                    <MenuItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} sm={formData.reason === 'Production Use' && transactionType === 'remove' ? 6 : 12}>
            <TextField
              fullWidth
              label="Reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Optional reference number or code"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Additional details about this transaction..."
            />
          </Grid>
          
          {transactionType === 'add' && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  After saving, the current stock will be {parseFloat(item.current_stock) + (parseFloat(formData.quantity) || 0)} {item.unit}
                </Typography>
              </Alert>
            </Grid>
          )}
          
          {transactionType === 'remove' && (
            <Grid item xs={12}>
              <Alert severity={parseFloat(formData.quantity) > parseFloat(item.current_stock) ? "error" : "info"}>
                <Typography variant="body2">
                  After saving, the current stock will be {Math.max(0, parseFloat(item.current_stock) - (parseFloat(formData.quantity) || 0))} {item.unit}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
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
          {loading ? <CircularProgress size={24} /> : transactionType === 'add' ? 'Add Stock' : 'Remove Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryTransactionModal;
