import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

const ExerciseSelector = ({ exercises, onUpdate }) => {
    const [selected, setSelected] = useState([]);
    const [customExercise, setCustomExercise] = useState('');

    const toggleExercise = (exercise) => {
        let updated;
        if (selected.includes(exercise)) {
            updated = selected.filter(e => e !== exercise);
        } else {
            updated = [...selected, exercise];
        }
        setSelected(updated);
        onUpdate(updated);
    };

    const addCustom = () => {
        if (customExercise.trim()) {
            const updated = [...selected, customExercise.trim()];
            setSelected(updated);
            onUpdate(updated);
            setCustomExercise('');
        }
    };

    return (
        <div className="card">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-700">
                    <strong className="text-black">Note:</strong> Selected exercises will be verified against uploaded materials to ensure authenticity.
                </p>
            </div>

            {exercises.length > 0 ? (
                <div className="space-y-3 mb-6">
                    <h4 className="font-bold text-black mb-3">Auto-Detected Exercises:</h4>
                    {exercises.map((exercise, idx) => {
                        const isSelected = selected.includes(exercise);
                        return (
                            <button
                                key={idx}
                                onClick={() => toggleExercise(exercise)}
                                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${isSelected
                                    ? 'bg-green-50 text-black border-green-500 ring-2 ring-green-200'
                                    : 'bg-white text-black border-gray-300 hover:border-black'
                                    }`}
                            >
                                {isSelected ? (
                                    <CheckSquare className="w-5 h-5 flex-shrink-0 text-green-600" />
                                ) : (
                                    <Square className="w-5 h-5 flex-shrink-0 text-gray-400" />
                                )}
                                <span className="font-medium">{exercise}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>No exercises detected. Add custom exercises below.</p>
                </div>
            )}

            <div className="pt-6 border-t-2 border-gray-200">
                <h4 className="font-bold text-black mb-3">Add Custom Exercise:</h4>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={customExercise}
                        onChange={(e) => setCustomExercise(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustom()}
                        placeholder="e.g., Exercise 5.2, Problem 3.1"
                        className="input-field flex-1"
                    />
                    <button
                        onClick={addCustom}
                        disabled={!customExercise.trim()}
                        className="btn-primary px-6 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="font-bold mb-1 text-black">{selected.length} exercise(s) selected</p>
                    <p className="text-sm text-gray-600">These will be included in the generated paper</p>
                </div>
            )}
        </div>
    );
};

export default ExerciseSelector;
