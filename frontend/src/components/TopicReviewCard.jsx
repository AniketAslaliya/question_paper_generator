import { useState } from 'react';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

const TopicReviewCard = ({ parsedTopics, onConfirm, loading }) => {
    const [topics, setTopics] = useState(parsedTopics || []);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [newTopic, setNewTopic] = useState('');

    const handleEdit = (index, currentText) => {
        setEditingId(index);
        setEditText(currentText);
    };

    const handleSaveEdit = (index) => {
        if (editText.trim()) {
            const updatedTopics = [...topics];
            updatedTopics[index] = editText.trim();
            setTopics(updatedTopics);
            setEditingId(null);
        }
    };

    const handleDelete = (index) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    const handleAddTopic = () => {
        if (newTopic.trim() && !topics.includes(newTopic.trim())) {
            setTopics([...topics, newTopic.trim()]);
            setNewTopic('');
        }
    };

    const handleConfirm = () => {
        if (topics.length === 0) {
            alert('Please have at least one topic');
            return;
        }
        onConfirm(topics);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Review & Edit CIF Topics
            </h3>

            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                    Review the topics extracted from your CIF file. You can edit, remove, or add topics.
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topics.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No topics added yet</p>
                    ) : (
                        topics.map((topic, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200"
                            >
                                {editingId === index ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(index)}
                                            className="text-green-600 hover:text-green-700"
                                            title="Save"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-gray-500 hover:text-gray-600"
                                            title="Cancel"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 text-sm text-gray-700">{topic}</span>
                                        <button
                                            onClick={() => handleEdit(index, topic)}
                                            className="text-blue-600 hover:text-blue-700"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-red-600 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add New Topic */}
            <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                    Add New Topic
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                        placeholder="Enter topic name..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleAddTopic}
                        className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1 hover:bg-blue-700 transition"
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>

            {/* Topic Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                <p className="text-sm text-blue-800">
                    <strong>Total Topics:</strong> {topics.length}
                </p>
                {topics.length > 0 && (
                    <p className="text-sm text-blue-700 mt-2">
                        <strong>Topics:</strong> {topics.join(', ')}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <button
                onClick={handleConfirm}
                disabled={loading || topics.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Confirming...' : '✓ Confirm Topics'}
            </button>
        </div>
    );
};

export default TopicReviewCard;
