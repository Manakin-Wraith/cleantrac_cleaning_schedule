import api from './api';

// Thermometer endpoints
export const getThermometers = async (params = {}) => {
  const response = await api.get('/thermometers/', { params });
  return response.data;
};

export const getThermometer = async (id) => {
  const response = await api.get(`/thermometers/${id}/`);
  return response.data;
};

export const createThermometer = async (thermometerData) => {
  const response = await api.post('/thermometers/', thermometerData);
  return response.data;
};

export const updateThermometer = async (id, thermometerData) => {
  const response = await api.put(`/thermometers/${id}/`, thermometerData);
  return response.data;
};

export const deleteThermometer = async (id) => {
  const response = await api.delete(`/thermometers/${id}/`);
  return response.data;
};

// Thermometer status-specific endpoints
export const getVerifiedThermometers = async () => {
  const response = await api.get('/thermometers/verified/');
  return response.data;
};

export const getThermometersNeedingVerification = async () => {
  const response = await api.get('/thermometers/needs-verification/');
  return response.data;
};

export const getThermometersExpiringVerification = async () => {
  const response = await api.get('/thermometers/expiring-verification/');
  return response.data;
};

// Thermometer Verification API functions
export const getVerificationRecords = async () => {
  const response = await api.get('/thermometer-verification-records/');
  return response.data;
};

export const getVerificationRecord = async (id) => {
  const response = await api.get(`/thermometer-verification-records/${id}/`);
  return response.data;
};

export const createVerificationRecord = async (recordData) => {
  const response = await api.post('/thermometer-verification-records/', recordData);
  return response.data;
};

// Temperature Log API functions
export const getTemperatureLogs = async (params = {}) => {
  const response = await api.get('/temperature-logs/', { params });
  return response.data;
};

export const getTodayTemperatureLogs = async () => {
  const response = await api.get('/temperature-logs/today/');
  return response.data;
};

/**
 * Creates a new temperature log entry
 * @param {Object} logData - The temperature log data to submit
 * @returns {Promise<Object>} The created temperature log data
 */
