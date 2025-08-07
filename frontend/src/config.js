// API Configuration
// Base URL for backend API – injected at build time via Vite env variable
// Fallback to production HTTPS URL if env variable not set
export const API_URL = import.meta.env.VITE_API_BASE || 'https://api.cleentrac.com/api';

// Tenant configuration for multi-tenant API
export const TENANT_DOMAIN = 'api.cleentrac.com';

// Other configuration settings can be added here
export const FILE_UPLOAD_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB (increased from 5MB)
