const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({ name, email, passwordHash });
        await user.save();

        const payload = { id: user.id, role: user.role, name: user.name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;
    console.log('Login attempt:', { email, passwordProvided: !!password, rememberMe });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('User found, comparing password...');
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            console.log('Password mismatch for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const payload = { id: user.id, role: user.role, name: user.name };
        const expiresIn = rememberMe ? '30d' : '1d';
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

        // Log activity
        if (req.logActivity) await req.logActivity('login');

        console.log('Login successful for:', email, '| Token expires in:', expiresIn);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server error');
    }
});

// Get User
router.get('/me', auth, async (req, res) => {
    try {
        console.log('📋 Fetching user data for:', req.user.id);
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            console.log('❌ User not found in database:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('✅ User found:', user.email);
        res.json(user);
    } catch (err) {
        console.error('❌ Error in /me endpoint:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
