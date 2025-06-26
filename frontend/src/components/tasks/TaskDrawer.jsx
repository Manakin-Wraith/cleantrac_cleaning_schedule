import React from 'react';
import {
  SwipeableDrawer,
  Box,
  Button,
  CardActions,
  CircularProgress,
} from '@mui/material';
import TaskCardContent from './TaskCardContent';
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, Divider } from '@mui/material';
import { scaleQty, parseQuantity } from '../../utils/recipeUtils';

/**
 * Bottom sheet drawer showing full task details + action button.
 * Pure presentation – no API calls here; parent handles state.
 */
const TaskDrawer = ({ open, onClose, onOpen, task, onMarkDone, updating, recipe, loadingRecipe }) => {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      PaperProps={{ sx: { height: '75vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
    >
      <Box sx={{ p: 2, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {task && <TaskCardContent task={task} />}

        {/* Ingredient list for recipe tasks */}
        {task?.__type === 'recipe' && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb:1 }} />
            <Typography variant="subtitle1" gutterBottom>
              Ingredients
            </Typography>
            {loadingRecipe ? (
              <CircularProgress size={24} />
            ) : recipe?.ingredients?.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{fontWeight:600}}>Code</TableCell>
                    <TableCell sx={{fontWeight:600}}>Name</TableCell>
                    <TableCell sx={{fontWeight:600}} align="right">Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipe.ingredients.map((ing) => {
                    const rawQty = ing.quantity ?? ing.weight ?? ing.recipe_use ?? ing.qty ?? 0;
                    const baseQty = parseQuantity(rawQty);
                    const batch = parseQuantity(task.batch_size) || 1;
                    const qty = scaleQty(baseQty, batch).toFixed(2);
                    return (
                      <TableRow key={ing.id}>
                        <TableCell>{ing.ingredient_code || ing.code || ing.product_code || ''}</TableCell>
                        <TableCell>{ing.name || ing.description || ing.ingredient_name || ing.product?.name || ing.product?.description || ''}</TableCell>
                        <TableCell align="right">{qty} {ing.unit || ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2">No ingredients found.</Typography>
            )}
          </Box>
        )}
        {task && ['pending', 'in_progress'].includes(task.status) && (
          <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => onMarkDone(task)}
              disabled={updating === task.id}
            >
              {updating === task.id ? <CircularProgress size={20} color="inherit" /> : 'Mark Completed'}
            </Button>
          </CardActions>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default TaskDrawer;
