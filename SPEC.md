# Home Automation with Hand Gesture Detection - Specification

## Project Overview
- **Project Name**: GestureHome - Smart Home Automation
- **Type**: Web Application (Multi-page SPA)
- **Core Functionality**: Control home devices (lights, fans, AC, door lock) using hand gestures detected via webcam
- **Target Users**: Smart home enthusiasts, tech-savvy homeowners

## UI/UX Specification

### Color Palette
- **Primary**: #667eea (Purple-Blue)
- **Secondary**: #764ba2 (Deep Purple)
- **Accent**: #00d4aa (Teal/Mint)
- **Background Dark**: #1a1a2e
- **Background Light**: #16213e
- **Text Primary**: #ffffff
- **Text Secondary**: #a0a0a0
- **Success**: #00d88a
- **Warning**: #ffa502
- **Danger**: #ff4757

### Typography
- **Font Family**: 'Poppins', sans-serif (Primary)
- **Heading Font**: 'Orbitron', sans-serif (for futuristic feel)
- **H1**: 48px, Bold
- **H2**: 36px, Semi-bold
- **H3**: 24px, Medium
- **Body**: 16px, Regular
- **Small**: 14px, Regular

### Layout Structure
- **Navigation**: Fixed top navbar with glassmorphism effect
- **Pages**: Single page application with section navigation
- **Responsive**: Mobile-first design, breakpoints at 768px, 1024px

### Visual Effects
- Glassmorphism cards with backdrop blur
- Smooth hover transitions (0.3s ease)
- Particle background animation
- Glow effects on active elements
- Smooth page transitions

## Pages Specification

### 1. Login Page
- Centered login card with glassmorphism
- Email and password inputs with icons
- "Remember me" checkbox
- Login button with gradient
- Animated background
- Error message display

### 2. About Page
- Project description section
- Features list with icons
- Technology stack
- Team/Developer info cards
- How it works diagram

### 3. Main Dashboard (Home Page)
- Header with user info and logout
- Camera preview section (640x480)
- Gesture status indicator
- Device control panel:
  - Lights (Living Room, Bedroom, Kitchen)
  - Fan (Speed control)
  - Air Conditioner (Temperature)
  - Door Lock
- Device status cards with toggle switches
- Gesture detection log/history
- Real-time feedback animations

## Functionality Specification

### Hand Gestures
1. **👍 Thumbs Up**: Turn ON selected device
2. **👎 Thumbs Down**: Turn OFF selected device
3. **✋ Open Palm**: Toggle device
4. **✌️ Peace Sign**: Cycle through modes
5. **👌 OK Sign**: Lock/Unlock door

### Device Controls
- **Lights**: Toggle on/off, brightness indicator
- **Fan**: Off/Low/Medium/High speeds
- **AC**: On/Off with temperature display
- **Door**: Locked/Unlocked status

### Authentication
- Simple client-side validation
- Demo credentials: admin@guest.com / admin123
- Session storage for login state

## Technical Implementation
- **HTML5**: Semantic structure
- **CSS3**: Custom properties, animations, flexbox/grid
- **JavaScript**: ES6+ modules
- **Hand Detection**: MediaPipe Hands (Google)
- **Deployment**: Static files, no build required

## File Structure
```
project_100/
├── index.html          (Main entry point)
├── css/
│   └── styles.css      (All styles)
├── js/
│   ├── app.js          (Main application logic)
│   ├── auth.js         (Authentication)
│   ├── gesture.js      (Hand gesture detection)
│   └── devices.js      (Device control)
└── assets/
    └── (placeholder for images)
```

## Acceptance Criteria
1. ✅ Login page validates credentials and redirects to dashboard
2. ✅ About page displays all project information
3. ✅ Dashboard shows camera feed with hand overlay
4. ✅ Gestures are detected and device states update accordingly
5. ✅ All UI elements have smooth animations
6. ✅ Responsive design works on mobile and desktop
7. ✅ Ready to deploy (no build step required)

