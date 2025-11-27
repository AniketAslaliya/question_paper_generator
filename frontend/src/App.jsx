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
    
    // Show loading state while checking authentication
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
    
    // If we have a token but aren't authenticated and not loading, token is invalid
    if (token && !isAuthenticated) {
        console.log('⚠️ Token exists but user not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }
    
    // No token and not authenticated
    if (!token && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Authenticated - show content
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <div>Loading...</div>;
    return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
    const { loadUser, token, isLoading } = useAuthStore();

    useEffect(() => {
        // Always try to load user on mount if token exists
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            console.log('🔄 App mounted with token, loading user...');
            loadUser().catch(err => {
                console.error('Failed to load user on mount:', err);
            });
        } else {
            console.log('🔄 App mounted without token');
        }
    }, []); // Empty dependency array - only run on mount

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
