import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api'; // Adjust if your Django backend runs elsewhere

// Function to log in a user and get the auth token
export const loginUser = async (username, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/token-auth/`, {
            username: username,
            password: password,
        });
        if (response.data.token) {
            // Store the token in localStorage (or sessionStorage)
            localStorage.setItem('authToken', response.data.token);
            // Set Axios default header for subsequent requests
            axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
            return response.data; // { token: "..." }
        } else {
            throw new Error('Token not found in response');
        }
    } catch (error) {
        console.error('Login API error:', error.response || error.message);
        // Clear any potentially stale auth token from previous attempts
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        throw error; // Re-throw to be caught by the component
    }
};

// Function to get the current authenticated user's details
export const getCurrentUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // If no token, clear Authorization header just in case it was set by a previous session
        delete axios.defaults.headers.common['Authorization'];
        return Promise.reject('No auth token found');
    }
    // Ensure Authorization header is set for this request if it wasn't already
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    try {
        const response = await axios.get(`${API_BASE_URL}/users/me/`);
        return response.data;
    } catch (error) {
        console.error('Get current user API error:', error.response || error.message);
        // If the token is invalid (e.g., 401 Unauthorized), we should clear it
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
        }
        throw error;
    }
};

// Function to log out a user
export const logoutUser = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    // We don't have a backend logout endpoint for token auth, 
    // so logout is purely a client-side token removal.
    // If you implement server-side token invalidation, call that API here.
    return Promise.resolve();
};

// Function to check if a user is currently authenticated (e.g., on app load)
export const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        return true;
    }
    delete axios.defaults.headers.common['Authorization'];
    return false;
};
