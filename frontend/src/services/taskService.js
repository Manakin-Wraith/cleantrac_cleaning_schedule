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
import { extractNumericId } from '../utils/idUtils';

export const updateTaskInstance = async (taskId, taskData) => {
    try {
        // Ensure assigned_to_id is correctly mapped to assigned_to for the backend.
        // The backend typically expects the foreign key field name (e.g., 'assigned_to') 
        // with the ID as its value for updates.
        const payload = { ...taskData };

        // Ensure assigned_to_id numeric or null; leave field name as assigned_to_id because DRF serializer accepts it (source='assigned_to')
        if (taskData.hasOwnProperty('assigned_to_id')) {
            payload.assigned_to_id = taskData.assigned_to_id === '' || taskData.assigned_to_id === undefined
                ? null
                : parseInt(taskData.assigned_to_id, 10);
        } else if (taskData.hasOwnProperty('assigned_to')) {
            // Fallback if caller passed 'assigned_to'
            payload.assigned_to_id = taskData.assigned_to === '' || taskData.assigned_to === undefined 
                ? null 
                : parseInt(taskData.assigned_to, 10);
            delete payload.assigned_to; // avoid unknown field
        }

        // Normalize cleaning item key → always send cleaning_item_id_write
        if (taskData.hasOwnProperty('cleaning_item_id_write')) {
            payload.cleaning_item_id_write = taskData.cleaning_item_id_write === '' || taskData.cleaning_item_id_write === undefined
                ? null
                : parseInt(taskData.cleaning_item_id_write, 10);
        } else if (taskData.hasOwnProperty('cleaning_item_id')) {
            payload.cleaning_item_id_write = taskData.cleaning_item_id === '' || taskData.cleaning_item_id === undefined
                ? null
                : parseInt(taskData.cleaning_item_id, 10);
            delete payload.cleaning_item_id;
        } else if (taskData.hasOwnProperty('cleaning_item')) {
            // may be object or ID
            const ciVal = typeof taskData.cleaning_item === 'object' ? taskData.cleaning_item.id : taskData.cleaning_item;
            payload.cleaning_item_id_write = ciVal === '' || ciVal === undefined ? null : parseInt(ciVal, 10);
            delete payload.cleaning_item;
        }

        // Remove status if it is unchanged or redundant to satisfy workflow rules
        if ('status' in payload && (payload.status === undefined || payload.status === null)) {
            delete payload.status;
        }

        // Drop any null/undefined fields to keep PATCH minimal
        Object.keys(payload).forEach((k) => {
            if (payload[k] === '' || payload[k] == null) {
                delete payload[k];
            }
        });

        const numericId = extractNumericId(taskId);
        if (Number.isNaN(numericId)) {
            throw new Error(`Invalid task id '${taskId}'`);
        }
        if (Object.keys(payload).length === 0) {
            // Nothing to update – treat as success
            return { id: numericId };
        }
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[updateTaskInstance] PATCH payload', payload);
        }
        const response = await api.patch(`/taskinstances/${numericId}/`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating task ${taskId}:`, error.response?.data || error.message);
        let errorMessage = "Failed to update task.";
        if (error.response && error.response.data) {
            const errorData = error.response.data;
            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (typeof errorData === 'object') {
                // Try to extract common DRF error formats
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else {
                    // Concatenate all error messages from DRF (e.g., field errors)
                    const messages = Object.entries(errorData).map(([key, value]) => {
                        if (Array.isArray(value)) return `${key}: ${value.join(' ')}`;
                        return `${key}: ${value}`;
                    });
                    if (messages.length > 0) errorMessage = messages.join('; ');
                }
            }
        }
        throw new Error(errorMessage);
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

/**
 * Deletes a task instance.
 * 
 * @param {number} taskId - ID of the task instance to delete.
 * @returns {Promise<void>} A promise that resolves when the task is successfully deleted.
 */
export const deleteMultipleTaskInstances = async (taskIds) => {
    try {
        // Using POST for bulk operations with a body is common, even for deletions.
        // Alternatively, some APIs use DELETE with a body, but POST is widely supported.
        const response = await api.post('/taskinstances/bulk_delete/', { ids: taskIds });
        return response.data; // Or response itself if you need status, etc.
    } catch (error) {
        console.error(
            "Error deleting multiple task instances:", 
            error.response ? error.response.data : error.message,
            error.response ? `Status: ${error.response.status}` : '',
            error.config ? `Payload: ${JSON.stringify(error.config.data)}`: ''
        );
        let errorMessage = "Failed to delete selected tasks.";
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (Object.keys(error.response.data).length > 0) {
                // Try to format object errors
                errorMessage = Object.entries(error.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
            }
        }
        throw new Error(errorMessage);
    }
};

export const deleteTaskInstance = async (taskId) => {
    try {
        await api.delete(`/taskinstances/${taskId}/`);
        // No response data expected for a successful DELETE, but some APIs might return 204 No Content
    } catch (error) {
        console.error(`Error deleting task instance ${taskId}:`, error.response?.data || error.message);
        // Re-throw a more specific error or the error data from the response
        const errorMessage = error.response?.data?.detail || 
                             (error.response?.status ? `Server error: ${error.response.status}` : error.message) || 
                             'Failed to delete task instance.';
        throw new Error(errorMessage);
    }
};
