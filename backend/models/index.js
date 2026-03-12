require('dotenv').config();
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        default: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Device Schema
const deviceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['light', 'fan', 'ac', 'door'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    room: {
        type: String,
        default: 'living'
    },
    state: {
        type: Boolean,
        default: false
    },
    settings: {
        brightness: { type: Number, default: 100 },
        speed: { type: Number, default: 0 },
        temperature: { type: Number, default: 24 }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Activity Schema
const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['gesture', 'device', 'system', 'login', 'logout'],
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    device: {
        type: String
    },
    gesture: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better performance
userSchema.index({ email: 1 });
deviceSchema.index({ userId: 1, type: 1 });
activitySchema.index({ userId: 1, timestamp: -1 });

// Export models
const User = mongoose.model('User', userSchema);
const Device = mongoose.model('Device', deviceSchema);
const Activity = mongoose.model('Activity', activitySchema);

module.exports = { User, Device, Activity };

