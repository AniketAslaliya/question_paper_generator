import { useState } from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/axiosConfig';

const FileUploadCard = ({ onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('paperName', file.name.split('.')[0]); // Default paper name

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/papers/create-phase1`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            onUploadComplete(res.data);
        } catch (err) {
            setError('Upload failed. Please try again.');
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <UploadCloud className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Reference Material</h3>
                <p className="text-slate-500 mb-8">Upload your textbook, notes, or question bank (PDF, DOCX, TXT).</p>

                {!file ? (
                    <div className="flex justify-center">
                        <label className="cursor-pointer btn-secondary border-dashed border-2 w-full py-12 hover:bg-slate-50 transition-colors">
                            <span className="block text-sm font-medium text-slate-600">Click to browse or drag file here</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                        </label>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                                <File className="w-5 h-5 text-slate-400 mr-2" />
                                <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                            </div>
                            {!uploading && (
                                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        {uploading && (
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                {file && !uploading && (
                    <button onClick={handleUpload} className="w-full btn-primary">
                        Upload & Analyze
                    </button>
                )}

                {uploading && (
                    <p className="text-sm text-slate-500 mt-2">
                        {progress < 100 ? `Uploading... ${progress}%` : 'Analyzing content...'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FileUploadCard;
