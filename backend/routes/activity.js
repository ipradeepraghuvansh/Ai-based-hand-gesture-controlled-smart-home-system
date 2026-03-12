const express = require('express');
const jwt = require('jsonwebtoken');
const { Activity } = require('../models');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'gesturehome_secret_key_2024';

// Middleware to authenticate token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all activities
router.get('/', authenticate, async (req, res) => {
    try {
        const { limit = 50, type, startDate, endDate } = req.query;

        let query = { userId: req.userId };

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        const activities = await Activity.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get recent activities (last 24 hours)
router.get('/recent', authenticate, async (req, res) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const activities = await Activity.find({
            userId: req.userId,
            timestamp: { $gte: oneDayAgo }
        })
        .sort({ timestamp: -1 })
        .limit(20);

        res.json(activities);
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Log new activity
router.post('/', authenticate, async (req, res) => {
    try {
        const { type, action, details, device, gesture } = req.body;

        const activity = new Activity({
            userId: req.userId,
            type,
            action,
            details,
            device,
            gesture
        });

        await activity.save();

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('newActivity', activity);
        }

        res.status(201).json(activity);
    } catch (error) {
        console.error('Log activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Log gesture activity (specific endpoint for gestures)
router.post('/gesture', authenticate, async (req, res) => {
    try {
        const { gesture, device, action } = req.body;

        const activity = new Activity({
            userId: req.userId,
            type: 'gesture',
            action: `Detected gesture: ${gesture}`,
            details: action || `Controlled ${device || 'unknown device'}`,
            device,
            gesture
        });

        await activity.save();

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('gestureActivity', activity);
        }

        res.status(201).json(activity);
    } catch (error) {
        console.error('Log gesture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get activity statistics
router.get('/stats', authenticate, async (req, res) => {
    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Total activities
        const totalActivities = await Activity.countDocuments({ userId: req.userId });

        // Activities by type
        const activitiesByType = await Activity.aggregate([
            { $match: { userId: req.userId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Activities this week
        const weeklyActivities = await Activity.countDocuments({
            userId: req.userId,
            timestamp: { $gte: oneWeekAgo }
        });

        // Most used gestures
        const topGestures = await Activity.aggregate([
            { $match: { userId: req.userId, type: 'gesture' } },
            { $group: { _id: '$gesture', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Most controlled devices
        const topDevices = await Activity.aggregate([
            { $match: { userId: req.userId, type: { $in: ['gesture', 'device'] } } },
            { $group: { _id: '$device', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalActivities,
            weeklyActivities,
            activitiesByType,
            topGestures,
            topDevices
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear old activities
router.delete('/cleanup', authenticate, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const result = await Activity.deleteMany({
            userId: req.userId,
            timestamp: { $lt: cutoffDate }
        });

        res.json({ message: `Deleted ${result.deletedCount} activities` });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

