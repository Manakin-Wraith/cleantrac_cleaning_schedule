// frontend/src/services/departmentService.js
import api from './api';

/**
 * Fetches all departments.
 * @returns {Promise<Array>} A promise that resolves to an array of department objects.
 *                           Each object should ideally have at least 'id' and 'name'.
 */
export const getDepartments = async () => {
    try {
        // API endpoint for departments
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

/**
 * Creates a new department.
 * @param {Object} departmentData - The data for the new department (e.g., { name: 'New Department' }).
 * @returns {Promise<Object>} A promise that resolves to the created department object.
 */
export const createDepartment = async (departmentData) => {
    try {
        const response = await api.post('/departments/', departmentData);
        return response.data;
    } catch (error) {
        console.error('Error creating department:', error);
        if (error.response) {
            const errorDetail = error.response.data?.detail || 
                                (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data));
            throw new Error(errorDetail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server while creating department.');
        } else {
            throw new Error(error.message || 'An unknown error occurred while creating department.');
        }
    }
};

/**
 * Updates an existing department.
 * @param {number|string} id - The ID of the department to update.
 * @param {Object} departmentData - The updated data for the department.
 * @returns {Promise<Object>} A promise that resolves to the updated department object.
 */
export const updateDepartment = async (id, departmentData) => {
    try {
        const response = await api.put(`/departments/${id}/`, departmentData);
        return response.data;
    } catch (error) {
        console.error('Error updating department:', error);
        if (error.response) {
            const errorDetail = error.response.data?.detail || 
                                (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data));
            throw new Error(errorDetail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server while updating department.');
        } else {
            throw new Error(error.message || 'An unknown error occurred while updating department.');
        }
    }
};

/**
 * Deletes a department.
 * @param {number|string} id - The ID of the department to delete.
 * @returns {Promise<void>} A promise that resolves when the department is successfully deleted.
 */
export const deleteDepartment = async (id) => {
    try {
        await api.delete(`/departments/${id}/`);
    } catch (error) {
        console.error('Error deleting department:', error);
        if (error.response) {
            const errorDetail = error.response.data?.detail || 
                                (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data));
            throw new Error(errorDetail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server while deleting department.');
        } else {
            throw new Error(error.message || 'An unknown error occurred while deleting department.');
        }
    }
};
