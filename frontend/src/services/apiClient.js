import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to requests if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Corrected: Use 'authToken'
    if (token) {
      config.headers['Authorization'] = `Token ${token}`; // Corrected: Use 'Token <token>' format
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Interceptor for global error handling
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle global errors here, e.g., redirect to login on 401
//     if (error.response && error.response.status === 401) {
//       // For example, redirect to login page or refresh token
//       console.error('Unauthorized, redirecting to login...');
//       // window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default apiClient;
