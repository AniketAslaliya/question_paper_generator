import { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';

const ReferenceQuestionsCard = ({ references, onUpdate }) => {
    const [refList, setRefList] = useState(references || []);
    const [newRef, setNewRef] = useState('');

    const addReference = () => {
        if (newRef.trim()) {
            const updated = [...refList, newRef.trim()];
            setRefList(updated);
            onUpdate(updated);
            setNewRef('');
        }
    };

    const removeReference = (index) => {
        const updated = refList.filter((_, i) => i !== index);
        setRefList(updated);
        onUpdate(updated);
    };

    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-dark" />
                <h3 className="text-lg font-bold text-dark">Reference Questions</h3>
            </div>

            <p className="text-sm text-dark/70 mb-6">
                Add reference questions from previous papers or sample questions that should guide the generation.
            </p>

            <div className="space-y-3 mb-6">
                {refList.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-dark/5 rounded-lg border-2 border-dark/10">
                        <span className="text-sm text-dark flex-1">{ref}</span>
                        <button
                            onClick={() => removeReference(idx)}
                            className="text-dark/50 hover:text-dark"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addReference()}
                    placeholder="Enter a reference question..."
                    className="input-field flex-1"
                />
                <button
                    onClick={addReference}
                    className="btn-primary px-6 flex items-center gap-2"
                    disabled={!newRef.trim()}
                >
                    <Plus className="w-5 h-5" /> Add
                </button>
            </div>
        </div>
    );
};

export default ReferenceQuestionsCard;
