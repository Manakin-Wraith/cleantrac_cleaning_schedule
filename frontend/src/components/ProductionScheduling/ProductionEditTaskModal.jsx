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
  MenuItem,
  CircularProgress,
  Select, // For multi-select staff
  Chip, // For displaying selected staff
  Box, // For Chip container
  OutlinedInput, // For Select input
  InputLabel // For Select label
} from '@mui/material';
import moment from 'moment';
import { createTaskInstance, updateTaskInstance } from '../../services/taskService'; // API services
import apiClient from '../../services/api'; // For direct API calls
import { getUsers } from '../../services/userService'; // To fetch staff



const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ProductionEditTaskModal = ({ open, onClose, task, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false); // For save operation
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // State for dropdown data
  const [recipes, setRecipes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [isDropdownDataLoading, setIsDropdownDataLoading] = useState(false);
  const [dropdownDataError, setDropdownDataError] = useState(null);

  useEffect(() => {
    if (task) {
      setFormData({
        recipeId: task.recipe?.id || '',
        scheduled_quantity: task.scheduled_quantity || '',
        unit_of_measure: task.recipe?.unit_of_measure || '',
        scheduled_start_time: task.start ? moment(task.start).format('YYYY-MM-DDTHH:mm') : '',
        scheduled_end_time: task.end ? moment(task.end).format('YYYY-MM-DDTHH:mm') : '',
        departmentId: task.department?.id || '', // Assuming department comes with task
        assigned_staff_ids: task.assigned_staff?.map(s => s.id) || [],
        production_line_id: task.production_line?.id || '',
        notes: task.notes || '',
      });
      const recipe = recipes.find(r => r.id === task.recipe?.id);
      setSelectedRecipe(recipe);
    } else {
      // Default for new task (though this modal is for editing initially)
      setFormData({
        recipeId: '',
        scheduled_quantity: '',
        unit_of_measure: '',
        scheduled_start_time: moment().format('YYYY-MM-DDTHH:mm'),
        scheduled_end_time: moment().add(2, 'hours').format('YYYY-MM-DDTHH:mm'),
        departmentId: '', // Should be pre-filled based on user context for new tasks
        assigned_staff_ids: [],
        production_line_id: '',
        notes: '',
      });
      setSelectedRecipe(null);
    }
  }, [task, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'recipeId') {
      const recipe = recipes.find(r => r.id === value);
      setSelectedRecipe(recipe);
      setFormData(prev => ({ ...prev, unit_of_measure: recipe ? recipe.unit_of_measure : '' }));
    }
  };

  const handleMultiSelectChange = (event) => {
    const { target: { name, value } } = event;
    setFormData(prev => ({ ...prev, [name]: typeof value === 'string' ? value.split(',') : value, }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        recipe_id: formData.recipeId, // Ensure your backend expects 'recipe_id'
        scheduled_quantity: formData.scheduled_quantity ? parseInt(formData.scheduled_quantity, 10) : null,
        scheduled_start_time: moment(formData.scheduled_start_time).toISOString(),
        scheduled_end_time: moment(formData.scheduled_end_time).toISOString(),
        // department_id: formData.departmentId, // Assuming departmentId is part of task or context
        assigned_to: formData.assigned_staff_ids, // taskService expects 'assigned_to'
        production_line_id: formData.production_line_id, // Ensure backend expects 'production_line_id'
        notes: formData.notes,
        status: task?.status || 'Scheduled', // Retain existing status or default for new
        type: 'production', // Crucial for identifying task type
        // Include department_id if it's part of the form and needs to be saved.
        // If departmentId is fixed for this view, it might be added on the backend or passed differently.
        // For now, assuming task object might carry it or it's handled by context.
        // If task.department is an object like {id: 1, name: 'Bakery'}, send task.department.id
        department: task?.department?.id || formData.departmentId, // Or however department is managed
      };

      let savedTask;
      if (task && task.id) {
        // Update existing task
        // The updateTaskInstance in taskService.js handles assigned_to mapping if 'assigned_to_id' is in payload.
        // Since we are sending 'assigned_to' directly as an array of IDs, ensure backend supports this.
        // If backend expects a single assignee ID for 'assigned_to', this needs adjustment.
        // For now, assuming taskService or backend can handle an array for 'assigned_to'.
        const updatePayload = { ...payload };
        // Remove fields that might not be directly updatable or are managed by specific endpoints (e.g., status might have its own)
        // delete updatePayload.status; // If status is updated via ChangeStatusModal exclusively

        savedTask = await updateTaskInstance(task.id, updatePayload);
      } else {
        // Create new task
        savedTask = await createTaskInstance(payload);
      }
      onSave(savedTask); // Pass API response to parent
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error.response?.data || error.message || error);
      // TODO: Show user-friendly error message (e.g., using a snackbar)
      alert(`Error saving task: ${error.response?.data?.detail || error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  useEffect(() => {
    if (open) {
      const loadDropdownData = async () => {
        setIsDropdownDataLoading(true);
        setDropdownDataError(null);
        try {
          // Fetch all data in parallel
          const [recipesResponse, staffResponse, productionLinesResponse] = await Promise.all([
            apiClient.get('/recipes/'), // Assuming endpoint /api/recipes/
            getUsers(), // Fetches users, potentially filter by role if needed e.g. getUsers({ role: 'staff' })
            apiClient.get('/production-lines/') // Assuming endpoint /api/production-lines/
          ]);

          setRecipes(recipesResponse.data || []);
          // getUsers from userService already returns response.data or throws an error
          setStaff(staffResponse || []); 
          setProductionLines(productionLinesResponse.data || []);

        } catch (err) {
          console.error('Failed to load dropdown data for Production Edit Modal:', err);
          setDropdownDataError(err.message || 'Failed to load selection data. Check console for details.');
          // Optionally, set individual error states for each dropdown if granular feedback is needed
        } finally {
          setIsDropdownDataLoading(false);
        }
      };
      loadDropdownData();
    }
  }, [open]); // Reload data when modal is opened

  if (!open) return null;

  // Display error message if dropdown data failed to load
  if (dropdownDataError) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography color="error">{dropdownDataError}</Typography>
          <Typography>Please ensure the backend services for recipes, staff, and production lines are running and accessible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{task?.id ? 'Edit Production Task' : 'Create New Production Task'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Recipe"
              name="recipeId"
              value={formData.recipeId || ''}
              onChange={handleChange}
              fullWidth
              required
            >
              {isDropdownDataLoading && <MenuItem value=""><em>Loading recipes...</em></MenuItem>}
              {!isDropdownDataLoading && recipes.length === 0 && <MenuItem value=""><em>No recipes found</em></MenuItem>}
              {recipes.map((recipe) => (
                <MenuItem key={recipe.id} value={recipe.id}>{recipe.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Scheduled Quantity"
              name="scheduled_quantity"
              type="number"
              value={formData.scheduled_quantity || ''}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Unit of Measure"
              name="unit_of_measure"
              value={formData.unit_of_measure || ''}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Scheduled Start Time"
              name="scheduled_start_time"
              type="datetime-local"
              value={formData.scheduled_start_time || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Scheduled End Time"
              name="scheduled_end_time"
              type="datetime-local"
              value={formData.scheduled_end_time || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InputLabel id="assigned-staff-label">Assigned Staff</InputLabel>
            <Select
              labelId="assigned-staff-label"
              name="assigned_staff_ids"
              multiple
              value={formData.assigned_staff_ids || []}
              onChange={handleMultiSelectChange}
              input={<OutlinedInput label="Assigned Staff" />}
              renderValue={(selectedIds) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedIds.map((id) => {
                    const selectedStaffMember = staff.find(s => s.id === id);
                    return <Chip key={id} label={selectedStaffMember?.username || selectedStaffMember?.name || id} />;
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {isDropdownDataLoading && <MenuItem value=""><em>Loading staff...</em></MenuItem>}
              {!isDropdownDataLoading && staff.length === 0 && <MenuItem value=""><em>No staff found</em></MenuItem>}
              {staff.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.username || s.name} {/* Display username or name based on your user model */}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Production Line"
              name="production_line_id"
              value={formData.production_line_id || ''}
              onChange={handleChange}
              fullWidth
            >
              {isDropdownDataLoading && <MenuItem value=""><em>Loading lines...</em></MenuItem>}
              {!isDropdownDataLoading && productionLines.length === 0 && <MenuItem value=""><em>No production lines found</em></MenuItem>}
              {productionLines.map((pl) => (
                <MenuItem key={pl.id} value={pl.id}>{pl.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notes (Optional)"
              name="notes"
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Save Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionEditTaskModal;
