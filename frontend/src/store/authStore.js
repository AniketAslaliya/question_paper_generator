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
            const res = await api.post('/api/auth/login', { email, password, rememberMe });
            const { token, user } = res.data;

            // Store token and expiry
            localStorage.setItem('token', token);
            const expiryDays = rememberMe ? 30 : 1;
            const expiryTime = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
            localStorage.setItem('tokenExpiry', expiryTime.toString());

            set({ user, token, isAuthenticated: true, isLoading: false, error: null });
            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Login failed';
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
            set({ isLoading: false });
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
            set({ user: res.data, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
            console.error('❌ Failed to load user:', err.response?.data || err.message);
            // Only logout if it's a 401 (unauthorized) error
            if (err.response?.status === 401) {
                console.log('Invalid token, logging out');
                localStorage.removeItem('token');
                localStorage.removeItem('tokenExpiry');
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            } else {
                // For other errors, keep the user logged in but stop loading
                console.log('Keeping user logged in despite error');
                set({ isLoading: false });
            }
        }
    }
}));

export default useAuthStore;
