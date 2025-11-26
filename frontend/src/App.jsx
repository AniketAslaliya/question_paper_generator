import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CreatePaperPage from './pages/CreatePaperPage';
import AdminDashboard from './pages/AdminDashboard';
import PaperViewPage from './pages/PaperViewPage';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, isLoading, token } = useAuthStore();
    
    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    // If token exists but not authenticated, might be loading - wait a bit
    if (token && !isAuthenticated && isLoading === false) {
        // Token exists but auth check failed - redirect to login
        return <Navigate to="/login" />;
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div>Loading...</div>;
    return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
    const loadUser = useAuthStore((state) => state.loadUser);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <Router>
            <div className="min-h-screen bg-cream text-dark">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/create-paper" element={
                        <PrivateRoute>
                            <CreatePaperPage />
                        </PrivateRoute>
                    } />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    } />
                    <Route path="/paper/:id" element={
                        <PrivateRoute>
                            <PaperViewPage />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