export const createTemperatureLog = async (logData) => {
  try {
    // Check if auth token exists before making the request
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    const response = await api.post('/temperature-logs/', logData);
    return response.data;
  } catch (error) {
    // Log the detailed error for debugging
    if (error.response) {
      console.error('Temperature log submission error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else {
      console.error('Temperature log submission error:', error.message);
    }
    throw error; // Re-throw to be handled by the component
  }
};

export const updateTemperatureLog = async (id, logData) => {
  const response = await api.put(`/temperature-logs/${id}/`, logData);
  return response.data;
};

export const getTemperatureLogsByDate = async (date) => {
  const response = await api.get(`/temperature-logs/by-date/${date}/`);
  return response.data;
};

export const getAreasWithLogStatus = async () => {
  const response = await api.get('/temperature-logs/areas-with-status/');
  return response.data;
};

export const getTemperatureLoggingManagerSummary = async () => {
  const response = await api.get('/temperature-logs/manager-summary/');
  return response.data;
};

export const getTemperatureLogsByArea = async (areaId) => {
  const response = await api.get(`/temperature-logs/by-area/${areaId}/`);
  return response.data;
};

// Area Units API functions
export const getAreaUnits = async (params = {}) => {
  const response = await api.get('/area-units/', { params });
  return response.data;
};

export const getAreaUnit = async (id) => {
  const response = await api.get(`/area-units/${id}/`);
  return response.data;
};

// Thermometer Assignment API functions
export const getThermometerAssignments = async () => {
  const response = await api.get('/thermometer-assignments/');
  return response.data;
};

export const createThermometerAssignment = async (assignmentData) => {
  const response = await api.post('/thermometer-assignments/', assignmentData);
  return response.data;
};

export const updateThermometerAssignment = async (id, assignmentData) => {
  const response = await api.put(`/thermometer-assignments/${id}/`, assignmentData);
  return response.data;
};

export const deleteThermometerAssignment = async (id) => {
  const response = await api.delete(`/thermometer-assignments/${id}/`);
  return response.data;
};

export const getCurrentUserAssignments = async () => {
  const response = await api.get('/thermometer-assignments/my-assignments/');
  return response.data;
};

// Dashboard statistics
export const getThermometerStats = async () => {
  const response = await api.get('/thermometers/stats/');
  return response.data;
};

// Thermometer Verification Assignment endpoints
export const getVerificationAssignments = async (params = {}) => {
  const response = await api.get('/thermometer-verification-assignments/', { params });
  return response.data;
};

/**
 * Gets the current THERMOMETER VERIFICATION assignment for the logged-in user.
 * This is specifically for thermometer verification duties, not temperature checks.
 * 
 * @returns {Promise<Object>} The thermometer verification assignment or an empty object if not assigned
 */
export const getCurrentAssignment = async () => {
  try {
    const response = await api.get('/thermometer-verification-assignments/my-assignment/');
    // If the response is empty or doesn't have an ID, the user is not assigned to verification
    return response.data && typeof response.data === 'object' ? response.data : {};
  } catch (error) {
    // 404 means the user is not assigned to thermometer verification
    if (error.response && error.response.status === 404) {
      console.info('User is not assigned to thermometer verification');
      return {};
    }
    console.warn('Error fetching thermometer verification assignment:', error);
    return {};
  }
};

export const getAllCurrentAssignments = async () => {
  const response = await api.get('/thermometer-verification-assignments/', { params: { is_active: true } });
  return response.data;
};

// This is a duplicate function that should be removed as getCurrentAssignment already does this
// Keeping it for backward compatibility
export const getMyAssignment = async () => {
  try {
    const response = await api.get('/thermometer-verification-assignments/my-assignment/');
    return response.data;
  } catch (error) {
    console.warn('Error fetching thermometer verification assignment:', error);
    return {};
  }
};

export const createVerificationAssignment = async (assignmentData) => {
  const response = await api.post('/thermometer-verification-assignments/', assignmentData);
  return response.data;
};

export const updateVerificationAssignment = async (id, assignmentData) => {
  const response = await api.put(`/thermometer-verification-assignments/${id}/`, assignmentData);
  return response.data;
};

// Temperature Check Assignment endpoints
export const getTemperatureCheckAssignments = async (params = {}) => {
  const response = await api.get('/temperature-check-assignments/', { params });
  return response.data;
};

export const getCurrentTemperatureCheckAssignments = async () => {
  const response = await api.get('/temperature-check-assignments/current-assignments/');
  return response.data;
};

export const getAllCurrentTemperatureCheckAssignments = async () => {
  const response = await api.get('/temperature-check-assignments/', { params: { is_active: true } });
  return response.data;
};

/**
 * Gets the current TEMPERATURE CHECK assignments (AM/PM) for the logged-in user.
 * This is specifically for temperature check duties, not thermometer verification.
 * 
 * @returns {Promise<Object>} Object containing am_assignment and pm_assignment properties
 */
export const getMyTemperatureCheckAssignments = async () => {
  try {
    // Check if auth token exists before making the request
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found when fetching temperature check assignments');
      return { am_assignment: null, pm_assignment: null };
    }
    
    // Use the correct endpoint - ensure it matches your backend API
    const response = await api.get('/temperature-check-assignments/my-assignments/');
    return response.data && typeof response.data === 'object' ? response.data : { am_assignment: null, pm_assignment: null };
  } catch (error) {
    // 404 means the user is not assigned to temperature checks
    if (error.response && error.response.status === 404) {
      console.info('User is not assigned to temperature checks');
      return { am_assignment: null, pm_assignment: null };
    } else if (error.response && error.response.status === 401) {
      console.warn('Authentication failed when fetching temperature check assignments');
      // Consider redirecting to login page or refreshing token here
      return { am_assignment: null, pm_assignment: null };
    }
    console.warn('Error fetching temperature check assignments:', error);
    return { am_assignment: null, pm_assignment: null };
  }
};

export const createTemperatureCheckAssignment = async (assignmentData) => {
  const response = await api.post('/temperature-check-assignments/', assignmentData);
  return response.data;
};

export const updateTemperatureCheckAssignment = async (id, assignmentData) => {
  const response = await api.put(`/temperature-check-assignments/${id}/`, assignmentData);
  return response.data;
};
