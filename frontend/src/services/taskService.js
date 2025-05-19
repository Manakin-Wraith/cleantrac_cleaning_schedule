import api from './api'; // Assuming 'api.js' is your central Axios instance

/**
 * Fetches task instances based on query parameters.
 * 
 * @param {object} params - Query parameters to filter tasks.
 * Example: { assigned_to: 1, due_date: '2023-10-27', status: 'pending' }
 * @returns {Promise<Array>} A promise that resolves to an array of task objects.
 */
export const getTaskInstances = async (params) => {
    try {
        const response = await api.get('/taskinstances/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching task instances:', error);
        // Consider how to handle specific error status codes or messages
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error('Network error: No response received from server.');
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(error.message || 'Error fetching tasks.');
        }
    }
};

/**
 * Creates a new task instance.
 * 
 * @param {object} taskData - Data for the new task.
 * Example: { cleaning_item_id: 1, assigned_to_id: 2, due_date: '2023-10-28', status: 'pending' }
 * @returns {Promise<object>} A promise that resolves to the created task object.
 */
export const createTaskInstance = async (taskData) => {
    try {
        const response = await api.post('/taskinstances/', taskData);
        return response.data;
    } catch (error) {
        console.error('Error creating task instance:', error);
        if (error.response) {
            // Log more details if available, e.g., validation errors
            console.error('Error details:', error.response.data);
            const messages = Object.values(error.response.data).flat().join(' ');
            throw new Error(messages || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error('Network error: No response received from server.');
        } else {
            throw new Error(error.message || 'Error creating task.');
        }
    }
};

// Future functions for tasks can be added here, e.g.:
// export const updateTaskStatus = async (taskId, statusUpdate) => { ... };
// export const getTaskInstanceById = async (taskId) => { ... };
