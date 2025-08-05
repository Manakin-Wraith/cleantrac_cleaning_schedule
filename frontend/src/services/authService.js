import axios from 'axios';
import { 
    setTenantAuthToken, 
    getTenantAuthToken, 
    removeTenantAuthToken, 
    getTenantHeaders 
} from '../utils/tenantUtils';

// Base API URL provided via Vite env files (.env, .env.local, .env.production)
const API_BASE_URL = import.meta.env.VITE_API_BASE;

// Function to log in a user and get the auth token (tenant-aware)
export const loginUser = async (username, password) => {
    try {
        // Get tenant headers for the login request
        const tenantHeaders = getTenantHeaders();
        
        console.log('🔐 Tenant-aware login attempt:', {
            username,
            tenant: tenantHeaders['x-tenant-domain']
        });
        
        const response = await axios.post(`${API_BASE_URL}/token-auth/`, {
            username: username,
            password: password,
        }, {
            headers: {
                'Content-Type': 'application/json',
                ...tenantHeaders
            }
        });
        
        if (response.data.token) {
            // Store the token with tenant-specific key
            setTenantAuthToken(response.data.token);
            
            // Set Axios default header for subsequent requests
            axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
            
            console.log('✅ Tenant login successful:', {
                tenant: tenantHeaders['x-tenant-domain'],
                tokenLength: response.data.token.length
            });
            
            return response.data; // { token: "..." }
        } else {
            throw new Error('Token not found in response');
        }
    } catch (error) {
        console.error('❌ Tenant login API error:', {
            error: error.response?.data || error.message,
            status: error.response?.status,
            tenant: getTenantHeaders()['x-tenant-domain']
        });
        
        // Clear any potentially stale auth token from previous attempts
        removeTenantAuthToken();
        delete axios.defaults.headers.common['Authorization'];
        throw error; // Re-throw to be caught by the component
    }
};

// Function to get the current authenticated user's details (tenant-aware)
export const getCurrentUser = async () => {
    const token = getTenantAuthToken();
    if (!token) {
        // If no token, clear Authorization header just in case it was set by a previous session
        delete axios.defaults.headers.common['Authorization'];
        return Promise.reject('No tenant auth token found');
    }
    
    // Get tenant headers
    const tenantHeaders = getTenantHeaders();
    
    // Ensure Authorization header is set for this request if it wasn't already
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    
    try {
        const response = await axios.get(`${API_BASE_URL}/users/me/`, {
            headers: {
                ...tenantHeaders
            }
        });
        
        console.log('👤 Current user fetched for tenant:', {
            tenant: tenantHeaders['x-tenant-domain'],
            username: response.data.username
        });
        
        return response.data;
    } catch (error) {
        console.error('❌ Get current user API error:', {
            error: error.response?.data || error.message,
            status: error.response?.status,
            tenant: tenantHeaders['x-tenant-domain']
        });
        
        // If the token is invalid (e.g., 401 Unauthorized), we should clear it
        if (error.response && error.response.status === 401) {
            removeTenantAuthToken();
            delete axios.defaults.headers.common['Authorization'];
        }
        throw error;
    }
};

// Function to log out a user (tenant-aware)
export const logoutUser = async () => {
    try {
        const tenantHeaders = getTenantHeaders();
        
        // Clear the tenant-specific token from localStorage
        removeTenantAuthToken();
        
        // Remove the Authorization header from Axios defaults
        delete axios.defaults.headers.common['Authorization'];
        
        console.log('✅ User logged out successfully from tenant:', {
            tenant: tenantHeaders['x-tenant-domain']
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
};

// Function to check if a user is currently authenticated (tenant-aware)
export const checkAuthStatus = () => {
    const token = getTenantAuthToken();
    const tenantHeaders = getTenantHeaders();
    
    if (token) {
        // Set the Authorization header if a token exists
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        
        console.log('🔍 Auth status check:', {
            tenant: tenantHeaders['x-tenant-domain'],
            hasToken: true,
            tokenLength: token.length
        });
        
        return true;
    } else {
        // Clear the Authorization header if no token
        delete axios.defaults.headers.common['Authorization'];
        
        console.log('🔍 Auth status check:', {
            tenant: tenantHeaders['x-tenant-domain'],
            hasToken: false
        });
        
        return false;
    }
};

// Function to request a password reset code
export const requestPasswordReset = async (username) => {
    try {
        // Get tenant headers
        const tenantHeaders = getTenantHeaders();
        
        // No token needed for this request
        const response = await axios.post(`${API_BASE_URL}/auth/password-reset/request/`, {
            username: username,
        }, {
            headers: {
                ...tenantHeaders
            }
        });
        return response.data; // Expected: { message: "..." }
    } catch (error) {
        console.error('Request password reset API error:', error.response?.data || error.response || error.message);
        throw error.response?.data || new Error(error.message || 'Failed to request password reset.');
    }
};

// Function to confirm a password reset with a token and new password
export const confirmPasswordReset = async (username, token, newPassword) => {
    try {
        // Get tenant headers
        const tenantHeaders = getTenantHeaders();
        
        // No token needed for this request
        const response = await axios.post(`${API_BASE_URL}/auth/password-reset/confirm/`, {
            username: username,
            token: token,
            new_password: newPassword,
        }, {
            headers: {
                ...tenantHeaders
            }
        });
        return response.data; // Expected: { message: "Password has been reset successfully." }
    } catch (error) {
        console.error('Confirm password reset API error:', error.response?.data || error.response || error.message);
        throw error.response?.data || new Error(error.message || 'Failed to confirm password reset.');
    }
};

// Function to get the auth header for API requests (tenant-aware)
export const getAuthHeader = () => {
    const token = getTenantAuthToken();
    const tenantHeaders = getTenantHeaders();
    
    if (token) {
        return {
            'Authorization': `Token ${token}`,
            ...tenantHeaders
        };
    }
    
    // Return tenant headers even without auth token for public endpoints
    return tenantHeaders;
};
