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
  Alert,
  Stack
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
  const [batchUnit, setBatchUnit] = useState('kg');
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
  const [taskType] = useState('production'); // default, not shown in UI
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

    // --- START OF ENHANCED Department and Recipe LOGIC ---
    let newDepartmentId = '';
    let derivedDeptName = '';
    
    // Debug the currentUser object structure in detail
    console.log('[FormInit Dep/Recipe] Current User Object:', JSON.stringify(currentUser, null, 2));
    console.log('[FormInit Dep/Recipe] Determining department. EditMode:', editMode, 'Task:', productionTask, 'User:', currentUser, 'Recipe on Task:', productionTask?.recipe, 'DeptOptions:', departmentOptions.length);
    
    // Enhanced check for user's department with more possible paths
    let userDepartmentId = null;
    let userDepartmentName = null;
    
    // Check all possible paths where department info might be stored
    if (currentUser) {
      // Direct properties
      if (currentUser.department_id) {
        userDepartmentId = currentUser.department_id;
        userDepartmentName = currentUser.department_name;
      } 
      // Nested department object
      else if (currentUser.department) {
        if (typeof currentUser.department === 'object') {
          userDepartmentId = currentUser.department.id;
          userDepartmentName = currentUser.department.name;
        } else if (typeof currentUser.department === 'string' || typeof currentUser.department === 'number') {
          // If department is just an ID
          userDepartmentId = currentUser.department;
          // Try to find the name from department options
          if (departmentOptions.length > 0) {
            const deptObj = departmentOptions.find(d => String(d.id) === String(currentUser.department));
            if (deptObj) userDepartmentName = deptObj.name;
          }
        }
      }
      // Check profile.department path
      else if (currentUser.profile && currentUser.profile.department) {
        if (typeof currentUser.profile.department === 'object') {
          userDepartmentId = currentUser.profile.department.id;
          userDepartmentName = currentUser.profile.department.name;
        } else {
          userDepartmentId = currentUser.profile.department;
          // Try to find the name from department options
          if (departmentOptions.length > 0) {
            const deptObj = departmentOptions.find(d => String(d.id) === String(currentUser.profile.department));
            if (deptObj) userDepartmentName = deptObj.name;
          }
        }
      }
    }
    
    console.log('[FormInit Dep/Recipe] Extracted user department info:', { 
      userDepartmentId, 
      userDepartmentName,
      departmentOptions
    });

    if (editMode && productionTask?.department_id) {
      // In edit mode, keep the task's original department
      newDepartmentId = String(productionTask.department_id);
      console.log('[FormInit Dep/Recipe] Department from task (edit mode):', newDepartmentId);
    } else if (productionTask?.recipe) { 
      // Task from drag-drop usually has recipe object
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
    } 
    
    // If no department has been set yet, prioritize user's department
    if (!newDepartmentId && userDepartmentId) {
      newDepartmentId = String(userDepartmentId);
      if (userDepartmentName) {
        derivedDeptName = userDepartmentName;
      }
      console.log('[FormInit Dep/Recipe] Department auto-populated from current user:', { newDepartmentId, derivedDeptName });
    }
    
    // Fallback to first department in options if we still don't have a department
    if (!newDepartmentId && departmentOptions.length > 0) {
      newDepartmentId = String(departmentOptions[0].id);
      derivedDeptName = departmentOptions[0].name;
      console.log('[FormInit Dep/Recipe] No user department found, using first available department:', { newDepartmentId, derivedDeptName });
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
      setBatchUnit(productionTask.batch_unit || 'kg');
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
      setDescription(productionTask.description || (recipe?.name ? `Production of ${recipe.name}`: 'New Production Task'));
      setDurationMinutes(productionTask.duration_minutes || 120); // Default duration if not set

    } else { // New task, not from drag-drop, not edit mode
      // Department and Recipe are handled by the restored logic above for new tasks
      setScheduledDate(selectedDate || new Date());
      setStartTime(new Date(new Date().setHours(9,0,0,0)));
      setEndTime(new Date(new Date().setHours(11,0,0,0)));
      setBatchSize(1);
      setBatchUnit('kg');
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
      case 'batchUnit':
        if (!value) newErrors.batchUnit = 'Unit is required';
        else delete newErrors.batchUnit;
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
    if (!batchUnit) newErrors.batchUnit = 'Unit is required';
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

    // Combine date and time for start and end - ensure we're working with Date objects
    const startTimeObj = startTime instanceof Date ? startTime : new Date(startTime);
    const endTimeObj = endTime instanceof Date ? endTime : new Date(endTime);
    const scheduledDateObj = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
    
    const combinedStartTime = new Date(scheduledDateObj);
    combinedStartTime.setHours(startTimeObj.getHours(), startTimeObj.getMinutes(), startTimeObj.getSeconds());

    const combinedEndTime = new Date(scheduledDateObj);
    combinedEndTime.setHours(endTimeObj.getHours(), endTimeObj.getMinutes(), endTimeObj.getSeconds());
    
    console.log('Form submission - combined times:', {
      scheduledDate: scheduledDateObj,
      startTime: startTimeObj,
      endTime: endTimeObj,
      combinedStartTime,
      combinedEndTime
    });

    const taskData = {
      recipe_id: recipe ? (recipe.recipe_id || recipe.id) : null, // Handle both recipe_id and id formats
      department_id: department ? parseInt(department) : null,
      batch_size: batchSize ? parseFloat(batchSize) : null,  // Changed from scheduled_quantity to batch_size
      batch_unit: batchUnit,
      scheduled_date: format(scheduledDateObj, "yyyy-MM-dd"),  // Added explicit scheduled_date field
      task_type: taskType,
      scheduled_start_time: format(combinedStartTime, "yyyy-MM-dd'T'HH:mm:ssxxx"), // ISO 8601 with timezone
      scheduled_end_time: format(combinedEndTime, "yyyy-MM-dd'T'HH:mm:ssxxx"),   // ISO 8601 with timezone
      start_time: format(startTimeObj, "HH:mm:ss"), // Add time-only fields for backend compatibility
      end_time: format(endTimeObj, "HH:mm:ss"),     // Add time-only fields for backend compatibility
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
      // Add a small delay to ensure the modal doesn't close too quickly
      // This gives the parent component time to process the data
      const result = await onSave(taskData, editMode ? productionTask.id : null);
      console.log('Task saved successfully:', result);
      
      // Don't close the modal here - let the parent component handle it
      // The parent will close it after ensuring the calendar is updated
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
      maxWidth="xs"
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
      <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}> {/* Adjust padding */}
          {/* Basic Information Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom color="primary">
              {departmentName || 'Task Information'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container columnSpacing={2} rowSpacing={2.5} sx={{ mt: 0 }} alignItems="flex-start">
              {/* Single Column with specified order */}
              <Grid item xs={12}>
                <Stack spacing={2.5}>
                  {/* Recipe */}
                  <Autocomplete
                    id="recipe-select"
                    options={recipeOptions.filter(option => !department || option.department_id === parseInt(department) || option.department_name === departmentName )}
                    getOptionLabel={(option) => option ? `${option.name} (${option.product_code || 'N/A'})` : ''}
                    value={recipe}
                    onChange={(event, newValue) => {
                      setRecipe(newValue);
                      validateField('recipe', newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Recipe"
                        required
                        error={!!errors.recipe}
                        helperText={errors.recipe || ' '}
                        fullWidth
                      />
                    )}
                    popupIcon={<ArrowDropDownIcon />}
                  />

                  {/* Assigned Staff */}
                  <Autocomplete
                    id="assigned-staff"
                    multiple
                    options={staffOptions}
                    getOptionLabel={(option) => option.full_name || option.username || option.email}
                    value={assignedStaff}
                    onChange={(e, value) => {
                      setAssignedStaff(value);
                      validateField('assignedStaff', value);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Assigned Staff"
                        required
                        error={!!errors.assignedStaff}
                        helperText={errors.assignedStaff || ' '}
                        fullWidth
                      />
                    )}
                    popupIcon={<ArrowDropDownIcon />}
                  />

                  {/* Date */}
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={scheduledDate}
                      onChange={(date) => {
                        setScheduledDate(date);
                        validateField('scheduledDate', date);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} required error={!!errors.scheduledDate} helperText={errors.scheduledDate || ' '} fullWidth />
                      )}
                    />
                  </LocalizationProvider>

                  {/* Batch Size + Unit */}
                  <Box display="flex" gap={1}>
                    <TextField
                      sx={{ flex: 2, '& .MuiInputBase-input': { fontWeight: 500 } }}
                      value={batchSize}
                      onChange={(e) => {
                        setBatchSize(e.target.value);
                        validateField('batchSize', e.target.value);
                      }}
                      onBlur={() => validateField('batchSize', batchSize)}
                      label="Batch Size"
                      type="number"
                      required
                      error={!!errors.batchSize}
                      helperText={errors.batchSize || ' '}
                      inputProps={{ min:1, step:1, style:{textAlign:'right',paddingRight:'40px'} }}
                    />
                    <FormControl sx={{ flex: 1 }} error={!!errors.batchUnit}>
                      <InputLabel id="batch-unit-label">Unit</InputLabel>
                      <Select
                        labelId="batch-unit-label"
                        value={batchUnit}
                        label="Unit"
                        onChange={(e) => {
                          setBatchUnit(e.target.value);
                          validateField('batchUnit', e.target.value);
                        }}
                      >
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                        <MenuItem value="ea">ea</MenuItem>
                        <MenuItem value="case">case</MenuItem>
                      </Select>
                      <FormHelperText>{errors.batchUnit || ' '}</FormHelperText>
                    </FormControl>
                  </Box>

                  {/* Start Time */}
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={(time) => {
                        setStartTime(time);
                        validateField('startTime', time);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} required error={!!errors.startTime} helperText={errors.startTime || ' '} fullWidth />
                      )}
                    />
                  </LocalizationProvider>

                  {/* End Time */}
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="End Time"
                      value={endTime}
                      onChange={(time) => {
                        setEndTime(time);
                        validateField('endTime', time);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} required error={!!errors.endTime} helperText={errors.endTime || ' '} fullWidth />
                      )}
                    />
                  </LocalizationProvider>
                </Stack>
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
