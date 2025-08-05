/**
 * Tenant Utility Functions
 * Handles tenant detection and management for multi-tenant SaaS
 */

/**
 * Get the current tenant domain from window location
 * @returns {string} The tenant domain (e.g., 'capestation.manager.cleentrac.com')
 */
export const getCurrentTenantDomain = () => {
  // In production, this would be the actual domain
  // For development, we can use a default or environment variable
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If we're on localhost or development, use the Cape Station tenant
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'capestation.manager.cleentrac.com';
    }
    
    // In production, return the actual hostname
    return hostname;
  }
  
  // Fallback for server-side rendering or testing
  return 'capestation.manager.cleentrac.com';
};

/**
 * Extract tenant identifier from domain
 * @param {string} domain - The full domain (e.g., 'capestation.manager.cleentrac.com')
 * @returns {string} The tenant identifier (e.g., 'capestation')
 */
export const getTenantIdentifier = (domain = getCurrentTenantDomain()) => {
  // Extract the subdomain part (tenant identifier)
  const parts = domain.split('.');
  if (parts.length >= 3 && parts[1] === 'manager' && parts[2] === 'cleentrac') {
    return parts[0]; // e.g., 'capestation'
  }
  
  // Fallback for development or non-standard domains
  return 'capestation';
};

/**
 * Get tenant-specific storage key
 * @param {string} key - Base storage key
 * @returns {string} Tenant-prefixed storage key
 */
export const getTenantStorageKey = (key) => {
  const tenantId = getTenantIdentifier();
  return `${tenantId}_${key}`;
};

/**
 * Get tenant-specific auth token from localStorage
 * @returns {string|null} The tenant-specific auth token
 */
export const getTenantAuthToken = () => {
  const tenantKey = getTenantStorageKey('authToken');
  return localStorage.getItem(tenantKey);
};

/**
 * Set tenant-specific auth token in localStorage
 * @param {string} token - The auth token to store
 */
export const setTenantAuthToken = (token) => {
  const tenantKey = getTenantStorageKey('authToken');
  localStorage.setItem(tenantKey, token);
};

/**
 * Remove tenant-specific auth token from localStorage
 */
export const removeTenantAuthToken = () => {
  const tenantKey = getTenantStorageKey('authToken');
  localStorage.removeItem(tenantKey);
  
  // Also remove the old non-tenant-specific token for migration
  localStorage.removeItem('authToken');
};

/**
 * Get tenant headers for API requests
 * @returns {Object} Headers object with tenant information
 */
export const getTenantHeaders = () => {
  const tenantDomain = getCurrentTenantDomain();
  return {
    'x-tenant-domain': tenantDomain,
    'X-Tenant-Domain': tenantDomain, // Backup for case sensitivity
  };
};

/**
 * Check if we're in a tenant context
 * @returns {boolean} True if we're in a tenant context
 */
export const isInTenantContext = () => {
  const tenantId = getTenantIdentifier();
  return tenantId && tenantId !== 'localhost' && tenantId !== '127';
};

export default {
  getCurrentTenantDomain,
  getTenantIdentifier,
  getTenantStorageKey,
  getTenantAuthToken,
  setTenantAuthToken,
  removeTenantAuthToken,
  getTenantHeaders,
  isInTenantContext,
};
