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

/**
 * Creates a new user.
 * @param {object} userData - The user data. Expected fields:
 *                            username, password, email, first_name (optional),
 *                            last_name (optional), role, department_id (optional).
 * @returns {Promise<object>} A promise that resolves to the created user object.
 */
export const createUser = async (userData) => {
    try {
        const response = await api.post('/users/', userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error.response?.data || error.message);
        // Re-throw to be handled by the form/caller, potentially with detailed error messages
        throw error; 
    }
};

/**
 * Updates an existing user.
 * @param {string|number} userId - The ID of the user to update.
 * @param {object} userData - The user data to update. Can include any of the fields
 *                            allowed by the UserWithProfileSerializer (e.g., username, email,
 *                            first_name, last_name, password (if changing), role, department_id).
 * @returns {Promise<object>} A promise that resolves to the updated user object.
 */
export const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(`/users/${userId}/`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a user.
 * @param {string|number} userId - The ID of the user to delete.
 * @returns {Promise<void>} A promise that resolves when the user is successfully deleted.
 */
export const deleteUser = async (userId) => {
    try {
        await api.delete(`/users/${userId}/`);
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
        throw error;
    }
};
