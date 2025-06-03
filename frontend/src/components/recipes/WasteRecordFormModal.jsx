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
  FormControlLabel,
  Switch,
  Autocomplete,
  Radio,
  RadioGroup
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

const WasteRecordFormModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  record, 
  isEditing, 
  departmentColor 
}) => {
  const initialFormState = {
    date: new Date(),
    amount: '',
    unit: '',
    reason: '',
    notes: '',
    cost_value: '',
    is_recipe: false,
    recipe: null,
    inventory_item: null,
    source_type: 'inventory'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const { currentUser } = useAuth();

  const wasteReasons = [
    'Spoilage',
    'Expiration',
    'Quality Issues',
    'Overproduction',
    'Processing Error',
    'Damage',
    'Contamination',
    'Equipment Failure',
    'Training/Testing',
    'Other'
  ];

  useEffect(() => {
    if (open) {
      fetchSourceOptions();
      
      if (isEditing && record) {
        setFormData({
          date: new Date(record.date),
          amount: record.amount.toString(),
          unit: record.unit,
          reason: record.reason,
          notes: record.notes || '',
          cost_value: record.cost_value.toString(),
          is_recipe: !!record.recipe,
          recipe: record.recipe || null,
          inventory_item: record.inventory_item || null,
          source_type: record.recipe ? 'recipe' : 'inventory'
        });
        
        if (record.recipe) {
          setSelectedSource({
            id: record.recipe,
            name: record.recipe_name,
            unit: record.unit
          });
        } else if (record.inventory_item) {
          setSelectedSource({
            id: record.inventory_item,
            name: record.inventory_item_name,
            unit: record.unit
          });
        }
      } else {
        setFormData(initialFormState);
        setSelectedSource(null);
      }
    }
  }, [open, isEditing, record]);

  const fetchSourceOptions = async () => {
    setLoading(true);
    try {
      // Fetch recipes
      const recipesResponse = await api.get('/recipes/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      setRecipes(recipesResponse.data.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        unit: recipe.yield_unit,
        cost: recipe.unit_cost
      })));

      // Fetch inventory items
      const inventoryResponse = await api.get('/inventory-items/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      setInventoryItems(inventoryResponse.data.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        cost: item.cost_per_unit
      })));
      
      setFetchError(null);
    } catch (err) {
      console.error('Error fetching source options:', err);
      setFetchError('Failed to load recipes and inventory items. Please try again.');
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
    setFormData(prev => ({ ...prev, date }));
    
    // Clear error when date is updated
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: null }));
    }
  };

  const handleSourceTypeChange = (e) => {
    const sourceType = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      source_type: sourceType,
      recipe: null,
      inventory_item: null,
      unit: ''
    }));
    setSelectedSource(null);
  };

  const handleSourceChange = (event, newValue) => {
    setSelectedSource(newValue);
    
    if (newValue) {
      const sourceType = formData.source_type;
      const sourceField = sourceType === 'recipe' ? 'recipe' : 'inventory_item';
      
      setFormData(prev => ({
        ...prev,
        [sourceField]: newValue.id,
        unit: newValue.unit,
        cost_value: calculateCostValue(prev.amount, newValue.cost)
      }));
      
      // Clear errors
      setErrors(prev => ({
        ...prev,
        [sourceField]: null,
        unit: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipe: null,
        inventory_item: null,
        unit: '',
        cost_value: ''
      }));
    }
  };

  const handleAmountChange = (e) => {
    const amount = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      amount,
      cost_value: calculateCostValue(amount, selectedSource?.cost || 0)
    }));
    
    // Clear error
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  const calculateCostValue = (amount, unitCost) => {
    if (!amount || !unitCost) return '';
    const numAmount = parseFloat(amount);
    const numCost = parseFloat(unitCost);
    
    if (isNaN(numAmount) || isNaN(numCost)) return '';
    
    return (numAmount * numCost).toFixed(2);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }
    
    if (formData.source_type === 'recipe' && !formData.recipe) {
      newErrors.recipe = 'Recipe is required';
    }
    
    if (formData.source_type === 'inventory' && !formData.inventory_item) {
      newErrors.inventory_item = 'Inventory item is required';
    }
    
    if (!formData.cost_value) {
      newErrors.cost_value = 'Cost value is required';
    } else if (isNaN(formData.cost_value) || parseFloat(formData.cost_value) < 0) {
      newErrors.cost_value = 'Cost value must be a non-negative number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const recordData = {
      date: formData.date.toISOString().split('T')[0],
      amount: parseFloat(formData.amount),
      unit: formData.unit,
      reason: formData.reason,
      notes: formData.notes,
      cost_value: parseFloat(formData.cost_value),
      recipe: formData.source_type === 'recipe' ? formData.recipe : null,
      inventory_item: formData.source_type === 'inventory' ? formData.inventory_item : null,
      department: currentUser?.profile?.department?.id,
      recorded_by: currentUser.id
    };
    
    const success = await onSubmit(recordData);
    if (success) {
      setFormData(initialFormState);
      setErrors({});
    }
  };

  const getSourceOptions = () => {
    return formData.source_type === 'recipe' ? recipes : inventoryItems;
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
          {isEditing ? 'Edit Waste Record' : 'Record New Waste'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {fetchError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: { 
                    fullWidth: true,
                    error: !!errors.date,
                    helperText: errors.date
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" gutterBottom>
                Waste Source
              </Typography>
              <RadioGroup
                row
                name="source_type"
                value={formData.source_type}
                onChange={handleSourceTypeChange}
              >
                <FormControlLabel 
                  value="inventory" 
                  control={<Radio />} 
                  label="Inventory Item" 
                />
                <FormControlLabel 
                  value="recipe" 
                  control={<Radio />} 
                  label="Recipe" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Autocomplete
              value={selectedSource}
              onChange={handleSourceChange}
              options={getSourceOptions()}
              getOptionLabel={(option) => `${option.name} (${option.unit})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={formData.source_type === 'recipe' ? "Recipe" : "Inventory Item"}
                  error={!!(errors.recipe || errors.inventory_item)}
                  helperText={errors.recipe || errors.inventory_item}
                  required
                />
              )}
              loading={loading}
              loadingText="Loading options..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              value={formData.amount}
              onChange={handleAmountChange}
              type="number"
              InputProps={{ 
                inputProps: { min: 0, step: "0.01" },
                endAdornment: formData.unit
              }}
              required
              error={!!errors.amount}
              helperText={errors.amount}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cost Value (R)"
              name="cost_value"
              value={formData.cost_value}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              required
              error={!!errors.cost_value}
              helperText={errors.cost_value}
            />
          </Grid>
          
          <Grid item xs={12}>
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
                {wasteReasons.map((reason, index) => (
                  <MenuItem key={index} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
              {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
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
              placeholder="Additional details about this waste record..."
            />
          </Grid>
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
          {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Record' : 'Save Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WasteRecordFormModal;
