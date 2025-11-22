const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Save draft
router.post('/save', async (req, res) => {
    try {
        const { paperId, config, chapters, cifData, currentStep } = req.body;

        // Find existing draft or create new one
        let draft = await Draft.findOne({ userId: req.user.id });

        if (draft) {
            // Update existing draft
            draft.paperId = paperId;
            draft.config = config;
            draft.chapters = chapters || [];
            draft.cifData = cifData;
            draft.currentStep = currentStep || 1;
            draft.lastSaved = Date.now();
            await draft.save();
        } else {
            // Create new draft
            draft = new Draft({
                userId: req.user.id,
                paperId,
                config,
                chapters: chapters || [],
                cifData,
                currentStep: currentStep || 1
            });
            await draft.save();
        }

        res.json({
            message: 'Draft saved successfully',
            draft: {
                id: draft._id,
                lastSaved: draft.lastSaved,
                currentStep: draft.currentStep
            }
        });
    } catch (err) {
        console.error('Save draft error:', err);
        res.status(500).json({ message: 'Failed to save draft' });
    }
});

// Get latest draft
router.get('/latest', async (req, res) => {
    try {
        const draft = await Draft.findOne({ userId: req.user.id })
            .sort({ lastSaved: -1 });

        if (!draft) {
            return res.json({ draft: null });
        }

        res.json({ draft });
    } catch (err) {
        console.error('Get draft error:', err);
        res.status(500).json({ message: 'Failed to retrieve draft' });
    }
});

// Get specific draft
router.get('/:id', async (req, res) => {
    try {
        const draft = await Draft.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        res.json({ draft });
    } catch (err) {
        console.error('Get draft error:', err);
        res.status(500).json({ message: 'Failed to retrieve draft' });
    }
});

// Delete draft
router.delete('/:id', async (req, res) => {
    try {
        const draft = await Draft.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        res.json({ message: 'Draft deleted successfully' });
    } catch (err) {
        console.error('Delete draft error:', err);
        res.status(500).json({ message: 'Failed to delete draft' });
    }
});

// Delete current draft (after successful generation)
router.delete('/clear/current', async (req, res) => {
    try {
        await Draft.findOneAndDelete({ userId: req.user.id });
        res.json({ message: 'Draft cleared successfully' });
    } catch (err) {
        console.error('Clear draft error:', err);
        res.status(500).json({ message: 'Failed to clear draft' });
    }
});

// List all user drafts
router.get('/list/all', async (req, res) => {
    try {
        const drafts = await Draft.find({ userId: req.user.id })
            .sort({ lastSaved: -1 })
            .select('currentStep lastSaved createdAt');

        res.json({ drafts });
    } catch (err) {
        console.error('List drafts error:', err);
        res.status(500).json({ message: 'Failed to list drafts' });
    }
});

module.exports = router;
