const express = require('express');
const jwt = require('jsonwebtoken');
const { Device, Activity } = require('../models');

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

// Get all devices
router.get('/', authenticate, async (req, res) => {
    try {
        const devices = await Device.find({ userId: req.userId });
        res.json(devices);
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new device
router.post('/', authenticate, async (req, res) => {
    try {
        const { type, name, room } = req.body;

        const device = new Device({
            userId: req.userId,
            type,
            name,
            room: room || 'living'
        });

        await device.save();

        // Log activity
        await Activity.create({
            userId: req.userId,
            type: 'device',
            action: 'Added new device',
            details: `${name} (${type})`,
            device: name
        });

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('deviceAdded', device);
        }

        res.status(201).json(device);
    } catch (error) {
        console.error('Add device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update device state
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { state, settings } = req.body;
        
        const device = await Device.findOne({ _id: req.params.id, userId: req.userId });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        device.state = state !== undefined ? state : device.state;
        if (settings) {
            device.settings = { ...device.settings, ...settings };
        }
        device.updatedAt = new Date();

        await device.save();

        // Log activity
        await Activity.create({
            userId: req.userId,
            type: 'device',
            action: state ? 'Turned ON' : 'Turned OFF',
            details: `${device.name} - ${device.type}`,
            device: device.name
        });

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('deviceStateUpdate', {
                deviceId: device._id,
                state: device.state,
                settings: device.settings
            });
        }

        res.json(device);
    } catch (error) {
        console.error('Update device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete device
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const device = await Device.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Log activity
        await Activity.create({
            userId: req.userId,
            type: 'device',
            action: 'Removed device',
            details: `${device.name} (${device.type})`,
            device: device.name
        });

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('deviceDeleted', { deviceId: req.params.id });
        }

        res.json({ message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Delete device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle device (for gesture control)
router.post('/toggle/:type', authenticate, async (req, res) => {
    try {
        const { type } = req.params;
        const { room } = req.body;

        let query = { userId: req.userId, type };
        if (room) {
            query.room = room;
        }

        const device = await Device.findOne(query);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }

        device.state = !device.state;
        device.updatedAt = new Date();
        await device.save();

        // Log activity
        await Activity.create({
            userId: req.userId,
            type: 'gesture',
            action: `Toggled ${device.name} via gesture`,
            details: `New state: ${device.state ? 'ON' : 'OFF'}`,
            device: device.name,
            gesture: req.body.gesture || 'unknown'
        });

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('deviceStateUpdate', {
                deviceId: device._id,
                state: device.state,
                settings: device.settings,
                gesture: req.body.gesture
            });
        }

        res.json(device);
    } catch (error) {
        console.error('Toggle device error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

