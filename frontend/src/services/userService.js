import api from './api';

/**
 * Fetches users. 
 * For managers, the backend automatically filters this to users in their department.
 * For staff, it returns only their own user record.
 * 
 * @param {object} params - Optional query parameters (e.g., { role: 'staff' } to further filter by role if backend supports).
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getUsers = async (params = {}) => {
    try {
        const response = await api.get('/users/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        if (error.response) {
            throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server.');
        } else {
            throw new Error(error.message || 'Error fetching users.');
        }
    }
};

/**
 * Fetches users, optionally filtered by department ID and other parameters.
 * @param {string|number} departmentId - The ID of the department to filter users by.
 * @param {object} params - Additional query parameters (e.g., { role: 'staff' }).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of user objects.
 */
export const getUsersByDepartment = async (departmentId, params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            department_id: departmentId,
            ...params,
        });
        const response = await api.get(`/users/?${queryParams}`);
        return response.data; // Assuming the API returns an array of users
    } catch (error) {
        console.error('Error fetching users by department:', error);
        // You might want to throw the error or return a specific error structure
        // For now, re-throwing to be caught by the caller (e.g., ItemFormModal)
        throw error;
    }
};

// Potentially add functions like getUserById, updateUser, etc. in the future
