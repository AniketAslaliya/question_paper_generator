import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password, rememberMe });
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
            const res = await axios.post(`${API_URL}/register`, { name, email, password });
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

        if (!token) return;

        // Check if token has expired
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
            set({ user: null, token: null, isAuthenticated: false });
            return;
        }

        try {
            const res = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ user: res.data, token, isAuthenticated: true });
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
            set({ user: null, token: null, isAuthenticated: false });
        }
    }
}));

export default useAuthStore;
