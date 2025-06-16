import api from './api';

/**
 * Fetch production schedules (scheduled recipe batches).
 * Accepts optional query params (e.g. date range, department, status)
 * and returns paginated DRF response (results + count + next/prev).
 */
export const getProductionSchedules = async (params = {}) => {
  try {
    const response = await api.get('/production-schedules/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching production schedules:', error);
    throw new Error(error.message || 'Unknown error fetching production schedules.');
  }
};

// Create a production schedule (recipe production task)
export const createProductionSchedule = async (payload) => {
  try {
    const response = await api.post('/production-schedules/', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating production schedule:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create production schedule');
  }
};

// Update existing production schedule
export const updateProductionSchedule = async (id, payload) => {
  try {
    const response = await api.patch(`/production-schedules/${id}/`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating production schedule ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update production schedule');
  }
};

// Delete a production schedule
export const deleteProductionSchedule = async (id) => {
  try {
    await api.delete(`/production-schedules/${id}/`);
  } catch (error) {
    console.error(`Error deleting production schedule ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete production schedule');
  }
};
