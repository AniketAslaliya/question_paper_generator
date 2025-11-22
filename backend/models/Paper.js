const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    paperName: { type: String, required: true },
    subject: { type: String },
    templateUsed: { type: String },
    config: {
        marks: Number,
        difficulty: {
            easy: Number,
            medium: Number,
            hard: Number
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
    }]
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema);
