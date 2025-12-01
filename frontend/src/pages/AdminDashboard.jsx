import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { Users, FileText, Activity, BarChart2, Eye, X, Download, History, Tag, CheckCircle, Clock, BookOpen, Settings, List, AlertCircle, RefreshCw, Filter, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [papers, setPapers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [paperFullDetails, setPaperFullDetails] = useState(null);
    const [importantQuestions, setImportantQuestions] = useState([]);
    const [importantQuestionsStats, setImportantQuestionsStats] = useState(null);
    const [versionHistory, setVersionHistory] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [paperFilter, setPaperFilter] = useState('all');
    const [expandedPaperId, setExpandedPaperId] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, usersRes, logsRes, papersRes, importantQuestionsRes] = await Promise.all([
                    api.get('/api/admin/stats', { headers }),
                    api.get('/api/admin/users?page=1&limit=20', { headers }),
                    api.get('/api/admin/logs?page=1&limit=50', { headers }),
                    api.get(`/api/admin/papers?page=1&limit=50&filter=${paperFilter}`, { headers }),
                    api.get('/api/admin/important-questions?page=1&limit=50', { headers }).catch(() => ({ data: { questions: [], stats: null } }))
                ]);

                setStats(statsRes.data);
                setUsers(usersRes.data.users || usersRes.data);
                setLogs(logsRes.data.logs || logsRes.data);
                setPapers(papersRes.data.papers || papersRes.data);
                setImportantQuestions(importantQuestionsRes.data.questions || []);
                setImportantQuestionsStats(importantQuestionsRes.data.stats || null);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [paperFilter]);

    // Fetch full paper details
    const fetchPaperFullDetails = async (paperId) => {
        try {
            setLoadingDetails(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await api.get(`/api/admin/papers/${paperId}/full-details`, { headers });
            setPaperFullDetails(res.data);
        } catch (err) {
            console.error('Error fetching paper details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Fetch version history for a paper
    const fetchVersionHistory = async (paperId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await api.get(`/api/admin/papers/${paperId}/versions`, { headers });
            setVersionHistory({ paperId, ...res.data });
        } catch (err) {
            console.error('Error fetching version history:', err);
        }
    };

    // Fetch specific version content
    const fetchVersionContent = async (paperId, versionId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await api.get(`/api/admin/papers/${paperId}/versions/${versionId}`, { headers });
            setSelectedVersion(res.data);
        } catch (err) {
            console.error('Error fetching version content:', err);
        }
    };

    if (!stats) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

                {/* Stats Cards - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Users</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Papers</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalPapers}</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Generated Papers</p>
                                <p className="text-2xl font-bold text-green-600">{stats.generatedPapers || 0}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Today</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.activeUsersToday}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Activity className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-green-700">Auto-Saved</p>
                                <p className="text-xl font-bold text-green-800">{stats.autoSavedPapers || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <History className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-purple-700">Total Versions</p>
                                <p className="text-xl font-bold text-purple-800">{stats.totalVersions || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Tag className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-blue-700">With CIF Topics</p>
                                <p className="text-xl font-bold text-blue-800">{stats.papersWithCifTopics || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <BookOpen className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-orange-700">With Imp. Topics</p>
                                <p className="text-xl font-bold text-orange-800">{stats.papersWithImportantTopics || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-red-700">Pending/Failed</p>
                                <p className="text-xl font-bold text-red-800">{(stats.pendingPapers || 0) + (stats.failedPapers || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <Activity className="w-4 h-4" />
                            Recent Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <Users className="w-4 h-4" />
                            Users List
                        </button>
                        <button
                            onClick={() => setActiveTab('papers')}
                            className={`${activeTab === 'papers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <FileText className="w-4 h-4" />
                            All Papers
                        </button>
                        <button
                            onClick={() => setActiveTab('important-questions')}
                            className={`${activeTab === 'important-questions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Important Questions
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                    {activeTab === 'overview' ? (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {logs.map((log) => (
                                    <tr key={log._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.userName || 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.actionType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : activeTab === 'users' ? (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : activeTab === 'papers' ? (
                        <div>
                            {/* Filter Bar */}
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Filter:</span>
                                </div>
                                {[
                                    { value: 'all', label: 'All Papers', icon: FileText },
                                    { value: 'generated', label: 'Generated', icon: CheckCircle },
                                    { value: 'pending', label: 'Pending', icon: Clock },
                                    { value: 'auto-saved', label: 'Auto-Saved', icon: RefreshCw },
                                    { value: 'with-versions', label: 'Multi-Version', icon: History }
                                ].map(filter => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setPaperFilter(filter.value)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            paperFilter === filter.value
                                                ? 'bg-primary text-white'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <filter.icon className="w-4 h-4" />
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Papers Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Versions</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Topics</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Saved</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {papers.map((paper) => {
                                            const totalQuestions = paper.sections?.reduce((sum, section) =>
                                                sum + (section.questions?.length || 0), 0) || 0;
                                            const isExpanded = expandedPaperId === paper._id;
                                            const genStatus = paper.generationStatus?.status || 'pending';

                                            return (
                                                <>
                                                    <tr key={paper._id} className={`${isExpanded ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`}>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-slate-900">{paper.paperName}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                                <span>{totalQuestions} questions</span>
                                                                {paper.cifTopicsCount > 0 && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                                        {paper.cifTopicsCount} CIF topics
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{paper.subject || 'N/A'}</td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-slate-900">{paper.userName}</div>
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paper.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {paper.userRole || 'teacher'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-1">
                                                                <History className="w-4 h-4 text-purple-500" />
                                                                <span className="text-sm font-semibold text-purple-700">{paper.versionsCount || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col gap-1">
                                                                {paper.cifTopicsCount > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-700">
                                                                        <Tag className="w-3 h-3" /> {paper.cifTopicsCount} CIF
                                                                    </span>
                                                                )}
                                                                {paper.importantTopicsWithNotesCount > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-orange-700">
                                                                        <MessageSquare className="w-3 h-3" /> {paper.importantTopicsWithNotesCount} with notes
                                                                    </span>
                                                                )}
                                                                {paper.importantQuestionsCount > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                                                        <BookOpen className="w-3 h-3" /> {paper.importantQuestionsCount} questions
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            {genStatus === 'completed' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Generated
                                                                </span>
                                                            ) : genStatus === 'generating' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                                    Generating
                                                                </span>
                                                            ) : genStatus === 'failed' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Failed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                                    <Clock className="w-3 h-3" />
                                                                    {paper.isAutoSaved ? 'Saved' : 'Draft'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {paper.lastAutoSaveAt 
                                                                ? new Date(paper.lastAutoSaveAt).toLocaleString()
                                                                : new Date(paper.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setExpandedPaperId(isExpanded ? null : paper._id);
                                                                        if (!isExpanded) fetchPaperFullDetails(paper._id);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                                                    title="Expand Details"
                                                                >
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPaper(paper);
                                                                        fetchPaperFullDetails(paper._id);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                                    title="View Paper"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => fetchVersionHistory(paper._id)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
                                                                    title="Version History"
                                                                >
                                                                    <History className="w-4 h-4" />
                                                                </button>
                                                                <a
                                                                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/papers/${paper._id}/export/pdf`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                                                    title="Download PDF"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Expanded Details Row */}
                                                    {isExpanded && (
                                                        <tr key={`${paper._id}-expanded`}>
                                                            <td colSpan="8" className="px-4 py-4 bg-slate-50 border-t border-slate-200">
                                                                {loadingDetails ? (
                                                                    <div className="flex items-center justify-center py-8">
                                                                        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                                                        <span className="ml-2 text-slate-600">Loading details...</span>
                                                                    </div>
                                                                ) : paperFullDetails && paperFullDetails._id === paper._id ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        {/* CIF Topics */}
                                                                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                                                                            <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                                                                <Tag className="w-4 h-4" />
                                                                                CIF Topics ({paperFullDetails.cifTopics?.length || 0})
                                                                            </h4>
                                                                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                                                                {paperFullDetails.cifTopics?.length > 0 ? (
                                                                                    paperFullDetails.cifTopics.map((t, idx) => (
                                                                                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                                            {t.name}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-500 italic">No CIF topics</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Important Topics with Notes */}
                                                                        <div className="bg-white p-4 rounded-lg border border-orange-200">
                                                                            <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                                                                <MessageSquare className="w-4 h-4" />
                                                                                Important Topics ({paperFullDetails.importantTopicsWithNotes?.length || 0})
                                                                            </h4>
                                                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                                {paperFullDetails.importantTopicsWithNotes?.length > 0 ? (
                                                                                    paperFullDetails.importantTopicsWithNotes.map((t, idx) => (
                                                                                        <div key={idx} className="text-xs">
                                                                                            <span className={`px-2 py-0.5 rounded-full ${
                                                                                                t.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                                                                t.priority === 'Low' ? 'bg-gray-100 text-gray-700' :
                                                                                                'bg-orange-100 text-orange-700'
                                                                                            }`}>
                                                                                                {t.topic}
                                                                                            </span>
                                                                                            {t.notes && (
                                                                                                <p className="text-slate-500 italic mt-1 ml-2">📝 {t.notes}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-500 italic">No important topics</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Important Questions */}
                                                                        <div className="bg-white p-4 rounded-lg border border-green-200">
                                                                            <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                                                                <BookOpen className="w-4 h-4" />
                                                                                Important Questions ({paperFullDetails.importantQuestions?.length || 0})
                                                                            </h4>
                                                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                                {paperFullDetails.importantQuestions?.length > 0 ? (
                                                                                    paperFullDetails.importantQuestions.slice(0, 5).map((q, idx) => (
                                                                                        <div key={idx} className="text-xs p-2 bg-green-50 rounded">
                                                                                            <span className={`px-1.5 py-0.5 rounded text-xs mr-1 ${
                                                                                                q.questionType === 'Reference' ? 'bg-purple-100 text-purple-700' :
                                                                                                q.questionType === 'Numerical' ? 'bg-blue-100 text-blue-700' :
                                                                                                'bg-green-100 text-green-700'
                                                                                            }`}>
                                                                                                {q.questionType}
                                                                                            </span>
                                                                                            <span className="text-slate-700">{q.question?.substring(0, 80)}...</span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-500 italic">No important questions</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Config Summary */}
                                                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                                            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                                                <Settings className="w-4 h-4" />
                                                                                Configuration
                                                                            </h4>
                                                                            {paperFullDetails.config ? (
                                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                    <div><span className="text-slate-500">Template:</span> {paperFullDetails.config.templateName || 'N/A'}</div>
                                                                                    <div><span className="text-slate-500">Total Marks:</span> {paperFullDetails.config.marks || 'N/A'}</div>
                                                                                    <div><span className="text-slate-500">Duration:</span> {paperFullDetails.config.duration || 'N/A'}</div>
                                                                                    <div><span className="text-slate-500">Sections:</span> {paperFullDetails.config.sections?.length || 0}</div>
                                                                                    <div><span className="text-slate-500">Answer Key:</span> {paperFullDetails.config.generateAnswerKey ? 'Yes' : 'No'}</div>
                                                                                    <div><span className="text-slate-500">Q. Types:</span> {paperFullDetails.config.questionTypes?.join(', ') || 'N/A'}</div>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-xs text-slate-500 italic">No config</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Versions Summary */}
                                                                        <div className="bg-white p-4 rounded-lg border border-purple-200">
                                                                            <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                                                                                <History className="w-4 h-4" />
                                                                                Versions ({paperFullDetails.totalVersions || 0})
                                                                            </h4>
                                                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                                                {paperFullDetails.versions?.length > 0 ? (
                                                                                    paperFullDetails.versions.map((v, idx) => (
                                                                                        <div key={idx} className={`text-xs p-2 rounded flex justify-between items-center ${
                                                                                            v.isCurrent ? 'bg-purple-100' : 'bg-slate-50'
                                                                                        }`}>
                                                                                            <span>
                                                                                                v{v.versionNumber} - {v.changeReason || 'generation'}
                                                                                                {v.isCurrent && <span className="ml-1 text-purple-700 font-semibold">(Current)</span>}
                                                                                            </span>
                                                                                            <span className="text-slate-500">{v.questionsCount} Q</span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-500 italic">No versions</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Extracted Data */}
                                                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                                            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                                                <List className="w-4 h-4" />
                                                                                Source Data
                                                                            </h4>
                                                                            <div className="text-xs space-y-1">
                                                                                <div><span className="text-slate-500">Chapters:</span> {paperFullDetails.extractedData?.chaptersCount || 0}</div>
                                                                                <div><span className="text-slate-500">Files:</span> {paperFullDetails.extractedData?.uploadedFiles?.length || 0}</div>
                                                                                <div><span className="text-slate-500">Exercises:</span> {paperFullDetails.extractedData?.detectedExercises?.length || 0}</div>
                                                                                <div><span className="text-slate-500">CIF Parsed:</span> {paperFullDetails.extractedData?.hasCifParsed ? 'Yes' : 'No'}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center text-slate-500 py-4">No details available</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'important-questions' ? (
                        <div className="p-6">
                            {importantQuestionsStats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600 font-medium">Total Questions</div>
                                        <div className="text-2xl font-bold text-blue-900">{importantQuestionsStats.totalQuestions}</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <div className="text-sm text-purple-600 font-medium">Reference</div>
                                        <div className="text-2xl font-bold text-purple-900">{importantQuestionsStats.byType?.Reference || 0}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600 font-medium">Important</div>
                                        <div className="text-2xl font-bold text-green-900">{importantQuestionsStats.byType?.Important || 0}</div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="text-sm text-orange-600 font-medium">Numerical</div>
                                        <div className="text-2xl font-bold text-orange-900">{importantQuestionsStats.byType?.Numerical || 0}</div>
                                    </div>
                                </div>
                            )}
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Question</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Added By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {importantQuestions.length > 0 ? (
                                        importantQuestions.map((q) => (
                                            <tr key={q._id}>
                                                <td className="px-6 py-4 text-sm text-slate-900 max-w-md">
                                                    <div className="font-medium">{q.question}</div>
                                                    {q.notes && (
                                                        <div className="text-xs text-slate-500 mt-1 italic">{q.notes}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        q.questionType === 'Reference' ? 'bg-purple-100 text-purple-800' :
                                                        q.questionType === 'Important' ? 'bg-green-100 text-green-800' :
                                                        q.questionType === 'Numerical' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {q.questionType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    <div className="font-medium">{q.paper?.name || 'N/A'}</div>
                                                    <div className="text-xs text-slate-400">{q.paper?.subject || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    <div>{q.addedBy?.name || q.paper?.createdBy?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-400">{q.addedBy?.email || q.paper?.createdBy?.email || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(q.addedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                                <p>No important questions added yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-500">
                            <p>Unknown tab selected</p>
                        </div>
                    )}
                </div>

                {/* Paper View Modal */}
                {selectedPaper && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedPaper.paperName}</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {selectedPaper.subject} • Created by {selectedPaper.userName} • {new Date(selectedPaper.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            {selectedPaper.versionsCount || 0} version{selectedPaper.versionsCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            {selectedPaper.importantTopicsCount || 0} topic{selectedPaper.importantTopicsCount !== 1 ? 's' : ''}
                                        </span>
                                        {selectedPaper.cifTopicsCount > 0 && (
                                            <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full">
                                                {selectedPaper.cifTopicsCount} CIF topics
                                            </span>
                                        )}
                                        {selectedPaper.importantQuestionsCount > 0 && (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                {selectedPaper.importantQuestionsCount} imp. questions
                                            </span>
                                        )}
                                        {selectedPaper.isAutoSaved && (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                Auto-saved
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedPaper(null); setPaperFullDetails(null); }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                {/* Tabs for different views */}
                                <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                        Questions
                                    </button>
                                </div>

                                {/* CIF Topics Section */}
                                {paperFullDetails?.cifTopics && paperFullDetails.cifTopics.length > 0 && (
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                                            <Tag className="w-5 h-5" />
                                            CIF Topics ({paperFullDetails.cifTopics.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {paperFullDetails.cifTopics.map((topic, idx) => (
                                                <span key={idx} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                                    {topic.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Important Topics with Notes Section */}
                                {paperFullDetails?.importantTopicsWithNotes && paperFullDetails.importantTopicsWithNotes.length > 0 && (
                                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5" />
                                            Important Topics with Notes ({paperFullDetails.importantTopicsWithNotes.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {paperFullDetails.importantTopicsWithNotes.map((topic, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-orange-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            topic.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                            topic.priority === 'Low' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            {topic.priority}
                                                        </span>
                                                        <span className="font-medium text-slate-900">{topic.topic}</span>
                                                    </div>
                                                    {topic.notes && (
                                                        <p className="text-sm text-slate-600 mt-2 italic">📝 {topic.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Important Questions Section */}
                                {paperFullDetails?.importantQuestions && paperFullDetails.importantQuestions.length > 0 && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Important Questions ({paperFullDetails.importantQuestions.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {paperFullDetails.importantQuestions.map((q, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-green-100">
                                                    <div className="flex items-start gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                                            q.questionType === 'Reference' ? 'bg-purple-100 text-purple-700' :
                                                            q.questionType === 'Numerical' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            {q.questionType}
                                                        </span>
                                                        <span className="text-sm text-slate-900">{q.question}</span>
                                                    </div>
                                                    {q.notes && (
                                                        <p className="text-xs text-slate-500 mt-1 ml-16 italic">{q.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Legacy Important Topics Section */}
                                {selectedPaper.importantTopics && selectedPaper.importantTopics.length > 0 && (
                                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                                            <Tag className="w-5 h-5" />
                                            Important Topics (Legacy)
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPaper.importantTopics.map((topic, idx) => (
                                                <span 
                                                    key={idx}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        topic.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                        topic.priority === 'Low' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-purple-100 text-purple-700'
                                                    }`}
                                                >
                                                    {topic.topic}
                                                    {topic.priority === 'High' && ' ⭐'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Configuration Section */}
                                {paperFullDetails?.config && (
                                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Settings className="w-5 h-5" />
                                            Paper Configuration
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div><span className="text-slate-500">Template:</span> <span className="font-medium">{paperFullDetails.config.templateName || 'N/A'}</span></div>
                                            <div><span className="text-slate-500">Total Marks:</span> <span className="font-medium">{paperFullDetails.config.marks || 'N/A'}</span></div>
                                            <div><span className="text-slate-500">Duration:</span> <span className="font-medium">{paperFullDetails.config.duration || 'N/A'}</span></div>
                                            <div><span className="text-slate-500">Answer Key:</span> <span className="font-medium">{paperFullDetails.config.generateAnswerKey ? 'Yes' : 'No'}</span></div>
                                        </div>
                                        {paperFullDetails.config.sections && paperFullDetails.config.sections.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Sections Configuration:</h4>
                                                <div className="space-y-2">
                                                    {paperFullDetails.config.sections.map((s, idx) => (
                                                        <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs flex gap-4">
                                                            <span><strong>{s.name}</strong></span>
                                                            <span>Marks: {s.marks}</span>
                                                            <span>Questions: {s.questionCount}</span>
                                                            <span>Type: {s.questionType}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Generated Questions Section */}
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Generated Questions</h3>
                                {selectedPaper.sections && selectedPaper.sections.length > 0 ? (
                                    <div className="space-y-6">
                                        {selectedPaper.sections.map((section, sectionIdx) => (
                                            <div key={sectionIdx} className="border border-slate-200 rounded-lg p-4">
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">
                                                    Section {sectionIdx + 1}: {section.sectionName || `Section ${sectionIdx + 1}`}
                                                </h3>

                                                {section.questions && section.questions.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {section.questions.map((q, qIdx) => (
                                                            <div key={qIdx} className="bg-slate-50 p-4 rounded-lg">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="font-semibold text-slate-700 min-w-[2rem]">Q{qIdx + 1}.</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-slate-900 mb-2">{q.question || q.text || 'No question text'}</p>
                                                                        <div className="flex gap-4 text-sm text-slate-500">
                                                                            {q.marks && <span>Marks: {q.marks}</span>}
                                                                            {q.difficulty && <span>Difficulty: {q.difficulty}</span>}
                                                                            {q.bloomLevel && <span>Bloom's: {q.bloomLevel}</span>}
                                                                        </div>
                                                                        {q.options && q.options.length > 0 && (
                                                                            <div className="mt-2 space-y-1">
                                                                                {q.options.map((opt, optIdx) => (
                                                                                    <div key={optIdx} className="text-sm text-slate-600">
                                                                                        {String.fromCharCode(97 + optIdx)}) {opt}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {q.answer && (
                                                                            <div className="mt-2 text-sm">
                                                                                <span className="font-semibold text-green-700">Answer: </span>
                                                                                <span className="text-slate-700">{q.answer}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 italic">No questions in this section</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">No questions available for this paper</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Version History Modal */}
                {versionHistory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Version History</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {versionHistory.paperName} • {versionHistory.totalVersions} version{versionHistory.totalVersions !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setVersionHistory(null); setSelectedVersion(null); }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                {versionHistory.versions && versionHistory.versions.length > 0 ? (
                                    <div className="space-y-4">
                                        {versionHistory.versions.map((version, idx) => (
                                            <div
                                                key={version._id}
                                                className={`border rounded-lg p-4 ${version.isCurrent ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900">
                                                                Version {version.versionNumber}
                                                            </span>
                                                            {version.isCurrent && (
                                                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-1">
                                                            {version.changeReason === 'generation' ? '🆕 Initial Generation' :
                                                             version.changeReason === 'regeneration' ? '🔄 Regenerated' :
                                                             version.changeReason === 'edit' ? '✏️ Edited' : version.changeReason}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Created: {new Date(version.createdAt).toLocaleString()}
                                                            {version.modifiedBy && ` • By: ${version.modifiedBy.name || version.modifiedBy.email}`}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => fetchVersionContent(versionHistory.paperId, version._id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">No versions found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Version Content Modal */}
                {selectedVersion && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {selectedVersion.paperName} - Version {selectedVersion.version?.versionNumber}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {selectedVersion.version?.changeReason || 'generation'} • {new Date(selectedVersion.version?.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedVersion(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                {selectedVersion.version?.generatedContentJSON?.sections ? (
                                    <div className="space-y-6">
                                        {selectedVersion.version.generatedContentJSON.sections.map((section, sectionIdx) => (
                                            <div key={sectionIdx} className="border border-slate-200 rounded-lg p-4">
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">
                                                    Section {sectionIdx + 1}: {section.sectionName || `Section ${sectionIdx + 1}`}
                                                </h3>
                                                {section.questions && section.questions.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {section.questions.map((q, qIdx) => (
                                                            <div key={qIdx} className="bg-slate-50 p-4 rounded-lg">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="font-semibold text-slate-700 min-w-[2rem]">Q{qIdx + 1}.</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-slate-900 mb-2">{q.question || q.text || 'No question text'}</p>
                                                                        <div className="flex gap-4 text-sm text-slate-500">
                                                                            {q.marks && <span>Marks: {q.marks}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-500 italic">No questions in this section</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : selectedVersion.version?.generatedContentHTML ? (
                                    <div 
                                        className="prose max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: selectedVersion.version.generatedContentHTML }}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">No content available for this version</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
