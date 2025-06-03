import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Box,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RecipeDetailModal = ({ open, onClose, recipe, departmentColor }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Use the recipe data directly from props
  const recipeDetails = recipe;

  const handlePrint = () => {
    window.print();
  };

  const canManageRecipes = currentUser?.is_superuser || 
                          currentUser?.profile?.role === 'manager';

  if (!recipe) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${departmentColor}`,
          borderRadius: '4px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Recipe Details
        </Typography>
        <Box>
          <IconButton onClick={handlePrint} size="small" sx={{ mr: 1 }}>
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : recipeDetails && (
          <div>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h5" gutterBottom sx={{ color: departmentColor, fontWeight: 'bold' }}>
                    {recipeDetails.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {recipeDetails.description || 'No description provided.'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Product Code
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {recipeDetails.product_code}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Yield
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {recipeDetails.yield_quantity || recipeDetails.yield} {recipeDetails.yield_unit}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Unit Cost
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      R {typeof recipeDetails.unit_cost === 'number' ? recipeDetails.unit_cost.toFixed(2) : '0.00'}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Status
                    </Typography>
                    <Chip 
                      label={recipeDetails.is_active ? "Active" : "Inactive"} 
                      color={recipeDetails.is_active ? "success" : "default"}
                      size="small"
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Ingredients
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Pack Size</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Cost (R)</TableCell>
                    <TableCell>Total Cost (R)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!recipeDetails.ingredients || recipeDetails.ingredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No ingredients found for this recipe.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipeDetails.ingredients.map((ingredient, index) => (
                      <TableRow key={index}>
                        <TableCell>{ingredient.ingredient_code || '-'}</TableCell>
                        <TableCell>{ingredient.ingredient_name}</TableCell>
                        <TableCell>{ingredient.pack_size || '-'}</TableCell>
                        <TableCell>{`${ingredient.quantity} ${ingredient.unit}`}</TableCell>
                        <TableCell>
                          R {typeof ingredient.unit_cost === 'number' 
                              ? ingredient.unit_cost.toFixed(2) 
                              : ingredient.unit_cost 
                                ? parseFloat(ingredient.unit_cost).toFixed(2) 
                                : '0.00'}
                        </TableCell>
                        <TableCell>
                          R {typeof ingredient.total_cost === 'number' 
                              ? ingredient.total_cost.toFixed(2) 
                              : ingredient.total_cost 
                                ? parseFloat(ingredient.total_cost).toFixed(2) 
                                : '0.00'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {recipeDetails.ingredients.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                        Total Recipe Cost:
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        R {recipeDetails.ingredients.reduce(
                          (sum, ingredient) => {
                            const cost = ingredient.total_cost || 0;
                            return sum + (typeof cost === 'number' ? cost : parseFloat(cost) || 0);
                          }, 
                          0
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Created By
                  </Typography>
                  <Typography variant="body2">
                    {recipeDetails.created_by_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(recipeDetails.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {recipeDetails.updated_by_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(recipeDetails.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </div>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        {canManageRecipes && (
          <Button 
            startIcon={<EditIcon />}
            variant="contained" 
            sx={{ 
              bgcolor: departmentColor,
              '&:hover': {
                bgcolor: departmentColor,
                opacity: 0.9
              }
            }}
          >
            Edit Recipe
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RecipeDetailModal;
