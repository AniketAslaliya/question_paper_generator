import { useState } from 'react';

const bloomsLevels = [
    { id: 'remember', name: 'Remember', description: 'Recall facts and basic concepts', icon: '🧠', color: '#3b82f6' },
    { id: 'understand', name: 'Understand', description: 'Explain ideas or concepts', icon: '💭', color: '#10b981' },
    { id: 'apply', name: 'Apply', description: 'Use information in new situations', icon: '🔧', color: '#f59e0b' },
    { id: 'analyze', name: 'Analyze', description: 'Draw connections among ideas', icon: '🔍', color: '#f97316' },
    { id: 'evaluate', name: 'Evaluate', description: 'Justify a decision or course of action', icon: '⚖️', color: '#ef4444' },
    { id: 'create', name: 'Create', description: 'Produce new or original work', icon: '✨', color: '#a855f7' }
];

const BloomsTaxonomySelector = ({ distribution, onUpdate }) => {
    const handleChange = (level, value) => {
        onUpdate({ ...distribution, [level]: parseInt(value) || 0 });
    };

    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    return (
        <div className="card">
            <div className="space-y-6">
                {bloomsLevels.map((level) => (
                    <div key={level.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{level.icon}</span>
                                <div>
                                    <h4 className="font-bold text-black">{level.name}</h4>
                                    <p className="text-xs text-gray-600">{level.description}</p>
                                </div>
                            </div>
                            <span className="text-lg font-bold text-black">{distribution[level.id]}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={distribution[level.id]}
                            onChange={(e) => handleChange(level.id, e.target.value)}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, ${level.color} 0%, ${level.color} ${distribution[level.id]}%, #e5e7eb ${distribution[level.id]}%, #e5e7eb 100%)`
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className={`mt-6 p-4 rounded-lg border-2 text-center font-bold text-lg ${total === 100 ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-600 border-red-300'
                }`}>
                Total: {total}% {total === 100 ? '✓' : '(Must equal 100%)'}
            </div>
        </div>
    );
};

export default BloomsTaxonomySelector;
