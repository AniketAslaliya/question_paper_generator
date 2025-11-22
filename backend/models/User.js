const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  provider: { type: String, enum: ['email', 'google'], default: 'email' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: { type: Date },
  lastActivityTimestamp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
