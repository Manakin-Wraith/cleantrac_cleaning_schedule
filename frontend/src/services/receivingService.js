// frontend/src/services/receivingService.js
// -----------------------------------------------------------------------------
// API helpers for Receiving Records (inventory arrivals)
// -----------------------------------------------------------------------------
// Each helper returns the Axios response data field, already parsed to JSON.
// All requests automatically include the auth token header via api.js interceptor.
//
// Supported endpoints (see Django DRF router):
//   GET /receiving-records/                -> list (paginated)
//   GET /receiving-records/:id/            -> retrieve single record
// -----------------------------------------------------------------------------

import api from './api';

/**
 * Fetch a paginated list of receiving records.
 * If the backend pagination is enabled, the response object will contain
 *  { results, count, next, previous } by default (DRF PageNumberPagination).
 *
 * @param {Object} params - Optional query params (e.g. { page: 2, search: 'ABC' }).
 * @returns {Promise<Object>} The paginated response object.
 */
export const fetchReceivingRecords = async (params = {}) => {
  try {
    const res = await api.get('/receiving-records/', { params });
    return res.data;
  } catch (err) {
    console.error('Error fetching receiving records', err);
    throw err;
  }
};

/**
 * Retrieve a single receiving record by primary key.
 * @param {number | string} id - The inventory_id of the record.
 * @returns {Promise<Object>} The receiving record object.
 */
export const fetchReceivingRecordById = async (id) => {
  try {
    const res = await api.get(`/receiving-records/${id}/`);
    return res.data;
  } catch (err) {
    console.error(`Error fetching receiving record ${id}`, err);
    throw err;
  }
};
