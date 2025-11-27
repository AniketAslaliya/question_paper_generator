import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_URL } from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

const PaperViewPage = () => {
    const { id } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('questionPaper'); // 'questionPaper' or 'answerKey'

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get(`/api/papers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPaper(res.data);
            } catch (err) {
                console.error('Error fetching paper:', err);
                console.error('Error details:', err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchPaper();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading paper...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!paper) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800">Paper not found or you don't have access to it.</p>
                        <Link to="/dashboard" className="mt-4 inline-block btn-primary">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    const latestVersion = paper.versions && paper.versions.length > 0 
        ? paper.versions[paper.versions.length - 1] 
        : null;
    
    if (!latestVersion) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <p className="text-yellow-800">No generated content found for this paper. Please generate the paper first.</p>
                        <Link to="/dashboard" className="mt-4 inline-block btn-primary">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleDownload = (type) => {
        const token = localStorage.getItem('token');
        const url = type === 'answerKey'
            ? `${API_URL}/api/papers/${id}/export/answer-key`
            : `${API_URL}/api/papers/${id}/export/pdf`;

        // Trigger download
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{paper.paperName}</h1>
                            <p className="text-sm text-slate-500">Subject: {paper.subject || 'General'}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
                            <Printer className="w-4 h-4" /> Print
                        </button>

                        {activeTab === 'questionPaper' ? (
                            <button
                                onClick={() => handleDownload('questionPaper')}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download Paper
                            </button>
                        ) : (
                            <button
                                onClick={() => handleDownload('answerKey')}
                                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 border-green-600"
                            >
                                <Download className="w-4 h-4" /> Download Key
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'questionPaper'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('questionPaper')}
                    >
                        Question Paper
                    </button>
                    {latestVersion?.generatedAnswerKeyHTML && (
                        <button
                            className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'answerKey'
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('answerKey')}
                        >
                            Answer Key
                        </button>
                    )}
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden min-h-[800px] p-8">
                    <ReactQuill
                        value={
                            activeTab === 'questionPaper'
                                ? (latestVersion?.generatedContentHTML || '')
                                : (latestVersion?.generatedAnswerKeyHTML || '')
                        }
                        readOnly={true}
                        theme="bubble"
                    />
                </div>
            </div>
        </div>
    );
};

export default PaperViewPage;
