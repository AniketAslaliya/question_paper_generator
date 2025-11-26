require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./middleware/logger');

const app = express();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
    'https://question-paper-generator-sigma.vercel.app',
    'https://*.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*');
                return new RegExp(pattern).test(origin);
            }
            return origin === allowed;
        })) {
            callback(null, true);
        } else {
            // For development, allow all origins
            if (process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger); // Attach logger helper to all requests

// Health Check
app.get('/healthz', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        checks: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            jwt_secret: !!process.env.JWT_SECRET,
            gemini_key: !!process.env.GEMINI_API_KEY
        }
    };
    res.status(200).json(health);
});

// Validate required environment variables BEFORE setting up routes
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('⚠️  Server may not work correctly without these variables');
    console.error('💡 Set these in Render dashboard: Environment → Environment Variables');
}

// DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/qpg_db';
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('⚠️  Make sure MONGO_URI is set correctly in environment variables');
        console.error('💡 Check Render dashboard: Environment → Environment Variables');
    });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/papers', require('./routes/paperRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/drafts', require('./routes/draftRoutes'));

// Error handling middleware (should be last, before 404)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS: Origin not allowed' });
    }
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler (should be last)
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found', path: req.path });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/healthz`);
    if (missingVars.length > 0) {
        console.warn(`⚠️  Warning: Missing env vars: ${missingVars.join(', ')}`);
    }
});
