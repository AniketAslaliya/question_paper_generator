import { create } from 'zustand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../api/axiosConfig';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // Initialize Auth Listener
    initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔐 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');

            if (firebaseUser) {
                try {
                    console.log('📡 Getting Firebase token...');
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('token', token);

                    console.log('🔄 Syncing with backend...');
                    // Sync with backend to get role/db user data
                    const res = await api.post('/api/auth/firebase-login', {
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log('✅ Backend sync successful:', res.data);
                    set({ user: res.data, token, isAuthenticated: true, isLoading: false });
                } catch (err) {
                    console.error("❌ Backend sync failed:", err.response?.data || err.message);
                    // Even if backend fails, let user in with Firebase data
                    set({
                        user: {
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                            role: 'user'
                        },
                        token: await firebaseUser.getIdToken(),
                        isAuthenticated: true,
                        isLoading: false
                    });
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
            await signInWithRedirect(auth, provider);
            // The page will redirect, so we don't return here
            // onAuthStateChanged will handle the user after redirect
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

    loadUser: () => { }
}));

export default useAuthStore;
