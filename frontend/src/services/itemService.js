import api from './api'; // Assuming your API utility is in 'api.js' in the same directory

/**
 * Fetches cleaning items from the backend.
 * @param {object} params - Optional query parameters for the API request (e.g., { department_id: 1 }).
 * @returns {Promise<Array>} A promise that resolves to an array of cleaning items.
 */
export const getCleaningItems = async (params) => {
    try {
        const response = await api.get('/cleaningitems/', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch cleaning items:', error);
        // You might want to throw a more specific error or handle it as per your app's error handling strategy
        throw error;
    }
};

/**
 * Creates a new cleaning item.
 * @param {object} itemData - The data for the new cleaning item.
 * @returns {Promise<object>} A promise that resolves to the created cleaning item.
 */
export const createCleaningItem = async (itemData) => {
    try {
        const response = await api.post('/cleaningitems/', itemData);
        return response.data;
    } catch (error) {
        console.error('Failed to create cleaning item:', error);
        throw error;
    }
};

/**
 * Updates an existing cleaning item.
 * @param {number} itemId - The ID of the item to update.
 * @param {object} itemData - The updated data for the cleaning item.
 * @returns {Promise<object>} A promise that resolves to the updated cleaning item.
 */
export const updateCleaningItem = async (itemId, itemData) => {
    try {
        const response = await api.patch(`/cleaningitems/${itemId}/`, itemData);
        return response.data;
    } catch (error) {
        console.error(`Failed to update cleaning item ${itemId}:`, error);
        throw error;
    }
};

/**
 * Deletes a cleaning item.
 * @param {number} itemId - The ID of the item to delete.
 * @returns {Promise<void>} A promise that resolves when the item is deleted.
 */
export const deleteCleaningItem = async (itemId) => {
    try {
        await api.delete(`/cleaningitems/${itemId}/`);
    } catch (error) {
        console.error(`Failed to delete cleaning item ${itemId}:`, error);
        throw error;
    }
};
