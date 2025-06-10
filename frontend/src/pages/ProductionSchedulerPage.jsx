import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import apiClient from '../services/api';
import axios from 'axios';
import { Draggable } from '@fullcalendar/interaction';
import ProductionSchedulerCalendar from '../components/recipes/ProductionSchedulerCalendar';
import ProductionAssignmentModal from '../components/recipes/ProductionAssignmentModal';
import ProductionTaskDetailModal from '../components/recipes/ProductionTaskDetailModal';
import ProductionScheduleList from '../components/recipes/ProductionScheduleList';
import { format, addHours } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const ProductionSchedulerPage = () => {
  const theme = useTheme();
  const [productionTasks, setProductionTasks] = useState([]);
  const [staffResources, setStaffResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('resourceTimeGridDay');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [canEdit] = useState(true); // This would typically come from user roles/permissions
  const [tabValue, setTabValue] = useState(0); // For tab navigation

  const calendarRef = useRef(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recipeFilter, setRecipeFilter] = useState(''); // Recipe ID or name
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [placeholderEventId, setPlaceholderEventId] = useState(null);
  
  // Reference for draggable recipes container
  const externalEventsRef = useRef(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Auto-clear success and error messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Department-specific styling
  const getDepartmentColor = () => {
    const deptName = staffResources.length > 0 && staffResources[0].department_name
      ? staffResources[0].department_name.toLowerCase()
      : '';
    
    if (deptName.includes('bakery')) return '#F9A825'; // Yellow for Bakery
    if (deptName.includes('butchery')) return '#D32F2F'; // Red for Butchery
    if (deptName.includes('hmr') || deptName.includes('home meal')) return '#757575'; // Grey for HMR
    return theme.palette.primary.main;
  };
  
  const departmentColor = getDepartmentColor();

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await apiClient.get('/departments/');
      // Ensure we have an array, even if the API returns an object with results
      const departments = Array.isArray(response.data) ? response.data : 
                         (response.data?.results || []);
      setDepartmentOptions(departments);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments.');
    }
  }, []);

  const fetchProductionTasks = useCallback(async (date, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // Get start and end of month for filtering
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const params = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        recipe: recipeFilter || undefined,
        // Add a cache-busting parameter if forceRefresh is true
        _t: forceRefresh ? Date.now() : undefined
      };
      
      const response = await apiClient.get('/production-schedules/', { params });
      // Handle both array responses and paginated responses with results property
      const tasksData = Array.isArray(response.data) ? response.data : 
                       (response.data?.results || []);
      
      console.log(`Fetched ${tasksData.length} production tasks for ${formattedDate}${forceRefresh ? ' (forced refresh)' : ''}`);
      
      // Helper function to get color based on task status
      const getTaskColor = (status, isBorder = false) => {
        const theme = {
          palette: {
            primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
            success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
            error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
            warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
            info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
            grey: { 400: '#bdbdbd', 500: '#9e9e9e', 600: '#757575' }
          }
        };
        
        switch (status) {
          case 'completed':
            return isBorder ? theme.palette.success.dark : theme.palette.success.main;
          case 'in_progress':
            return isBorder ? theme.palette.info.dark : theme.palette.info.main;
          case 'scheduled':
            return isBorder ? theme.palette.primary.dark : theme.palette.primary.main;
          case 'cancelled':
            return isBorder ? theme.palette.error.dark : theme.palette.error.main;
          case 'pending_review':
            return isBorder ? theme.palette.warning.dark : theme.palette.warning.main;
          case 'on_hold':
            return isBorder ? theme.palette.grey[600] : theme.palette.grey[500];
          default:
            return isBorder ? theme.palette.primary.dark : theme.palette.primary.main;
        }
      };
      
      // Map tasks to calendar events
      const tasks = tasksData.map(task => {
        // Ensure we have valid dates - create default times if missing
        let startTime = null;
        let endTime = null;
        
        // First try to use scheduled_start_time and scheduled_end_time (full ISO datetime)
        if (task.scheduled_start_time) {
          startTime = new Date(task.scheduled_start_time);
        }
        
        if (task.scheduled_end_time) {
          endTime = new Date(task.scheduled_end_time);
        }
        
        // If those aren't available, try to combine scheduled_date with start_time and end_time
        if (!startTime && task.scheduled_date) {
          const scheduledDate = new Date(task.scheduled_date);
          
          if (task.start_time) {
            // Parse time in format HH:MM:SS
            const [hours, minutes, seconds] = task.start_time.split(':').map(Number);
            startTime = new Date(scheduledDate);
            startTime.setHours(hours || 9, minutes || 0, seconds || 0);
          } else {
            // Default to 9:00 AM if no time specified
            startTime = new Date(scheduledDate);
            startTime.setHours(9, 0, 0);
          }
          
          if (task.end_time) {
            // Parse time in format HH:MM:SS
            const [hours, minutes, seconds] = task.end_time.split(':').map(Number);
            endTime = new Date(scheduledDate);
            endTime.setHours(hours || 11, minutes || 0, seconds || 0);
          } else {
            // Default to start time + 2 hours if no end time specified
            endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 2);
          }
        }
        
        // Last resort - create default times based on current date
        if (!startTime) {
          console.warn(`Task ${task.id} has no valid start time - creating default:`, task);
          const defaultDate = task.scheduled_date ? new Date(task.scheduled_date) : new Date();
          startTime = new Date(defaultDate);
          startTime.setHours(9, 0, 0);
          endTime = new Date(defaultDate);
          endTime.setHours(11, 0, 0);
        }
        
        // Ensure end time is after start time
        if (endTime <= startTime) {
          endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 2);
        }
        
        // Get recipe name from either recipe_details or directly from recipe_name field
        const recipeName = task.recipe_details?.name || task.recipe_name || 'Unnamed Recipe';
        
        // Get batch size from either scheduled_quantity or batch_size field
        const batchSize = task.scheduled_quantity || task.batch_size || '';
        
        // Initialize staff IDs array
        let staffIds = [];
        
        if (task.assigned_staff_details && task.assigned_staff_details.length > 0) {
          staffIds = task.assigned_staff_details.map(staff => staff.id.toString());
        } else if (task.assigned_staff_ids) { // Fallback for older format if needed
          staffIds = Array.isArray(task.assigned_staff_ids) ? task.assigned_staff_ids.map(id => id.toString()) : [task.assigned_staff_ids.toString()];
        } else if (task.assigned_staff_id) { // Fallback for single ID format
          staffIds = [task.assigned_staff_id.toString()];
        }
        
        // Use the first staff ID as the resourceId for calendar display
        const resourceId = staffIds.length > 0 ? staffIds[0] : 'unassigned'; // staffIds are already strings
        
        return {
          id: task.id.toString(),
          resourceId: resourceId,
          title: `${recipeName} (${batchSize}${task.recipe_details?.yield_unit || ''})`,
          start: startTime,
          end: endTime,
          extendedProps: {
            ...task,
            recipe_name: recipeName,
            batch_size: batchSize,
            yield_unit: task.recipe_details?.yield_unit || '',
            description: task.description || `Production of ${recipeName}`,
            status: task.status || 'scheduled',
            task_type: task.task_type || 'production',
            assigned_staff_ids: staffIds
          },
          backgroundColor: getTaskColor(task.status || 'scheduled'),
          borderColor: getTaskColor(task.status || 'scheduled', true),
          textColor: '#ffffff'
        };
      }).filter(Boolean); // Remove any null events
      
      console.log(`Mapped ${tasks.length} tasks for calendar display`);
      
      // Update state with new tasks
      if (forceRefresh) {
        // For force refresh, completely replace the events
        console.log('Force refreshing calendar events');
        setProductionTasks(tasks);
      } else {
        // For normal fetch, merge with existing events to avoid UI flicker
        setProductionTasks(prevTasks => {
          // Create a map of existing events by ID for quick lookup
          const existingTasksMap = new Map(prevTasks.map(task => [task.id, task]));
          
          // Create a map of new tasks by ID
          const newTasksMap = new Map(tasks.map(task => [task.id, task]));
          
          // Start with all new tasks
          const mergedTasks = [...tasks];
          
          // Add any existing tasks that aren't in the new set (might be from other dates)
          prevTasks.forEach(task => {
            if (!newTasksMap.has(task.id)) {
              mergedTasks.push(task);
            }
          });
          
          console.log(`Merged ${mergedTasks.length} tasks for calendar (${tasks.length} new, ${mergedTasks.length - tasks.length} retained)`);
          return mergedTasks;
        });
      }
    } catch (err) {
      console.error('Error fetching production tasks:', err);
      setError('Failed to load production tasks.');
    }
    setLoading(false);
  }, [departmentFilter, statusFilter, recipeFilter]);

  const fetchStaffResources = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/'); // Get all users
      // Handle both array responses and paginated responses with results property
      const userData = Array.isArray(response.data) ? response.data : 
                      (response.data?.results || []);
      console.log('Raw userData from /api/users/:', userData);

      const resources = userData
        .filter(user => user.profile?.role === 'staff' || user.profile?.role === 'manager' || 
                 user.user_role === 'staff' || user.user_role === 'manager')
        .map(user => ({
          id: user.id.toString(),
          title: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Staff Member',
        }));
      console.log('Filtered and mapped staff resources:', resources);
      setStaffResources(resources);
    } catch (err) {
      console.error('Error fetching staff resources:', err);
      // setError('Failed to load staff resources.'); // Optional: can be non-critical
    }
  }, []);

  // Fetch available recipes for drag-and-drop
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const params = {
        is_active: true,
        department_id: departmentFilter || undefined
      };
      const response = await apiClient.get('/recipes/', { params });
      // Handle both array responses and paginated responses with results property
      const recipesData = Array.isArray(response.data) ? response.data :
                       (response.data?.results || []);
      setRecipes(recipesData);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes.');
    } finally {
      setLoadingRecipes(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    fetchDepartments();
    fetchStaffResources();
    // fetchProductionTasks(selectedDate); // Handled by its own useEffect
    fetchRecipes();
  }, [fetchDepartments, fetchStaffResources, fetchRecipes]);

  // Create a stable string representation of selectedDate for the useEffect dependency array
  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  useEffect(() => {
    if (selectedDate) { // Ensure selectedDate is not null/undefined before fetching
      fetchProductionTasks(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [selectedDateString, fetchProductionTasks]); // fetchProductionTasks is already a useCallback

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // The useEffect hook listening to selectedDate will handle calling fetchProductionTasks.
  };

  // Handle calendar view changes (month, week, day, timeline)
  const handleViewChange = (newView) => {
    // Update the calendarView state. The key prop on ProductionSchedulerCalendar
    // will handle re-initializing FullCalendar with the new view.
    if (calendarView !== newView) {
      setCalendarView(newView);
    }
  };

  // Function to initialize draggable recipe items
  const initializeDraggables = useCallback(() => {
    let draggable = null;
    if (externalEventsRef.current && recipes.length > 0) {
      console.log('Initializing draggable recipe items...');
      // Use FullCalendar's Draggable utility for external events
      draggable = new Draggable(externalEventsRef.current, {
        itemSelector: '.draggable-recipe-item',
        eventData: function(eventEl) {
          const eventDataString = eventEl.getAttribute('data-event');
          if (eventDataString) {
            try {
              const parsedData = JSON.parse(eventDataString);
              return {
                title: parsedData.title,
                duration: parsedData.duration || '02:00', // Default 2 hour duration
                extendedProps: { 
                  recipe_id: parsedData.recipe_id,
                  recipe_name: parsedData.title, // Added recipe_name
                  isExternal: true 
                },
              };
            } catch (e) {
              console.error("Failed to parse event data from draggable item:", e);
              return {};
            }
          }
          return {}; 
        }
      });
      
      return draggable;
    }
    return null;
  }, [recipes]);
  
  // Initialize draggable recipe items when component mounts or recipes change
  useEffect(() => {
    let draggable = initializeDraggables();
    
    // Re-initialize draggable after a short delay to ensure DOM is fully updated
    const reInitTimeout = setTimeout(() => {
      if (draggable) {
        draggable.destroy();
        draggable = initializeDraggables();
        console.log('Re-initialized draggable recipe items after delay');
      }
    }, 500);
    
    return () => {
      clearTimeout(reInitTimeout);
      if (draggable) {
        draggable.destroy();
      }
    };
  }, [recipes, initializeDraggables]);

  // Handle receiving an external event (dropped recipe)
  const handleEventReceive = (receiveInfo) => {
    const droppedEventData = receiveInfo.event; // Data of the event FullCalendar proposes
    const initialExtendedProps = droppedEventData.extendedProps;

    if (initialExtendedProps && initialExtendedProps.isExternal) {
        console.log('External recipe event drop detected:', droppedEventData);

        // CRITICAL: Revert FullCalendar's default processing for this drop.
        // We will handle adding our own styled and detailed placeholder.
        if (receiveInfo.revert) {
            receiveInfo.revert();
        } else {
            console.error('Could not revert FullCalendar drop, revert function missing.');
            // Potentially remove the event if it somehow got added without an ID we can track
            // This part is tricky as FullCalendar might have already added it.
            // For now, logging error and proceeding to add our placeholder.
        }

        const placeholderGeneratedId = `placeholder-${Date.now()}`;
        const startTime = droppedEventData.start;
        const endTime = droppedEventData.end || addHours(startTime, 2);
        
        let resource = null;
        if (droppedEventData.getResources) {
            const resources = droppedEventData.getResources();
            console.log('Dropped event resources:', resources);
            if (resources.length > 0) {
                resource = resources[0];
                console.log('Selected resource from drop:', resource);
                console.log('Selected resource ID from drop:', resource?.id);
            } else {
                console.log('Dropped event has no associated resources.');
            }
        } else {
            console.log('droppedEventData.getResources function does not exist.');
        }
        
        const staffId = (resource && resource.id && resource.id.toString() !== 'unassigned') ? resource.id.toString() : null;
        console.log('Determined staffId for modal/placeholder:', staffId);

        const recipeDetails = recipes.find(r => 
            r.id === initialExtendedProps.recipe_id || r.recipe_id === initialExtendedProps.recipe_id
        );

        const staffDetails = staffId ? staffResources.find(s => s.id === staffId) : null;

        const taskDataForModal = {
            id: null,
            recipe: recipeDetails,
            recipe_id: initialExtendedProps.recipe_id,
            recipe_name: recipeDetails?.name || initialExtendedProps.recipe_name || droppedEventData.title,
            yield_unit: recipeDetails?.yield_unit || 'units',
            scheduled_start_time: startTime,
            scheduled_end_time: endTime,
            assigned_staff_id: staffId,
            assigned_staff: staffDetails ? [staffDetails] : [],
            task_type: 'production',
            scheduled_quantity: 1,
            status: 'scheduled',
            department_id: recipeDetails?.department_id || null,
            description: `Production of ${recipeDetails?.name || initialExtendedProps.recipe_name || droppedEventData.title}`,
            notes: ''
        };
        console.log('Recipe dropped - Task data for modal:', taskDataForModal);

        // Now, programmatically add our own placeholder event
        console.log(`[handleEventReceive] About to add placeholder. taskDataForModal.assigned_staff_id: ${taskDataForModal.assigned_staff_id}, type: ${typeof taskDataForModal.assigned_staff_id}`);
        try {
            if (calendarRef.current?.getApi()) {
                const calendarApi = calendarRef.current.getApi();
                const eventToAdd = {
                    id: placeholderGeneratedId,
                    title: taskDataForModal.recipe_name || 'New Production Task',
                    start: taskDataForModal.scheduled_start_time,
                    end: taskDataForModal.scheduled_end_time,
                    resourceId: taskDataForModal.assigned_staff_id || undefined, // Ensure undefined if null/falsy
                    allDay: false,
                    extendedProps: {
                        ...taskDataForModal,
                        isExternal: true,
                        isPlaceholder: true
                    },
                    backgroundColor: theme.palette.grey[300],
                    borderColor: theme.palette.grey[500],
                    textColor: theme.palette.grey[700],
                    classNames: ['placeholder-production-event']
                };
                console.log('[handleEventReceive] Event object to add to calendar:', eventToAdd);
                calendarApi.addEvent(eventToAdd);
                setPlaceholderEventId(placeholderGeneratedId);
                console.log(`[handleEventReceive] Added new placeholder event ${placeholderGeneratedId} to calendar.`);
            } else {
                console.warn('[handleEventReceive] Calendar API not available to add placeholder event.');
            }
            
            setSelectedTask(taskDataForModal);
            setEditMode(false);
            setAssignmentModalOpen(true);
            console.log('[handleEventReceive] Modal should be opening now.');

        } catch (error) {
            console.error('[handleEventReceive] Error during placeholder addition or modal opening:', error);
            // Attempt to clean up if placeholderId was set but event add might have failed partially
            if (placeholderEventId === placeholderGeneratedId) {
                setPlaceholderEventId(null); // Clear our tracking ID
                console.warn('[handleEventReceive] Cleared placeholderEventId due to error.');
            }
        }

    } else {
        console.warn('handleEventReceive called for a non-external or malformed event. Reverting if possible.', droppedEventData);
        if (receiveInfo.revert) {
           receiveInfo.revert();
        }
    }
};

  const handleCalendarDateChange = (newDate) => {
    // Called when calendar navigates, update our selectedDate
    setSelectedDate(newDate);
  };

  const handleOpenAssignmentModal = (date, staffId = null) => {
    setSelectedDate(date || new Date());
    setSelectedTask(null); // Clear previous task for new assignment
    setEditMode(false);
    // If staffId is provided (e.g., clicking on a resource column), pre-select staff
    // const staff = staffResources.find(s => s.id === staffId);
    // Pass staff object to modal if found
    setAssignmentModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const taskId = clickInfo.event.id;
    const task = productionTasks.find(t => t.id.toString() === taskId.toString())?.extendedProps;
    if (task) {
      setSelectedTask(task);
      setDetailModalOpen(true);
    }
  };

  const handleCloseAssignmentModal = () => {
    if (placeholderEventId && calendarRef.current?.getApi) {
      const calendarApi = calendarRef.current.getApi();
      const placeholderEvent = calendarApi.getEventById(placeholderEventId);
      if (placeholderEvent) {
        const originalEventId = placeholderEvent.extendedProps?.originalEventId;
        placeholderEvent.remove();
        if (originalEventId) {
          fetchProductionTasks(selectedDate, true);
        }
      }
      setPlaceholderEventId(null); // Clear the placeholder ID
    }
    setAssignmentModalOpen(false);
    setEditMode(false); // Reset edit mode
    setSelectedTask(null); // Clear any selected task
  };

  const handleSaveProductionTask = async (taskData) => {
    setLoading(true);
    try {
      let response;
      let actionDescription = '';
      
      // Check if this is from a drag operation (has originalEventId in the placeholder)
      const isFromDragOperation = placeholderEventId && calendarRef.current?.getApi && 
        calendarRef.current.getApi().getEventById(placeholderEventId)?.extendedProps?.originalEventId;
      
      console.log(`Saving task with ID: ${selectedTask?.id}, isFromDragOperation: ${isFromDragOperation}`);
      
      if (editMode && selectedTask && selectedTask.id) {
        // For drag operations, we want to include information about what changed
        if (isFromDragOperation && selectedTask._originalEvent) {
          // Log the changes for debugging
          console.log('Changes from drag operation:', {
            originalStart: selectedTask._originalEvent.start,
            newStart: new Date(taskData.scheduled_start_time),
            originalResourceId: selectedTask._originalEvent.resourceId,
            newResourceId: taskData.assigned_staff_id
          });
          
          actionDescription = 'Rescheduled via drag-and-drop';
        } else {
          actionDescription = 'Updated';
        }
        
        response = await apiClient.put(`/production-schedules/${selectedTask.id}/`, taskData);
        console.log(`${actionDescription} production task:`, response.data);
      } else {
        response = await apiClient.post('/production-schedules/', taskData);
        console.log('Created new production task:', response.data);
        actionDescription = 'Created';
      }
      
      // Store the newly created/updated task data for immediate use
      const savedTaskData = response.data;
      console.log('Saved task data for calendar update:', savedTaskData);
      
      // Remove placeholder event if it exists
      if (placeholderEventId && calendarRef.current?.getApi) {
        const calendarApi = calendarRef.current.getApi();
        const placeholderEvent = calendarApi.getEventById(placeholderEventId);
        if (placeholderEvent) {
          placeholderEvent.remove();
          console.log(`Placeholder event ${placeholderEventId} removed successfully.`);
        }
        setPlaceholderEventId(null);
      }
      
      // Ensure calendar is refreshed with the latest data
      // Force refresh for drag operations to ensure proper rendering
      await fetchProductionTasks(selectedDate, true);
      
      // Show success message
      setSuccessMessage(`Task ${actionDescription.toLowerCase()}: ${savedTaskData.recipe_name || 'Production task'}`);
      
      // Close the modal immediately
      setAssignmentModalOpen(false);
      setEditMode(false);
      setSelectedTask(null);
      
      // Reinitialize draggable elements to ensure they work after saving
      setTimeout(() => {
        // First destroy any existing draggables to avoid duplicates
        if (externalEventsRef.current) {
          console.log('Reinitializing draggable recipe elements after successful save...');
          const draggable = initializeDraggables();
          if (draggable) {
            console.log('Successfully reinitialized draggable elements');
          }
        }
        
        // If we saved a new task or rescheduled via drag, navigate to its date to ensure visibility
        if (calendarRef.current?.getApi && (!editMode || isFromDragOperation) && taskData.scheduled_date) {
          const taskDate = new Date(taskData.scheduled_date);
          calendarRef.current.getApi().gotoDate(taskDate);
        }
      }, 200); // Increased delay to ensure DOM is updated first
    } catch (err) {
      console.error('Error saving production task:', err);
      setError(`Failed to save production task: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
      
      // If there was an error and this was a drag operation, restore the original event
      if (placeholderEventId && calendarRef.current?.getApi) {
        // Remove the placeholder event
        const calendarApi = calendarRef.current.getApi();
        const placeholderEvent = calendarApi.getEventById(placeholderEventId);
        if (placeholderEvent) {
          placeholderEvent.remove();
        }
        setPlaceholderEventId(null);
        
        // Force refresh to restore the original event
        fetchProductionTasks(selectedDate, true);
      }
    }
    setLoading(false);
  };

  const handleEditTask = (taskToEdit) => {
    setSelectedTask(taskToEdit);
    setEditMode(true);
    setDetailModalOpen(false); // Close detail modal if open
    setAssignmentModalOpen(true);
  };

  const handleDeleteTask = async (taskToDelete) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        // Delete the task from the backend
        await apiClient.delete(`/production-schedules/${taskToDelete.id}/`);
        
        // Immediately remove the task from the calendar UI for instant feedback
        if (calendarRef.current?.getApi) {
          const calendarApi = calendarRef.current.getApi();
          const eventToRemove = calendarApi.getEventById(taskToDelete.id.toString());
          if (eventToRemove) {
            eventToRemove.remove();
          }
        }
        
        // Force refresh to ensure the deleted task is removed from the calendar and state is consistent
        await fetchProductionTasks(selectedDate, true);
        
        // Show success message
        setSuccessMessage(`Task deleted: ${taskToDelete.recipe_name || 'Production task'}`);
        
        // Close any open modals
        setDetailModalOpen(false);
        setSelectedTask(null);
        
        // Reinitialize draggable elements to ensure they work after deletion
        setTimeout(() => {
          if (externalEventsRef.current) {
            console.log('Reinitializing draggable recipe elements after successful deletion...');
            const draggable = initializeDraggables();
            if (draggable) {
              console.log('Successfully reinitialized draggable elements after deletion');
            }
          }
        }, 200); // Delay to ensure DOM is updated first
      } catch (err) {
        console.error('Error deleting production task:', err);
        setError(`Failed to delete task: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
        
        // Refresh the calendar to ensure consistent state even after an error
        fetchProductionTasks(selectedDate, true);
      }
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (updateData) => {
    setLoading(true);
    try {
      // Assuming a partial update endpoint or the main PUT endpoint handles status changes
      await axios.patch(`/api/recipe-production-tasks/${updateData.id}/`, { 
        status: updateData.status, 
        notes: updateData.notes 
      });
      fetchProductionTasks(selectedDate); // Refresh tasks
      // Optionally, close detail modal or update its content
      const updatedTask = productionTasks.find(t => t.id === updateData.id)?.extendedProps;
      if (updatedTask) {
        setSelectedTask({ ...updatedTask, status: updateData.status, notes: updateData.notes });
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status.');
    }
    setLoading(false);
  };

  const handleEventDrop = async (dropInfo) => {
    // Prevent the default revert behavior
    dropInfo.preventDefault();
    const { event, oldEvent, revert } = dropInfo;
    const taskId = event.id;
    
    // Get the task to update from our local state
    const taskToUpdate = productionTasks.find(t => t.id.toString() === taskId.toString());
    
    if (!taskToUpdate) {
      setError('Failed to find task for update.');
      revert();
      return;
    }
    
    try {
      console.log(`Event drop detected for task ${taskId}. Opening modal for confirmation.`);
      
      // Store the original event details for potential revert
      const originalStart = oldEvent.start;
      const originalEnd = oldEvent.end;
      const originalResourceId = oldEvent.getResources()?.[0]?.id;
      
      // Create a placeholder event at the new position
      const placeholderId = `placeholder-${Date.now()}`;
      const calendarApi = calendarRef.current.getApi();
      
      // Extract resource ID from the event
      const resourceId = event.getResources()?.[0]?.id;
      
      // Calculate proper end time if not provided
      const endTime = event.end || addHours(event.start, 2);
      
      // Log the drag operation details for debugging
      console.log('Drag operation details:', {
        taskId,
        originalStart,
        newStart: event.start,
        originalResourceId,
        newResourceId: resourceId,
        placeholderId
      });
      
      // Remove the original event temporarily
      event.remove();
      
      // Add placeholder event with clear visual indication
      calendarApi.addEvent({
        id: placeholderId,
        start: event.start,
        end: endTime,
        resourceId: resourceId,
        title: `${event.title} (pending)`,
        extendedProps: {
          ...taskToUpdate.extendedProps,
          isPlaceholder: true,
          originalEventId: taskId,
          originalStart,
          originalEnd,
          originalResourceId
        },
        backgroundColor: theme.palette.info.light,
        borderColor: theme.palette.info.main,
        textColor: theme.palette.info.contrastText,
        classNames: ['placeholder-production-event']
      });
      
      // Set placeholder event ID and selected task
      setPlaceholderEventId(placeholderId);
      
      // Prepare task data for the modal
      // We need to convert the event data to the format expected by the modal
      const modalTaskData = {
        ...taskToUpdate.extendedProps,
        id: taskId,
        scheduled_date: format(event.start, "yyyy-MM-dd"),
        scheduled_start_time: format(event.start, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        scheduled_end_time: format(endTime, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        start_time: format(event.start, "HH:mm"),
        end_time: format(endTime, "HH:mm"),
        assigned_staff_id: resourceId || taskToUpdate.extendedProps.assigned_staff_id,
        _originalEvent: {
          start: originalStart,
          end: originalEnd,
          resourceId: originalResourceId
        }
      };
      
      // Open the modal with the task data
      setSelectedTask(modalTaskData);
      setEditMode(true);
      setAssignmentModalOpen(true);
    } catch (err) {
      console.error('Error handling event drop:', err);
      setError(`Failed to handle drag operation: ${err.message || 'Unknown error'}`);
      revert();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 'medium',
                fontSize: '0.95rem',
              },
              '& .Mui-selected': {
                color: departmentColor,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: departmentColor,
              }
            }}
          >
            <Tab label="Calendar View" id="tab-0" />
            <Tab label="List View" id="tab-1" />
          </Tabs>
          {tabValue === 0 && (
            <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenAssignmentModal(selectedDate)}
                          fullWidth
                          sx={{ height: '100%' }}
                      >
                          New Production Task
                      </Button>
                  </Grid>
              </Grid>
          )}

        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        {loading && !productionTasks.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Available Recipes for Drag and Drop - Only show in Calendar View */}
            {tabValue === 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Recipes (Drag to Schedule)
              </Typography>
              <Box 
                ref={externalEventsRef}
                id="draggable-recipes"
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  mb: 2,
                  minHeight: '50px',
                  overflow: 'visible', // Important for drag operations
                  position: 'relative', // Establish positioning context
                  zIndex: 100 // Ensure draggable items appear above other elements
                }}
              >
                {loadingRecipes ? (
                  <CircularProgress size={24} sx={{ m: 1 }} />
                ) : recipes.length > 0 ? (
                  recipes.map(recipe => (
                    <Box
                      key={recipe.recipe_id || recipe.id}
                      className="draggable-recipe-item"
                      data-event={JSON.stringify({
                        title: recipe.name,
                        recipe_id: recipe.recipe_id || recipe.id,
                        duration: '02:00'
                      })}
                      sx={{
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        padding: '8px 12px',
                        margin: '4px 0',
                        borderRadius: '4px',
                        cursor: 'grab',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1,
                        touchAction: 'none',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.main,
                          boxShadow: theme.shadows[2]
                        },
                        '&:active': {
                          cursor: 'grabbing',
                          opacity: 0.8
                        }
                      }}
                    >
                      {recipe.name}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
                    No recipes available. Please create recipes first.
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Drag recipes to the calendar to schedule production tasks
              </Typography>
            </Paper>
            )}
            
            {tabValue === 0 ? (
              <Paper sx={{ p: 2 }}>
                <ProductionSchedulerCalendar 
                calendarRef={calendarRef}
                events={productionTasks}
                resources={staffResources}
                currentDate={selectedDate}
                currentView={calendarView} // Pass the current view state
                onDateChange={handleCalendarDateChange} // For calendar's internal navigation
                onViewChange={handleViewChange} // Handle view type changes
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventDrop} // Treat resize similar to drop for time changes
                onDateClick={(arg) => handleOpenAssignmentModal(arg.date, arg.resource?.id)}
                onEventReceive={handleEventReceive}
                />
              </Paper>
            ) : (
              <Paper sx={{ p: 2 }}>
                <ProductionScheduleList departmentColor={departmentColor} />
              </Paper>
            )}
          </>
        )}
      {/* Modals rendered inside the main component structure */}
      <ProductionAssignmentModal
        open={assignmentModalOpen}
        onClose={handleCloseAssignmentModal} // Use the new handler
        productionTask={selectedTask}
        editMode={editMode}
        onSave={handleSaveProductionTask}
        recipes={recipes} // Pass recipes
        staffOptions={staffResources} // Pass staff options
        departmentOptions={departmentOptions} // Pass department options
        // Add any other props your modal needs, e.g., isLoading
      />

      <ProductionTaskDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTask(null);
        }}
        productionTask={selectedTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusUpdate={handleStatusUpdate}
        canEdit={canEdit} // Pass permission flag
      />
    </Container>
  </LocalizationProvider>
  );
};

export default ProductionSchedulerPage;
