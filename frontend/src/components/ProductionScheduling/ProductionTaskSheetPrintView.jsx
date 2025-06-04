import React from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import moment from 'moment';

// This component is designed to be used with react-to-print or similar
// It's a class component to allow for a ref if needed by some print libraries, 
// but can be functional if preferred and ref forwarding is used.
class ProductionTaskSheetPrintView extends React.PureComponent {
  render() {
    const { task } = this.props;

    if (!task) {
      return <Typography>No task data to print.</Typography>;
    }

    return (
      <Box sx={{ p: 3, fontFamily: 'Arial, sans-serif', color: '#000' }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
          Production Task Sheet
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="h6"><strong>Task:</strong> {task.title}</Typography>
            <Typography variant="body1"><strong>Recipe:</strong> {task.recipe?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body1"><strong>Department:</strong> {task.department?.name || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Production Line:</strong> {task.production_line?.name || 'N/A'}</Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Scheduled Start:</strong> {task.start ? moment(task.start).format('YYYY-MM-DD HH:mm') : 'N/A'}</Typography>
            <Typography variant="body1"><strong>Scheduled End:</strong> {task.end ? moment(task.end).format('YYYY-MM-DD HH:mm') : 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body1"><strong>Scheduled Quantity:</strong> {task.scheduled_quantity || 'N/A'} {task.recipe?.unit_of_measure || ''}</Typography>
          </Grid>
        </Grid>

        {task.assigned_staff && task.assigned_staff.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Assigned Staff:</Typography>
            <Typography variant="body1">{task.assigned_staff.map(s => s.name).join(', ')}</Typography>
          </Box>
        )}

        {task.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Notes:</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, whiteSpace: 'pre-wrap', background: '#f9f9f9' }}>
              {task.notes}
            </Paper>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />

        {task.recipe?.ingredients && task.recipe.ingredients.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Required Ingredients:</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell>Ingredient</TableCell>
                    <TableCell align="right">Required Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Available (Placeholder)</TableCell>
                    <TableCell>Actual Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {task.recipe.ingredients.map((ing, index) => (
                    <TableRow key={index}>
                      <TableCell>{ing.name}</TableCell>
                      <TableCell align="right">{ing.quantity_required_per_unit * (task.scheduled_quantity || 1)}</TableCell>
                      <TableCell>{ing.unit_of_measure}</TableCell>
                      <TableCell align="right">{ing.available_quantity || 'N/A'}</TableCell>
                      <TableCell sx={{ borderBottom: '1px dotted #ccc', minWidth: '100px' }}></TableCell> {/* For manual entry */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>Production Output Record:</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}><Typography>Actual Quantity Produced: ________________</Typography></Grid>
            <Grid item xs={6} sm={3}><Typography>Unit: {task.recipe?.unit_of_measure || 'units'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography>Batch Code: _________________________</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography>Production Date/Time: _________________</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography>Expiry Date/Time: ___________________</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography>Quality Rating (1-5): _______________</Typography></Grid>
            <Grid item xs={12}><Typography>Production Notes/Issues:</Typography></Grid>
            <Grid item xs={12}><Box sx={{ border: '1px solid #ccc', minHeight: '60px', mt:0.5 }}></Box></Grid>
            <Grid item xs={12} sm={6}><Typography sx={{mt:2}}>Recorded By: ______________________</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography sx={{mt:2}}>Date: _____________________________</Typography></Grid>
          </Grid>
        </Paper>

      </Box>
    );
  }
}

export default ProductionTaskSheetPrintView;
