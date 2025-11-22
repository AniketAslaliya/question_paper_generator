import { useState } from 'react';

const questionTypes = [
    { id: 'numerical', name: 'Numerical', icon: '🔢' },
    { id: 'theoretical', name: 'Theoretical', icon: '📖' },
    { id: 'conceptual', name: 'Conceptual', icon: '💡' },
    { id: 'mcq', name: 'MCQ', icon: '✓' },
    { id: 'truefalse', name: 'True/False', icon: '⚖️' },
    { id: 'fillblanks', name: 'Fill Blanks', icon: '📝' },
    { id: 'shortanswer', name: 'Short Answer', icon: '✍️' },
    { id: 'longanswer', name: 'Long Answer', icon: '📄' },
    { id: 'casestudy', name: 'Case Study', icon: '📊' },
    { id: 'algorithmic', name: 'Algorithmic', icon: '⚙️' }
];

const QuestionTypeSelector = ({ selectedTypes, onUpdate }) => {
    const toggleType = (typeId) => {
        if (selectedTypes.includes(typeId)) {
            onUpdate(selectedTypes.filter(t => t !== typeId));
        } else {
            onUpdate([...selectedTypes, typeId]);
        }
    };

    return (
        <div className="card">
            <div className="grid grid-cols-2 gap-3">
                {questionTypes.map((type) => {
                    const isSelected = selectedTypes.includes(type.id);
                    return (
                        <button
                            key={type.id}
                            onClick={() => toggleType(type.id)}
                            className={`p-4 rounded-lg border-2 font-semibold transition-all ${isSelected
                                ? 'bg-blue-50 text-black border-blue-500 shadow-lg ring-2 ring-blue-200'
                                : 'bg-white text-black border-gray-300 hover:border-black'
                                }`}
                        >
                            <span className="text-2xl mb-2 block">{type.icon}</span>
                            <span className="text-sm">{type.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 text-sm text-gray-600 text-center font-semibold">
                {selectedTypes.length} type(s) selected
            </div>
        </div>
    );
};

export default QuestionTypeSelector;
