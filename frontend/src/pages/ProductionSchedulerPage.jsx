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
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import apiClient from '../services/api';
import { Draggable } from '@fullcalendar/interaction';
import ProductionSchedulerCalendar from '../components/recipes/ProductionSchedulerCalendar';
import ProductionAssignmentModal from '../components/recipes/ProductionAssignmentModal';
import ProductionTaskDetailModal from '../components/recipes/ProductionTaskDetailModal';
import { format, startOfMonth, endOfMonth, addHours } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const ProductionSchedulerPage = () => {
  const theme = useTheme();
  const [productionTasks, setProductionTasks] = useState([]);
  const [staffResources, setStaffResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('resourceTimeGridDay');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [canEdit, setCanEdit] = useState(true); // This would typically come from user roles/permissions

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

  const fetchProductionTasks = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      // Get start and end of month for filtering
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const params = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        recipe: recipeFilter || undefined,
      };
      const response = await apiClient.get('/production-schedules/', { params });
      // Handle both array responses and paginated responses with results property
      const tasksData = Array.isArray(response.data) ? response.data : 
                       (response.data?.results || []);
      
      const tasks = tasksData.map(task => ({
        id: task.id,
        resourceId: task.assigned_staff_id || 'unassigned',
        title: `${task.recipe_details?.name || 'Task'} (${task.task_type_display || task.task_type})`,
        start: new Date(task.scheduled_start_time),
        end: new Date(task.scheduled_end_time),
        extendedProps: {
          ...task,
          recipe_name: task.recipe_details?.name,
          batch_size: task.scheduled_quantity,
          yield_unit: task.recipe_details?.yield_unit,
          description: task.description,
        },
        // Add color based on status if needed, or handle in calendar component
      }));
      setProductionTasks(tasks);
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
      
      const resources = userData
        .filter(user => user.is_active && 
                (user.profile?.role === 'staff' || user.profile?.role === 'manager' || 
                 user.user_role === 'staff' || user.user_role === 'manager')) // Handle different API formats
        .map(user => ({
          id: user.id.toString(),
          title: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Staff Member',
        }));
      setStaffResources([{ id: 'unassigned', title: 'Unassigned' }, ...resources]);
    } catch (err) {
      console.error('Error fetching staff resources:', err);
      // setError('Failed to load staff resources.'); // Optional: can be non-critical
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchStaffResources();
    fetchProductionTasks(selectedDate);
    fetchRecipes();
  }, [fetchDepartments, fetchStaffResources, fetchProductionTasks, selectedDate]);

  useEffect(() => {
    fetchProductionTasks(selectedDate);
  }, [selectedDate, fetchProductionTasks]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchProductionTasks(date);
  };

  // Handle calendar view changes (month, week, day, timeline)
  const handleViewChange = (newViewType) => {
    if (newViewType !== calendarView) {
      setCalendarView(newViewType);
    }
    // The datesSet handler in the calendar component is responsible for fetching data
    // if the date range changes. We don't need to call fetchProductionTasks here
    // explicitly for view changes, as datesSet will cover it if the view change
    // also implies a date range change (e.g., month to week).
  };

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

  // Initialize draggable recipe items
  useEffect(() => {
    let draggable = null;
    if (externalEventsRef.current && recipes.length > 0) {
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
    }
    return () => {
      if (draggable) {
        draggable.destroy();
      }
    };
  }, [recipes]);

  // Handle receiving an external event (dropped recipe)
  const handleEventReceive = (receiveInfo) => {
    const event = receiveInfo.event;
    const extendedProps = event.extendedProps;
    
    if (extendedProps.isExternal) {
      // Store the placeholder event ID
      setPlaceholderEventId(event.id);
      
      // Open the assignment modal with pre-filled data
      const startTime = event.start;
      const endTime = event.end || addHours(startTime, 2); // Default 2 hours if no end time
      
      const taskData = {
        recipe_id: extendedProps.recipe_id,
        recipe_name: extendedProps.recipe_name,
        yield_unit: extendedProps.yield_unit,
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        assigned_staff_id: event.getResources()[0]?.id === 'unassigned' ? null : event.getResources()[0]?.id,
        task_type: 'production', // Default task type
        scheduled_quantity: 1, // Default quantity
        status: 'scheduled' // Default status
      };
      
      setSelectedTask(taskData);
      setEditMode(false); // This is a new task
      setAssignmentModalOpen(true);
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
    const staff = staffResources.find(s => s.id === staffId);
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

  const handleSaveProductionTask = async (taskData) => {
    setLoading(true);
    try {
      let response;
      if (editMode && selectedTask && selectedTask.id) {
        response = await apiClient.put(`/production-schedules/${selectedTask.id}/`, taskData);
      } else {
        response = await apiClient.post('/production-schedules/', taskData);
      }
      
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
      
      fetchProductionTasks(selectedDate); // Refresh tasks
      setAssignmentModalOpen(false);
      setEditMode(false);
      setSelectedTask(null);
    } catch (err) {
      console.error('Error saving production task:', err.response?.data || err.message);
      setError(`Failed to save task: ${JSON.stringify(err.response?.data) || err.message}`);
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
        await apiClient.delete(`/production-schedules/${taskToDelete.id}/`);
        fetchProductionTasks(selectedDate); // Refresh tasks
        setDetailModalOpen(false);
        setSelectedTask(null);
      } catch (err) {
        console.error('Error deleting production task:', err);
        setError('Failed to delete task.');
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
    const { event, oldResource, newResource } = dropInfo;
    const taskId = event.id;
    const newStartTime = event.start;
    const newEndTime = event.end;
    const newAssignedStaffId = newResource ? newResource.id : (oldResource ? oldResource.id : null);

    const taskToUpdate = productionTasks.find(t => t.id.toString() === taskId.toString())?.extendedProps;

    if (!taskToUpdate) {
      setError('Failed to find task for update.');
      dropInfo.revert();
      return;
    }

    const updateData = {
      scheduled_start_time: format(newStartTime, "yyyy-MM-dd'T'HH:mm:ss"),
      scheduled_end_time: newEndTime ? format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
      assigned_staff_id: newAssignedStaffId === 'unassigned' ? null : newAssignedStaffId,
    };

    try {
      await axios.patch(`/api/recipe-production-tasks/${taskId}/`, updateData);
      fetchProductionTasks(selectedDate); // Refresh tasks
    } catch (err) {
      console.error('Error updating task (drag & drop):', err);
      setError('Failed to update task schedule.');
      dropInfo.revert(); // Revert calendar event on error
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Typography variant="h4" gutterBottom>
                Recipe Production Scheduler
              </Typography>
            </Grid>
            <Grid item xs={12} md={8} container spacing={2} justifyContent="flex-end">
                <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                        label="Selected Month"
                        value={selectedDate}
                        onChange={handleDateChange}
                        views={['year', 'month']}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            helperText: "View tasks for month"
                          }
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
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
          </Grid>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Departments</em></MenuItem>
                  {Array.isArray(departmentOptions) ? departmentOptions.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  )) : <MenuItem value=""><em>Loading...</em></MenuItem>}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value=""><em>All Statuses</em></MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending_review">Pending Review</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField 
                label="Recipe Name/Code"
                variant="outlined"
                fullWidth
                value={recipeFilter}
                onChange={(e) => setRecipeFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="outlined" onClick={() => fetchProductionTasks(selectedDate)} fullWidth>
                    Apply Filters
                </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && !productionTasks.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Available Recipes for Drag and Drop */}
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
                  minHeight: '50px' 
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
                        borderRadius: '4px',
                        cursor: 'grab',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.main,
                          boxShadow: theme.shadows[2]
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
        </>
        )}

        {assignmentModalOpen && (
          <ProductionAssignmentModal
            open={assignmentModalOpen}
            onClose={() => {
              setAssignmentModalOpen(false);
              setSelectedTask(null);
            }}
          />
        )}

        {detailModalOpen && selectedTask && (
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
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default ProductionSchedulerPage;
