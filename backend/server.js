require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./middleware/logger');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger); // Attach logger helper to all requests

// Health Check
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/papers', require('./routes/paperRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/drafts', require('./routes/draftRoutes'));

// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/qpg_db')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
