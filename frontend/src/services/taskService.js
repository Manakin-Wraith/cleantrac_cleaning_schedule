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
        console.error(
            "Error creating task instance:", 
            error.response ? error.response.data : error.message,
            error.response ? `Status: ${error.response.status}` : '',
            error.config ? `Payload: ${JSON.stringify(error.config.data)}`: ''
        );
        // Construct a more informative error message
        let errorMessage = "Failed to create task instance.";
        if (error.response && error.response.data) {
            const errorData = error.response.data;
            // Try to extract common DRF error formats
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (typeof errorData === 'object') {
                // Concatenate all error messages from DRF (e.g., field errors)
                const messages = Object.entries(errorData).map(([key, value]) => {
                    if (Array.isArray(value)) return `${key}: ${value.join(' ')}`;
                    return `${key}: ${value}`;
                });
                if (messages.length > 0) errorMessage = messages.join('; ');
            }
        }
        throw new Error(errorMessage);
    }
};

/**
 * Updates an existing task instance.
 * 
 * @param {number} taskId - ID of the task instance to update.
 * @param {object} taskData - Data to update in the task instance.
 * Example: { assigned_to: 3, status: 'in_progress' }
 * @returns {Promise<object>} A promise that resolves to the updated task object.
 */
export const updateTaskInstance = async (taskId, taskData) => {
    try {
        // Ensure assigned_to is explicitly null if it's an empty string or undefined
        // The backend might expect an integer or null for the foreign key.
        const payload = { ...taskData };
        if (taskData.hasOwnProperty('assigned_to')) {
            payload.assigned_to = taskData.assigned_to || null;
        }
        // If 'assigned_to_id' is used in taskData (which is typical for FKs in forms),
        // ensure it maps to 'assigned_to' or handle as needed by backend.
        // For now, assuming taskData comes with 'assigned_to' if it's being changed.

        const response = await api.patch(`/taskinstances/${taskId}/`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating task ${taskId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update task.');
    }
};

/**
 * Marks a task as complete.
 * 
 * @param {number} taskId - ID of the task instance to mark as complete.
 * @returns {Promise<object>} A promise that resolves to the updated task object.
 */
export const markTaskAsComplete = async (taskId) => {
    try {
        const response = await api.patch(`/taskinstances/${taskId}/`, { status: 'completed' });
        return response.data;
    } catch (error) {
        console.error(`Error marking task ${taskId} as complete:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to mark task as complete.');
    }
};

// Function to get all task instances (potentially filtered)
export const fetchTaskInstances = async (filters = {}) => {
    try {
        const response = await api.get('/taskinstances/', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Error fetching task instances:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch task instances.');
    }
};

// Function to fetch task instances by department and optionally by date
export const fetchDepartmentTaskInstances = async (departmentId, date = null) => {
    let url = `/taskinstances/?department_id=${departmentId}`;
    if (date) {
        url += `&due_date=${date}`;
    }
    try {
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching tasks for department ${departmentId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch tasks for department.');
    }
}; 


// In taskService.js
export const fetchCleaningItemsByDepartment = async (departmentId) => {
    try {
        const response = await api.get(`/cleaningitems/?department_id=${departmentId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching cleaning items by department:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch cleaning items.');
    }
};



// Future functions for tasks can be added here, e.g.:
// export const getTaskInstanceById = async (taskId) => { ... };
