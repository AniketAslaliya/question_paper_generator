const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('\nMongoDB Connected');

        // Delete existing admin if any
        await User.deleteOne({ email: 'admin@qpg.com' });
        console.log('Deleted old admin user');

        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const admin = new User({
            name: 'Admin User',
            email: 'admin@qpg.com',
            passwordHash,
            role: 'admin',
            provider: 'email'
        });

        await admin.save();
        console.log('\n✅ Admin user created successfully!');
        console.log('Email: admin@qpg.com');
        console.log('Password: admin123');
        console.log('\nYou can now login with these credentials.\n');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createTestUser();
