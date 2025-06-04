import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  MenuItem, // Added for Select in Output tab
  Paper, // Added for Ingredients and History tab items
  List, // Potentially for history or ingredients
  ListItem, // Potentially for history or ingredients
  ListItemText, // Potentially for history or ingredients
  Divider // For separating sections or history items
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment'; // For formatting dates in History
// import { useTheme } from '@mui/material/styles';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-detail-tabpanel-${index}`}
      aria-labelledby={`task-detail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const ProductionTaskDetailModal = ({ open, onClose, task, onEditTask, onChangeStatus, onPrintTaskSheet }) => {
  // const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (!task) {
    return null;
  }

  // Mock data for history - replace with actual data from task.history_log
  const taskHistory = task.history_log || [
    { timestamp: '2023-10-26 10:00', user: 'Admin', action: 'Task Created', details: 'Initial schedule' },
    { timestamp: '2023-10-27 14:30', user: 'John Doe', action: 'Status Changed', details: 'From Scheduled to In Progress' },
    { timestamp: '2023-10-28 09:15', user: 'Jane Smith', action: 'Note Added', details: 'Supplier delay for ingredient X' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          Task Details: {task.title || 'N/A'}
          {task.status && <Chip label={task.status} size="small" sx={{ ml: 2, backgroundColor: task.status === 'Completed' ? 'success.light' : task.status === 'In Progress' ? 'warning.light' : 'default' }} />}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          // sx={{
          //   position: 'absolute',
          //   right: theme.spacing(1),
          //   top: theme.spacing(1),
          //   color: theme.palette.grey[500],
          // }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="task detail tabs">
            <Tab label="Details" id="task-detail-tab-0" aria-controls="task-detail-tabpanel-0" />
            <Tab label="Ingredients" id="task-detail-tab-1" aria-controls="task-detail-tabpanel-1" />
            <Tab label="Output" id="task-detail-tab-2" aria-controls="task-detail-tabpanel-2" />
            <Tab label="History" id="task-detail-tab-3" aria-controls="task-detail-tabpanel-3" />
          </Tabs>
        </Box>
        <TabPanel value={currentTab} index={0}>
          <Typography variant="subtitle1" gutterBottom><strong>Recipe:</strong> {task.recipe?.name || 'Not specified'}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Scheduled Quantity:</strong> {task.scheduled_quantity || 'N/A'} {task.recipe?.unit_of_measure || ''}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Scheduled Start:</strong> {task.start ? moment(task.start).format('YYYY-MM-DD HH:mm') : 'Not specified'}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Scheduled End:</strong> {task.end ? moment(task.end).format('YYYY-MM-DD HH:mm') : 'Not specified'}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Department:</strong> {task.department?.name || 'Not specified'}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Assigned Staff:</strong> {task.assigned_staff?.map(s => s.name).join(', ') || 'N/A'}</Typography>
          <Typography variant="subtitle1" gutterBottom><strong>Production Line:</strong> {task.production_line?.name || 'N/A'}</Typography>
          <Typography variant="subtitle1" gutterBottom sx={{mt: 1}}><strong>Notes:</strong></Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{task.notes || 'No notes provided.'}</Typography>
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>Required Ingredients</Typography>
          {(!task.recipe?.ingredients || task.recipe.ingredients.length === 0) && (
            <Typography>No ingredient information available for this recipe.</Typography>
          )}
          {task.recipe?.ingredients && task.recipe.ingredients.length > 0 && (
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {task.recipe.ingredients.map((ing, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                  <Typography variant="subtitle1"><strong>{ing.name}</strong></Typography>
                  <Typography variant="body2">Required: {ing.quantity_required_per_unit * (task.scheduled_quantity || 1)} {ing.unit_of_measure}</Typography>
                  <Typography variant="body2">Available: {ing.available_quantity || 'N/A'} {ing.unit_of_measure} (Placeholder)</Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => console.log('Record usage for', ing.name)}>
                    Record Usage
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>Record Production Output</Typography>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              label={`Actual Quantity Produced (${task.recipe?.unit_of_measure || 'units'})`}
              type="number"
              fullWidth
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Batch Code"
              fullWidth
              margin="normal"
            />
            <TextField
              label="Production Date"
              type="datetime-local"
              fullWidth
              margin="normal"
              defaultValue={moment().format('YYYY-MM-DDTHH:mm')}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Expiry Date (Optional)"
              type="datetime-local"
              fullWidth
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField select label="Quality Rating" fullWidth margin="normal" defaultValue="">
                <MenuItem value=""><em>Select Rating</em></MenuItem>
                <MenuItem value={5}>Excellent</MenuItem>
                <MenuItem value={4}>Good</MenuItem>
                <MenuItem value={3}>Average</MenuItem>
                <MenuItem value={2}>Fair</MenuItem>
                <MenuItem value={1}>Poor</MenuItem>
            </TextField>
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => console.log('Record Output Submitted', task.id)}>
              Record Output
            </Button>
          </Box>
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>Task History</Typography>
          {taskHistory.length === 0 ? (
            <Typography>No history available for this task.</Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {taskHistory.map((entry, index) => (
                <React.Fragment key={index}>
                  <Paper elevation={1} sx={{ p: 1.5, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')} - by {entry.user}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Action: {entry.action}
                    </Typography>
                    {entry.details && (
                      <Typography variant="body2">Details: {entry.details}</Typography>
                    )}
                  </Paper>
                  {/* {index < taskHistory.length - 1 && <Divider component="li" />} */}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          <Button onClick={() => onEditTask(task)} variant="outlined" sx={{ mr: 1 }}>
            Edit Task
          </Button>
          <Button onClick={() => onChangeStatus(task)} variant="outlined" sx={{ mr: 1 }}>Change Status</Button>
          <Button onClick={() => onPrintTaskSheet(task)} variant="outlined">Print Task Sheet</Button>
        </Box>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductionTaskDetailModal;
