import apiClient from './apiClient'; // Assuming apiClient.js handles base URL and auth

/**
 * Fetches temperature logs based on provided parameters.
 * @param {object} params - Query parameters for filtering logs (e.g., { department, date }).
 * @returns {Promise<Array>} A promise that resolves to an array of temperature log objects.
 */
export const getTemperatureLogs = async (params) => {
  try {
    const response = await apiClient.get('/temperature-logs/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching temperature logs:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Creates a new temperature log entry.
 * @param {object} logData - The data for the new temperature log.
 * @returns {Promise<object>} A promise that resolves to the created temperature log object.
 */
export const createTemperatureLog = async (logData) => {
  try {
    const response = await apiClient.post('/temperature-logs/', logData);
    return response.data;
  } catch (error) {
    console.error('Error creating temperature log:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
