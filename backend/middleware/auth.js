const admin = require('../config/firebaseAdmin');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            id: decodedToken.uid,
            email: decodedToken.email,
            // You can attach more custom claims or look up the user in MongoDB here if needed
            // For now, we'll assume basic info is enough or fetch DB user in routes
        };
        next();
    } catch (err) {
        console.error('Auth Error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
