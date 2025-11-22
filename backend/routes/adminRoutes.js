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
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get All Papers
router.get('/papers', auth, adminAuth, async (req, res) => {
    try {
        const papers = await Paper.find()
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        // Transform papers to include userRole and extract sections from latest version
        const papersWithRole = papers.map(paper => {
            const paperObj = paper.toObject();
            const latestVersion = paperObj.versions && paperObj.versions.length > 0
                ? paperObj.versions[paperObj.versions.length - 1]
                : null;

            return {
                ...paperObj,
                userRole: paper.userId?.role || null,
                sections: latestVersion?.generatedContentJSON?.sections || []
            };
        });

        res.json(papersWithRole);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Logs
router.get('/logs', auth, adminAuth, async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
