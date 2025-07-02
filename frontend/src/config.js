// API Configuration
// Base URL for backend API – injected at build time via Vite env variable
export const API_URL = import.meta.env.VITE_API_BASE;

// Other configuration settings can be added here
export const FILE_UPLOAD_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
