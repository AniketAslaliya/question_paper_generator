import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react';

const QUESTION_TYPES = [
    'Mixed',
    'Multiple Choice',
    'True/False',
    'Fill in the Blanks',
    'Short Answer',
    'Long Answer',
    'Problem Solving',
    'Conceptual',
    'Theoretical',
    'Numerical'
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

const DIFFICULTY_COLORS = {
    'Easy': 'bg-green-100 border-green-400 text-green-700',
    'Medium': 'bg-yellow-100 border-yellow-400 text-yellow-700',
    'Hard': 'bg-red-100 border-red-400 text-red-700'
};

const SectionConfigCard = ({ sections, onUpdate, totalMarks = 100 }) => {
    const [expandedSections, setExpandedSections] = useState({});

    // Check if individual question difficulties are out of sync with section difficulty
    const isDifficultiesOutOfSync = (section) => {
        const sectionDiff = section.sectionDifficulty || 'Medium';
        const questionDiffs = section.questionDifficulties || [];
        return questionDiffs.some(d => d !== sectionDiff);
    };

    // Count how many questions differ from section difficulty
    const getOutOfSyncCount = (section) => {
        const sectionDiff = section.sectionDifficulty || 'Medium';
        const questionDiffs = section.questionDifficulties || [];
        return questionDiffs.filter(d => d !== sectionDiff).length;
    };

    // Sync all question difficulties to section difficulty
    const syncDifficultiesToSection = (index) => {
        const updated = sections.map((section, i) => {
            if (i !== index) return section;
            const sectionDiff = section.sectionDifficulty || 'Medium';
            return {
                ...section,
                questionDifficulties: Array(section.questionCount || 1).fill(sectionDiff)
            };
        });
        onUpdate(updated);
    };

    const addSection = () => {
        const questionCount = 4;
        const newSection = {
            name: `Section ${String.fromCharCode(65 + sections.length)}`,
            marks: 20,
            questionCount: questionCount,
            questionType: 'Theoretical',
            sectionDifficulty: 'Medium', // Section-level difficulty
            questionDifficulties: Array(questionCount).fill('Medium') // Per-question difficulty
        };
        onUpdate([...sections, newSection]);
    };

    const removeSection = (index) => {
        if (sections.length > 1) {
            onUpdate(sections.filter((_, i) => i !== index));
            // Remove from expanded state
            const newExpanded = { ...expandedSections };
            delete newExpanded[index];
            setExpandedSections(newExpanded);
        }
    };

    const updateSection = (index, field, value) => {
        const updated = sections.map((section, i) => {
            if (i !== index) return section;
            
            let updatedSection = { ...section, [field]: value };
            
            // If question count changes, adjust the questionDifficulties array
            if (field === 'questionCount') {
                const newCount = parseInt(value) || 1;
                const currentDifficulties = section.questionDifficulties || [];
                const sectionDiff = section.sectionDifficulty || 'Medium';
                
                if (newCount > currentDifficulties.length) {
                    // Add new entries with section default difficulty
                    updatedSection.questionDifficulties = [
                        ...currentDifficulties,
                        ...Array(newCount - currentDifficulties.length).fill(sectionDiff)
                    ];
                } else {
                    // Truncate array
                    updatedSection.questionDifficulties = currentDifficulties.slice(0, newCount);
                }
            }
            
            // If section difficulty changes, optionally update all question difficulties
            if (field === 'sectionDifficulty') {
                // Update all questions to match section difficulty
                updatedSection.questionDifficulties = Array(section.questionCount || 1).fill(value);
            }
            
            return updatedSection;
        });
        onUpdate(updated);
    };

    const updateQuestionDifficulty = (sectionIndex, questionIndex, difficulty) => {
        const updated = sections.map((section, i) => {
            if (i !== sectionIndex) return section;
            
            const newDifficulties = [...(section.questionDifficulties || [])];
            newDifficulties[questionIndex] = difficulty;
            
            return { ...section, questionDifficulties: newDifficulties };
        });
        onUpdate(updated);
    };

    const toggleSectionExpanded = (index) => {
        setExpandedSections(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Initialize questionDifficulties for existing sections that don't have it
    useEffect(() => {
        const needsInit = sections.some(s => !s.questionDifficulties || !s.sectionDifficulty);
        if (needsInit) {
            const updated = sections.map(section => ({
                ...section,
                sectionDifficulty: section.sectionDifficulty || 'Medium',
                questionDifficulties: section.questionDifficulties || Array(section.questionCount || 1).fill('Medium')
            }));
            onUpdate(updated);
        }
    }, []);

    const calculatedTotalMarks = sections.reduce((sum, s) => sum + (parseInt(s.marks) || 0), 0);

    return (
        <div className="card">
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <div key={index} className="p-6 bg-dark/5 rounded-lg border-2 border-dark/10">
                        <div className="flex items-center justify-between mb-4">
                            <input
                                type="text"
                                value={section.name}
                                onChange={(e) => updateSection(index, 'name', e.target.value)}
                                className="text-lg font-bold bg-transparent border-b-2 border-dark/30 focus:border-dark outline-none px-2 py-1"
                            />
                            {sections.length > 1 && (
                                <button
                                    onClick={() => removeSection(index)}
                                    className="text-dark/50 hover:text-dark p-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Marks</label>
                                <input
                                    type="number"
                                    value={section.marks}
                                    onChange={(e) => updateSection(index, 'marks', parseInt(e.target.value) || 0)}
                                    className="input-field"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Questions</label>
                                <input
                                    type="number"
                                    value={section.questionCount}
                                    onChange={(e) => updateSection(index, 'questionCount', parseInt(e.target.value) || 1)}
                                    className="input-field"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Question Type</label>
                                <select
                                    value={section.questionType || 'Theoretical'}
                                    onChange={(e) => updateSection(index, 'questionType', e.target.value)}
                                    className="input-field"
                                >
                                    {QUESTION_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Section Difficulty</label>
                                <select
                                    value={section.sectionDifficulty || 'Medium'}
                                    onChange={(e) => updateSection(index, 'sectionDifficulty', e.target.value)}
                                    className={`input-field font-semibold ${DIFFICULTY_COLORS[section.sectionDifficulty || 'Medium']}`}
                                >
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Out of sync warning */}
                        {isDifficultiesOutOfSync(section) && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm text-amber-700">
                                        {getOutOfSyncCount(section)} question(s) have different difficulty than section ({section.sectionDifficulty || 'Medium'})
                                    </span>
                                </div>
                                <button
                                    onClick={() => syncDifficultiesToSection(index)}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-semibold"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Sync All to {section.sectionDifficulty || 'Medium'}
                                </button>
                            </div>
                        )}

                        {/* Per-Question Difficulty Section */}
                        <div className="mt-4">
                            <button
                                onClick={() => toggleSectionExpanded(index)}
                                className="flex items-center gap-2 text-sm font-bold text-dark/70 hover:text-dark transition-colors"
                            >
                                {expandedSections[index] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Individual Question Difficulty ({section.questionCount} questions)
                                {isDifficultiesOutOfSync(section) && (
                                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                        {getOutOfSyncCount(section)} custom
                                    </span>
                                )}
                            </button>
                            
                            {expandedSections[index] && (
                                <div className="mt-3 p-4 bg-white rounded-lg border border-dark/20">
                                    <p className="text-xs text-gray-500 mb-3">
                                        Set difficulty for each question in this section. Changing section difficulty will reset all to that level.
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {Array.from({ length: section.questionCount || 0 }, (_, qIndex) => (
                                            <div key={qIndex} className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-dark mb-1">Q{qIndex + 1}</span>
                                                <select
                                                    value={(section.questionDifficulties || [])[qIndex] || 'Medium'}
                                                    onChange={(e) => updateQuestionDifficulty(index, qIndex, e.target.value)}
                                                    className={`w-full text-xs py-1 px-2 rounded border-2 font-semibold cursor-pointer ${DIFFICULTY_COLORS[(section.questionDifficulties || [])[qIndex] || 'Medium']}`}
                                                >
                                                    {DIFFICULTY_LEVELS.map(level => (
                                                        <option key={level} value={level}>{level}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Quick actions */}
                                    <div className="mt-3 pt-3 border-t border-dark/10 flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500 mr-2">Quick set all:</span>
                                        {DIFFICULTY_LEVELS.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => updateSection(index, 'sectionDifficulty', level)}
                                                className={`text-xs px-2 py-1 rounded border ${DIFFICULTY_COLORS[level]} hover:opacity-80 transition-opacity`}
                                            >
                                                All {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={addSection}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Section
                </button>

                <div className={`text-lg font-bold ${calculatedTotalMarks === totalMarks ? 'text-dark' : 'text-red-600'}`}>
                    Total: {calculatedTotalMarks} / {totalMarks} marks
                </div>
            </div>
        </div>
    );
};

export default SectionConfigCard;
