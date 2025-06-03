/**
 * Recipe ingredients data extracted from recipe_table.json
 * This file provides ingredient data for recipes to be displayed in the frontend
 * until backend integration is complete.
 */

import axios from 'axios';

/**
 * Fetches recipe ingredients data from the JSON file
 * @returns {Promise<Object>} A promise that resolves to an object mapping product codes to ingredients
 */
export const fetchRecipeIngredients = async () => {
  try {
    // Fetch the JSON data from the public directory
    const response = await axios.get('/docs/recipe_table.json');
    const recipesData = response.data;
    
    // Create a mapping of product codes to ingredients
    const ingredientsMap = {};
    
    recipesData.forEach(recipe => {
      const productCode = recipe.product_code;
      const ingredients = recipe.ingredients || [];
      
      // Format the ingredients data to match the backend model
      const formattedIngredients = ingredients.map(ingredient => ({
        ingredient_code: ingredient.prod_code || '',
        ingredient_name: ingredient.description || '',
        pack_size: ingredient.pack_size || '',
        quantity: parseFloat(ingredient.recipe_use) || 0,
        unit: 'kg', // Default unit
        unit_cost: parseFloat(ingredient.cost) || 0,
        total_cost: parseFloat(ingredient.total_cost) || 0
      }));
      
      ingredientsMap[productCode] = formattedIngredients;
    });
    
    return ingredientsMap;
  } catch (error) {
    console.error('Error fetching recipe ingredients:', error);
    return {};
  }
};

/**
 * Enhances recipe data with ingredients from the JSON file
 * @param {Array} recipes - Array of recipe objects from the API
 * @param {Object} ingredientsMap - Mapping of product codes to ingredients
 * @returns {Array} Enhanced recipe objects with ingredients
 */
export const enhanceRecipesWithIngredients = (recipes, ingredientsMap) => {
  if (!recipes || !ingredientsMap) return recipes;
  
  return recipes.map(recipe => {
    const productCode = recipe.product_code;
    const ingredients = ingredientsMap[productCode] || [];
    
    return {
      ...recipe,
      ingredients
    };
  });
};
