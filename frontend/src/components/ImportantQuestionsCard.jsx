import { useState } from 'react';
import { Plus, X, Lightbulb, Trash2, CheckCircle } from 'lucide-react';

const ImportantQuestionsCard = ({ 
    importantQuestions = [], 
    onAdd, 
    onDelete,
    onSuggest,
    suggestedQuestions = [],
    showSuggestions = false,
    loadingSuggestions = false
}) => {
    const [newQuestion, setNewQuestion] = useState('');
    const [questionType, setQuestionType] = useState('Important');
    const [notes, setNotes] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newQuestion.trim()) {
            onAdd(newQuestion.trim(), questionType, notes.trim());
            setNewQuestion('');
            setNotes('');
            setQuestionType('Important');
            setShowAddForm(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-xl font-bold text-black">Important Questions</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onSuggest}
                        disabled={loadingSuggestions}
                        className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50"
                    >
                        <Lightbulb className="w-4 h-4" />
                        {loadingSuggestions ? 'Generating...' : 'Get Suggestions'}
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Question
                    </button>
                </div>
            </div>

            {/* Suggested Questions */}
            {showSuggestions && suggestedQuestions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-blue-900">AI Suggested Questions</h4>
                        <button
                            onClick={() => setShowSuggestions(false)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {suggestedQuestions.map((suggestion, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            {suggestion.question}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                {suggestion.questionType || 'Theoretical'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                                {suggestion.difficulty || 'Medium'}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                {suggestion.bloomLevel || 'Understand'}
                                            </span>
                                            {suggestion.topic && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                                    {suggestion.topic}
                                                </span>
                                            )}
                                        </div>
                                        {suggestion.reason && (
                                            <p className="text-xs text-gray-500 mt-1 italic">
                                                {suggestion.reason}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onSuggest && onSuggest(suggestion)}
                                        className="flex-shrink-0 p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        title="Add this question"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Question Form */}
            {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Question</label>
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Enter the important question..."
                                className="input-field w-full min-h-[100px]"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Type</label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="Important">Important</option>
                                    <option value="Reference">Reference</option>
                                    <option value="Numerical">Numerical</option>
                                    <option value="Specific">Specific</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes about this question..."
                                className="input-field w-full min-h-[60px]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Question
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewQuestion('');
                                    setNotes('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* List of Added Questions */}
            <div className="space-y-3">
                {importantQuestions.length > 0 ? (
                    importantQuestions.map((iq) => (
                        <div key={iq._id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                        {iq.question}
                                    </p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                            iq.questionType === 'Reference' ? 'bg-purple-100 text-purple-700' :
                                            iq.questionType === 'Important' ? 'bg-green-100 text-green-700' :
                                            iq.questionType === 'Numerical' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {iq.questionType}
                                        </span>
                                        {iq.notes && (
                                            <span className="text-xs text-gray-500 italic">
                                                {iq.notes}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            Added {new Date(iq.addedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDelete && onDelete(iq._id)}
                                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete question"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No important questions added yet</p>
                        <p className="text-sm mt-1">Click "Get Suggestions" to see AI-recommended questions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportantQuestionsCard;

