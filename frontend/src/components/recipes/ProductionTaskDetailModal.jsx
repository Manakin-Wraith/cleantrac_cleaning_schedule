import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NoteIcon from '@mui/icons-material/Note';
import { format } from 'date-fns';
import axios from 'axios';

const ProductionTaskDetailModal = ({
  open,
  onClose,
  productionTask,
  onEdit,
  onDelete,
  onStatusUpdate,
  canEdit = false
}) => {
  const [loading, setLoading] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // Define production workflow steps based on task type
  const getWorkflowSteps = (taskType) => {
    switch (taskType) {
      case 'prep':
        return [
          { label: 'Gather Ingredients', description: 'Collect all required ingredients from inventory' },
          { label: 'Prepare Equipment', description: 'Set up and sanitize all required equipment' },
          { label: 'Pre-measure Ingredients', description: 'Measure and prepare ingredients according to recipe' },
          { label: 'Complete Preparation', description: 'Finalize all preparation tasks' }
        ];
      case 'production':
        return [
          { label: 'Setup', description: 'Prepare workspace and equipment' },
          { label: 'Mix Ingredients', description: 'Combine ingredients according to recipe' },
          { label: 'Process', description: 'Process the mixture according to recipe instructions' },
          { label: 'Quality Check', description: 'Verify product meets quality standards' },
          { label: 'Complete Production', description: 'Finalize production process' }
        ];
      case 'post_production':
        return [
          { label: 'Cool/Set Product', description: 'Allow product to cool or set as required' },
          { label: 'Portion/Divide', description: 'Divide product into appropriate portions' },
          { label: 'Complete Post-Production', description: 'Finalize all post-production tasks' }
        ];
      case 'quality_check':
        return [
          { label: 'Visual Inspection', description: 'Check appearance, color, and consistency' },
          { label: 'Taste Test', description: 'Verify flavor profile meets standards' },
          { label: 'Measurement Check', description: 'Confirm weight, volume, or other specifications' },
          { label: 'Documentation', description: 'Record quality check results' },
          { label: 'Decision', description: 'Approve or reject batch' }
        ];
      case 'packaging':
        return [
          { label: 'Prepare Packaging', description: 'Get packaging materials ready' },
          { label: 'Package Product', description: 'Place product in appropriate packaging' },
          { label: 'Label', description: 'Apply proper labels with dates and information' },
          { label: 'Complete Packaging', description: 'Finalize all packaging tasks' }
        ];
      case 'cleanup':
        return [
          { label: 'Clean Equipment', description: 'Clean all used equipment' },
          { label: 'Sanitize Surfaces', description: 'Sanitize all work surfaces' },
          { label: 'Waste Disposal', description: 'Properly dispose of any waste' },
          { label: 'Final Inspection', description: 'Verify area is clean and ready for next use' }
        ];
      default:
        return [
          { label: 'Start Task', description: 'Begin the assigned task' },
          { label: 'Complete Task', description: 'Finish the assigned task' }
        ];
    }
  };

  // Fetch recipe details and ingredients when task changes
  useEffect(() => {
    if (productionTask && productionTask.recipe_id) {
      setLoading(true);
      setStatus(productionTask.status || 'scheduled');
      setNotes(productionTask.notes || '');
      
      // Set active step based on status
      switch (productionTask.status) {
        case 'scheduled':
          setActiveStep(0);
          break;
        case 'in_progress':
          setActiveStep(1);
          break;
        case 'completed':
          setActiveStep(getWorkflowSteps(productionTask.task_type).length - 1);
          break;
        default:
          setActiveStep(0);
      }

      // Fetch recipe details and ingredients
      const fetchRecipeDetails = async () => {
        try {
          const recipeResponse = await axios.get(`/api/recipes/${productionTask.recipe_id}/`);
          setRecipeDetails(recipeResponse.data);
          
          // Fetch ingredients
          const ingredientsResponse = await axios.get(`/api/recipes/${productionTask.recipe_id}/ingredients/`);
          // Ensure ingredientsResponse.data is an array before setting state
          const fetchedIngredients = Array.isArray(ingredientsResponse.data) 
            ? ingredientsResponse.data 
            : (ingredientsResponse.data && Array.isArray(ingredientsResponse.data.results)) 
              ? ingredientsResponse.data.results // Handle paginated response like DRF
              : [];
          setIngredients(fetchedIngredients);
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching recipe details:', error);
          setLoading(false);
        }
      };
      
      fetchRecipeDetails();
    }
  }, [productionTask]);

  // Handle status change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  // Handle notes change
  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  // Handle save status update
  const handleSaveStatus = () => {
    onStatusUpdate({
      id: productionTask.id,
      status: status,
      notes: notes
    });
  };

  // Handle step change in workflow
  const handleStepChange = (step) => {
    setActiveStep(step);
    
    // Update status based on step
    if (step === 0) {
      setStatus('scheduled');
    } else if (step === getWorkflowSteps(productionTask.task_type).length - 1) {
      setStatus('completed');
    } else {
      setStatus('in_progress');
    }
  };

  // Format date and time for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    try {
      return format(new Date(dateTimeString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateTimeString;
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending_review':
        return 'warning';
      case 'on_hold':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <ScheduleIcon />;
      case 'in_progress':
        return <PendingIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  // Calculate scaled quantities based on batch size
  const calculateScaledQuantity = (ingredient) => {
    if (!recipeDetails || !productionTask) return ingredient.quantity;
    
    const scaleFactor = productionTask.scheduled_quantity / recipeDetails.yield_quantity;
    return (ingredient.quantity * scaleFactor).toFixed(2);
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
        <Typography variant="h6">
          Production Task Details
        </Typography>
        <Box>
          {canEdit && (
            <>
              <IconButton onClick={() => onEdit(productionTask)} color="primary" size="small" sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => onDelete(productionTask)} color="error" size="small" sx={{ mr: 1 }}>
                <DeleteIcon />
              </IconButton>
            </>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        {loading ? (
          <Typography>Loading task details...</Typography>
        ) : (
          <Grid container spacing={3}>
            {/* Basic Task Information */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>
                      {recipeDetails?.name || 'Recipe'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {recipeDetails?.product_code || 'No code'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RestaurantIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {productionTask?.task_type_display || productionTask?.task_type || 'Production'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {productionTask?.scheduled_quantity || '0'} {recipeDetails?.yield_unit || 'units'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {productionTask?.assigned_staff_details?.first_name 
                          ? `${productionTask.assigned_staff_details.first_name} ${productionTask.assigned_staff_details.last_name}`
                          : 'Unassigned'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Chip 
                        label={productionTask?.status_display || productionTask?.status || 'Scheduled'} 
                        color={getStatusColor(productionTask?.status)}
                        icon={getStatusIcon(productionTask?.status)}
                        sx={{ mb: 2 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'flex-end' }}>
                      <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDateTime(productionTask?.scheduled_start_time)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'flex-end' }}>
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Duration: {productionTask?.duration_minutes || 0} minutes
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'flex-end' }}>
                      <NoteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {productionTask?.description || 'No description'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Workflow Progress */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Production Workflow
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {getWorkflowSteps(productionTask?.task_type).map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        <Typography variant="caption">{step.description}</Typography>
                      }
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button
                            variant="contained"
                            onClick={() => handleStepChange(index + 1)}
                            disabled={index === getWorkflowSteps(productionTask?.task_type).length - 1}
                          >
                            {index === getWorkflowSteps(productionTask?.task_type).length - 1 ? 'Finish' : 'Complete Step'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={() => handleStepChange(index - 1)}
                          >
                            Back
                          </Button>
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Grid>
            
            {/* Recipe Ingredients */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Required Ingredients
              </Typography>
              <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                <List dense>
                  {ingredients.length > 0 ? (
                    ingredients.map((ingredient) => (
                      <ListItem key={ingredient.id}>
                        <ListItemText
                          primary={ingredient.ingredient_name}
                          secondary={`${calculateScaledQuantity(ingredient)} ${ingredient.unit} (scaled for batch)`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No ingredients found" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            
            {/* Status Update */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Status Update
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    value={status}
                    label="Status"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="pending_review">Pending Review</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={handleNotesChange}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                />
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSaveStatus}
                  fullWidth
                >
                  Update Status
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionTaskDetailModal;
