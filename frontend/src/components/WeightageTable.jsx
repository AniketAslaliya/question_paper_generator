import { useState, useEffect } from 'react';

const WeightageTable = ({ chapters, onUpdate }) => {
    const [weights, setWeights] = useState({});

    useEffect(() => {
        if (chapters && Array.isArray(chapters) && chapters.length > 0) {
            const initialWeights = {};
            const equalShare = Math.floor(100 / chapters.length);
            chapters.forEach(ch => {
                const key = typeof ch === 'string' ? ch : ch.name;
                const value = typeof ch === 'object' && ch.weightage ? ch.weightage : equalShare;
                initialWeights[key] = value;
            });
            setWeights(initialWeights);
            onUpdate(initialWeights);
        }
    }, [chapters]);

    const handleChange = (chapter, value) => {
        const newWeights = { ...weights, [chapter]: parseInt(value) || 0 };
        setWeights(newWeights);
        onUpdate(newWeights);
    };

    const total = Object.values(weights).reduce((a, b) => a + b, 0);

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b-2 border-black bg-gray-100">
                            <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Chapter/Topic</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Weightage (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chapters && Array.isArray(chapters) && chapters.map((chapter, idx) => {
                            const chapterName = typeof chapter === 'string' ? chapter : chapter.name;
                            return (
                                <tr key={chapterName || idx} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-black">{chapterName || 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={weights[chapterName] || 0}
                                            onChange={(e) => handleChange(chapterName, e.target.value)}
                                            className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-black/20 focus:border-black font-bold text-black bg-white"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className={`font-bold ${total === 100 ? 'bg-green-50' : 'bg-red-50'}`}>
                            <td className="px-6 py-4 text-sm text-black">TOTAL</td>
                            <td className={`px-6 py-4 text-lg ${total === 100 ? 'text-green-700' : 'text-red-600'}`}>
                                {total}% {total === 100 ? '✓' : '⚠️ Must equal 100%'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WeightageTable;
