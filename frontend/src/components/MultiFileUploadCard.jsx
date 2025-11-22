import { useState } from 'react';
import { UploadCloud, File, X, CheckCircle, Plus } from 'lucide-react';
import axios from 'axios';

const MultiFileUploadCard = ({ onUploadComplete }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles([...files, ...selectedFiles]);
        setError(null);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('files', file);
        });
        formData.append('paperName', files[0].name.split('.')[0]);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/papers/create-phase1-multi', formData, {
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
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <UploadCloud className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2 text-center">Upload Reference Materials</h3>
                <p className="text-slate-500 mb-8 text-center">Upload multiple books, PDFs, or documents (PDF, DOCX, TXT).</p>

                {files.length === 0 ? (
                    <div className="flex justify-center">
                        <label className="cursor-pointer btn-secondary border-dashed border-2 w-full py-12 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-center">
                                <Plus className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="block text-sm font-medium text-slate-600">Click to browse or drag files here</span>
                                <span className="block text-xs text-slate-400 mt-1">You can select multiple files</span>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" multiple />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {files.map((file, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <File className="w-5 h-5 text-slate-400 mr-3" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-slate-700 truncate block">{file.name}</span>
                                            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                                        </div>
                                    </div>
                                    {!uploading && (
                                        <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 ml-3">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {!uploading && (
                            <label className="cursor-pointer flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary hover:bg-slate-50 transition-colors">
                                <Plus className="w-5 h-5 text-slate-400" />
                                <span className="text-sm text-slate-600">Add more files</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" multiple />
                            </label>
                        )}
                    </div>
                )}

                {uploading && (
                    <div className="mb-6">
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 text-center">
                            {progress < 100 ? `Uploading... ${progress}%` : 'Processing and analyzing content...'}
                        </p>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                {files.length > 0 && !uploading && (
                    <button onClick={handleUpload} className="w-full btn-primary">
                        Upload & Analyze {files.length} File{files.length > 1 ? 's' : ''}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MultiFileUploadCard;
