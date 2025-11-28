import { useState } from 'react';
import { Upload, FileCheck, X, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/axiosConfig';

const CombinedUploadCard = ({ onUploadComplete, onCIFParsed, paperId }) => {
    const [files, setFiles] = useState([]);
    const [cifFile, setCifFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [cifData, setCifData] = useState(null);

    /**
     * Auto-save parsed CIF topics to the server as soon as parsing completes
     * This ensures that the Topic Review step can fetch and display topics immediately
     */
    const autoSaveCifTopics = async (topics, paperId) => {
        if (!paperId) {
            console.warn('[AUTO-SAVE] Skipping auto-save: no paperId provided');
            return;
        }
        
        if (!Array.isArray(topics)) {
            console.warn('[AUTO-SAVE] Skipping auto-save: topics is not an array', typeof topics);
            return;
        }
        
        if (topics.length === 0) {
            console.warn('[AUTO-SAVE] Skipping auto-save: no topics to save');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log(`\n[AUTO-SAVE] Starting auto-save of ${topics.length} CIF topics...`);
            console.log(`[AUTO-SAVE] Paper ID: ${paperId}`);
            console.log(`[AUTO-SAVE] Topics to save:`, topics.map(t => typeof t === 'string' ? t : t.name));
            
            const startTime = Date.now();
            const response = await axios.post(
                `${API_URL}/api/papers/${paperId}/confirm-cif-topics`,
                { confirmedTopics: topics },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const elapsedTime = Date.now() - startTime;
            console.log(`[AUTO-SAVE] SUCCESS! Topics saved in ${elapsedTime}ms`);
            console.log(`[AUTO-SAVE] Server response:`, {
                message: response.data.message,
                totalTopics: response.data.totalTopics,
                cifTopics: response.data.cifTopics?.length
            });
        } catch (err) {
            console.error(`\n[AUTO-SAVE] FAILED to auto-save CIF topics`);
            console.error(`[AUTO-SAVE] Error message:`, err.message);
            console.error(`[AUTO-SAVE] Error status:`, err.response?.status);
            console.error(`[AUTO-SAVE] Error data:`, err.response?.data);
            console.error(`[AUTO-SAVE] Full error:`, err);
            // Non-fatal error - topics are still in client state and will display
            console.log('[AUTO-SAVE] Topics are still available in browser state - they will display locally');
        }
    };

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
            console.log('\n[CIF-PARSE] Starting CIF file upload:', {
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(2)} KB`,
                fileType: file.type
            });
            
            const parseStartTime = Date.now();
            const res = await axios.post(`${API_URL}/api/papers/parse-cif`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                timeout: 120000 // 120 second timeout (increased to handle Gemini API + parsing which can take 30-40s)
            });

            const parseElapsedTime = Date.now() - parseStartTime;
            console.log(`[CIF-PARSE] Parsing completed in ${parseElapsedTime}ms`);
            console.log('[CIF-PARSE] Response summary:', {
                status: res.data.status,
                totalTopics: res.data.totalTopics,
                pdfType: res.data.pdfType,
                extractedTextLength: res.data.extractedTextLength,
                processingTimeMs: res.data.processingTimeMs,
                requestId: res.data.requestId
            });
            
            if (res.data.topics && res.data.topics.length > 0) {
                console.log('[CIF-PARSE] Topics extracted:', res.data.topics.slice(0, 5).map(t => t.name || t));
                if (res.data.topics.length > 5) {
                    console.log(`   ... and ${res.data.topics.length - 5} more topics`);
                }
            }
            
            // Handle response
            if (res.data.status === 'error' || res.data.totalTopics === 0) {
                console.warn('\n[CIF-PARSE] No topics found in CIF');
                console.warn('[CIF-PARSE] Reason:', res.data.message);
                console.warn('[CIF-PARSE] PDF Type:', res.data.pdfType);
                setCifData({
                    ...res.data,
                    totalTopics: 0,
                    topics: [],
                    message: res.data.message || 'No topics extracted from PDF'
                });
            } else {
                console.log(`\n[CIF-PARSE] SUCCESS! ${res.data.totalTopics} topics extracted`);
                setCifData(res.data);
                
                // Auto-save topics to server if paperId is available
                if (paperId && res.data.topics && res.data.topics.length > 0) {
                    console.log(`\n[CIF-PARSE] Triggering auto-save to server...`);
                    autoSaveCifTopics(res.data.topics, paperId);
                } else if (!paperId) {
                    console.warn('[CIF-PARSE] paperId not available - auto-save skipped. Topics exist only in browser state.');
                }
            }
            
            onCIFParsed(res.data);
        } catch (err) {
            console.error('\n[CIF-PARSE] CIF parsing failed');
            console.error('[CIF-PARSE] Error message:', err.message);
            console.error('[CIF-PARSE] Error code:', err.code);
            console.error('[CIF-PARSE] Error response:', err.response?.data);
            
            // Check if it's a timeout
            if (err.code === 'ECONNABORTED') {
                console.error('[CIF-PARSE] Request timed out after 120 seconds');
                alert('CIF parsing timed out (took longer than 2 minutes). The file may be very large or the server is slow. Please try again or try a smaller file.');
            } else if (err.response?.status === 400) {
                console.error('[CIF-PARSE] Bad request (400):', err.response.data?.message);
                alert(`CIF parsing failed: ${err.response.data?.message || 'Invalid file format'}`);
            } else if (err.response?.status === 500) {
                console.error('[CIF-PARSE] Server error (500):', err.response.data?.message);
                alert(`Server error: ${err.response.data?.message || 'Please try again'}`);
            } else {
                console.error('[CIF-PARSE] Unknown error');
                alert('CIF parsing failed. Please check the file and try again.');
            }
            
            setCifFile(null);
            setCifData(null);
            onCIFParsed(null);
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
                            <div className={`p-6 rounded-lg border-2 space-y-2 ${
                                cifData.status === 'error' || cifData.totalTopics === 0 
                                    ? 'bg-yellow-50 border-yellow-200' 
                                    : 'bg-dark/5 border-dark/10'
                            }`}>
                                <p className="text-sm font-bold text-dark">
                                    <strong>Subject:</strong> {cifData.subjectName}
                                </p>
                                <p className="text-sm font-bold text-dark">
                                    <strong>Topics Found:</strong> {cifData.totalTopics || 0}
                                </p>
                                {cifData.pdfType && (
                                    <p className="text-xs text-dark/60">
                                        <strong>PDF Type:</strong> {cifData.pdfType === 'image-based' ? '🖼️ Image-based (Scanned)' : '📄 Text-based'}
                                    </p>
                                )}
                                {cifData.processingTimeMs && (
                                    <p className="text-xs text-dark/60">
                                        <strong>Processing Time:</strong> {cifData.processingTimeMs}ms
                                    </p>
                                )}
                                {cifData.message && cifData.totalTopics === 0 && (
                                    <p className="text-xs text-yellow-700 mt-2 font-semibold">
                                        💡 {cifData.message}
                                    </p>
                                )}
                                {cifData.additionalInfo && (
                                    <p className="text-xs text-dark/70 mt-2">
                                        <strong>Note:</strong> {cifData.additionalInfo}
                                    </p>
                                )}
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
