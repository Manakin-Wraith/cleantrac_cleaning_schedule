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
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InventoryFormModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  item, 
  isEditing, 
  departmentColor 
}) => {
  const initialFormState = {
    item_code: '',
    name: '',
    description: '',
    category: '',
    supplier: '',
    unit: '',
    pack_size: '',
    cost_per_unit: '',
    current_stock: '0',
    reorder_level: '0',
    location: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState(['kg', 'g', 'l', 'ml', 'ea', 'cs', 'dz', 'lb', 'oz']);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      fetchCategories();
      
      if (isEditing && item) {
        setFormData({
          item_code: item.item_code || '',
          name: item.name || '',
          description: item.description || '',
          category: item.category || '',
          supplier: item.supplier || '',
          unit: item.unit || '',
          pack_size: item.pack_size || '',
          cost_per_unit: item.cost_per_unit ? item.cost_per_unit.toString() : '',
          current_stock: item.current_stock ? item.current_stock.toString() : '0',
          reorder_level: item.reorder_level ? item.reorder_level.toString() : '0',
          location: item.location || ''
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [open, isEditing, item]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/', {
        params: { department_id: currentUser?.profile?.department?.id }
      });
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setFetchError('Failed to load suppliers data.');
    }
  };

  const fetchCategories = async () => {
    try {
      // This could be a dedicated endpoint or we can extract from existing inventory items
      const response = await api.get('/inventory-categories/');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback to common categories if API fails
      setCategories([
        'Raw Materials', 
        'Packaging', 
        'Spices & Seasonings', 
        'Dairy', 
        'Meat', 
        'Produce', 
        'Bakery Ingredients', 
        'Cleaning Supplies'
      ]);
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

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.item_code) {
      newErrors.item_code = 'Item code is required';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    
    if (!formData.cost_per_unit) {
      newErrors.cost_per_unit = 'Cost per unit is required';
    } else if (isNaN(formData.cost_per_unit) || parseFloat(formData.cost_per_unit) < 0) {
      newErrors.cost_per_unit = 'Cost per unit must be a non-negative number';
    }
    
    if (formData.current_stock && (isNaN(formData.current_stock) || parseFloat(formData.current_stock) < 0)) {
      newErrors.current_stock = 'Current stock must be a non-negative number';
    }
    
    if (formData.reorder_level && (isNaN(formData.reorder_level) || parseFloat(formData.reorder_level) < 0)) {
      newErrors.reorder_level = 'Reorder level must be a non-negative number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const itemData = {
      ...formData,
      cost_per_unit: parseFloat(formData.cost_per_unit),
      current_stock: parseFloat(formData.current_stock || 0),
      reorder_level: parseFloat(formData.reorder_level || 0),
      department: currentUser?.profile?.department?.id
    };
    
    const success = await onSubmit(itemData);
    if (success) {
      setFormData(initialFormState);
      setErrors({});
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
          {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
            <TextField
              fullWidth
              label="Item Code"
              name="item_code"
              value={formData.item_code}
              onChange={handleChange}
              required
              error={!!errors.item_code}
              helperText={errors.item_code}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={categories}
              value={formData.category}
              onChange={(event, newValue) => {
                handleAutocompleteChange('category', newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  required
                  error={!!errors.category}
                  helperText={errors.category}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="supplier-label">Supplier</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                label="Supplier"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={units}
              value={formData.unit}
              onChange={(event, newValue) => {
                handleAutocompleteChange('unit', newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unit"
                  required
                  error={!!errors.unit}
                  helperText={errors.unit}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pack Size"
              name="pack_size"
              value={formData.pack_size}
              onChange={handleChange}
              placeholder="e.g., 10kg, 12x500ml, 24ct"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Cost per Unit (R)"
              name="cost_per_unit"
              value={formData.cost_per_unit}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              required
              error={!!errors.cost_per_unit}
              helperText={errors.cost_per_unit}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Current Stock"
              name="current_stock"
              value={formData.current_stock}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              error={!!errors.current_stock}
              helperText={errors.current_stock}
              disabled={isEditing} // Can only set initial stock when creating
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Reorder Level"
              name="reorder_level"
              value={formData.reorder_level}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              error={!!errors.reorder_level}
              helperText={errors.reorder_level}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Storage Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Shelf A3, Cold Room 2, Freezer 1"
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
          {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Item' : 'Add Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryFormModal;
