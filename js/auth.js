const API_BASE = "http://localhost:3000/api";

const DEMO_CREDENTIALS = {
  email: "admin@guest.com",
  password: "admin123",
};

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeCheckbox = document.getElementById("rememberMe");
const togglePasswordBtn = document.getElementById("togglePassword");
const loginError = document.getElementById("loginError");

// State
let authToken = null;
let socket = null;

// Initialize authentication
function initAuth() {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  }

  loadSavedCredentials();
  initSocket();
}

// Initialize Socket.io connection
function initSocket() {
  if (typeof io !== "undefined") {
    socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("gestureUpdate", (data) => {
      console.log("Gesture update:", data);
    });

    socket.on("deviceStateUpdate", (data) => {
      if (typeof updateDeviceFromServer === "function") {
        updateDeviceFromServer(data);
      }
    });

    socket.on("newActivity", (activity) => {
      if (typeof addActivityFromServer === "function") {
        addActivityFromServer(activity);
      }
    });
  }
}

// Handle login submission
async function handleLogin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!validateEmail(email)) {
    showLoginError("Please enter a valid email address");
    return;
  }

  if (password.length < 4) {
    showLoginError("Password must be at least 4 characters");
    return;
  }

  try {
    // Try API login first
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem("authToken", data.token);

      if (rememberMeCheckbox.checked) {
        saveCredentials(email, password);
      } else {
        clearSavedCredentials();
      }

      login(data.user);
      loginForm.reset();
    } else {
      // Fallback to demo credentials
      if (
        email.toLowerCase() === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
      ) {
        const demoUser = {
          email: DEMO_CREDENTIALS.email,
          name: "Demo User",
        };

        localStorage.setItem("demoUser", JSON.stringify(demoUser));
        login(demoUser);
        loginForm.reset();
        showToast("Logged in with demo account (offline mode)", "info");
      } else {
        showLoginError(data.message || "Invalid email or password");
      }
    }
  } catch (error) {
    console.error("Login error:", error);

    // Fallback to demo credentials
    if (
      email.toLowerCase() === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      const demoUser = {
        email: DEMO_CREDENTIALS.email,
        name: "Demo User",
      };

      localStorage.setItem("demoUser", JSON.stringify(demoUser));
      login(demoUser);
      loginForm.reset();
      showToast("Logged in with demo account (offline mode)", "info");
    } else {
      showLoginError("Unable to connect to server. Using demo mode.");

      // Use demo mode anyway
      const demoUser = {
        email: email,
        name: "User",
      };
      login(demoUser);
      loginForm.reset();
    }
  }
}

// Register new user
async function registerUser(email, password, name) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem("authToken", data.token);
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: "Connection error" };
  }
}

// Verify token
async function verifyToken() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.valid) {
      authToken = token;
      return data.user;
    }
  } catch (error) {
    console.error("Token verification failed:", error);
  }

  return null;
}

// Get auth token
function getAuthToken() {
  return authToken || localStorage.getItem("authToken");
}

// Logout - renamed to avoid conflict with app.js
async function handleLogout() {
  console.log("[Auth] Logging out...");

  const token = getAuthToken();

  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log("[Auth] Logout API call failed, continuing anyway");
    }
  }

  authToken = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("demoUser");

  if (socket) {
    socket.disconnect();
  }
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show login error
function showLoginError(message) {
  const errorSpan = loginError.querySelector("span");
  errorSpan.textContent = message;
  loginError.classList.add("show");

  setTimeout(() => {
    loginError.classList.remove("show");
  }, 3000);
}

// Toggle password visibility
function togglePasswordVisibility() {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePasswordBtn.classList.toggle("fa-eye");
  togglePasswordBtn.classList.toggle("fa-eye-slash");
}

// Save credentials to localStorage
function saveCredentials(email, password) {
  try {
    const credentials = btoa(JSON.stringify({ email, password }));
    localStorage.setItem("gestureHomeCredentials", credentials);
  } catch (e) {
    console.warn("Could not save credentials:", e);
  }
}

// Load saved credentials
function loadSavedCredentials() {
  try {
    const saved = localStorage.getItem("gestureHomeCredentials");
    if (saved) {
      const { email, password } = JSON.parse(atob(saved));
      emailInput.value = email;
      passwordInput.value = password;
      rememberMeCheckbox.checked = true;
    }
  } catch (e) {
    console.warn("Could not load credentials:", e);
  }
}

// Clear saved credentials
function clearSavedCredentials() {
  localStorage.removeItem("gestureHomeCredentials");
}

// Get socket instance
function getSocket() {
  return socket;
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initAuth);

// Export for other modules
window.registerUser = registerUser;
window.verifyToken = verifyToken;
window.getAuthToken = getAuthToken;
window.getSocket = getSocket;
