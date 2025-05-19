import api from './api';

/**
 * Fetches cleaning items.
 * The backend filters these by the requesting manager's department automatically.
 * 
 * @param {object} params - Optional query parameters to filter cleaning items.
 * @returns {Promise<Array>} A promise that resolves to an array of cleaning item objects.
 */
export const getCleaningItems = async (params = {}) => {
    try {
        const response = await api.get('/cleaningitems/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching cleaning items:', error);
        if (error.response) {
            throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server.');
        } else {
            throw new Error(error.message || 'Error fetching cleaning items.');
        }
    }
};

// Future functions for cleaning items can be added here, e.g.:
// export const createCleaningItem = async (itemData) => { ... };
// export const updateCleaningItem = async (itemId, itemData) => { ... };
