import { create } from 'zustand';
import api from '../api/axiosConfig';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
            console.log('🔐 Attempting login for:', email);
            console.log('🌐 API URL:', api.defaults.baseURL);
            
            const res = await api.post('/api/auth/login', { email, password, rememberMe });
            
            if (!res.data || !res.data.token) {
                throw new Error('Invalid response from server');
            }
            
            const { token, user } = res.data;
            console.log('✅ Login successful, token received');

            // Store token and expiry
            localStorage.setItem('token', token);
            const expiryDays = rememberMe ? 30 : 1;
            const expiryTime = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
            localStorage.setItem('tokenExpiry', expiryTime.toString());

            set({ user, token, isAuthenticated: true, isLoading: false, error: null });
            return true;
        } catch (err) {
            console.error('❌ Login error:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                code: err.code
            });
            
            let errorMsg = 'Login failed';
            if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                errorMsg = 'Cannot connect to server. Please check if the backend is running.';
            } else if (err.code === 'ERR_BAD_REQUEST') {
                errorMsg = 'Invalid credentials or server error';
            }
            
            set({ error: errorMsg, isLoading: false, isAuthenticated: false });
            throw new Error(errorMsg);
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/api/auth/register', { name, email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 1 day default
            localStorage.setItem('tokenExpiry', expiryTime.toString());

            set({ user, token, isAuthenticated: true, isLoading: false, error: null });
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Registration failed';
            set({ error: errorMsg, isLoading: false, isAuthenticated: false });
            throw new Error(errorMsg);
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        if (!token) {
            set({ isLoading: false, isAuthenticated: false, user: null });
            return;
        }

        // Check if token has expired
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            console.log('Token expired, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            return;
        }

        try {
            set({ isLoading: true });
            const res = await api.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ User loaded successfully:', res.data);
            set({ user: res.data, token, isAuthenticated: true, isLoading: false, error: null });
        } catch (err) {
            console.error('❌ Failed to load user:', err.response?.data || err.message);
            // Only logout if it's a 401 (unauthorized) or 403 (forbidden) error
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.log('Invalid token, logging out');
                localStorage.removeItem('token');
                localStorage.removeItem('tokenExpiry');
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            } else {
                // For network errors, keep token but don't set as authenticated
                // This allows retry on next page load
                console.log('Network error, keeping token for retry');
                set({ token, isLoading: false, isAuthenticated: false, user: null });
            }
        }
    }
}));

export default useAuthStore;
