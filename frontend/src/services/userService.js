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

// Potentially add functions like getUserById, updateUser, etc. in the future
