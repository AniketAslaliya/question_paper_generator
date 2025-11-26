import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const QUESTION_TYPES = [
    'Multiple Choice',
    'True/False',
    'Fill in the Blanks',
    'Short Answer',
    'Long Answer',
    'Problem Solving',
    'Conceptual',
    'Theoretical'
];

const SectionConfigCard = ({ sections, onUpdate }) => {
    const addSection = () => {
        const newSection = {
            name: `Section ${String.fromCharCode(65 + sections.length)}`,
            marks: 20,
            questionCount: 4,
            questionType: 'Theoretical' // Default type
        };
        onUpdate([...sections, newSection]);
    };

    const removeSection = (index) => {
        if (sections.length > 1) {
            onUpdate(sections.filter((_, i) => i !== index));
        }
    };

    const updateSection = (index, field, value) => {
        const updated = sections.map((section, i) =>
            i === index ? { ...section, [field]: value } : section
        );
        onUpdate(updated);
    };

    const totalMarks = sections.reduce((sum, s) => sum + (parseInt(s.marks) || 0), 0);

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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className={`text-lg font-bold ${totalMarks === 100 ? 'text-dark' : 'text-red-600'}`}>
                    Total: {totalMarks} / 100 marks
                </div>
            </div>
        </div>
    );
};

export default SectionConfigCard;
