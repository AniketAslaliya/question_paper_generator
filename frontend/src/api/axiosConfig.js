import axios from 'axios';

// Get API URL from environment or use default
const getApiUrl = () => {
    // Priority 1: Environment variable (set in Vercel)
    if (import.meta.env.VITE_API_URL) {
        const url = import.meta.env.VITE_API_URL.replace(/\/$/, '');
        console.log('✅ Using VITE_API_URL from environment:', url);
        return url;
    }
    
    // Priority 2: Local development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('✅ Using localhost for development');
        return 'http://localhost:5000';
    }
    
    // Priority 3: Production fallback - you MUST set VITE_API_URL in Vercel
    console.warn('⚠️ VITE_API_URL not set! Using fallback. Please set VITE_API_URL in Vercel environment variables.');
    // Try to use relative URL as last resort (won't work if backend is on different domain)
    return '/api'; // This won't work if backend is separate - user must set env var
};

export const API_URL = getApiUrl();

console.log('🔧 API URL configured:', API_URL);
console.log('🔧 Environment:', import.meta.env.MODE);

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 second timeout
});

// Add request interceptor to attach token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't handle 401 on auth endpoints - let them handle their own errors
        const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                              error.config?.url?.includes('/api/auth/register') ||
                              error.config?.url?.includes('/api/auth/me');
        
        if (error.response?.status === 401 && !isAuthEndpoint) {
            // Token expired or invalid (but not for auth endpoints)
            console.log('🚫 401 error on non-auth endpoint, clearing token');
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
