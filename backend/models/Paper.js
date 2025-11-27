const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    paperName: { type: String, required: true },
    subject: { type: String },
    templateUsed: { type: String },
    config: {
        templateName: String,
        marks: Number,
        duration: String,
        difficulty: {
            easy: Number,
            medium: Number,
            hard: Number
        },
        sections: [{
            name: String,
            marks: Number,
            questionCount: Number,
            questionType: String,
            instructions: String
        }],
        bloomsTaxonomy: {
            remember: Number,
            understand: Number,
            apply: Number,
            analyze: Number,
            evaluate: Number,
            create: Number
        },
        weightage: Object,
        questionTypes: [String],
        mandatoryItemsIncluded: Boolean,
        mandatoryExercises: [String],
        referenceQuestions: [String],
        importantTopics: String,
        generateAnswerKey: Boolean,
        cifData: Object,
        setsGenerated: Boolean,
        answerKeyMode: Boolean
    },
    extractedData: {
        chapters: [String],
        textChunks: [String],
        cifParsed: Object,
        uploadedFiles: [String],
        detectedExercises: [String]
    },
    versions: [{
        versionNumber: Number,
        generatedContentHTML: String,
        generatedAnswerKeyHTML: String,
        generatedContentJSON: Object,
        createdAt: { type: Date, default: Date.now },
        aiModel: { type: String, default: "Gemini Flash 2.5" }
    }],
    generationStatus: {
        status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
        progress: { type: Number, default: 0 },
        startedAt: Date,
        completedAt: Date,
        error: String
    },
    importantQuestions: [{
        question: { type: String, required: true },
        questionType: { type: String, enum: ['Reference', 'Important', 'Numerical', 'Specific'] },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        notes: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema);
