import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../api/axiosConfig';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check auth state
    error: null,

    // Initialize Auth Listener
    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('token', token);

                    // Sync with backend to get role/db user data
                    const res = await api.post('/api/auth/firebase-login', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    set({ user: res.data, token, isAuthenticated: true, isLoading: false });
                } catch (err) {
                    console.error("Backend sync failed", err);
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                }
            } else {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            }
        });
        return unsubscribe;
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the rest
            return true;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();

            // Register in backend
            await api.post('/api/auth/firebase-register', { name, email }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return true;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        } catch (err) {
            console.error(err);
        }
    },

    loadUser: () => { } // Deprecated, handled by initAuth
}));

export default useAuthStore;
