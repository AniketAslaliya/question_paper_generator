import { useState } from 'react';
import { Upload, FileCheck, Edit2, Save } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/axiosConfig';

const CIFUploadCard = ({ onCIFParsed, initialData }) => {
    const [cifData, setCifData] = useState(initialData || null);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedData, setEditedData] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('cif', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/papers/parse-cif`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                timeout: 60000 // 60 seconds timeout for AI parsing
            });

            if (res.data && res.data.topics && res.data.topics.length > 0) {
                setCifData(res.data);
                setEditedData(res.data);
                onCIFParsed(res.data);
            } else {
                alert('CIF parsed but no topics found. Please check the file format or try editing manually.');
                // Still set the data so user can edit
                setCifData(res.data);
                setEditedData(res.data);
                onCIFParsed(res.data);
            }
        } catch (err) {
            console.error('CIF parsing error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'CIF parsing failed';
            alert(`CIF parsing failed: ${errorMsg}. Please check the file format or try again.`);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveEdit = () => {
        setCifData(editedData);
        onCIFParsed(editedData);
        setEditing(false);
    };

    const updateWeightage = (index, value) => {
        if (!editedData || !editedData.topics || !editedData.topics[index]) {
            return;
        }
        const updated = { ...editedData };
        updated.topics = [...updated.topics];
        updated.topics[index] = { ...updated.topics[index], weightage: parseInt(value) || 0 };
        setEditedData(updated);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-slate-900">CIF Upload (Optional)</h3>
                </div>
                {cifData && !editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="btn-secondary text-sm flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" /> Edit
                    </button>
                )}
                {editing && (
                    <button
                        onClick={handleSaveEdit}
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>
                )}
            </div>

            <p className="text-sm text-slate-600 mb-4">
                Upload Course Information File (CIF) to automatically extract subject name, topics, and weightage.
            </p>

            {!cifData ? (
                <label className="cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary hover:bg-slate-50 transition-colors">
                    <Upload className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">Click to upload CIF file</span>
                    <span className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT format</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.txt"
                        disabled={uploading}
                    />
                </label>
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800">✓ CIF Parsed Successfully</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Subject Name</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editedData.subjectName}
                                    onChange={(e) => setEditedData({ ...editedData, subjectName: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                />
                            ) : (
                                <p className="mt-1 text-slate-900">{cifData.subjectName}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Total Topics</label>
                            <p className="mt-1 text-slate-900">{cifData.topics?.length || 0}</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Topics & Weightage</label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(editing ? editedData : cifData).topics?.map((topic, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <span className="flex-1 text-sm text-slate-700">{topic.name}</span>
                                    {editing ? (
                                        <input
                                            type="number"
                                            value={topic.weightage}
                                            onChange={(e) => updateWeightage(idx, e.target.value)}
                                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                            min="0"
                                            max="100"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-primary">{topic.weightage}%</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CIFUploadCard;
