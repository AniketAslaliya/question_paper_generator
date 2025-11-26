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

        res.json({
            totalUsers,
            totalPapers,
            totalGenerations,
            activeUsersToday: activeUsersToday.length
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

        const total = await Paper.countDocuments();
        const papers = await Paper.find()
            .populate('userId', 'name email role')
            .populate('importantQuestions.addedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Transform papers to include userRole and extract sections from latest version
        const papersWithRole = papers.map(paper => {
            const paperObj = paper.toObject();
            const latestVersion = paperObj.versions && paperObj.versions.length > 0
                ? paperObj.versions[paperObj.versions.length - 1]
                : null;

            return {
                ...paperObj,
                userRole: paper.userId?.role || null,
                sections: latestVersion?.generatedContentJSON?.sections || [],
                importantQuestionsCount: (paper.importantQuestions || []).length
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

module.exports = router;
