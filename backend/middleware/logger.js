const ActivityLog = require('../models/ActivityLog');

const logger = async (req, res, next) => {
    // We only log specific actions or methods if needed, or we can attach this to specific routes
    // This middleware helper can be called manually or attached globally
    // For specific tracking, we might want a helper function instead of global middleware for everything

    req.logActivity = async (actionType, metadata = {}) => {
        try {
            if (req.user) {
                await ActivityLog.create({
                    userId: req.user.id,
                    userName: req.user.name || 'Unknown', // Might need to fetch if not in token
                    actionType,
                    metadata
                });
            }
        } catch (err) {
            console.error('Activity Log Error:', err);
        }
    };

    next();
};

module.exports = logger;
