const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper'
    },
    config: {
        type: Object,
        required: true
    },
    chapters: {
        type: Array,
        default: []
    },
    cifData: {
        type: Object
    },
    currentStep: {
        type: Number,
        default: 1
    },
    lastSaved: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Auto-delete drafts older than 7 days
draftSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('Draft', draftSchema);
