import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { Users, FileText, Activity, BarChart2, Eye, X, Download, History, Tag, CheckCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [papers, setPapers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [importantQuestions, setImportantQuestions] = useState([]);
    const [importantQuestionsStats, setImportantQuestionsStats] = useState(null);
    const [versionHistory, setVersionHistory] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, usersRes, logsRes, papersRes, importantQuestionsRes] = await Promise.all([
                    api.get('/api/admin/stats', { headers }),
                    api.get('/api/admin/users?page=1&limit=20', { headers }),
                    api.get('/api/admin/logs?page=1&limit=50', { headers }),
                    api.get('/api/admin/papers?page=1&limit=20', { headers }),
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
    }, []);

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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                                <p className="text-sm font-medium text-slate-500">Generations</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalGenerations}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Activity className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Today</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.activeUsersToday}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <BarChart2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Recent Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Users List
                        </button>
                        <button
                            onClick={() => setActiveTab('papers')}
                            className={`${activeTab === 'papers' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Papers List
                        </button>
                        <button
                            onClick={() => setActiveTab('important-questions')}
                            className={`${activeTab === 'important-questions' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
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
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Versions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Topics</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Saved</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {papers.map((paper) => {
                                    // Calculate total questions and marks
                                    const totalQuestions = paper.sections?.reduce((sum, section) =>
                                        sum + (section.questions?.length || 0), 0) || 0;

                                    return (
                                        <tr key={paper._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{paper.paperName}</div>
                                                <div className="text-xs text-slate-500">{totalQuestions} questions</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{paper.subject || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{paper.userName}</div>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paper.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {paper.userRole || 'teacher'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <History className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-semibold text-slate-700">{paper.versionsCount || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative group">
                                                    <div className="flex items-center gap-1 cursor-pointer">
                                                        <Tag className="w-4 h-4 text-purple-500" />
                                                        <span className="text-sm font-semibold text-purple-700">{paper.importantTopicsCount || 0}</span>
                                                    </div>
                                                    {/* Tooltip showing topics */}
                                                    {paper.importantTopics && paper.importantTopics.length > 0 && (
                                                        <div className="absolute z-10 hidden group-hover:block left-0 top-full mt-1 w-64 p-3 bg-white border border-slate-200 rounded-lg shadow-lg">
                                                            <div className="text-xs font-semibold text-slate-500 mb-2">Important Topics:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {paper.importantTopics.slice(0, 5).map((t, idx) => (
                                                                    <span key={idx} className={`px-2 py-0.5 text-xs rounded-full ${
                                                                        t.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                                        t.priority === 'Low' ? 'bg-gray-100 text-gray-700' :
                                                                        'bg-purple-100 text-purple-700'
                                                                    }`}>
                                                                        {t.topic}
                                                                    </span>
                                                                ))}
                                                                {paper.importantTopics.length > 5 && (
                                                                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                                                                        +{paper.importantTopics.length - 5} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {paper.isAutoSaved ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Auto-saved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {paper.lastAutoSaveAt 
                                                    ? new Date(paper.lastAutoSaveAt).toLocaleString()
                                                    : new Date(paper.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPaper(paper)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => fetchVersionHistory(paper._id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                                    >
                                                        <History className="w-4 h-4" />
                                                        History
                                                    </button>
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/papers/${paper._id}/export/pdf`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        PDF
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            {selectedPaper.versionsCount || 0} version{selectedPaper.versionsCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            {selectedPaper.importantTopicsCount || 0} topic{selectedPaper.importantTopicsCount !== 1 ? 's' : ''}
                                        </span>
                                        {selectedPaper.isAutoSaved && (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                Auto-saved
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPaper(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                {/* Important Topics Section */}
                                {selectedPaper.importantTopics && selectedPaper.importantTopics.length > 0 && (
                                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                                            <Tag className="w-5 h-5" />
                                            Important Topics
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
