import axios from 'axios';
import { getTenantAuthToken, getTenantHeaders } from '../utils/tenantUtils';

const API_URL = import.meta.env.VITE_API_BASE; // defined in Vercel/ .env files

// Debug: Log the API URL being used
console.log('🔍 API_URL being used:', API_URL);
console.log('🔍 All env vars:', import.meta.env);

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        // Dynamic tenant headers will be added via interceptor
    },
});

// Interceptor to add the auth token and tenant headers to requests
apiClient.interceptors.request.use(
    (config) => {
        // Add tenant-specific auth token
        const token = getTenantAuthToken();
        if (token) {
            config.headers['Authorization'] = `Token ${token}`;
        }
        
        // Add tenant headers for multi-tenant routing
        const tenantHeaders = getTenantHeaders();
        Object.assign(config.headers, tenantHeaders);
        
        // Debug logging for tenant requests
        console.log('🏢 API Request with tenant context:', {
            url: config.url,
            tenant: tenantHeaders['x-tenant-domain'],
            hasToken: !!token
        });
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor for handling 401 Unauthorized responses (optional but good practice)
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token might be expired or invalid - remove tenant-specific token
            const { removeTenantAuthToken } = require('../utils/tenantUtils');
            removeTenantAuthToken();
            
            // Redirect to login, or dispatch an event to update auth state
            console.error('Unauthorized request. Tenant token might be invalid or expired.');
            // window.location.href = '/login'; // Could force redirect
        }
        return Promise.reject(error);
    }
);

export default apiClient;
