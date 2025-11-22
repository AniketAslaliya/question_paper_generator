import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../api/axiosConfig';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    return unsubscribe;
},

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
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
