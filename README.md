
# GestureHome - Smart Home Automation
A full-stack home automation system with hand gesture detection, MongoDB backend, and real-time updates powered by Socket.io.

A full-stack home automation system with hand gesture detection.
🚀 **Live Demo:** [https://ai-based-hand-gesture-controlled-smart-iykp.onrender.com](https://ai-based-hand-gesture-controlled-smart-iykp.onrender.com)
## ✨ Features

- 🎯 **Hand Gesture Control** - Control devices using Google MediaPipe AI
- 🔄 **Real-time Updates** - Socket.io for instant device state sync
- 🗄️ **MongoDB Database** - Persistent storage for users, devices, and activities
- 📱 **Responsive UI** - Modern glassmorphism design
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 📊 **Activity Logging** - Track all gestures and device actions

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **AI/ML** | Google MediaPipe Hands |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Real-time** | Socket.io |
| **Auth** | JWT, bcrypt |

## 📁 Project Structure

```
project_100/
├── index.html              # Frontend entry point
├── SPEC.md                 # Project specification
├── README.md               # This file
├── css/
│   └── styles.css         # Glassmorphism styles
├── js/
│   ├── app.js            # Main application logic
│   ├── auth.js           # Authentication handling
│   ├── gesture.js        # MediaPipe hand detection
│   └── devices.js        # Device control UI
└── backend/
    ├── server.js          # Express + Socket.io server
    ├── package.json       # Backend dependencies
    ├── models/
    │   └── index.js      # Mongoose schemas (User, Device, Activity)
    └── routes/
        ├── auth.js       # Auth API endpoints
        ├── devices.js    # Device API endpoints
        └── activity.js   # Activity API endpoints
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- Webcam for gesture detection

### 1. Install MongoDB

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install
```

### 3. Configure Environment

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/gesturehome
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 4. Start Backend

```bash
cd backend
npm start
```

### 5. Start Frontend

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: npx serve
npx serve .
```

### 6. Access Application

- 🌐 **Frontend**: http://localhost:8080
- 🔌 **Backend API**: http://localhost:3000/api
- 👤 **Demo Login**: admin@guest.com / admin123

## 👋 Hand Gestures

| Gesture | Fingers | Action |
|---------|---------|--------|
| 👍 Thumbs Up | Thumb only | Turn ON lights |
| 👎 Thumbs Down | Thumb only | Turn OFF lights |
| ✋ Open Palm | All 5 fingers | Toggle lights |
| ☝️ 4 Fingers Up | Index + Middle + Ring + Pinky | Cycle fan speed |
| 👌 OK Sign | Index + Thumb touching | Lock/Unlock door |
| 👆 Pointing | Index only | Toggle AC |
| ✌️ 2 Up | Index + Middle | Brightness +25% |
| ✌️ 2 Down | Ring + Pinky | Brightness -25% |
| 🤟 3 Up | Index + Middle + Ring | Temperature +1°C |
| 🤟 3 Down | Middle + Ring + Pinky | Temperature -1°C |
| ✊ Fist | All folded | Toggle notifications |

### Gesture Detection Tips

- Ensure good lighting for accurate detection
- Keep your hand within the camera frame
- 1.5 second cooldown between gesture actions
- Blue dots = hand landmarks detected

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| GET | `/verify` | Verify JWT token |
| POST | `/logout` | User logout |
| POST | `/change-password` | Change password |

### Devices (`/api/devices`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all user devices |
| POST | `/` | Add new device |
| PUT | `/:id` | Update device state |
| DELETE | `/:id` | Delete device |
| POST | `/toggle/:type` | Toggle by device type |

### Activity (`/api/activity`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get activities (with filters) |
| GET | `/recent` | Last 24 hours activities |
| GET | `/stats` | Activity statistics |
| POST | `/` | Log new activity |
| POST | `/gesture` | Log gesture activity |
| DELETE | `/cleanup` | Delete old activities |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

## 📱 Device Types

- **Light** - On/Off with brightness (0-100%)
- **Fan** - Off + 3 speed levels
- **AC** - On/Off with temperature (16-30°C)
- **Door** - Locked/Unlocked

## 🔧 Socket.io Events

### Client → Server

- `gestureDetected` - Send detected gesture
- `deviceStateChange` - Device state changed

### Server → Client

- `gestureUpdate` - Broadcast gesture detection
- `deviceStateUpdate` - Device state changed
- `deviceAdded` - New device added
- `deviceDeleted` - Device removed
- `newActivity` - New activity logged
- `userLogin` - User logged in

## 📝 License

MIT License - Feel free to use this project for learning or commercial purposes.

