const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Paper = require('../models/Paper');
const ActivityLog = require('../models/ActivityLog');

// Middleware to check admin role
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Get System Stats
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPapers = await Paper.countDocuments();
        const totalGenerations = await ActivityLog.countDocuments({ actionType: 'paper_generated' });

        // Active users today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const activeUsersToday = await ActivityLog.distinct('userId', { timestamp: { $gte: startOfDay } });

        // Papers with generation status
        const generatedPapers = await Paper.countDocuments({ 'generationStatus.status': 'completed' });
        const pendingPapers = await Paper.countDocuments({ 'generationStatus.status': 'pending' });
        const failedPapers = await Paper.countDocuments({ 'generationStatus.status': 'failed' });
        
        // Auto-saved papers
        const autoSavedPapers = await Paper.countDocuments({ isAutoSaved: true });
        
        // Papers with important questions/topics
        const papersWithImportantQuestions = await Paper.countDocuments({ 
            'importantQuestions.0': { $exists: true } 
        });
        const papersWithCifTopics = await Paper.countDocuments({ 
            'cifTopics.0': { $exists: true } 
        });
        const papersWithImportantTopics = await Paper.countDocuments({ 
            'importantTopicsWithNotes.0': { $exists: true } 
        });
        
        // Total versions across all papers
        const versionStats = await Paper.aggregate([
            { $project: { versionsCount: { $size: { $ifNull: ['$versions', []] } } } },
            { $group: { _id: null, totalVersions: { $sum: '$versionsCount' } } }
        ]);
        const totalVersions = versionStats[0]?.totalVersions || 0;

        res.json({
            totalUsers,
            totalPapers,
            totalGenerations,
            activeUsersToday: activeUsersToday.length,
            // Enhanced stats
            generatedPapers,
            pendingPapers,
            failedPapers,
            autoSavedPapers,
            papersWithImportantQuestions,
            papersWithCifTopics,
            papersWithImportantTopics,
            totalVersions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find()
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get All Papers
router.get('/papers', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter = req.query.filter; // 'all', 'generated', 'pending', 'auto-saved'

        // Build query based on filter
        let query = {};
        if (filter === 'generated') {
            query['generationStatus.status'] = 'completed';
        } else if (filter === 'pending') {
            query['generationStatus.status'] = { $in: ['pending', 'generating'] };
        } else if (filter === 'auto-saved') {
            query.isAutoSaved = true;
        } else if (filter === 'with-versions') {
            query['versions.1'] = { $exists: true }; // Has more than 1 version
        }

        const total = await Paper.countDocuments(query);
        const papers = await Paper.find(query)
            .populate('userId', 'name email role')
            .populate('importantQuestions.addedBy', 'name email')
            .populate('importantTopicsList.addedBy', 'name email')
            .populate('importantTopicsWithNotes.addedBy', 'name email')
            .populate('cifTopics')
            .populate('versions.modifiedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Transform papers to include all details
        const papersWithRole = papers.map(paper => {
            const paperObj = paper.toObject();
            const latestVersion = paperObj.versions && paperObj.versions.length > 0
                ? paperObj.versions[paperObj.versions.length - 1]
                : null;

            // Format important topics for display
            const importantTopics = (paper.importantTopicsList || []).map(t => ({
                topic: t.topic,
                priority: t.priority || 'Medium',
                addedBy: t.addedBy?.name || 'Unknown',
                addedAt: t.addedAt
            }));
            
            // Format important topics with notes
            const importantTopicsWithNotes = (paper.importantTopicsWithNotes || []).map(t => ({
                topic: t.topic,
                notes: t.notes || '',
                priority: t.priority || 'Medium',
                addedBy: t.addedBy?.name || 'Unknown',
                addedAt: t.addedAt
            }));
            
            // Format CIF topics
            const cifTopics = (paper.cifTopics || []).map(t => ({
                name: t.name,
                originalName: t.originalName,
                isConfirmed: t.isConfirmed,
                confirmedAt: t.confirmedAt
            }));
            
            // Format important questions
            const importantQuestionsFull = (paper.importantQuestions || []).map(q => ({
                question: q.question,
                questionType: q.questionType,
                notes: q.notes,
                addedBy: q.addedBy?.name || 'Unknown',
                addedAt: q.addedAt
            }));

            return {
                ...paperObj,
                userRole: paper.userId?.role || null,
                sections: latestVersion?.generatedContentJSON?.sections || [],
                importantQuestionsCount: (paper.importantQuestions || []).length,
                importantQuestionsFull,
                // Versioning and auto-save info
                versionsCount: (paper.versions || []).length,
                importantTopicsCount: importantTopics.length,
                importantTopics,
                // NEW: Important topics with notes
                importantTopicsWithNotesCount: importantTopicsWithNotes.length,
                importantTopicsWithNotes,
                // NEW: CIF topics
                cifTopicsCount: cifTopics.length,
                cifTopics,
                isAutoSaved: paper.isAutoSaved || false,
                lastAutoSaveAt: paper.lastAutoSaveAt,
                // Generation status
                generationStatus: paper.generationStatus || { status: 'pending', progress: 0 },
                // Config summary
                configSummary: paper.config ? {
                    templateName: paper.config.templateName,
                    marks: paper.config.marks,
                    duration: paper.config.duration,
                    sectionsCount: (paper.config.sections || []).length,
                    questionTypes: paper.config.questionTypes || [],
                    generateAnswerKey: paper.config.generateAnswerKey || false
                } : null,
                currentVersion: latestVersion ? {
                    versionNumber: latestVersion.versionNumber,
                    createdAt: latestVersion.createdAt,
                    changeReason: latestVersion.changeReason || 'generation',
                    modifiedBy: latestVersion.modifiedBy
                } : null
            };
        });

        res.json({
            papers: papersWithRole,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get All Important Questions (Admin View)
router.get('/important-questions', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Get all papers with important questions
        const papers = await Paper.find({
            importantQuestions: { $exists: true, $ne: [] }
        })
        .populate('userId', 'name email role')
        .populate('importantQuestions.addedBy', 'name email')
        .select('paperName subject userId importantQuestions createdAt')
        .sort({ createdAt: -1 });

        // Flatten important questions with paper info
        let allQuestions = [];
        papers.forEach(paper => {
            (paper.importantQuestions || []).forEach(iq => {
                allQuestions.push({
                    _id: iq._id,
                    question: iq.question,
                    questionType: iq.questionType,
                    notes: iq.notes,
                    addedAt: iq.addedAt,
                    addedBy: iq.addedBy,
                    paper: {
                        id: paper._id,
                        name: paper.paperName,
                        subject: paper.subject,
                        createdBy: {
                            name: paper.userId?.name,
                            email: paper.userId?.email,
                            role: paper.userId?.role
                        }
                    }
                });
            });
        });

        // Sort by date (newest first)
        allQuestions.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

        const total = allQuestions.length;
        const paginatedQuestions = allQuestions.slice(skip, skip + limit);

        res.json({
            questions: paginatedQuestions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats: {
                totalQuestions: total,
                totalPapers: papers.length,
                byType: {
                    Reference: allQuestions.filter(q => q.questionType === 'Reference').length,
                    Important: allQuestions.filter(q => q.questionType === 'Important').length,
                    Numerical: allQuestions.filter(q => q.questionType === 'Numerical').length,
                    Specific: allQuestions.filter(q => q.questionType === 'Specific').length
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Logs
router.get('/logs', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const total = await ActivityLog.countDocuments();
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Paper Version History (Admin)
router.get('/papers/:id/versions', auth, adminAuth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('versions.modifiedBy', 'name email');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        // Return version metadata without full content for performance
        const versionsSummary = (paper.versions || []).map((v, idx) => ({
            _id: v._id,
            versionNumber: v.versionNumber,
            createdAt: v.createdAt,
            aiModel: v.aiModel,
            changeReason: v.changeReason || 'generation',
            modifiedBy: v.modifiedBy,
            isCurrent: idx === (paper.currentVersionIndex || paper.versions.length - 1)
        }));

        res.json({ 
            versions: versionsSummary,
            currentVersionIndex: paper.currentVersionIndex || paper.versions.length - 1,
            totalVersions: paper.versions.length,
            paperName: paper.paperName
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Specific Version Content (Admin)
router.get('/papers/:id/versions/:versionId', auth, adminAuth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        const version = paper.versions.find(v => v._id.toString() === req.params.versionId);
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }

        res.json({ version, paperName: paper.paperName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Important Topics (Admin)
router.get('/papers/:id/important-topics', auth, adminAuth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('importantTopicsList.addedBy', 'name email');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        res.json({ 
            importantTopicsList: paper.importantTopicsList || [],
            paperName: paper.paperName
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Full Paper Details (Admin) - All fields including config, topics, questions
router.get('/papers/:id/full-details', auth, adminAuth, async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id)
            .populate('userId', 'name email role')
            .populate('importantQuestions.addedBy', 'name email')
            .populate('importantTopicsList.addedBy', 'name email')
            .populate('importantTopicsWithNotes.addedBy', 'name email')
            .populate('versions.modifiedBy', 'name email');
            
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        // Build comprehensive paper details
        const fullDetails = {
            // Basic Info
            _id: paper._id,
            paperName: paper.paperName,
            subject: paper.subject,
            templateUsed: paper.templateUsed,
            createdAt: paper.createdAt,
            updatedAt: paper.updatedAt,
            
            // User Info
            user: {
                _id: paper.userId?._id,
                name: paper.userId?.name || paper.userName,
                email: paper.userId?.email,
                role: paper.userId?.role
            },
            
            // Auto-save Status
            isAutoSaved: paper.isAutoSaved,
            lastAutoSaveAt: paper.lastAutoSaveAt,
            
            // Generation Status
            generationStatus: paper.generationStatus || { status: 'pending', progress: 0 },
            
            // Full Configuration
            config: paper.config,
            
            // CIF Topics
            cifTopics: (paper.cifTopics || []).map(t => ({
                name: t.name,
                originalName: t.originalName,
                isConfirmed: t.isConfirmed,
                confirmedAt: t.confirmedAt
            })),
            
            // Important Topics (Legacy)
            importantTopicsList: (paper.importantTopicsList || []).map(t => ({
                topic: t.topic,
                priority: t.priority,
                addedBy: t.addedBy?.name || 'Unknown',
                addedAt: t.addedAt
            })),
            
            // Important Topics with Notes (New)
            importantTopicsWithNotes: (paper.importantTopicsWithNotes || []).map(t => ({
                topic: t.topic,
                notes: t.notes,
                priority: t.priority,
                addedBy: t.addedBy?.name || 'Unknown',
                addedAt: t.addedAt
            })),
            
            // Important Questions
            importantQuestions: (paper.importantQuestions || []).map(q => ({
                _id: q._id,
                question: q.question,
                questionType: q.questionType,
                notes: q.notes,
                addedBy: q.addedBy?.name || 'Unknown',
                addedAt: q.addedAt
            })),
            
            // Extracted Data Summary
            extractedData: {
                chaptersCount: (paper.extractedData?.chapters || []).length,
                chapters: paper.extractedData?.chapters || [],
                uploadedFiles: paper.extractedData?.uploadedFiles || [],
                detectedExercises: paper.extractedData?.detectedExercises || [],
                hasCifParsed: !!paper.extractedData?.cifParsed
            },
            
            // Versions Summary
            versions: (paper.versions || []).map((v, idx) => ({
                _id: v._id,
                versionNumber: v.versionNumber,
                createdAt: v.createdAt,
                aiModel: v.aiModel,
                changeReason: v.changeReason || 'generation',
                modifiedBy: v.modifiedBy?.name || 'Unknown',
                isCurrent: idx === (paper.currentVersionIndex || paper.versions.length - 1),
                hasContent: !!(v.generatedContentHTML || v.generatedContentJSON),
                hasAnswerKey: !!v.generatedAnswerKeyHTML,
                questionsCount: v.generatedContentJSON?.sections?.reduce((sum, s) => 
                    sum + (s.questions?.length || 0), 0) || 0
            })),
            
            currentVersionIndex: paper.currentVersionIndex || paper.versions.length - 1,
            totalVersions: paper.versions?.length || 0
        };

        res.json(fullDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
