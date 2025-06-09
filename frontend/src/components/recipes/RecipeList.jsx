import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  HistoryToggleOff as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RecipeFormModal from './RecipeFormModal';
import RecipeDetailModal from './RecipeDetailModal';
import RecipeVersionHistoryModal from './RecipeVersionHistoryModal';
import ConfirmDialog from '../modals/ConfirmDialog';
import api from '../../services/api';
import { fetchRecipeIngredients, enhanceRecipesWithIngredients } from '../../data/recipeIngredients';

const RecipeList = ({ departmentColor }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openVersionHistoryModal, setOpenVersionHistoryModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ingredientsMap, setIngredientsMap] = useState({});
  const { currentUser } = useAuth();

  // Fetch recipe ingredients data from JSON file
  const loadIngredientsData = async () => {
    try {
      const ingredients = await fetchRecipeIngredients();
      setIngredientsMap(ingredients);
    } catch (err) {
      console.error('Error loading ingredients data:', err);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/recipes/', {
        params: {
          department_id: currentUser?.profile?.department?.id,
          search: searchTerm || undefined
        }
      });
      
      // Enhance recipes with ingredients data
      const enhancedRecipes = enhanceRecipesWithIngredients(response.data, ingredientsMap);
      setRecipes(enhancedRecipes);
      setError(null);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredientsData();
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [currentUser, searchTerm, ingredientsMap]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsEditing(false);
    setOpenFormModal(true);
  };

  const handleEditRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setIsEditing(true);
    setOpenFormModal(true);
  };

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setOpenDetailModal(true);
  };

  const handleViewVersionHistory = (recipe) => {
    setSelectedRecipe(recipe);
    setOpenVersionHistoryModal(true);
  };

  const handleDeleteClick = (recipe) => {
    setSelectedRecipe(recipe);
    setOpenConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/recipes/${selectedRecipe.id}/`);
      fetchRecipes();
      setOpenConfirmDelete(false);
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again later.');
    }
  };

  const handleFormSubmit = async (recipeData) => {
    try {
      if (isEditing) {
        await api.put(`/recipes/${selectedRecipe.id}/`, recipeData);
      } else {
        await api.post('/recipes/', {
          ...recipeData,
          department: currentUser?.profile?.department?.id
        });
      }
      fetchRecipes();
      setOpenFormModal(false);
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again later.');
      return false;
    }
    return true;
  };

  const canManageRecipes = currentUser?.is_superuser || 
                          currentUser?.profile?.role === 'manager';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Department Recipes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {canManageRecipes && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRecipe}
              sx={{ 
                bgcolor: departmentColor,
                '&:hover': {
                  bgcolor: departmentColor,
                  opacity: 0.9
                }
              }}
            >
              Add Recipe
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="recipes table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Recipe Name</TableCell>
              <TableCell>Product Code</TableCell>
              <TableCell>Yield</TableCell>
              <TableCell>Ingredients</TableCell>
              <TableCell>Unit Cost</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    {searchTerm ? 'No recipes match your search criteria.' : 'No recipes found. Add your first recipe!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              recipes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((recipe) => (
                  <TableRow key={recipe.id} hover>
                    <TableCell>{recipe.name}</TableCell>
                    <TableCell>{recipe.product_code}</TableCell>
                    <TableCell>{recipe.yield_quantity} {recipe.yield_unit}</TableCell>
                    <TableCell>
                      {recipe.ingredients && recipe.ingredients.length > 0 ? (
                        <Tooltip title={
                          <React.Fragment key={`tooltip-${recipe.id}`}>
                            {recipe.ingredients.map(ing => (
                              <div key={`${recipe.id}-${ing.ingredient_name}`}>
                                {`${ing.ingredient_name} (${ing.quantity} ${ing.unit})`}
                              </div>
                            ))}
                          </React.Fragment>
                        }>
                          <Chip 
                            label={`${recipe.ingredients.length} ingredient${recipe.ingredients.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Chip label="No ingredients" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>R {typeof recipe.unit_cost === 'number' ? recipe.unit_cost.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={recipe.is_active ? "Active" : "Inactive"} 
                        color={recipe.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewRecipe(recipe)} size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Version History">
                          <IconButton onClick={() => handleViewVersionHistory(recipe)} size="small">
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        {canManageRecipes && (
                          <React.Fragment key={`actions-${recipe.id}`}>
                            <Tooltip title="Edit Recipe">
                              <IconButton onClick={() => handleEditRecipe(recipe)} size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Recipe">
                              <IconButton onClick={() => handleDeleteClick(recipe)} size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </React.Fragment>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={recipes.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Modals */}
      <RecipeFormModal
        open={openFormModal}
        onClose={() => setOpenFormModal(false)}
        onSubmit={handleFormSubmit}
        recipe={selectedRecipe}
        isEditing={isEditing}
        departmentColor={departmentColor}
      />

      <RecipeDetailModal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        recipe={selectedRecipe}
        departmentColor={departmentColor}
      />

      <RecipeVersionHistoryModal
        open={openVersionHistoryModal}
        onClose={() => setOpenVersionHistoryModal(false)}
        recipe={selectedRecipe}
        departmentColor={departmentColor}
      />

      <ConfirmDialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recipe"
        content={`Are you sure you want to delete the recipe "${selectedRecipe?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default RecipeList;
