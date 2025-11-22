
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
