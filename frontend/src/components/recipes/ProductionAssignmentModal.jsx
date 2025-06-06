import React, { useState, useEffect, useContext } from 'react';
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
  FormControlLabel,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import { format } from 'date-fns';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ProductionAssignmentModal = ({ 
  open, 
  onClose, 
  onSave, 
  selectedDate, 
  selectedStaff = null,
  editMode = false,
  productionTask = null
}) => {
  const { currentUser } = useAuth();
  // State for form fields
  const [recipe, setRecipe] = useState(null);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [department, setDepartment] = useState('');
  const [departmentName, setDepartmentName] = useState(''); // For displaying department name
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



  // Effect to initialize and update form based on open, productionTask, currentUser, and data options
  useEffect(() => {
    if (!open) {
      setErrors({}); // Reset errors when modal closes
      // Consider resetting other form fields if they should not persist across openings for new tasks
      // setRecipe(null);
      // setAssignedStaff([]);
      // setBatchSize(1);
      // ... etc.
      return;
    }

    // Determine Department ID and Name
    let newDepartmentId = '';
    if (editMode && productionTask?.department_id) {
      newDepartmentId = String(productionTask.department_id);
    } else if (!editMode && productionTask?.recipe?.department_id) { // New task from drag-drop, recipe has a department
      newDepartmentId = String(productionTask.recipe.department_id);
    } else if (currentUser?.department_id) { // Fallback to user's department for new tasks
      newDepartmentId = String(currentUser.department_id);
    }
    setDepartment(newDepartmentId);

    if (newDepartmentId && departmentOptions.length > 0) {
      const dept = departmentOptions.find(d => String(d.id) === newDepartmentId);
      setDepartmentName(dept ? dept.name : 'Department not found');
    } else if (newDepartmentId) {
      setDepartmentName('Loading department info...');
    } else {
      setDepartmentName('');
    }

    // Populate Recipe
    if (productionTask?.recipe) { // Direct recipe object from drag-and-drop
      setRecipe(productionTask.recipe);
    } else if (productionTask?.recipe_id && recipeOptions.length > 0) {
      const matchedRecipe = recipeOptions.find(r => r.id === productionTask.recipe_id);
      setRecipe(matchedRecipe || null);
    } else if (!editMode) {
      setRecipe(null); // Clear recipe for new non-drag-drop tasks
    }

    // Populate other fields
    if (productionTask) {
      setBatchSize(productionTask.scheduled_quantity || 1);
      if (productionTask.scheduled_start_time) {
        const startDate = new Date(productionTask.scheduled_start_time);
        setScheduledDate(startDate);
        setStartTime(startDate);
      } else if (!editMode) {
        setScheduledDate(selectedDate || new Date());
        setStartTime(new Date(new Date().setHours(9, 0, 0, 0)));
      }
      if (productionTask.scheduled_end_time) {
        setEndTime(new Date(productionTask.scheduled_end_time));
      } else if (!editMode) {
        setEndTime(new Date(new Date().setHours(11, 0, 0, 0)));
      }

      if (productionTask.assigned_staff && productionTask.assigned_staff.length > 0) {
        setAssignedStaff(productionTask.assigned_staff);
      } else if (productionTask.assigned_staff_id && staffOptions.length > 0) {
        const staff = staffOptions.find(s => s.id === productionTask.assigned_staff_id);
        setAssignedStaff(staff ? [staff] : []);
      } else if (!editMode && selectedStaff) {
        setAssignedStaff([selectedStaff]);
      } else if (!editMode) {
        setAssignedStaff([]);
      }
      
      setNotes(productionTask.notes || '');
      setIsRecurring(productionTask.is_recurring || false);
      setRecurrenceType(productionTask.recurrence_type || 'none');
      setRecurrencePattern(productionTask.recurrence_pattern || {});
      setTaskType(productionTask.task_type || 'production');
      setDescription(productionTask.description || (productionTask.recipe_name ? `Production of ${productionTask.recipe_name}` : ''));
      setDurationMinutes(productionTask.duration_minutes || 120);
    } else { // New task, not from drag-drop, not edit mode
      setScheduledDate(selectedDate || new Date());
      setStartTime(new Date(new Date().setHours(9, 0, 0, 0)));
      setEndTime(new Date(new Date().setHours(11, 0, 0, 0)));
      setBatchSize(1);
      setTaskType('production');
      setNotes('');
      setDescription('');
      setDurationMinutes(120);
      setIsRecurring(false);
      setRecurrenceType('none');
      setRecurrencePattern({});
      if (selectedStaff) {
        setAssignedStaff([selectedStaff]);
      } else {
        setAssignedStaff([]);
      }
    }
  }, [open, productionTask, currentUser, departmentOptions, recipeOptions, staffOptions, editMode, selectedDate, selectedStaff]);

  // Effect to initialize and update form based on open, productionTask, currentUser, and data options
  useEffect(() => {
    if (!open) {
      setErrors({});
      // Reset more fields if they shouldn't persist for new tasks
      // setRecipe(null); 
      // setAssignedStaff([]); 
      // setBatchSize(1);
      // setDepartment(''); 
      // setDepartmentName('');
      // setScheduledDate(null);
      // setStartTime(null);
      // setEndTime(null);
      // setNotes('');
      // setDescription('');
      // setDurationMinutes(120);
      // setIsRecurring(false);
      // setRecurrenceType('none');
      // setRecurrencePattern({});
      return;
    }

    // Determine Department ID and Name
    let newDepartmentId = '';
    let derivedDeptName = '';
    console.log('Determining department. EditMode:', editMode, 'Task:', productionTask, 'User:', currentUser, 'Recipe on Task:', productionTask?.recipe);

    if (editMode && productionTask?.department_id) {
      newDepartmentId = String(productionTask.department_id);
      console.log('Department from task (edit mode):', newDepartmentId);
    } else if (!editMode && productionTask?.recipe) {
      if (productionTask.recipe.department_id) {
        newDepartmentId = String(productionTask.recipe.department_id);
        console.log('Department ID from recipe object:', newDepartmentId);
      } else if (productionTask.recipe.department_name && departmentOptions.length > 0) {
        // If recipe has department_name but not id, try to find id from departmentOptions
        const deptFromRecipeName = departmentOptions.find(opt => opt.name === productionTask.recipe.department_name);
        if (deptFromRecipeName) {
          newDepartmentId = String(deptFromRecipeName.id);
          derivedDeptName = deptFromRecipeName.name; // Already have the name
          console.log('Department ID derived from recipe department_name:', newDepartmentId);
        } else {
          console.warn('Recipe department_name not found in departmentOptions:', productionTask.recipe.department_name);
        }
      }
    }
    
    // Fallback to user's department if no department determined yet for new tasks
    if (!newDepartmentId && !editMode && currentUser?.department_id) {
      newDepartmentId = String(currentUser.department_id);
      console.log('Department from current user:', newDepartmentId);
    }
    setDepartment(newDepartmentId);

    // Set Department Name
    if (derivedDeptName) { // If name was already derived while finding ID
        setDepartmentName(derivedDeptName);
    } else if (newDepartmentId && departmentOptions.length > 0) {
      const dept = departmentOptions.find(d => String(d.id) === newDepartmentId);
      setDepartmentName(dept ? dept.name : 'Department ID not found in options');
      console.log('Department name set from options:', dept ? dept.name : 'not found');
    } else if (newDepartmentId) {
      setDepartmentName('Loading department info...'); 
      console.log('Department ID present, but options not ready or ID not found yet.');
    } else {
      setDepartmentName('N/A'); // Default if no department could be set
      console.log('No department ID could be determined.');
    }

    // Populate Recipe
    if (productionTask?.recipe) { // Direct recipe object from drag-and-drop
      setRecipe(productionTask.recipe);
    } else if (productionTask?.recipe_id && recipeOptions.length > 0) {
      const matchedRecipe = recipeOptions.find(r => r.id === productionTask.recipe_id || r.recipe_id === productionTask.recipe_id);
      setRecipe(matchedRecipe || null);
    } else if (!editMode) { // For new tasks not from drag-drop
      setRecipe(null);
    }
    
    // Populate other fields
    if (productionTask) {
      console.log('Populating form with productionTask data:', productionTask);
      setBatchSize(productionTask.scheduled_quantity || 1);
      if (productionTask.scheduled_start_time) {
        const startDate = new Date(productionTask.scheduled_start_time);
        setScheduledDate(startDate);
        setStartTime(startDate);
      } else if (!editMode) { // Default for new tasks
        setScheduledDate(selectedDate || new Date());
        setStartTime(new Date(new Date().setHours(9,0,0,0)));
      }

      if (productionTask.scheduled_end_time) {
        setEndTime(new Date(productionTask.scheduled_end_time));
      } else if (!editMode) { // Default for new tasks
         setEndTime(new Date(new Date().setHours(11,0,0,0)));
      }

      if (productionTask.assigned_staff && productionTask.assigned_staff.length > 0) {
        setAssignedStaff(productionTask.assigned_staff);
      } else if (productionTask.assigned_staff_id && staffOptions.length > 0) {
        const staff = staffOptions.find(s => s.id === productionTask.assigned_staff_id);
        setAssignedStaff(staff ? [staff] : []);
      } else if (!editMode && selectedStaff) {
          setAssignedStaff([selectedStaff]);
      } else if (!editMode) {
        setAssignedStaff([]);
      }
      
      setNotes(productionTask.notes || '');
      setIsRecurring(productionTask.is_recurring || false);
      setRecurrenceType(productionTask.recurrence_type || 'none');
      setRecurrencePattern(productionTask.recurrence_pattern || {});
      setTaskType(productionTask.task_type || 'production');
      // Set description carefully, considering if recipe is loaded yet
      const currentRecipeName = recipe?.name || productionTask?.recipe_name;
      setDescription(productionTask.description || (currentRecipeName ? `Production of ${currentRecipeName}`: 'New Production Task'));
      setDurationMinutes(productionTask.duration_minutes || 120); // Default duration if not set

    } else { // New task, not from drag-drop, not edit mode
      setScheduledDate(selectedDate || new Date());
      setStartTime(new Date(new Date().setHours(9,0,0,0)));
      setEndTime(new Date(new Date().setHours(11,0,0,0)));
      setBatchSize(1);
      setTaskType('production');
      setNotes('');
      setDescription('');
      setDurationMinutes(120);
      setIsRecurring(false);
      setRecurrenceType('none');
      setRecurrencePattern({});
      if (selectedStaff) { // If staff was selected on calendar
          setAssignedStaff([selectedStaff]);
      } else {
          setAssignedStaff([]);
      }
      // Department and Recipe are handled above or should be reset if necessary
      // setRecipe(null); // Already handled by logic above for !editMode
    }

  }, [open, productionTask, currentUser, departmentOptions, recipeOptions, staffOptions, editMode, selectedDate, selectedStaff, recipe]); // Added recipe to dependency array for description update

  // Debug logging for form state
  useEffect(() => {
    if (open) {
      console.log('Current form state (debug):', {
        recipe,
        department,
        departmentName,
        batchSize,
        scheduledDate: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
        startTime: startTime ? format(startTime, 'HH:mm:ss') : null,
        endTime: endTime ? format(endTime, 'HH:mm:ss') : null,
        assignedStaff,
        taskType,
        description,
        notes,
        isRecurring,
        recurrenceType,
        recurrencePattern,
        durationMinutes
      });
    }
  }, [open, recipe, department, departmentName, batchSize, scheduledDate, startTime, endTime, assignedStaff, taskType, description, notes, isRecurring, recurrenceType, recurrencePattern, durationMinutes]);
  
  // Inline validation for individual fields
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch(field) {
      case 'recipe':
        if (!value) newErrors.recipe = 'Recipe is required';
        else delete newErrors.recipe;
        break;
      case 'batchSize':
        if (!value) newErrors.batchSize = 'Batch size is required';
        else if (isNaN(value) || Number(value) <= 0) newErrors.batchSize = 'Must be a positive number';
        else delete newErrors.batchSize;
        break;
      case 'taskType':
        if (!value) newErrors.taskType = 'Task type is required';
        else delete newErrors.taskType;
        break;
      case 'scheduledDate':
        if (!value) newErrors.scheduledDate = 'Date is required';
        else delete newErrors.scheduledDate;
        break;
      case 'startTime':
        if (!value) newErrors.startTime = 'Start time is required';
        else delete newErrors.startTime;
        // Check if end time is after start time
        if (value && endTime) {
          const startDateTime = new Date(scheduledDate);
          startDateTime.setHours(value.getHours(), value.getMinutes());
          
          const endDateTime = new Date(scheduledDate);
          endDateTime.setHours(endTime.getHours(), endTime.getMinutes());
          
          if (endDateTime <= startDateTime) {
            newErrors.endTime = 'End time must be after start time';
          } else {
            delete newErrors.endTime;
          }
        }
        break;
      case 'endTime':
        if (!value) newErrors.endTime = 'End time is required';
        else delete newErrors.endTime;
        // Check if end time is after start time
        if (startTime && value) {
          const startDateTime = new Date(scheduledDate);
          startDateTime.setHours(startTime.getHours(), startTime.getMinutes());
          
          const endDateTime = new Date(scheduledDate);
          endDateTime.setHours(value.getHours(), value.getMinutes());
          
          if (endDateTime <= startDateTime) {
            newErrors.endTime = 'End time must be after start time';
          } else {
            delete newErrors.endTime;
          }
        }
        break;
      case 'assignedStaff':
        if (!value || value.length === 0) newErrors.assignedStaff = 'At least one staff member must be assigned';
        else delete newErrors.assignedStaff;
        break;
      case 'recurrenceType':
        if (isRecurring && !value) newErrors.recurrenceType = 'Recurrence type is required';
        else delete newErrors.recurrenceType;
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Full form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!recipe) newErrors.recipe = 'Recipe is required';
    if (!batchSize) newErrors.batchSize = 'Batch size is required';
    else if (isNaN(batchSize) || Number(batchSize) <= 0) newErrors.batchSize = 'Must be a positive number';
    if (!taskType) newErrors.taskType = 'Task type is required';
    if (!scheduledDate) newErrors.scheduledDate = 'Date is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (assignedStaff.length === 0) newErrors.assignedStaff = 'At least one staff member must be assigned';
    
    if (isRecurring && !recurrenceType) newErrors.recurrenceType = 'Recurrence type is required';
    
    // Check if end time is after start time
    if (startTime && endTime) {
      const startDateTime = new Date(scheduledDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      
      const endDateTime = new Date(scheduledDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes());
      
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log("Form validation failed", errors);
      return;
    }

    // Combine date and time for start and end
    const combinedStartTime = new Date(scheduledDate);
    combinedStartTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes(), new Date(startTime).getSeconds());

    const combinedEndTime = new Date(scheduledDate);
    combinedEndTime.setHours(new Date(endTime).getHours(), new Date(endTime).getMinutes(), new Date(endTime).getSeconds());

    const taskData = {
      recipe_id: recipe ? recipe.recipe_id : null,
      department_id: department ? parseInt(department) : null,
      batch_size: batchSize ? parseFloat(batchSize) : null,  // Changed from scheduled_quantity to batch_size
      scheduled_date: format(scheduledDate, "yyyy-MM-dd"),  // Added explicit scheduled_date field
      task_type: taskType,
      scheduled_start_time: format(combinedStartTime, "yyyy-MM-dd'T'HH:mm:ssxxx"), // ISO 8601 with timezone
      scheduled_end_time: format(combinedEndTime, "yyyy-MM-dd'T'HH:mm:ssxxx"),   // ISO 8601 with timezone
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
      assigned_staff_ids: assignedStaff.map(s => s.id),
      description: description,
      notes: notes,
      is_recurring: isRecurring,
      recurrence_type: recurrenceType, 
      recurrence_pattern: recurrenceType !== 'none' ? recurrencePattern : null,
      status: 'scheduled',
    };
    
    console.log('Submitting task data:', taskData);

    try {
      await onSave(taskData, editMode ? productionTask.id : null);
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error('Failed to save production task:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: 'Failed to save task: ' + (error.response?.data?.detail || error.message || 'Unknown error') 
      }));
    }
  };

  // JSX for the Modal
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
          pb: 2 
        }}
      >
        {editMode ? 'Edit Production Task' : 'Schedule New Production Task'}
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, px: 3 }}>
          {/* Basic Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
              Task Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* Recipe Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="recipe-select"
                  options={recipeOptions.filter(option => !department || option.department_id === parseInt(department) || option.department_name === departmentName )}
                  getOptionLabel={(option) => option ? `${option.name} (${option.product_code || 'N/A'})` : ''}
                  value={recipe}
                  onChange={(event, newValue) => {
                    setRecipe(newValue);
                    validateField('recipe', newValue);
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ 
                      whiteSpace: "normal", 
                      wordBreak: "break-word"
                    }}>
                      <Typography noWrap={false}>
                        {option.name} <Typography component="span" color="text.secondary" variant="body2">({option.product_code || 'N/A'})</Typography>
                      </Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Recipe" 
                      variant="outlined" 
                      fullWidth 
                      error={!!errors.recipe} 
                      helperText={errors.recipe || " "} 
                      required 
                      onBlur={() => validateField('recipe', recipe)}
                      InputProps={{
                        ...params.InputProps,
                        style: { overflow: 'hidden', textOverflow: 'ellipsis' }
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  ListboxProps={{
                    sx: { maxHeight: '200px' }
                  }}
                  disablePortal
                  popupIcon={<ArrowDropDownIcon />}
                  clearOnBlur={false}
                  openOnFocus
                />
              </Grid>

              {/* Department Display */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Department"
                  value={departmentName || 'N/A'}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: 'action.hover', opacity: 0.9 }
                  }}
                  variant="outlined"
                  error={!!errors.department}
                  helperText={errors.department || " "}
                  required
                />
              </Grid>

              {/* Batch Size */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Batch Size"
                  type="number"
                  value={batchSize}
                  onChange={(e) => {
                    setBatchSize(e.target.value);
                    validateField('batchSize', e.target.value);
                  }}
                  onBlur={() => validateField('batchSize', batchSize)}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    endAdornment: recipe?.yield_unit ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1, minWidth: '30px' }}>
                        {recipe.yield_unit}
                      </Typography>
                    ) : null,
                    style: { fontSize: '1rem' }
                  }}
                  error={!!errors.batchSize}
                  helperText={errors.batchSize || " "}
                  required
                  inputProps={{
                    min: 1,
                    step: 1,
                    style: { textAlign: 'right', paddingRight: '40px' },
                    'aria-label': 'Batch size in ' + (recipe?.yield_unit || 'units')
                  }}
                  sx={{ '& .MuiInputBase-input': { fontWeight: 500 } }}
                />
              </Grid>
              
              {/* Task Type */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="task-type-label">Task Type</InputLabel>
                  <Select
                    labelId="task-type-label"
                    value={taskType}
                    label="Task Type"
                    onChange={(e) => {
                      setTaskType(e.target.value);
                      validateField('taskType', e.target.value);
                    }}
                    onBlur={() => validateField('taskType', taskType)}
                    error={!!errors.taskType}
                    inputProps={{
                      'aria-label': 'Select task type'
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 200 }
                      }
                    }}
                    IconComponent={ArrowDropDownIcon}
                  >
                    <MenuItem value="production">Production</MenuItem>
                    <MenuItem value="prep">Prep</MenuItem>
                    <MenuItem value="packaging">Packaging</MenuItem>
                    <MenuItem value="cleanup">Cleanup</MenuItem>
                  </Select>
                  <FormHelperText error={!!errors.taskType}>{errors.taskType || " "}</FormHelperText>
                </FormControl>
              </Grid>
            
            {/* Duration */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={durationMinutes}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setDurationMinutes(value > 0 ? value : 1);
                }}
                fullWidth
                variant="outlined"
                InputProps={{ 
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1, minWidth: '30px' }}>
                      min
                    </Typography>
                  ),
                  style: { fontSize: '1rem' }
                }}
                helperText="Estimated task duration"
                inputProps={{
                  min: 1,
                  step: 5,
                  style: { textAlign: 'right', paddingRight: '40px' },
                  'aria-label': 'Duration in minutes'
                }}
                sx={{ '& .MuiInputBase-input': { fontWeight: 500 } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Scheduling Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
            Scheduling
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Date Picker */}
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Scheduled Date"
                  value={scheduledDate}
                  onChange={(newValue) => {
                    setScheduledDate(newValue);
                    validateField('scheduledDate', newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      error: !!errors.scheduledDate,
                      helperText: errors.scheduledDate || " ",
                      required: true,
                      onBlur: () => validateField('scheduledDate', scheduledDate),
                      inputProps: {
                        'aria-label': 'Select scheduled date'
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Start Time Picker */}
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={(newValue) => {
                    setStartTime(newValue);
                    validateField('startTime', newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      error: !!errors.startTime,
                      helperText: errors.startTime || " ",
                      required: true,
                      onBlur: () => validateField('startTime', startTime),
                      inputProps: {
                        'aria-label': 'Select start time'
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* End Time Picker */}
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="End Time"
                  value={endTime}
                  onChange={(newValue) => {
                    setEndTime(newValue);
                    validateField('endTime', newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      error: !!errors.endTime,
                      helperText: errors.endTime || " ",
                      required: true,
                      onBlur: () => validateField('endTime', endTime),
                      inputProps: {
                        'aria-label': 'Select end time'
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Staff Assignment */}
            <Grid item xs={12}>
              <Autocomplete
                id="assigned-staff"
                multiple
                options={staffOptions}
                getOptionLabel={(option) => option ? `${option.first_name || ''} ${option.last_name || ''}`.trim() : ''}
                value={assignedStaff}
                onChange={(event, newValue) => {
                  setAssignedStaff(newValue);
                  validateField('assignedStaff', newValue);
                }}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Typography>
                      {`${option.first_name || ''} ${option.last_name || ''}`.trim()}
                    </Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned Staff"
                    variant="outlined"
                    fullWidth
                    error={!!errors.assignedStaff}
                    helperText={errors.assignedStaff || " "}
                    onBlur={() => validateField('assignedStaff', assignedStaff)}
                    required
                    InputProps={{
                      ...params.InputProps,
                      style: { overflow: 'visible' }
                    }}
                    inputProps={{
                      ...params.inputProps,
                      'aria-label': 'Select staff members'
                    }}
                  />
                )}
                disablePortal
                popupIcon={<ArrowDropDownIcon />}
                clearOnBlur={false}
                openOnFocus
                limitTags={2}
                sx={{ minHeight: '80px' }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Additional Details Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
            Additional Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Description Text Area */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Description"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Brief description of the production task"
                inputProps={{
                  'aria-label': 'Task description'
                }}
              />
            </Grid>

            {/* Notes Text Area */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Additional notes or instructions for staff"
                inputProps={{
                  'aria-label': 'Additional notes'
                }}
              />
            </Grid>
          </Grid>
        </Box>
          
          {/* Recurrence Options */}
          <Box sx={{ 
            mb: 3,
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 1, 
            p: 2,
            bgcolor: isRecurring ? 'action.hover' : 'transparent',
            transition: 'background-color 0.3s ease'
          }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Recurrence Options
            </Typography>
            <FormControlLabel
                control={<Switch 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  color="primary"
                />}
                label={<Typography variant="body1" fontWeight={isRecurring ? 'medium' : 'normal'}>
                  Recurring Task
                </Typography>}
            />
            {isRecurring && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Recurrence Type</InputLabel>
                  <Select
                    value={recurrenceType}
                    label="Recurrence Type"
                    onChange={(e) => setRecurrenceType(e.target.value)}
                    error={!!errors.recurrenceType}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                  <FormHelperText error={!!errors.recurrenceType}>
                    {errors.recurrenceType || " "}
                  </FormHelperText>
                </FormControl>
                
                {recurrenceType === 'weekly' && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={recurrencePattern || ""}
                      label="Day of Week"
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                    >
                      <MenuItem value="monday">Monday</MenuItem>
                      <MenuItem value="tuesday">Tuesday</MenuItem>
                      <MenuItem value="wednesday">Wednesday</MenuItem>
                      <MenuItem value="thursday">Thursday</MenuItem>
                      <MenuItem value="friday">Friday</MenuItem>
                      <MenuItem value="saturday">Saturday</MenuItem>
                      <MenuItem value="sunday">Sunday</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {recurrenceType === 'monthly' && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Day of Month</InputLabel>
                    <Select
                      value={recurrencePattern || ""}
                      label="Day of Month"
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                    >
                      {[...Array(31)].map((_, i) => (
                        <MenuItem key={i+1} value={(i+1).toString()}>{i+1}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  This task will repeat {recurrenceType === 'daily' ? 'every day' : 
                    recurrenceType === 'weekly' ? 'every week on ' + (recurrencePattern || 'the selected day') : 
                    recurrenceType === 'monthly' ? 'every month on day ' + (recurrencePattern || 'of the month') : 
                    'based on the selected pattern'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      
        <Divider />
        <DialogActions sx={{ p: 3, justifyContent: 'space-between', flexWrap: 'wrap', bgcolor: 'background.paper' }}>
          <Box sx={{ width: { xs: '100%', sm: 'auto' }, mb: { xs: 1, sm: 0 } }}>
            {errors.form && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {errors.form}
              </Alert>
            )}
            {Object.keys(errors).length > 0 && !errors.form && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Please correct the errors in the form.
              </Alert>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button 
              onClick={onClose} 
              color="inherit" 
              sx={{ fontWeight: 500 }}
              aria-label="Cancel and close modal"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading || Object.keys(errors).length > 0}
              sx={{ px: 3 }}
              aria-label={editMode ? 'Save changes to production task' : 'Schedule new production task'}
              type="submit"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {editMode ? 'Save Changes' : 'Schedule Task'}
            </Button>
          </Box>
        </DialogActions>
    </Dialog>
  );
};

export default ProductionAssignmentModal;
