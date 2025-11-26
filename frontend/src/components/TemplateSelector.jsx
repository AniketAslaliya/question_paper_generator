import { FileText, Clock, Award, Edit } from 'lucide-react';
import { useState } from 'react';

const predefinedTemplates = [
    { id: 'midterm', name: 'Midterm Exam', icon: FileText, description: 'Standard midterm examination', marks: 100, duration: '3 hours' },
    { id: 'final', name: 'Final Exam', icon: Award, description: 'Comprehensive final examination', marks: 150, duration: '4 hours' },
    { id: 'quiz', name: 'Quick Quiz', icon: Clock, description: 'Short assessment quiz', marks: 50, duration: '1 hour' }
];

const TemplateSelector = ({ selectedTemplate, onSelect, onCustomTemplate }) => {
    const [showCustom, setShowCustom] = useState(false);
    const [customData, setCustomData] = useState({ name: '', marks: 100, duration: '3 hours' });

    const handleCustomSubmit = () => {
        if (customData.name.trim() && customData.marks > 0) {
            onCustomTemplate({ ...customData, id: 'custom' });
            setShowCustom(false);
            setCustomData({ name: '', marks: 100, duration: '3 hours' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {predefinedTemplates.map((template) => {
                    const isSelected = selectedTemplate === template.id;
                    const Icon = template.icon;

                    return (
                        <div
                            key={template.id}
                            onClick={() => onSelect(template.id)}
                            className={`
                                card cursor-pointer transition-all duration-300
                                ${isSelected
                                    ? 'border-black bg-blue-50 shadow-2xl ring-4 ring-blue-200'
                                    : 'border-gray-300 hover:border-black hover:shadow-xl'
                                }
                            `}
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className={`p-4 rounded-xl ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                                    <Icon className="w-10 h-10" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-black mb-1">{template.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                                    <div className="flex items-center justify-center gap-4 text-xs text-gray-700 font-semibold">
                                        <span className="flex items-center gap-1">
                                            <Award className="w-4 h-4" />
                                            {template.marks} marks
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {template.duration}
                                        </span>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="w-full pt-4 border-t-2 border-gray-200">
                                        <span className="text-sm font-bold text-blue-600">✓ Selected</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Template Option */}
            <div className="card border-2 border-dashed border-gray-400 hover:border-black transition-all">
                {!showCustom ? (
                    <button
                        onClick={() => setShowCustom(true)}
                        className="w-full p-6 flex flex-col items-center gap-3 text-gray-600 hover:text-black transition-all"
                    >
                        <Edit className="w-10 h-10" />
                        <span className="text-lg font-bold">Create Custom Template</span>
                        <span className="text-sm">Define your own exam parameters</span>
                    </button>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-black mb-4">Custom Template</h3>

                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Template Name</label>
                            <input
                                type="text"
                                value={customData.name}
                                onChange={(e) => setCustomData({ ...customData, name: e.target.value })}
                                placeholder="e.g., Unit Test, Practice Exam"
                                className="input-field"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Total Marks</label>
                                <input
                                    type="number"
                                    value={customData.marks}
                                    onChange={(e) => setCustomData({ ...customData, marks: parseInt(e.target.value) })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Duration</label>
                                <input
                                    type="text"
                                    value={customData.duration}
                                    onChange={(e) => setCustomData({ ...customData, duration: e.target.value })}
                                    placeholder="e.g., 2 hours"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={handleCustomSubmit} className="btn-primary flex-1">
                                Create Template
                            </button>
                            <button onClick={() => setShowCustom(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateSelector;
