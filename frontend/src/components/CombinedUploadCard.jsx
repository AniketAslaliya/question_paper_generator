import { useState } from 'react';
import { Upload, FileCheck, X, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/axiosConfig';

const CombinedUploadCard = ({ onUploadComplete, onCIFParsed }) => {
    const [files, setFiles] = useState([]);
    const [cifFile, setCifFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [cifData, setCifData] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles([...files, ...selectedFiles]);
    };

    const handleCIFSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCifFile(file);

        const formData = new FormData();
        formData.append('cif', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/papers/parse-cif`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setCifData(res.data);
            onCIFParsed(res.data);
        } catch (err) {
            console.error(err);
            alert('CIF parsing failed. Please check the file format.');
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const removeCIF = () => {
        setCifFile(null);
        setCifData(null);
        onCIFParsed(null);
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert('Please select at least one reference file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/papers/create-phase1-multi`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            onUploadComplete(res.data);
        } catch (err) {
            console.error(err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Reference Books Upload */}
            <div className="card">
                <h3 className="text-2xl font-bold text-dark mb-2">📚 Upload Reference Materials</h3>
                <p className="text-dark/70 mb-6">
                    Upload textbooks, PDFs, or documents to extract content for question generation.
                </p>

                <label className="cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed border-dark/30 rounded-xl hover:border-dark hover:bg-dark/5 transition-all">
                    <Upload className="w-16 h-16 text-dark/40 mb-4" />
                    <span className="text-lg font-bold text-dark mb-2">Click to upload reference files</span>
                    <span className="text-sm text-dark/60">PDF, DOCX, or TXT (up to 10 files)</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.docx,.txt"
                        multiple
                        disabled={uploading}
                    />
                </label>

                {files.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <p className="text-sm font-bold text-dark">{files.length} file(s) selected:</p>
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-dark/5 rounded-lg border-2 border-dark/10">
                                <span className="text-sm font-medium text-dark">{file.name}</span>
                                <button onClick={() => removeFile(idx)} className="text-dark/50 hover:text-dark">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CIF Upload (Optional) */}
            <div className="card">
                <div className="flex items-center gap-3 mb-2">
                    <FileCheck className="w-6 h-6 text-dark" />
                    <h3 className="text-2xl font-bold text-dark">Course Information File (Optional)</h3>
                </div>
                <p className="text-dark/70 mb-6">
                    Upload CIF to auto-extract subject name, topics, and weightage distribution.
                </p>

                {!cifFile ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center p-10 border-4 border-dashed border-dark/30 rounded-xl hover:border-dark hover:bg-dark/5 transition-all">
                        <FileCheck className="w-12 h-12 text-dark/40 mb-3" />
                        <span className="text-base font-bold text-dark mb-1">Click to upload CIF</span>
                        <span className="text-sm text-dark/60">PDF, DOCX, or TXT format</span>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleCIFSelect}
                            accept=".pdf,.docx,.txt"
                        />
                    </label>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-dark text-cream rounded-lg border-2 border-dark">
                            <span className="text-sm font-bold">✓ {cifFile.name}</span>
                            <button onClick={removeCIF} className="text-cream/70 hover:text-cream">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {cifData && (
                            <div className="p-6 bg-dark/5 rounded-lg border-2 border-dark/10 space-y-2">
                                <p className="text-sm font-bold text-dark"><strong>Subject:</strong> {cifData.subjectName}</p>
                                <p className="text-sm font-bold text-dark"><strong>Topics Found:</strong> {cifData.totalTopics}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="w-full btn-primary py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {uploading ? 'Processing Files...' : `Upload ${files.length} File(s) & Continue →`}
            </button>
        </div>
    );
};

export default CombinedUploadCard;
