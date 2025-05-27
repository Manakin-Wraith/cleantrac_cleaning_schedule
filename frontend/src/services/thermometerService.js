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

export const createTemperatureLog = async (logData) => {
  const response = await api.post('/temperature-logs/', logData);
  return response.data;
};

export const updateTemperatureLog = async (id, logData) => {
  const response = await api.put(`/temperature-logs/${id}/`, logData);
  return response.data;
};

export const getTemperatureLogsByDate = async (date) => {
  const response = await api.get(`/temperature-logs/by-date/${date}/`);
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

export const getCurrentAssignment = async () => {
  const response = await api.get('/thermometer-verification-assignments/current-assignment/');
  return response.data;
};

export const getAllCurrentAssignments = async () => {
  const response = await api.get('/thermometer-verification-assignments/', { params: { is_active: true } });
  return response.data;
};

export const getMyAssignment = async () => {
  const response = await api.get('/thermometer-verification-assignments/my-assignment/');
  return response.data;
};

export const createVerificationAssignment = async (assignmentData) => {
  const response = await api.post('/thermometer-verification-assignments/', assignmentData);
  return response.data;
};

export const updateVerificationAssignment = async (id, assignmentData) => {
  const response = await api.put(`/thermometer-verification-assignments/${id}/`, assignmentData);
  return response.data;
};
