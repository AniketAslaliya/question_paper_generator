import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { Users, FileText, Activity, BarChart2, Eye, X, Download } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [papers, setPapers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPaper, setSelectedPaper] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [statsRes, usersRes, logsRes, papersRes] = await Promise.all([
                    api.get('/api/admin/stats', { headers }),
                    api.get('/api/admin/users', { headers }),
                    api.get('/api/admin/logs', { headers }),
                    api.get('/api/admin/papers', { headers })
                ]);

                setStats(statsRes.data);
                setUsers(usersRes.data);
                setLogs(logsRes.data);
                setPapers(papersRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

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
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Questions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Marks</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {papers.map((paper) => {
                                    // Calculate total questions and marks
                                    const totalQuestions = paper.sections?.reduce((sum, section) =>
                                        sum + (section.questions?.length || 0), 0) || 0;
                                    const totalMarks = paper.sections?.reduce((sum, section) =>
                                        sum + (section.questions?.reduce((qSum, q) => qSum + (parseInt(q.marks) || 0), 0) || 0), 0) || 0;

                                    return (
                                        <tr key={paper._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{paper.paperName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{paper.subject || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{paper.userName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paper.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {paper.userRole || 'teacher'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{totalQuestions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{totalMarks}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(paper.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPaper(paper)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
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
                                </div>
                                <button
                                    onClick={() => setSelectedPaper(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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
            </div>
        </div>
    );
};

export default AdminDashboard;
