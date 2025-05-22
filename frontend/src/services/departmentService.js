// frontend/src/services/departmentService.js
import api from './api';

/**
 * Fetches all departments.
 * @returns {Promise<Array>} A promise that resolves to an array of department objects.
 *                           Each object should ideally have at least 'id' and 'name'.
 */
export const getDepartments = async () => {
    try {
        // Assuming your API endpoint for departments is /api/departments/
        // And it's registered in your Django urls.py and has a ViewSet.
        const response = await api.get('/departments/'); 
        return response.data;
    } catch (error) {
        console.error('Error fetching departments:', error);
        if (error.response) {
            // Attempt to parse out a Django REST framework error detail
            const errorDetail = error.response.data?.detail || 
                                (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data));
            throw new Error(errorDetail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server while fetching departments.');
        } else {
            throw new Error(error.message || 'An unknown error occurred while fetching departments.');
        }
    }
};
