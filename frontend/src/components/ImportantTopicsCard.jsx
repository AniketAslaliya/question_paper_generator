import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const ImportantTopicsCard = ({ topics, onUpdate }) => {
    const [topicText, setTopicText] = useState(topics || '');

    const handleChange = (e) => {
        setTopicText(e.target.value);
        onUpdate(e.target.value);
    };

    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-dark" />
                <h3 className="text-lg font-bold text-dark">Important Topics (Compulsory)</h3>
            </div>

            <p className="text-sm text-dark/70 mb-6">
                List important topics or questions that MUST be included in the paper. These will be given priority during generation.
            </p>

            <textarea
                value={topicText}
                onChange={handleChange}
                placeholder="Enter important topics, one per line:&#10;- Topic 1: Description&#10;- Topic 2: Description&#10;- Important concept to cover&#10;..."
                className="w-full h-48 px-4 py-3 border-2 border-dark rounded-lg focus:ring-4 focus:ring-dark/20 focus:border-dark resize-none"
            />

            <div className="mt-4 p-4 bg-dark/5 rounded-lg border-2 border-dark/10">
                <p className="text-sm text-dark/70">
                    <strong className="text-dark">Note:</strong> These topics will be prioritized and included in the generated paper with high importance.
                </p>
            </div>
        </div>
    );
};

export default ImportantTopicsCard;
