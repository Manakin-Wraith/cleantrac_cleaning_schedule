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

/**
 * Get preview URL for a generated document
 * @param {number} documentId - Document ID
 * @returns {string} - Preview URL
 */
export const getDocumentPreviewUrl = (documentId) => {
  return `${API_URL}/generated-documents/${documentId}/preview/`;
};

/**
 * Get download URL for a generated document
 * @param {number} documentId - Document ID
 * @returns {string} - Download URL
 */
export const getDocumentDownloadUrl = (documentId) => {
  return `${API_URL}/generated-documents/${documentId}/preview/?download=true`;
};

/**
 * Open document preview in new tab
 * @param {number} documentId - Document ID
 * @param {string} authToken - Authentication token
 */
export const openDocumentPreview = (documentId, authToken) => {
  const url = getDocumentPreviewUrl(documentId);
  // Open in new tab with auth headers (browser will handle the PDF display)
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // For preview, we'll use a form to send headers properly
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = url;
  form.target = '_blank';
  
  // Add hidden inputs for headers (this is a workaround for browser limitations)
  const authInput = document.createElement('input');
  authInput.type = 'hidden';
  authInput.name = 'auth';
  authInput.value = authToken;
  form.appendChild(authInput);
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

/**
 * Download document file
 * @param {number} documentId - Document ID
 * @param {string} filename - Filename for download
 */
export const downloadDocument = async (documentId, filename = 'document.pdf') => {
  try {
    const response = await axios.get(getDocumentDownloadUrl(documentId), {
      headers: getAuthHeader(),
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};
