import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

/**
 * Service for handling document template management API calls
 */

// Document Templates

/**
 * Fetch all document templates
 * @param {string} templateType - Optional filter by template type
 * @returns {Promise} - Promise with templates data
 */
export const getDocumentTemplates = async (templateType = '') => {
  let url = `${API_URL}/document-templates/`;
  if (templateType) {
    url += `?template_type=${templateType}`;
  }
  
  const response = await axios.get(url, { headers: getAuthHeader() });
  return response.data;
};

/**
 * Fetch document templates by department
 * @param {number} departmentId - Department ID
 * @returns {Promise} - Promise with templates data
 */
export const getDocumentTemplatesByDepartment = async (departmentId) => {
  const response = await axios.get(`${API_URL}/document-templates/by-department/${departmentId}/`, { 
    headers: getAuthHeader() 
  });
  return response.data;
};

/**
 * Fetch available template types
 * @returns {Promise} - Promise with template types data
 */
export const getTemplateTypes = async () => {
  const response = await axios.get(`${API_URL}/document-templates/types/`, { 
    headers: getAuthHeader() 
  });
  return response.data;
};

/**
 * Create a new document template
 * @param {Object} templateData - Template data including file
 * @returns {Promise} - Promise with created template data
 */
export const createDocumentTemplate = async (templateData) => {
  const formData = new FormData();
  
  // Append all template data to FormData
  Object.keys(templateData).forEach(key => {
    formData.append(key, templateData[key]);
  });
  
  const response = await axios.post(`${API_URL}/document-templates/`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

/**
 * Delete a document template
 * @param {number} templateId - Template ID to delete
 * @returns {Promise} - Promise with delete response
 */
export const deleteDocumentTemplate = async (templateId) => {
  const response = await axios.delete(`${API_URL}/document-templates/${templateId}/`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Generated Documents

/**
 * Fetch recent generated documents
 * @returns {Promise} - Promise with documents data
 */
export const getRecentGeneratedDocuments = async () => {
  const response = await axios.get(`${API_URL}/generated-documents/recent/`, { 
    headers: getAuthHeader() 
  });
  return response.data;
};

/**
 * Fetch generated documents by template
 * @param {number} templateId - Template ID
 * @returns {Promise} - Promise with documents data
 */
export const getGeneratedDocumentsByTemplate = async (templateId) => {
  const response = await axios.get(`${API_URL}/generated-documents/by-template/${templateId}/`, { 
    headers: getAuthHeader() 
  });
  return response.data;
};

/**
 * Generate a document from a template
 * @param {Object} documentData - Document generation data
 * @returns {Promise} - Promise with generated document data
 */
export const generateDocument = async (documentData) => {
  const response = await axios.post(`${API_URL}/generated-documents/`, documentData, {
    headers: getAuthHeader()
  });
  return response.data;
};

/**
 * Delete a generated document
 * @param {number} documentId - Document ID to delete
 * @returns {Promise} - Promise with delete response
 */
export const deleteGeneratedDocument = async (documentId) => {
  const response = await axios.delete(`${API_URL}/generated-documents/${documentId}/`, {
    headers: getAuthHeader()
  });
  return response.data;
};
