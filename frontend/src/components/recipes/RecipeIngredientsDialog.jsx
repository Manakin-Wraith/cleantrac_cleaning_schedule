import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  Stack,
} from '@mui/material';
import { scaleQty, parseQuantity } from '../../utils/recipeUtils';

/**
 * Displays a recipe ingredient list scaled to a given batch size.
 * Expects a recipe object that contains an `ingredients` array like:
 * [{ id, name, quantity, unit }]
 */
export default function RecipeIngredientsDialog({
  open,
  onClose,
  recipe,
  task,
  loading,
}) {
  if (!recipe && !loading) return null;

  const batch = parseQuantity(task?.batch_size) || 1;
  const unitLabel = task?.batch_unit || recipe?.unit || recipe?.yield_unit || recipe?.yield_measure || '';

  const ingredientRows = recipe?.ingredients?.map((ing) => {
    const rawQty = ing.quantity ?? ing.weight ?? ing.recipe_use ?? ing.qty ?? 0;
    const baseQty = parseQuantity(rawQty);
    const scaled = scaleQty(baseQty, batch);
    return {
      id: ing.id,
      code: ing.ingredient_code || ing.code || ing.product_code || ing.prod_code || ing.item_code || ing.product?.code || ing.product?.product_code || '',
      name: ing.name || ing.description || ing.ingredient_name || '',
      qty: scaled,
      unit: ing.unit || '',
    };
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task?.title || recipe?.name}</DialogTitle>
      <Stack direction="row" spacing={1} sx={{pl:3, pb:1}}>
        <Typography variant="caption" color="text.secondary">Batch × {batch} {unitLabel}</Typography>
      </Stack>
      <DialogContent dividers>
        {loading ? (
          <CircularProgress />
        ) : ingredientRows?.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight:600}}>Code</TableCell>
                <TableCell sx={{fontWeight:600}}>Name</TableCell>
                <TableCell sx={{fontWeight:600}} align="right">Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredientRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.qty.toFixed(2)} {row.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2">No ingredients found.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

RecipeIngredientsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  recipe: PropTypes.object,
  task: PropTypes.object,
  loading: PropTypes.bool,
};
