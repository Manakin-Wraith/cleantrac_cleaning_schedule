import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE; // defined in Vercel/ .env files

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the auth token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Token ${token}`;
        }
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
            // Token might be expired or invalid
            localStorage.removeItem('authToken');
            // Redirect to login, or dispatch an event to update auth state
            // For simplicity, we'll just log it here. A robust app would handle this globally.
            console.error('Unauthorized request. Token might be invalid or expired.');
            // window.location.href = '/login'; // Could force redirect
        }
        return Promise.reject(error);
    }
);

export default apiClient;
