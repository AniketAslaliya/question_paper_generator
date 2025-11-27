import { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const ImportantTopicsWithNotesCard = ({ topics = [], onAdd, onDelete, onUpdate } = {}) => {
    const [expandedId, setExpandedId] = useState(null);
    const [newTopic, setNewTopic] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newPriority, setNewPriority] = useState('Medium');
    const [showForm, setShowForm] = useState(false);

    const handleAddTopic = () => {
        if (!newTopic.trim()) {
            alert('Please enter a topic name');
            return;
        }

        onAdd({
            topic: newTopic.trim(),
            notes: newNotes.trim(),
            priority: newPriority
        });

        setNewTopic('');
        setNewNotes('');
        setNewPriority('Medium');
        setShowForm(false);
    };

    const handleUpdateNotes = (index, field, value) => {
        if (onUpdate) {
            onUpdate(index, field, value);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    📚 Important Topics with Custom Instructions
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Topic
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Add important topics and provide specific instructions for question generation.
            </p>

            {/* Add New Topic Form */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <h4 className="font-medium text-gray-800 mb-3">Add New Important Topic</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Topic Name *
                            </label>
                            <input
                                type="text"
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                placeholder="e.g., Multipath fading"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Instructions
                            </label>
                            <textarea
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                                placeholder="e.g., Ask conceptual questions only. Avoid heavy math."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                These instructions will guide Gemini when generating questions about this topic.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddTopic}
                                className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition"
                            >
                                Add Topic
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded font-medium hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Topics List */}
            <div className="space-y-2">
                {topics.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                        <p>No important topics added yet</p>
                        <p className="text-xs mt-1">Click "Add Topic" to get started</p>
                    </div>
                ) : (
                    topics.map((item, index) => (
                        <div
                            key={item._id || index}
                            className="border border-gray-200 rounded bg-white"
                        >
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedId(expandedId === index ? null : index)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-800">{item.topic}</h4>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            item.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    {item.notes && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {item.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(item._id || index);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {expandedId === index ? (
                                        <ChevronUp size={20} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={20} className="text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded View */}
                            {expandedId === index && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Custom Instructions
                                            </label>
                                            <textarea
                                                value={item.notes || ''}
                                                onChange={(e) => handleUpdateNotes(index, 'notes', e.target.value)}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Priority
                                            </label>
                                            <select
                                                value={item.priority || 'Medium'}
                                                onChange={(e) => handleUpdateNotes(index, 'priority', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Summary */}
            {topics.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-4">
                    <p className="text-sm text-green-800">
                        <strong>{topics.length}</strong> important topic{topics.length !== 1 ? 's' : ''} configured
                    </p>
                </div>
            )}
        </div>
    );
};

export default ImportantTopicsWithNotesCard;
