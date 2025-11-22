import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { Plus, FileText, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [papers, setPapers] = useState([]);
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, thisWeek: 0 });

    useEffect(() => {
        fetchPapers();
    }, []);

    const fetchPapers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/papers/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPapers(res.data);

            // Calculate stats
            const now = new Date();
            const thisMonth = res.data.filter(p => {
                const created = new Date(p.createdAt);
                return created.getMonth() === now.getMonth();
            }).length;

            const thisWeek = res.data.filter(p => {
                const created = new Date(p.createdAt);
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return created >= weekAgo;
            }).length;

            setStats({ total: res.data.length, thisMonth, thisWeek });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black mb-3">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-gray-600 text-lg sm:text-xl font-medium">
                        Create and manage your question papers with AI assistance
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="card bg-white border-2 border-black">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-600 text-xs sm:text-sm font-semibold mb-1 truncate">Total Papers</p>
                                <p className="text-3xl sm:text-4xl font-bold text-black">{stats.total}</p>
                            </div>
                            <div className="bg-black text-white p-3 sm:p-4 rounded-xl flex-shrink-0">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white border-2 border-black">
                    </div>

                    {/* Papers List */}
                    <div className="card">
                        <h2 className="section-title">Your Question Papers</h2>

                        {papers.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-12 h-12 text-dark/30" />
                                </div>
                                <h3 className="text-xl font-bold text-dark mb-2">No papers yet</h3>
                                <p className="text-dark/70 mb-6">Create your first question paper to get started</p>
                                <button
                                    onClick={() => navigate('/create-paper')}
                                    className="btn-primary"
                                >

                                    export default Dashboard;
