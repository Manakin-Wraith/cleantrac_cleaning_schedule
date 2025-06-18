import api from './api';

/**
 * Fetch a single recipe with optional expand params (e.g. ingredients)
 * @param {number|string} id
 * @param {object} params - query params { expand: 'ingredients' }
 */
export const getRecipe = async (id, params = {}) => {
  try {
    const response = await api.get(`/recipes/${id}/`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch recipe');
  }
};
