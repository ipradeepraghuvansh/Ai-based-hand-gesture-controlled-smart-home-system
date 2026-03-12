// App State
const AppState = {
  isLoggedIn: false,
  currentPage: "home",
  user: null,
};

// DOM Elements
const elements = {
  navbar: document.getElementById("navbar"),
  navLinks: document.querySelectorAll(".nav-links a"),
  hamburger: document.getElementById("hamburger"),
  pages: document.querySelectorAll(".page"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  dashboardLink: document.getElementById("dashboardLink"),
  logoutLink: document.getElementById("logoutLink"),
  loginNavLink: document.getElementById("loginNavLink"),
  userEmail: document.getElementById("userEmail"),
  dashboardLogout: document.getElementById("dashboardLogout"),
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initScrollEffects();
  checkAuthState();
  hideLoading();
});

// Navigation Setup
function initNavigation() {
  // Hamburger menu toggle
  elements.hamburger.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("active");
    elements.hamburger.classList.toggle("active");
  });

  // Nav link clicks
  elements.navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const page = link.dataset.page;
      if (page) {
        e.preventDefault();
        navigateTo(page);
      }
    });
  });

  // Logout buttons
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtns = [logoutBtn, elements.dashboardLogout];
  logoutBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
  });

  window.addEventListener("popstate", () => {
    const hash = window.location.hash.slice(1) || "home";
    navigateTo(hash, false);
  });

  // Initial hash check
  const initialHash = window.location.hash.slice(1) || "home";
  navigateTo(initialHash, false);
}

// Page Navigation
function navigateTo(page, updateHistory = true) {
  // Check authentication for protected pages
  if (page === "dashboard" && !AppState.isLoggedIn) {
    showToast("Please login to access the dashboard", "warning");
    page = "login";
  }

  // Update active states
  elements.navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });

  // Show/hide pages
  elements.pages.forEach((p) => p.classList.remove("active"));
  const targetPage = document.getElementById(`${page}Page`);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  updateAuthUI();

  // Update URL
  if (updateHistory) {
    window.history.pushState({}, "", `#${page}`);
  }

  // Update app state
  AppState.currentPage = page;

  // Close mobile menu
  document.querySelector(".nav-links").classList.remove("active");
  elements.hamburger.classList.remove("active");

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Initialize gesture detection if going to dashboard
  if (page === "dashboard" && AppState.isLoggedIn) {
    setTimeout(() => {
      // Re-cache elements and setup listeners for dashboard
      if (typeof initDevices === "function") {
        initDevices();
      }
      if (typeof initCamera === "function") {
        initCamera();
      }
    }, 500);
  }
}

// Auth State Management
function checkAuthState() {
  const session = sessionStorage.getItem("gestureHomeSession");
  if (session) {
    try {
      const userData = JSON.parse(session);
      AppState.isLoggedIn = true;
      AppState.user = userData;
      updateAuthUI();
    } catch (e) {
      sessionStorage.removeItem("gestureHomeSession");
    }
  }
}

function updateAuthUI() {
  if (AppState.isLoggedIn) {
    elements.dashboardLink.style.display = "block";
    elements.logoutLink.style.display = "block";
    elements.loginNavLink.style.display = "none";

    if (AppState.user && elements.userEmail) {
      elements.userEmail.textContent = AppState.user.email;
    }
  } else {
    elements.dashboardLink.style.display = "none";
    elements.logoutLink.style.display = "none";
    elements.loginNavLink.style.display = "block";
  }
}

function login(user) {
  AppState.isLoggedIn = true;
  AppState.user = user;
  sessionStorage.setItem("gestureHomeSession", JSON.stringify(user));
  updateAuthUI();
  showToast("Welcome back!", "success");
  navigateTo("dashboard");
}

function logout() {
  // Stop camera if running
  if (typeof stopCamera === "function") {
    stopCamera();
  }

  if (typeof handleLogout === "function") {
    handleLogout();
  }

  // Clean up app state
  AppState.isLoggedIn = false;
  AppState.user = null;
  sessionStorage.removeItem("gestureHomeSession");

  // Show toast and navigate to home
  if (typeof showToast === "function") {
    showToast("Logged out successfully", "info");
  }
  navigateTo("home");
}

// Scroll Effects
function initScrollEffects() {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      elements.navbar.classList.add("scrolled");
    } else {
      elements.navbar.classList.remove("scrolled");
    }
  });
}

// Loading
function hideLoading() {
  setTimeout(() => {
    elements.loadingOverlay.classList.add("hidden");
  }, 1500);
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-circle",
    info: "fa-info-circle",
  };

  toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Make functions globally available
window.navigateTo = navigateTo;
window.logout = logout;
window.showToast = showToast;
