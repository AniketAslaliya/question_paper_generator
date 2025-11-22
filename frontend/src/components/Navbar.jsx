import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, User } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b-4 border-black shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="bg-black text-white p-3 rounded-xl shadow-lg">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-black">Question Paper Generator</h1>
                            <p className="text-xs text-gray-600 font-semibold">AI-Powered Assessment Creation</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {user && (
                            <>
                                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-xl border-2 border-gray-300">
                                    <User className="w-5 h-5 text-gray-700" />
                                    <div>
                                        <p className="text-sm font-bold text-black">{user.name}</p>
                                        <p className="text-xs text-gray-600 capitalize">{user.role}</p>
                                    </div>
                                </div>

                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="px-5 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                                    >
                                        Admin Panel
                                    </button>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 transition-all font-semibold text-black"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
