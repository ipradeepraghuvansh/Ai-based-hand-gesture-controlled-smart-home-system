require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const activityRoutes = require('./routes/activity');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gesturehome';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        await seedDemoUser();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/activity', activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle gesture detection events from client
    socket.on('gestureDetected', (data) => {
        console.log('Gesture detected:', data);
        // Broadcast to all clients
        io.emit('gestureUpdate', data);
    });

    // Handle device state changes
    socket.on('deviceStateChange', (data) => {
        io.emit('deviceStateUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('io', io);

// Ensure demo user exists
async function seedDemoUser() {
    try {
        const demoEmail = 'admin@guest.com';
        const demoPassword = 'admin123';
        const demoName = 'Demo User';

        let demoUser = await User.findOne({ email: demoEmail });
        if (!demoUser) {
            const hashedPassword = await bcrypt.hash(demoPassword, 10);
            demoUser = new User({
                email: demoEmail,
                password: hashedPassword,
                name: demoName
            });
            await demoUser.save();
            console.log(`✅ Demo user created: ${demoEmail}`);
        } else {
            console.log(`✅ Demo user already exists: ${demoEmail}`);
        }
    } catch (error) {
        console.error('Error creating demo user:', error);
    }
}

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app, io };

