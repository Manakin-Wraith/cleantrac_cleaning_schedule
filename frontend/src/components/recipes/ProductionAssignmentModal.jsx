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
        console.log('[Modal fetchData] Fetching staff...');
        const staffResponse = await apiClient.get('/users/');
        console.log('[Modal fetchData] Raw staffResponse:', staffResponse);
        const staffData = Array.isArray(staffResponse.data) ? staffResponse.data : 
                         (staffResponse.data?.results || []);
        console.log('[Modal fetchData] Parsed staffData:', staffData);
        if (staffData.length > 0) {
          console.log('[Modal fetchData] First user object in staffData:', staffData[0]);
        }
        const schedulableStaff = staffData.filter(user => 
          user.profile?.role === 'staff' || 
          user.profile?.role === 'manager' ||
          user.user_role === 'staff' || // Fallback for different structures
          user.user_role === 'manager'   // Fallback for different structures
        );
        console.log('[Modal fetchData] Filtered schedulableStaff:', schedulableStaff);
        setStaffOptions(schedulableStaff);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Staff Options:', staffOptions);
  }, [staffOptions]);



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

    // --- START OF RESTORED/CORRECTED Department and Recipe LOGIC ---
    let newDepartmentId = '';
    let derivedDeptName = '';
    console.log('[FormInit Dep/Recipe] Determining department. EditMode:', editMode, 'Task:', productionTask, 'User:', currentUser, 'Recipe on Task:', productionTask?.recipe, 'DeptOptions:', departmentOptions.length);

    if (editMode && productionTask?.department_id) {
      newDepartmentId = String(productionTask.department_id);
      console.log('[FormInit Dep/Recipe] Department from task (edit mode):', newDepartmentId);
    } else if (productionTask?.recipe) { // Task from drag-drop usually has recipe object
      if (productionTask.recipe.department_id) {
        newDepartmentId = String(productionTask.recipe.department_id);
        console.log('[FormInit Dep/Recipe] Department ID directly from productionTask.recipe.department_id:', newDepartmentId);
      } else if (productionTask.recipe.department_name && departmentOptions.length > 0) {
        const deptFromRecipeName = departmentOptions.find(opt => opt.name === productionTask.recipe.department_name);
        if (deptFromRecipeName) {
          newDepartmentId = String(deptFromRecipeName.id);
          derivedDeptName = deptFromRecipeName.name;
          console.log('[FormInit Dep/Recipe] Department ID derived from productionTask.recipe.department_name:', newDepartmentId);
        } else {
          console.warn('[FormInit Dep/Recipe] Recipe department_name from task not found in departmentOptions:', productionTask.recipe.department_name);
        }
      } else if (productionTask.recipe.department_name) {
          console.log('[FormInit Dep/Recipe] Recipe has department_name, but departmentOptions not ready. Will attempt to set name later.');
      }
    } else if (!editMode && currentUser?.department_id) { // Fallback to user's department for new blank task
      newDepartmentId = String(currentUser.department_id);
      console.log('[FormInit Dep/Recipe] Department from current user (new blank task):', newDepartmentId);
    }
    setDepartment(newDepartmentId);

    if (derivedDeptName) {
        setDepartmentName(derivedDeptName);
        console.log('[FormInit Dep/Recipe] Department name set from derivedDeptName:', derivedDeptName);
    } else if (newDepartmentId && departmentOptions.length > 0) {
      const dept = departmentOptions.find(d => String(d.id) === newDepartmentId);
      setDepartmentName(dept ? dept.name : 'Department ID not found');
      console.log('[FormInit Dep/Recipe] Department name set from options:', dept ? dept.name : 'ID not found');
    } else if (newDepartmentId) { 
      setDepartmentName('Loading dept info...'); 
      console.log('[FormInit Dep/Recipe] Department ID present, but options not ready or ID not found yet for name.');
    } else if (productionTask?.recipe?.department_name) { // Fallback if ID couldn't be found but name exists on recipe
        setDepartmentName(productionTask.recipe.department_name);
        console.log('[FormInit Dep/Recipe] Department name set directly from productionTask.recipe.department_name as fallback:', productionTask.recipe.department_name);
    } else {
      setDepartmentName('N/A');
      console.log('[FormInit Dep/Recipe] No department ID or name could be determined.');
    }

    console.log('[FormInit Dep/Recipe] Populating recipe. Task recipe:', productionTask?.recipe, 'Task recipe_id:', productionTask?.recipe_id, 'RecipeOptions:', recipeOptions.length);
    if (productionTask?.recipe && typeof productionTask.recipe === 'object' && (productionTask.recipe.recipe_id || productionTask.recipe.id)) { 
      const fullRecipeFromOptions = recipeOptions.find(r => r.id === (productionTask.recipe.recipe_id || productionTask.recipe.id));
      const recipeToSet = fullRecipeFromOptions || productionTask.recipe;
      console.log('[FormInit Dep/Recipe] Setting recipe (from task.recipe, matched/fallback):', recipeToSet);
      setRecipe(recipeToSet);
    } else if (productionTask?.recipe_id && recipeOptions.length > 0) {
      const matchedRecipe = recipeOptions.find(r => r.id === productionTask.recipe_id || r.recipe_id === productionTask.recipe_id);
      setRecipe(matchedRecipe || null);
      console.log('[FormInit Dep/Recipe] Recipe set from productionTask.recipe_id and recipeOptions:', matchedRecipe);
    } else if (productionTask?.recipe_id) {
        console.log('[FormInit Dep/Recipe] productionTask.recipe_id present, but recipeOptions not ready. Setting recipe to null for now.');
        setRecipe(null);
    } else if (!editMode) { // For new tasks not from drag-drop, or if no recipe info on task
      setRecipe(null);
      console.log('[FormInit Dep/Recipe] New task or no recipe info on task. Setting recipe to null.');
    }
    // --- END OF RESTORED/CORRECTED Department and Recipe LOGIC ---

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
        setStartTime(new Date(new Date().setHours(9,0,0,0)));
      }

      if (productionTask.scheduled_end_time) {
        setEndTime(new Date(productionTask.scheduled_end_time));
      } else if (!editMode) { // Default for new tasks
         setEndTime(new Date(new Date().setHours(11,0,0,0)));
      }

      if (productionTask.assigned_staff && productionTask.assigned_staff.length > 0) {
        // This case handles when productionTask.assigned_staff is an array (e.g., from calendar drop: [{id, title}])
        console.log('[FormInit pt.assigned_staff] Processing productionTask.assigned_staff:', JSON.stringify(productionTask.assigned_staff));
        console.log('[FormInit pt.assigned_staff] staffOptions available:', staffOptions.length > 0);
        
        const mappedStaffToSet = productionTask.assigned_staff.map(s_minimal => {
          if (s_minimal.id && staffOptions.length > 0) {
            const fullStaffObj = staffOptions.find(opt => opt.id.toString() === s_minimal.id.toString());
            if (fullStaffObj) {
              console.log(`[FormInit pt.assigned_staff] Mapped ID ${s_minimal.id} to FULL object:`, JSON.stringify(fullStaffObj));
              return fullStaffObj;
            }
            console.warn(`[FormInit pt.assigned_staff] Mapped ID ${s_minimal.id} NOT FOUND in staffOptions. Returning minimal:`, JSON.stringify(s_minimal));
            return s_minimal; // Fallback to minimal if not found in options
          }
          console.log(`[FormInit pt.assigned_staff] Minimal staff object ${s_minimal.id} processed (no staffOptions or no id). Returning minimal:`, JSON.stringify(s_minimal));
          return s_minimal; // Fallback if no ID or staffOptions not ready
        });
        console.log('[FormInit pt.assigned_staff] Setting assignedStaff to (mapped):', JSON.stringify(mappedStaffToSet));
        setAssignedStaff(mappedStaffToSet);

      } else if (productionTask.assigned_staff_id) { // If only assigned_staff_id is present
        console.log('[FormInit pt.assigned_staff_id] Processing productionTask.assigned_staff_id:', productionTask.assigned_staff_id);
        console.log('[FormInit pt.assigned_staff_id] staffOptions available:', staffOptions.length > 0);
        let staffToSetById = [];
        if (staffOptions.length > 0) {
          const fullStaffObject = staffOptions.find(staff => staff.id.toString() === productionTask.assigned_staff_id.toString());
          if (fullStaffObject) {
            console.log('[FormInit pt.assigned_staff_id] Found full staffObject for ID:', JSON.stringify(fullStaffObject));
            staffToSetById = [fullStaffObject];
          } else {
            console.warn(`[FormInit pt.assigned_staff_id] Staff ID ${productionTask.assigned_staff_id} NOT FOUND in staffOptions.`);
            // Fallback: create a temporary object that might display the ID or a placeholder name
            staffToSetById = [{ id: productionTask.assigned_staff_id.toString(), first_name: `Staff ID ${productionTask.assigned_staff_id}`, last_name: '(Not found)' }];
          }
        } else {
          // staffOptions not yet loaded. Store minimal info. The effect will re-run when staffOptions loads.
          console.log('[FormInit pt.assigned_staff_id] staffOptions NOT YET READY. Storing temporary minimal assignedStaff.');
          staffToSetById = [{ id: productionTask.assigned_staff_id.toString(), first_name: 'Loading staff...', last_name: '' }]; 
        }
        console.log('[FormInit pt.assigned_staff_id] Setting assignedStaff to:', JSON.stringify(staffToSetById));
        setAssignedStaff(staffToSetById);

      } else {
        console.log('[FormInit productionTask] No assigned_staff info in productionTask. Setting empty assignedStaff.');
        setAssignedStaff([]);
      }
      
      setNotes(productionTask.notes || '');
      setIsRecurring(productionTask.is_recurring || false);
      setRecurrenceType(productionTask.recurrence_type || 'none');
      setRecurrencePattern(productionTask.recurrence_pattern || {});
      setTaskType(productionTask.task_type || 'production');
      // Set description carefully, considering if recipe is loaded yet
      const currentRecipeName = recipe?.name || productionTask?.recipe_name; // Use recipe state here
      setDescription(productionTask.description || (currentRecipeName ? `Production of ${currentRecipeName}`: 'New Production Task'));
      setDurationMinutes(productionTask.duration_minutes || 120); // Default duration if not set

    } else { // New task, not from drag-drop, not edit mode
      // Department and Recipe are handled by the restored logic above for new tasks
      setScheduledDate(selectedDate || new Date());
      setStartTime(new Date(new Date().setHours(9,0,0,0)));
      setEndTime(new Date(new Date().setHours(11,0,0,0)));
      setBatchSize(1);
      setTaskType('production');
      setNotes('');
      setDescription(recipe?.name ? `Production of ${recipe.name}` : 'New Production Task'); // Use recipe state here
      setDurationMinutes(120);
      setIsRecurring(false);
      setRecurrenceType('none');
      setRecurrencePattern({});
      if (selectedStaff) { // If staff was selected on calendar
          // Ensure selectedStaff is mapped to a full object if possible
          if (staffOptions.length > 0) {
            const fullSelectedStaff = staffOptions.find(opt => opt.id.toString() === selectedStaff.id.toString());
            if (fullSelectedStaff) {
              console.log('[FormInit NewTask] Setting selectedStaff (full object):', JSON.stringify(fullSelectedStaff));
              setAssignedStaff([fullSelectedStaff]);
            } else {
              console.warn('[FormInit NewTask] SelectedStaff ID not found in staffOptions. Using minimal:', JSON.stringify(selectedStaff));
              setAssignedStaff([selectedStaff]); // Fallback
            }
          } else {
            console.log('[FormInit NewTask] Setting selectedStaff (staffOptions not ready, using minimal):', JSON.stringify(selectedStaff));
            setAssignedStaff([selectedStaff]); // Fallback
    }
      } // Closes if (selectedStaff)
    } // Closes main else block (for !productionTask)

    if (productionTask && productionTask.scheduled_end_time) {
      setEndTime(new Date(productionTask.scheduled_end_time));
    } else if (!productionTask && !editMode) { // More explicit: for new tasks if productionTask is null
       setEndTime(new Date(new Date().setHours(11,0,0,0)));
    }

    if (productionTask && productionTask.assigned_staff && productionTask.assigned_staff.length > 0) {
      // This case handles when productionTask.assigned_staff is an array (e.g., from calendar drop: [{id, title}])
      console.log('[FormInit pt.assigned_staff] Processing productionTask.assigned_staff:', JSON.stringify(productionTask.assigned_staff));
      console.log('[FormInit pt.assigned_staff] staffOptions available:', staffOptions.length > 0);
      
      const mappedStaffToSet = productionTask.assigned_staff.map(s_minimal => {
        if (s_minimal.id && staffOptions.length > 0) {
          const fullStaffObj = staffOptions.find(opt => opt.id.toString() === s_minimal.id.toString());
          if (fullStaffObj) {
            console.log(`[FormInit pt.assigned_staff] Mapped ID ${s_minimal.id} to FULL object:`, JSON.stringify(fullStaffObj));
            return fullStaffObj;
          }
          console.warn(`[FormInit pt.assigned_staff] Mapped ID ${s_minimal.id} NOT FOUND in staffOptions. Returning minimal:`, JSON.stringify(s_minimal));
          return s_minimal; // Fallback to minimal if not found in options
        }
        console.log(`[FormInit pt.assigned_staff] Minimal staff object ${s_minimal.id} processed (no staffOptions or no id). Returning minimal:`, JSON.stringify(s_minimal));
        return s_minimal; // Fallback if no ID or staffOptions not ready
      });
      setAssignedStaff(mappedStaffToSet);
    }
  }, [open, productionTask, currentUser, departmentOptions, recipeOptions, staffOptions, editMode, selectedDate, selectedStaff]);
  
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
        <span>{editMode ? 'Edit Production Task' : 'Schedule New Production Task'}</span>
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
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={{ xs: 2, md: 3 }}>
              {/* Recipe Selection */}
              <Box>
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
                  slotProps={{
                    textField: {
                      label: "Recipe",
                      variant: "outlined",
                      fullWidth: true,
                      error: !!errors.recipe,
                      helperText: errors.recipe || " ",
                      required: true,
                      onBlur: () => validateField('recipe', recipe),
                      InputProps: {
                        style: { overflow: 'hidden', textOverflow: 'ellipsis' }
                      }
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  ListboxProps={{
                    sx: { maxHeight: '200px' }
                  }}
                  disablePortal
                  popupIcon={<ArrowDropDownIcon />}
                  clearOnBlur={false}
                  openOnFocus
                />
              </Box>

              {/* Department Display */}
              <Box>
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
              </Box>

              {/* Batch Size */}
              <Box>
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
              </Box>
              
              {/* Task Type */}
              <Box>
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
              </Box>
            
            {/* Duration */}
            <Box>
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
            </Box>
          </Box>
        </Box>

        {/* Scheduling Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
            Scheduling
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={{ xs: 2, md: 3 }}>
            {/* Date Picker */}
            <Box>
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
            </Box>

            {/* Start Time Picker */}
            <Box>
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
            </Box>

            {/* End Time Picker */}
            <Box>
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
            </Box>
            
            {/* Staff Assignment */}
            <Box>
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
                  <Box component="li" {...props} key={option.id}>
                    <Typography>
                      {`${option.first_name || ''} ${option.last_name || ''}`.trim()}
                    </Typography>
                  </Box>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={`${option.first_name || ''} ${option.last_name || ''}`.trim()}
                      /* Simplified sx for debugging */
                      sx={{
                        margin: '2px',
                        // Ensure basic visibility
                        backgroundColor: 'lightgray',
                        color: 'black',
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned Staff"
                    variant="outlined"
                    fullWidth
                    error={!!errors.assignedStaff}
                    helperText={errors.assignedStaff || " "}
                    required
                    onBlur={() => validateField('assignedStaff', assignedStaff)}
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
                sx={{ 
                  minHeight: '80px',
                  '& .MuiOutlinedInput-root': {
                    padding: '8px 8px 8px 12px',
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    right: '8px',
                  },
                  '& .MuiChip-root': {
                    margin: '2px',
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Additional Details Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
            Additional Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={{ xs: 2, md: 3 }}>
            {/* Description Text Area */}
            <Box>
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
            </Box>

            {/* Notes Text Area */}
            <Box>
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
            </Box>
          </Box>
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
