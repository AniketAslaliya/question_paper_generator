import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import StepIndicator from '../components/StepIndicator';
import CombinedUploadCard from '../components/CombinedUploadCard';
import TemplateSelector from '../components/TemplateSelector';
import SectionConfigCard from '../components/SectionConfigCard';
import BloomsTaxonomySelector from '../components/BloomsTaxonomySelector';
import ExerciseSelector from '../components/ExerciseSelector';
import ReferenceQuestionsCard from '../components/ReferenceQuestionsCard';
import ImportantTopicsCard from '../components/ImportantTopicsCard';
import ImportantQuestionsCard from '../components/ImportantQuestionsCard';
import ConfigPreview from '../components/ConfigPreview';
import RichEditor from '../components/RichEditor';
import { ArrowRight, ArrowLeft, Save, RefreshCw, Download, Eye, CheckCircle, Clock } from 'lucide-react';

const CreatePaperPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [paperId, setPaperId] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [detectedExercises, setDetectedExercises] = useState([]);
    const [cifData, setCifData] = useState(null);
    const [draftSaved, setDraftSaved] = useState(false);
    const [showDraftPrompt, setShowDraftPrompt] = useState(false);

    const [config, setConfig] = useState({
        templateName: 'midterm',
        marks: 100,
        duration: '3 hours',
        difficulty: { easy: 30, medium: 50, hard: 20 },
        weightage: {},
        mandatoryExercises: [],
        referenceQuestions: [],
        importantTopics: '',
        generateAnswerKey: false,
        sections: [
            { name: 'Section A', marks: 40, questionCount: 5, questionType: 'Multiple Choice' },
            { name: 'Section B', marks: 60, questionCount: 4, questionType: 'Long Answer' }
        ],
        bloomsTaxonomy: {
            remember: 20,
            understand: 25,
            apply: 25,
            analyze: 15,
            evaluate: 10,
            create: 5
        }
    });

    const [generatedContent, setGeneratedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [generationStatus, setGenerationStatus] = useState({ status: 'pending', progress: 0 });
    const [importantQuestions, setImportantQuestions] = useState([]);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const handleUploadComplete = (data) => {
        setPaperId(data.paperId);
        setChapters(data.chapters);
        setDetectedExercises(data.exercises || []);
        setStep(2);
    };

    const handleCIFParsed = (data) => {
        setCifData(data);
    };

    // Poll generation status
    useEffect(() => {
        let intervalId = null;
        if (generationStatus.status === 'generating' && paperId) {
            intervalId = setInterval(async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/api/papers/${paperId}/generation-status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const status = res.data.generationStatus;
                    setGenerationStatus(status);
                    
                    if (status.status === 'completed' || status.status === 'failed') {
                        clearInterval(intervalId);
                        if (status.status === 'completed') {
                            // Fetch the generated paper
                            const paperRes = await axios.get(`${API_URL}/api/papers/${paperId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const paper = paperRes.data;
                            if (paper.versions && paper.versions.length > 0) {
                                const latestVersion = paper.versions[paper.versions.length - 1];
                                setGeneratedContent(latestVersion.generatedContentHTML || '');
                                setStep(4);
                            }
                        } else if (status.status === 'failed') {
                            // Show error message
                            const errorMsg = status.error || 'Paper generation failed. Please try again.';
                            console.error('Generation failed:', errorMsg);
                            alert(`Generation failed: ${errorMsg}`);
                        }
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('Error polling status:', err);
                }
            }, 2000); // Poll every 2 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [generationStatus.status, paperId]);

    // Load important questions when paperId is available
    useEffect(() => {
        if (paperId && step >= 3) {
            loadImportantQuestions();
        }
    }, [paperId, step]);

    const loadImportantQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/papers/${paperId}/important-questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setImportantQuestions(res.data.importantQuestions || []);
        } catch (err) {
            console.error('Error loading important questions:', err);
        }
    };

    const handleSuggestQuestions = async () => {
        if (!paperId) {
            alert('Please upload files first');
            return;
        }
        setLoadingSuggestions(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/papers/${paperId}/suggest-questions`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestedQuestions(res.data.suggestions || []);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Error getting suggestions:', err);
            alert('Failed to generate suggestions. Please try again.');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleAddImportantQuestion = async (question, questionType = 'Important', notes = '') => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/papers/${paperId}/important-questions`, {
                question,
                questionType,
                notes
            }, { headers: { Authorization: `Bearer ${token}` } });
            await loadImportantQuestions();
            alert('Question added successfully!');
        } catch (err) {
            console.error('Error adding question:', err);
            alert('Failed to add question. Please try again.');
        }
    };

    const handleAddSuggestedQuestion = (suggestion) => {
        handleAddImportantQuestion(
            suggestion.question,
            suggestion.questionType || 'Important',
            `Topic: ${suggestion.topic || 'General'}, Difficulty: ${suggestion.difficulty || 'Medium'}, Bloom: ${suggestion.bloomLevel || 'Understand'}. ${suggestion.reason || ''}`
        );
    };

    const handleDeleteImportantQuestion = async (questionId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/papers/${paperId}/important-questions/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await loadImportantQuestions();
        } catch (err) {
            console.error('Error deleting question:', err);
            alert('Failed to delete question. Please try again.');
        }
    };

    const handleGenerate = async () => {
        // Validate sections before generating
        if (!config.sections || config.sections.length === 0) {
            alert('Please configure at least one section before generating the paper.');
            return;
        }

        // Validate each section has required fields
        const invalidSections = config.sections.filter(s => !s.name || !s.marks || !s.questionCount);
        if (invalidSections.length > 0) {
            alert('Please ensure all sections have a name, marks, and question count configured.');
            return;
        }

        setLoading(true);
        setGenerationStatus({ status: 'generating', progress: 0 });
        try {
            const token = localStorage.getItem('token');

            if (step === 3) {
                // Ensure sections are included in config
                const configToSave = {
                    ...config,
                    sections: config.sections || [],
                    cifData,
                    marks: config.marks || 100,
                    duration: config.duration || '3 Hours'
                };
                console.log('💾 Saving config with sections:', configToSave.sections?.length || 0, 'sections');
                console.log('📋 Sections details:', configToSave.sections);
                console.log('📋 Total marks:', configToSave.marks);
                await axios.post(`${API_URL}/api/papers/create-phase2`, {
                    paperId,
                    config: configToSave
                }, { headers: { Authorization: `Bearer ${token}` } });

                // Start generation (will be polled for status)
                await axios.post(`${API_URL}/api/papers/create-phase3`, {
                    paperId
                }, { headers: { Authorization: `Bearer ${token}` } });

                // Status will be updated via polling
            } else if (step === 4) {
                const res = await axios.post(`${API_URL}/api/papers/${paperId}/regenerate`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGeneratedContent(res.data.generatedData.html || '<h1>Generated Paper</h1><p>Content here...</p>');
                setGenerationStatus({ status: 'completed', progress: 100 });
            }
        } catch (err) {
            console.error(err);
            setGenerationStatus({ status: 'failed', progress: 0, error: err.message });
            alert('Generation failed. Please try again.');
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSave = () => {
        navigate('/dashboard');
    };

    const handleCustomTemplate = (templateData) => {
        try {
            if (!templateData || !templateData.marks) {
                console.error('Invalid template data:', templateData);
                return;
            }

            const totalMarks = parseInt(templateData.marks) || 100;
            // Reset sections to match new marks - distribute evenly
            const sectionCount = 2;
            const marksPerSection = Math.floor(totalMarks / sectionCount);
            const sections = [
                { name: 'Section A', marks: marksPerSection, questionCount: 5, questionType: 'Theoretical' },
                { name: 'Section B', marks: totalMarks - marksPerSection, questionCount: 4, questionType: 'Long Answer' }
            ];
            
            setConfig(prevConfig => ({
                ...prevConfig,
                templateName: 'custom',
                marks: totalMarks,
                customTemplateName: templateData.name || 'Custom Template',
                duration: templateData.duration || '3 hours',
                sections: sections
            }));
        } catch (error) {
            console.error('Error in handleCustomTemplate:', error);
            alert('Error creating custom template. Please try again.');
        }
    };

    // Load draft on mount
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/drafts/latest`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.draft) {
                    setShowDraftPrompt(true);
                }
            } catch (err) {
                console.log('No draft found or error loading draft');
            }
        };

        loadDraft();
    }, []);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (step === 1 || step === 4) return; // Don't save on upload or generation steps

        const saveDraft = async () => {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/api/drafts/save`, {
                    paperId,
                    config,
                    chapters,
                    cifData,
                    currentStep: step
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setDraftSaved(true);
                setTimeout(() => setDraftSaved(false), 2000);
            } catch (err) {
                console.error('Auto-save failed:', err);
            }
        };

        const interval = setInterval(saveDraft, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [step, config, chapters, cifData, paperId]);

    const loadDraftData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/drafts/latest`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const draft = res.data.draft;
            if (draft) {
                setPaperId(draft.paperId);
                setConfig(draft.config);
                setChapters(draft.chapters || []);
                setCifData(draft.cifData);
                setStep(draft.currentStep || 1);
                setShowDraftPrompt(false);
            }
        } catch (err) {
            console.error('Failed to load draft:', err);
        }
    };

    const deleteDraft = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/drafts/clear/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowDraftPrompt(false);
        } catch (err) {
            console.error('Failed to delete draft:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12">
                    <StepIndicator currentStep={step} />
                </div>

                {/* Draft Saved Indicator */}
                {draftSaved && (
                    <div className="fixed top-24 right-8 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-50">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Draft saved</span>
                    </div>
                )}

                {/* Draft Resume Prompt */}
                {showDraftPrompt && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-black">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-8 h-8 text-blue-600" />
                                <h3 className="text-2xl font-black text-black">Resume Draft?</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                We found an incomplete paper configuration. Would you like to continue where you left off?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={loadDraftData}
                                    className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                                >
                                    Resume Draft
                                </button>
                                <button
                                    onClick={deleteDraft}
                                    className="flex-1 bg-gray-100 text-black py-3 rounded-xl font-bold border-2 border-gray-300 hover:bg-gray-200 transition-all"
                                >
                                    Start Fresh
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: Upload Materials */}
                {step === 1 && (
                    <div>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-black mb-2">Upload Your Materials</h2>
                            <p className="text-gray-600">Upload reference books and course information to get started</p>
                        </div>
                        <CombinedUploadCard
                            onUploadComplete={handleUploadComplete}
                            onCIFParsed={handleCIFParsed}
                        />
                    </div>
                )}

                {/* STEP 2: Select Template */}
                {step === 2 && (
                    <div>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-black mb-2">Select Your Template</h2>
                            <p className="text-gray-600">Choose a predefined template or create your own</p>
                        </div>
                        <TemplateSelector
                            selectedTemplate={config.templateName}
                            onSelect={(id) => {
                                const templates = {
                                    'midterm': { marks: 100, duration: '3 hours' },
                                    'final': { marks: 150, duration: '4 hours' },
                                    'quiz': { marks: 50, duration: '1 hour' }
                                };
                                const template = templates[id];
                                if (template) {
                                    setConfig({
                                        ...config,
                                        templateName: id,
                                        marks: template.marks,
                                        duration: template.duration
                                    });
                                } else {
                                    setConfig({ ...config, templateName: id });
                                }
                            }}
                            onCustomTemplate={handleCustomTemplate}
                        />
                        <div className="flex justify-between mt-8">
                            <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
                                <ArrowLeft className="w-5 h-5" />
                                Back to Upload
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="btn-primary flex items-center gap-2"
                                disabled={!config.templateName}
                            >
                                Continue to Configuration
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Configure Paper */}
                {step === 3 && (
                    <div className="space-y-8">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-black mb-2">Configure Your Paper</h2>
                            <p className="text-gray-600">Customize every aspect of your question paper</p>
                        </div>

                        <section>
                            <h3 className="section-title">1. Configure Sections</h3>
                            <SectionConfigCard
                                sections={config.sections}
                                onUpdate={(sections) => setConfig({ ...config, sections })}
                                totalMarks={config.marks || 100}
                            />
                        </section>

                        <section>
                            <h3 className="section-title">3. Difficulty Distribution</h3>
                            <div className="card space-y-6">
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-black mb-2">
                                        Easy <span className="text-lg">{config.difficulty.easy}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        value={config.difficulty.easy}
                                        onChange={(e) => setConfig({ ...config, difficulty: { ...config.difficulty, easy: parseInt(e.target.value) } })}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #000 0%, #000 ${config.difficulty.easy}%, #e5e7eb ${config.difficulty.easy}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-black mb-2">
                                        Medium <span className="text-lg">{config.difficulty.medium}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        value={config.difficulty.medium}
                                        onChange={(e) => setConfig({ ...config, difficulty: { ...config.difficulty, medium: parseInt(e.target.value) } })}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #000 0%, #000 ${config.difficulty.medium}%, #e5e7eb ${config.difficulty.medium}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-black mb-2">
                                        Hard <span className="text-lg">{config.difficulty.hard}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        value={config.difficulty.hard}
                                        onChange={(e) => setConfig({ ...config, difficulty: { ...config.difficulty, hard: parseInt(e.target.value) } })}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #000 0%, #000 ${config.difficulty.hard}%, #e5e7eb ${config.difficulty.hard}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="section-title">5. Important Questions</h3>
                            <ImportantQuestionsCard
                                importantQuestions={importantQuestions}
                                onAdd={handleAddImportantQuestion}
                                onDelete={handleDeleteImportantQuestion}
                                onSuggest={handleSuggestQuestions}
                                onAddSuggested={handleAddSuggestedQuestion}
                                suggestedQuestions={suggestedQuestions}
                                showSuggestions={showSuggestions}
                                loadingSuggestions={loadingSuggestions}
                            />
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <section>
                                <h3 className="section-title">6. Important Topics (Compulsory)</h3>
                                <ImportantTopicsCard
                                    topics={config.importantTopics}
                                    onUpdate={(topics) => setConfig({ ...config, importantTopics: topics })}
                                />
                            </section>

                            <section>
                                <h3 className="section-title">7. Reference Questions</h3>
                                <ReferenceQuestionsCard
                                    references={config.referenceQuestions}
                                    onUpdate={(refs) => setConfig({ ...config, referenceQuestions: refs })}
                                />
                            </section>

                            <section>
                                <h3 className="section-title">8. Mandatory Exercises</h3>
                                <ExerciseSelector
                                    exercises={detectedExercises}
                                    onUpdate={(exercises) => setConfig({ ...config, mandatoryExercises: exercises })}
                                />
                            </section>

                            <section>
                                <h3 className="section-title">8. Bloom's Taxonomy Levels</h3>
                                <BloomsTaxonomySelector
                                    distribution={config.bloomsTaxonomy}
                                    onUpdate={(dist) => setConfig({ ...config, bloomsTaxonomy: dist })}
                                />
                            </section>
                        </div>

                        <section>
                            <h3 className="section-title">9. Answer Key</h3>
                            <div className="card">
                                <label className="flex items-center gap-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.generateAnswerKey}
                                        onChange={(e) => setConfig({ ...config, generateAnswerKey: e.target.checked })}
                                        className="h-6 w-6 text-black focus:ring-dark border-black/30 rounded"
                                    />
                                    <div className="flex-1">
                                        <span className="text-lg font-bold text-black">Generate Answer Key</span>
                                        <p className="text-sm text-black/70 mt-1">
                                            Include detailed answers and solutions for each question in the generated paper.
                                        </p>
                                    </div>
                                    {config.generateAnswerKey && (
                                        <CheckCircle className="w-8 h-8 text-black" />
                                    )}
                                </label>
                            </div>
                        </section>

                        <div className="flex justify-between items-center pt-8 border-t-4 border-black">
                            <button
                                onClick={handleBack}
                                className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Template
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="btn-primary flex items-center gap-2 text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Generating...' : 'Generate Paper'}
                                    {!loading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: Generate & Preview */}
                {step === 4 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-black mb-2">Paper Preview & Edit</h2>
                                <p className="text-gray-600">Edit the content below and export in your preferred format</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Edit Settings
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="btn-secondary flex items-center gap-2"
                                    disabled={loading}
                                    title="Generate a new version with different questions"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    {loading ? 'Regenerating...' : 'Regenerate'}
                                </button>
                                <div className="relative group">
                                    <button className="btn-secondary flex items-center gap-2">
                                        <Download className="w-5 h-5" /> Export
                                    </button>
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-black opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const response = await fetch(`${API_URL}/api/papers/${paperId}/export/pdf`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${paperId}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } catch (err) {
                                                    alert('Failed to download PDF');
                                                }
                                            }}
                                            className="block w-full px-6 py-3 text-sm font-semibold text-black hover:bg-dark hover:text-cream rounded-t-xl transition-all text-left"
                                        >
                                            📄 Export as PDF
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const response = await fetch(`${API_URL}/api/papers/${paperId}/export/docx`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${paperId}.docx`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } catch (err) {
                                                    alert('Failed to download DOCX');
                                                }
                                            }}
                                            className="block w-full px-6 py-3 text-sm font-semibold text-black hover:bg-dark hover:text-cream transition-all text-left"
                                        >
                                            📝 Export as DOCX
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const response = await fetch(`${API_URL}/api/papers/${paperId}/export/html`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${paperId}.html`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } catch (err) {
                                                    alert('Failed to download HTML');
                                                }
                                            }}
                                            className="block w-full px-6 py-3 text-sm font-semibold text-black hover:bg-dark hover:text-cream rounded-b-xl transition-all text-left"
                                        >
                                            🌐 Export as HTML
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                    <Save className="w-5 h-5" /> Save & Exit
                                </button>
                            </div>
                        </div>

                        <div className="card bg-white text-black border-2 border-black">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">ℹ️</div>
                                <div className="flex-1">
                                    <p className="text-lg font-bold mb-2">Smart Regeneration & Version Control</p>
                                    <p className="text-cream/80">
                                        Each regeneration creates unique questions and is saved as a new version.
                                        Click "Edit Settings" to modify configuration before regenerating.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <RichEditor
                                value={generatedContent}
                                onChange={setGeneratedContent}
                                onSave={async (content) => {
                                    try {
                                        const token = localStorage.getItem('token');
                                        await axios.put(`${API_URL}/api/papers/${paperId}/update-content`, {
                                            content: content
                                        }, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        alert('Paper updated successfully!');
                                    } catch (err) {
                                        console.error('Failed to save:', err);
                                        alert('Failed to save changes. Please try again.');
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatePaperPage;
