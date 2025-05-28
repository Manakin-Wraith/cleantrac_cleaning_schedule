// frontend/src/services/foodSafetyService.js
import api from './api'; // Assuming 'api.js' is the configured axios instance

/**
 * Submits a new weekly temperature review.
 * @param {object} reviewData - The data for the new review.
 * @param {number} reviewData.department - The ID of the department.
 * @param {string} reviewData.week_start_date - The start date of the week (YYYY-MM-DD).
 * @param {string} [reviewData.overall_comment] - Optional overall comment.
 * @returns {Promise<object>} The created weekly temperature review object.
 */
export const submitWeeklyTemperatureReview = async (reviewData) => {
  try {
    // Ensure week_start_date is in YYYY-MM-DD format if it's a Date object
    if (reviewData.week_start_date instanceof Date) {
      reviewData.week_start_date = reviewData.week_start_date.toISOString().split('T')[0];
    }

    const response = await api.post('/weekly-temperature-reviews/', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting weekly temperature review:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Network error or server issue');
  }
};

/**
 * Fetches weekly temperature reviews, optionally filtered by department.
 * @param {object} [filters] - Optional filters.
 * @param {number} [filters.departmentId] - The ID of the department to filter by.
 * @returns {Promise<Array<object>>} A list of weekly temperature review objects.
 */
export const fetchWeeklyTemperatureReviews = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.departmentId) {
      params.append('department', filters.departmentId);
    }
    // Add other filters as needed, e.g., date range

    const response = await api.get('/weekly-temperature-reviews/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly temperature reviews:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Network error or server issue');
  }
};

/**
 * Fetches cleaning items, typically filtered by the user's department on the backend.
 * @param {number} [departmentId] - Optional department ID, primarily for context or future use if API changes.
 * @returns {Promise<Array<object>>} A list of cleaning item objects.
 */
export const fetchCleaningItemsForDepartment = async (departmentId) => {
  try {
    // The backend's CleaningItemViewSet should automatically filter by the
    // authenticated user's department. Explicit departmentId in query params
    // might be redundant or could be added if the API supports overriding.
    const response = await api.get('/cleaningitems/');
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaning items:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Network error or server issue fetching cleaning items');
  }
};

/**
 * Submits a new daily cleaning record.
 * @param {object} recordData - The data for the daily cleaning record.
 * @param {number} recordData.cleaning_item - ID of the cleaning item.
 * @param {string} recordData.date_recorded - Date in 'YYYY-MM-DD' format.
 * @param {boolean} recordData.is_completed - Completion status.
 * @param {string} [recordData.comment] - Optional comment.
 * @param {number} recordData.department - ID of the department.
 * @returns {Promise<object>} The created daily cleaning record object.
 */
export const submitDailyCleaningRecord = async (recordData) => {
  try {
    const response = await api.post('/daily-cleaning-records/', recordData);
    return response.data;
  } catch (error) {
    console.error('Error submitting daily cleaning record:', error.response || error.message);
    // Enhance error message for common issues like missing department or user not linked
    let detailedError = 'Network error or server issue submitting daily cleaning record.';
    if (error.response && error.response.data) {
        detailedError = Object.values(error.response.data).flat().join(' ');
    }
    throw new Error(detailedError);
  }
};

/**
 * Fetches daily cleaning records, optionally filtered.
 * @param {object} [filters] - Optional filters.
 * @param {number} [filters.departmentId] - The ID of the department to filter by.
 * @param {number} [filters.cleaningItemId] - The ID of the cleaning item to filter by.
 * @param {string} [filters.dateRecorded] - Date in 'YYYY-MM-DD' to filter by (if supported by backend).
 * @returns {Promise<Array<object>>} A list of daily cleaning record objects.
 */
export const fetchDailyCleaningRecords = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.departmentId) {
      // Backend filters by cleaning_item__department_id, so we send department_id
      params.append('department_id', filters.departmentId);
    }
    if (filters.cleaningItemId) {
      params.append('cleaning_item_id', filters.cleaningItemId);
    }
    if (filters.dateRecorded) {
      // Note: Ensure backend ViewSet supports filtering by date_recorded
      params.append('date_recorded', filters.dateRecorded);
    }
    // Add other filters as needed, e.g., date range

    const response = await api.get('/daily-cleaning-records/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily cleaning records:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Network error or server issue fetching daily cleaning records');
  }
};

// Future functions for food safety can be added here:

const foodSafetyService = {
  submitWeeklyTemperatureReview,
  fetchWeeklyTemperatureReviews,
  fetchCleaningItemsForDepartment,
  submitDailyCleaningRecord,
  fetchDailyCleaningRecords,
  // ...other functions
};

export default foodSafetyService;
