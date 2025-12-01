const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    paperName: { type: String, required: true },
    subject: { type: String },
    templateUsed: { type: String },
    
    // Auto-save metadata
    isAutoSaved: { type: Boolean, default: true }, // All papers now auto-save
    lastAutoSaveAt: { type: Date },
    
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
    
    // CIF Topics - Confirmed/edited by user
    cifTopics: [{
        name: { type: String, required: true },
        originalName: String, // Original name from CIF parsing
        weightage: { type: Number, default: 0 }, // Weightage percentage from CIF
        isConfirmed: { type: Boolean, default: true },
        confirmedAt: { type: Date, default: Date.now }
    }],
    
    // Structured important topics with custom instructions/notes
    importantTopicsWithNotes: [{
        topic: { type: String, required: true },
        notes: { type: String, default: '' }, // Custom instructions for Gemini
        priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    
    // Structured important topics array (DEPRECATED - keeping for backward compatibility)
    importantTopicsList: [{
        topic: { type: String, required: true },
        priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    
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
        aiModel: { type: String, default: "Gemini Flash 2.5" },
        // Version metadata
        changeReason: { type: String }, // 'generation', 'regeneration', 'edit'
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // Track current active version (for version history navigation)
    currentVersionIndex: { type: Number, default: 0 },
    
    generationStatus: {
        status: { type: String, enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' },
        progress: { type: Number, default: 0 },
        startedAt: Date,
        completedAt: Date,
        error: String
    },
    importantQuestions: [{
        question: { type: String, required: true },
        questionType: { type: String, default: 'Important' },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        notes: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema);
