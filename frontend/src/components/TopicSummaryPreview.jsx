import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const TopicSummaryPreview = ({ 
    cifTopics = [], 
    importantTopicsWithNotes = [],
    onProceed,
    onEdit,
    loading = false 
}) => {
    const allAllowedTopics = [
        ...cifTopics.map(t => ({ 
            name: typeof t === 'string' ? t : t.name, 
            type: 'CIF', 
            priority: 'Standard' 
        })),
        ...importantTopicsWithNotes.map(t => ({ 
            name: t.topic, 
            type: 'Important', 
            priority: t.priority, 
            notes: t.notes 
        }))
    ];

    const totalAllowedTopics = allAllowedTopics.length;
    const readyForGeneration = totalAllowedTopics > 0;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    📋 Topic Summary - Final Review
                </h2>
            </div>

            <p className="text-gray-600 mb-6">
                Review all topics that will be used for question generation. This is your final chance to make changes.
            </p>

            {!readyForGeneration && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-red-800">
                        <p className="font-semibold">No topics available</p>
                        <p className="text-sm">Upload a CIF file or add important topics to proceed.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* CIF Topics */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-blue-600" />
                        CIF Topics ({cifTopics.length})
                    </h3>
                    {cifTopics.length === 0 ? (
                        <p className="text-sm text-gray-600 italic">No CIF topics confirmed</p>
                    ) : (
                        <ul className="space-y-2">
                            {cifTopics.map((topic, index) => (
                                <li
                                    key={index}
                                    className="text-sm bg-white border border-blue-100 rounded px-3 py-2"
                                >
                                    {typeof topic === 'string' ? topic : topic.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Important Topics with Notes */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-purple-600" />
                        Important Topics ({importantTopicsWithNotes.length})
                    </h3>
                    {importantTopicsWithNotes.length === 0 ? (
                        <p className="text-sm text-gray-600 italic">No important topics added</p>
                    ) : (
                        <ul className="space-y-2">
                            {importantTopicsWithNotes.map((item, index) => (
                                <li
                                    key={index}
                                    className="text-sm bg-white border border-purple-100 rounded px-3 py-2"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{item.topic}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            item.priority === 'High' ? 'bg-red-100 text-red-700' :
                                            item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    {item.notes && (
                                        <p className="text-xs text-gray-600 italic mt-1">
                                            "{item.notes}"
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* All Allowed Topics Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">📊 Complete Topic List</h3>
                {allAllowedTopics.length === 0 ? (
                    <p className="text-sm text-gray-600 italic">No topics available for generation</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {allAllowedTopics.map((topic, index) => (
                            <span
                                key={index}
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    topic.type === 'CIF'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                                }`}
                            >
                                {topic.name}
                                <span className="ml-1 text-xs opacity-70">({topic.type})</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{cifTopics.length}</div>
                    <div className="text-xs text-gray-600 mt-1">CIF Topics</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{importantTopicsWithNotes.length}</div>
                    <div className="text-xs text-gray-600 mt-1">Important Topics</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{totalAllowedTopics}</div>
                    <div className="text-xs text-gray-600 mt-1">Total Allowed</div>
                </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-800">
                    <strong>💡 How this works:</strong> Questions will only be generated from the topics listed above.
                    {importantTopicsWithNotes.length > 0 && (
                        <>
                            <br />
                            <strong className="text-purple-700">Important topics</strong> have specific instructions
                            that will guide the AI model's question generation.
                        </>
                    )}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onEdit}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
                >
                    ← Edit Topics
                </button>
                <button
                    onClick={onProceed}
                    disabled={!readyForGeneration || loading}
                    className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                        readyForGeneration && !loading
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {loading ? 'Preparing...' : 'Proceed to Generation'}
                    {!loading && <ArrowRight size={18} />}
                </button>
            </div>
        </div>
    );
};

export default TopicSummaryPreview;
