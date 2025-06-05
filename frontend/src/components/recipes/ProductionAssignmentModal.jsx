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
  FormHelperText,
  Typography,
  Divider,
  Box,
  Chip,
  IconButton,
  Autocomplete,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import apiClient from '../../services/api';

const ProductionAssignmentModal = ({ 
  open, 
  onClose, 
  onSave, 
  selectedDate, 
  selectedStaff = null,
  editMode = false,
  productionTask = null
}) => {
  // State for form fields
  const [recipe, setRecipe] = useState(null);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [department, setDepartment] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [batchSize, setBatchSize] = useState('');
  const [scheduledDate, setScheduledDate] = useState(selectedDate || new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(11, 0, 0, 0)));
  const [assignedStaff, setAssignedStaff] = useState(selectedStaff ? [selectedStaff] : []);
  const [staffOptions, setStaffOptions] = useState([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrencePattern, setRecurrencePattern] = useState({});
  const [taskType, setTaskType] = useState('production');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120); // Default 2 hours

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch departments
        const deptResponse = await apiClient.get('/departments/');
        const deptData = Array.isArray(deptResponse.data) ? deptResponse.data : 
                        (deptResponse.data?.results || []);
        setDepartmentOptions(deptData);
        
        // Fetch recipes
        const recipeResponse = await apiClient.get('/recipes/');
        const recipeData = Array.isArray(recipeResponse.data) ? recipeResponse.data : 
                          (recipeResponse.data?.results || []);
        setRecipeOptions(recipeData);
        
        // Fetch staff
        const staffResponse = await apiClient.get('/users/');
        const staffData = Array.isArray(staffResponse.data) ? staffResponse.data : 
                         (staffResponse.data?.results || []);
        setStaffOptions(staffData.filter(user => user.is_active));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Populate form if in edit mode
  useEffect(() => {
    if (editMode && productionTask) {
      setRecipe(recipeOptions.find(r => r.recipe_id === productionTask.recipe_id) || null);
      setDepartment(productionTask.department_id);
      setBatchSize(productionTask.scheduled_quantity);
      
      // Parse dates
      if (productionTask.scheduled_start_time) {
        const startDate = new Date(productionTask.scheduled_start_time);
        setScheduledDate(startDate);
        setStartTime(startDate);
      }
      
      if (productionTask.scheduled_end_time) {
        setEndTime(new Date(productionTask.scheduled_end_time));
      }
      
      // Set assigned staff
      if (productionTask.assigned_staff_id) {
        const staff = staffOptions.find(s => s.id === productionTask.assigned_staff_id);
        if (staff) setAssignedStaff([staff]);
      }
      
      setNotes(productionTask.notes || '');
      setIsRecurring(productionTask.is_recurring || false);
      setRecurrenceType(productionTask.recurrence_type || 'none');
      setRecurrencePattern(productionTask.recurrence_pattern || {});
      setTaskType(productionTask.task_type || 'production');
      setDescription(productionTask.description || '');
      
      if (productionTask.duration_minutes) {
        setDurationMinutes(productionTask.duration_minutes);
      }
    }
  }, [editMode, productionTask, recipeOptions, staffOptions]);

  // Handle department change - filter recipes by department
  const handleDepartmentChange = (event) => {
    const deptId = event.target.value;
    setDepartment(deptId);
    setRecipe(null); // Reset recipe when department changes
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!recipe) newErrors.recipe = 'Recipe is required';
    if (!department) newErrors.department = 'Department is required';
    if (!batchSize || batchSize <= 0) newErrors.batchSize = 'Valid batch size is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (endTime <= startTime) newErrors.endTime = 'End time must be after start time';
    if (!taskType) newErrors.taskType = 'Task type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Format the data for API submission
    const formattedStartTime = format(startTime, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEndTime = format(endTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    const productionTaskData = {
      recipe_id: recipe.recipe_id,
      department_id: department,
      scheduled_start_time: formattedStartTime,
      scheduled_end_time: formattedEndTime,
      scheduled_quantity: parseFloat(batchSize),
      status: 'scheduled',
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : 'none',
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      notes: notes,
      assigned_staff_id: assignedStaff.length > 0 ? assignedStaff[0].id : null,
      task_type: taskType,
      description: description || `Production of ${recipe.name}`,
      duration_minutes: durationMinutes
    };
    
    if (editMode && productionTask) {
      productionTaskData.id = productionTask.id;
    }
    
    onSave(productionTaskData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editMode ? 'Edit Production Task' : 'Schedule New Production Task'}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            {/* Recipe Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="recipe-select"
                options={recipeOptions.filter(r => !department || r.department === parseInt(department))}
                getOptionLabel={(option) => option ? `${option.name} (${option.product_code || ''})` : ''}
                value={recipe}
                onChange={(event, newValue) => setRecipe(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Recipe"
                    variant="outlined"
                    fullWidth
                    error={!!errors.recipe}
                    helperText={errors.recipe}
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />
            </Grid>
            
            {/* Department Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.department} required>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  value={department}
                  label="Department"
                  onChange={handleDepartmentChange}
                >
                  {departmentOptions.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Batch Size */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Batch Size"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: recipe ? <Typography variant="body2">{recipe.yield_unit}</Typography> : null
                }}
                error={!!errors.batchSize}
                helperText={errors.batchSize}
                required
              />
            </Grid>
            
            {/* Task Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.taskType} required>
                <InputLabel id="task-type-label">Task Type</InputLabel>
                <Select
                  labelId="task-type-label"
                  id="task-type"
                  value={taskType}
                  label="Task Type"
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <MenuItem value="prep">Preparation</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="post_production">Post-Production</MenuItem>
                  <MenuItem value="quality_check">Quality Check</MenuItem>
                  <MenuItem value="packaging">Packaging</MenuItem>
                  <MenuItem value="cleanup">Cleanup</MenuItem>
                </Select>
                {errors.taskType && <FormHelperText>{errors.taskType}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Date Selection */}
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Date"
                value={scheduledDate}
                onChange={(newDate) => setScheduledDate(newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.scheduledDate,
                    helperText: errors.scheduledDate,
                    required: true
                  }
                }}
              />
            </Grid>
            
            {/* Start Time */}
            <Grid item xs={12} md={4}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(newTime) => setStartTime(newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startTime,
                    helperText: errors.startTime,
                    required: true
                  }
                }}
              />
            </Grid>
            
            {/* End Time */}
            <Grid item xs={12} md={4}>
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(newTime) => setEndTime(newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endTime,
                    helperText: errors.endTime,
                    required: true
                  }
                }}
              />
            </Grid>
            
            {/* Duration in Minutes */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                fullWidth
                InputProps={{
                  endAdornment: <Typography variant="body2">min</Typography>
                }}
              />
            </Grid>
            
            {/* Staff Assignment */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="assigned-staff"
                options={staffOptions}
                getOptionLabel={(option) => option ? `${option.first_name || ''} ${option.last_name || ''}` : ''}
                value={assignedStaff.length > 0 ? assignedStaff[0] : null}
                onChange={(event, newValue) => setAssignedStaff(newValue ? [newValue] : [])}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned Staff"
                    variant="outlined"
                    fullWidth
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            {/* Recurrence Options */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recurrence Options
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                  }
                  label="Recurring Task"
                />
                
                {isRecurring && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel id="recurrence-type-label">Recurrence Type</InputLabel>
                        <Select
                          labelId="recurrence-type-label"
                          id="recurrence-type"
                          value={recurrenceType}
                          label="Recurrence Type"
                          onChange={(e) => setRecurrenceType(e.target.value)}
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                          <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Additional recurrence options based on type */}
                    {recurrenceType === 'weekly' && (
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          Repeat on these days:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                            <Chip
                              key={day}
                              label={day}
                              clickable
                              color={recurrencePattern.days?.includes(index) ? 'primary' : 'default'}
                              onClick={() => {
                                const days = recurrencePattern.days || [];
                                const newDays = days.includes(index)
                                  ? days.filter(d => d !== index)
                                  : [...days, index];
                                setRecurrencePattern({...recurrencePattern, days: newDays});
                              }}
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    {recurrenceType === 'monthly' && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Day of Month"
                          type="number"
                          value={recurrencePattern.dayOfMonth || ''}
                          onChange={(e) => setRecurrencePattern({
                            ...recurrencePattern,
                            dayOfMonth: parseInt(e.target.value)
                          })}
                          fullWidth
                          InputProps={{ inputProps: { min: 1, max: 31 } }}
                        />
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {editMode ? 'Update Task' : 'Schedule Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionAssignmentModal;
