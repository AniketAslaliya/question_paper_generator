import { CheckCircle, FileText, Target, Brain } from 'lucide-react';

const ConfigPreview = ({ config, sections, questionTypes, bloomsTaxonomy }) => {
    const totalMarks = sections.reduce((sum, s) => sum + (s.marks || 0), 0);
    const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || 0), 0);

    return (
        <div className="card bg-dark text-cream">
            <h3 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-cream/20">
                Configuration Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paper Details */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-6 h-6 mt-1" />
                        <div>
                            <h4 className="font-bold text-lg mb-2">Paper Structure</h4>
                            <div className="space-y-1 text-cream/80">
                                <p>📝 Total Marks: <strong>{totalMarks}</strong></p>
                                <p>❓ Total Questions: <strong>{totalQuestions}</strong></p>
                                <p>📑 Sections: <strong>{sections.length}</strong></p>
                                <p>🎯 Template: <strong className="capitalize">{config.templateName}</strong></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Target className="w-6 h-6 mt-1" />
                        <div>
                            <h4 className="font-bold text-lg mb-2">Difficulty Mix</h4>
                            <div className="space-y-2">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Easy</span>
                                        <span>{config.difficulty.easy}%</span>
                                    </div>
                                    <div className="h-2 bg-cream/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-cream" style={{ width: `${config.difficulty.easy}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Medium</span>
                                        <span>{config.difficulty.medium}%</span>
                                    </div>
                                    <div className="h-2 bg-cream/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-cream" style={{ width: `${config.difficulty.medium}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Hard</span>
                                        <span>{config.difficulty.hard}%</span>
                                    </div>
                                    <div className="h-2 bg-cream/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-cream" style={{ width: `${config.difficulty.hard}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Types & Bloom's */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 mt-1" />
                        <div>
                            <h4 className="font-bold text-lg mb-2">Question Types</h4>
                            <div className="flex flex-wrap gap-2">
                                {questionTypes.map(type => (
                                    <span key={type} className="px-3 py-1 bg-cream text-dark rounded-full text-xs font-semibold capitalize">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Brain className="w-6 h-6 mt-1" />
                        <div className="flex-1">
                            <h4 className="font-bold text-lg mb-2">Bloom's Taxonomy</h4>
                            <div className="space-y-1 text-sm text-cream/80">
                                {Object.entries(bloomsTaxonomy).map(([level, percent]) => (
                                    percent > 0 && (
                                        <div key={level} className="flex justify-between">
                                            <span className="capitalize">{level}</span>
                                            <strong>{percent}%</strong>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {config.generateAnswerKey && (
                        <div className="p-3 bg-cream/10 rounded-lg border border-cream/20">
                            <p className="text-sm font-semibold">✓ Answer Key Enabled</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sections Breakdown */}
            <div className="mt-6 pt-6 border-t-2 border-cream/20">
                <h4 className="font-bold text-lg mb-3">Section Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sections.map((section, idx) => (
                        <div key={idx} className="p-4 bg-cream/10 rounded-lg border border-cream/20">
                            <h5 className="font-bold mb-2">{section.name}</h5>
                            <p className="text-sm text-cream/80">{section.questionCount} questions</p>
                            <p className="text-sm text-cream/80">{section.marks} marks</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConfigPreview;
