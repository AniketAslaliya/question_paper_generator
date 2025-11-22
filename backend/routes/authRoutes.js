const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Firebase Login / Sync
router.post('/firebase-login', auth, async (req, res) => {
    try {
        const { email, id: firebaseUid } = req.user; // From auth middleware
        
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user if not exists (e.g. Google Sign In first time)
            user = new User({
                name: req.body.name || email.split('@')[0],
                email,
                passwordHash: 'firebase_managed',
                provider: 'firebase',
                firebaseUid
            });
            await user.save();
        }

        user.lastLogin = Date.now();
        await user.save();

        // Log activity
        // if (req.logActivity) await req.logActivity('login');

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Firebase Register (Explicit)
router.post('/firebase-register', auth, async (req, res) => {
    try {
        const { email, id: firebaseUid } = req.user;
        const { name } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({
            name,
            email,
            passwordHash: 'firebase_managed',
            provider: 'firebase',
            firebaseUid
        });
        await user.save();

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get User
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-passwordHash');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
