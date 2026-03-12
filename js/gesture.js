// Gesture Detection State
const GestureState = {
  isInitialized: false,
  isRunning: false,
  currentGesture: null,
  confidence: 0,
  selectedDevice: null,
};

// Initialize notifications as OFF by default (no popups for lights)
window.showNotifications = false;

// DOM Elements
let videoElement, canvasElement, canvasCtx, cameraStatus, cameraStatusText;
let gestureIcon, gestureName, confidenceFill, confidenceValue;

// MediaPipe Hands configuration
const handPoseConfig = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
  },
};

// Gesture detection parameters
let hands;
let camera;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1500;

// Cache DOM elements
function cacheGestureElements() {
  videoElement = document.getElementById("video");
  canvasElement = document.getElementById("canvas");
  canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;
  cameraStatus = document.getElementById("cameraStatus");
  cameraStatusText = document.getElementById("cameraStatusText");
  gestureIcon = document.getElementById("gestureIcon");
  gestureName = document.getElementById("gestureName");
  confidenceFill = document.getElementById("confidenceFill");
  confidenceValue = document.getElementById("confidenceValue");
}

// Initialize hand detection
async function initGestureDetection() {
  console.log("[Gesture] Starting initialization...");

  if (GestureState.isInitialized) return;

  try {
    if (typeof Hands === "undefined") {
      console.error("[Gesture] MediaPipe Hands not loaded!");
      updateCameraStatus(false, "MediaPipe not loaded");
      return;
    }

    hands = new Hands(handPoseConfig);
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onHandResults);

    GestureState.isInitialized = true;
    console.log("[Gesture] Hand detection initialized!");
    updateCameraStatus(true, "Ready");
  } catch (error) {
    console.error("[Gesture] Failed to initialize:", error);
    updateCameraStatus(false, "Initialization failed");
  }
}

// Handle hand detection results
function onHandResults(results) {
  if (!canvasCtx) return;

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    updateGestureDisplay(null, 0);
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  drawHandLandmarks(landmarks);

  const gesture = detectGesture(landmarks);
  updateGestureDisplay(gesture.name, gesture.confidence);

  // Execute gesture action if cooldown passed
  const now = Date.now();
  if (
    gesture.name &&
    gesture.confidence > 0.7 &&
    now - lastGestureTime > GESTURE_COOLDOWN
  ) {
    console.log("[Gesture] Executing:", gesture.name);
    executeGestureAction(gesture.name);
    lastGestureTime = now;
  }
}

// Draw hand landmarks
function drawHandLandmarks(landmarks) {
  if (!canvasCtx || !canvasElement) return;

  const width = canvasElement.width;
  const height = canvasElement.height;

  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [5, 9],
    [9, 13],
    [13, 17], // Palm
  ];

  canvasCtx.strokeStyle = "#00d4aa";
  canvasCtx.lineWidth = 2;
  connections.forEach(([i, j]) => {
    canvasCtx.beginPath();
    canvasCtx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
    canvasCtx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
    canvasCtx.stroke();
  });

  landmarks.forEach((landmark) => {
    canvasCtx.fillStyle = "#667eea";
    canvasCtx.beginPath();
    canvasCtx.arc(landmark.x * width, landmark.y * height, 4, 0, 2 * Math.PI);
    canvasCtx.fill();
  });
}

// Detect gesture - ORDER MATTERS! Check specific gestures first
function detectGesture(landmarks) {
  // Get key finger positions
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];
  const ringMCP = landmarks[13];
  const pinkyMCP = landmarks[17];
  const wrist = landmarks[0];

  // Calculate finger states
  const fingers = {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(indexTip, indexMCP),
    middle: isFingerExtended(middleTip, middleMCP),
    ring: isFingerExtended(ringTip, ringMCP),
    pinky: isFingerExtended(pinkyTip, pinkyMCP),
  };

  console.log("[Gesture] Fingers:", fingers);

  let gesture = { name: null, confidence: 0 };

  // === CHECK SPECIFIC GESTURES FIRST (fewer fingers) ===

  // 1. THUMBS UP - Only thumb extended, pointing up
  if (
    fingers.thumb &&
    !fingers.index &&
    !fingers.middle &&
    !fingers.ring &&
    !fingers.pinky
  ) {
    if (thumbTip.y < wrist.y - 0.1) {
      gesture = { name: "thumbsUp", confidence: 0.95 };
    } else if (thumbTip.y > wrist.y + 0.1) {
      gesture = { name: "thumbsDown", confidence: 0.95 };
    }
    return gesture;
  }

  // 2. OK SIGN - Index + thumb touching, others extended
  if (isOKSign(landmarks)) {
    gesture = { name: "okSign", confidence: 0.9 };
    return gesture;
  }

  // 3. FIST - All fingers folded
  if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    gesture = { name: "fist", confidence: 0.85 };
    return gesture;
  }

  // 4. POINTING - Only index extended
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    gesture = { name: "pointing", confidence: 0.85 };
    return gesture;
  }

  // 5. TWO FINGERS UP (index + middle only) - Brightness increase
  if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    gesture = { name: "twoFingersUp", confidence: 0.9 };
    return gesture;
  }

  // 6. TWO FINGERS DOWN (ring + pinky only) - Brightness decrease
  if (!fingers.index && !fingers.middle && fingers.ring && fingers.pinky) {
    gesture = { name: "twoFingersDown", confidence: 0.9 };
    return gesture;
  }

  // 7. THREE FINGERS UP (index + middle + ring only, pinky down) - Temperature increase
  if (fingers.index && fingers.middle && fingers.ring && !fingers.pinky) {
    gesture = { name: "threeFingersUp", confidence: 0.9 };
    return gesture;
  }

  // 8. THREE FINGERS DOWN (middle + ring + pinky only) - Temperature decrease
  if (!fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    gesture = { name: "threeFingersDown", confidence: 0.9 };
    return gesture;
  }

  // 9. FOUR FINGERS UP (all 4 fingers, thumb folded) - Fan speed
  if (
    fingers.index &&
    fingers.middle &&
    fingers.ring &&
    fingers.pinky &&
    !fingers.thumb
  ) {
    gesture = { name: "fourFingersUp", confidence: 0.9 };
    return gesture;
  }

  // 10. OPEN PALM (all 5 fingers extended) - Toggle lights
  if (
    fingers.index &&
    fingers.middle &&
    fingers.ring &&
    fingers.pinky &&
    fingers.thumb
  ) {
    gesture = { name: "openPalm", confidence: 0.9 };
    return gesture;
  }

  return gesture;
}

// Check if thumb is extended
function isThumbExtended(landmarks) {
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  const wrist = landmarks[0];

  const tipDist = Math.sqrt(
    Math.pow(thumbTip.x - wrist.x, 2) + Math.pow(thumbTip.y - wrist.y, 2),
  );
  const ipDist = Math.sqrt(
    Math.pow(thumbIP.x - wrist.x, 2) + Math.pow(thumbIP.y - wrist.y, 2),
  );

  return tipDist > ipDist * 1.1;
}

// Check if finger is extended
function isFingerExtended(tip, mcp) {
  return tip.y < mcp.y - 0.02;
}

// Check for OK sign
function isOKSign(landmarks) {
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const distance = Math.sqrt(
    Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2),
  );

  const middleMCP = landmarks[9];
  const ringMCP = landmarks[13];
  const pinkyMCP = landmarks[17];

  const otherExtended =
    middleTip.y < middleMCP.y - 0.02 &&
    ringTip.y < ringMCP.y - 0.02 &&
    pinkyTip.y < pinkyMCP.y - 0.02;

  return distance < 0.08 && otherExtended;
}

// Update gesture display
function updateGestureDisplay(gesture, confidence) {
  GestureState.currentGesture = gesture;
  GestureState.confidence = confidence;

  const gestureIcons = {
    thumbsUp: "fa-thumbs-up",
    thumbsDown: "fa-thumbs-down",
    openPalm: "fa-hand-paper",
    fourFingersUp: "fa-hand-sparkles",
    okSign: "fa-check",
    fist: "fa-fist-raised",
    pointing: "fa-hand-point-right",
    twoFingersUp: "fa-hand-pointer",
    twoFingersDown: "fa-hand-pointer",
    threeFingersUp: "fa-hand-holding",
    threeFingersDown: "fa-hand-holding",
  };

  const gestureLabels = {
    thumbsUp: "👍 Thumbs Up",
    thumbsDown: "👎 Thumbs Down",
    openPalm: "✋ Open Palm",
    fourFingersUp: "☝️ 4 Fingers - Fan",
    okSign: "👌 OK Sign",
    fist: "✊ Fist",
    pointing: "👆 Pointing - AC",
    twoFingersUp: "✌️ 2 Up - Brightness+",
    twoFingersDown: "✌️ 2 Down - Brightness-",
    threeFingersUp: "🤟 3 Up - Temp+",
    threeFingersDown: "🤟 3 Down - Temp-",
  };

  if (gesture && confidence > 0.5) {
    if (gestureIcon) {
      gestureIcon.className = `fas ${gestureIcons[gesture] || "fa-hand-paper"}`;
      gestureIcon.style.color = "#00d4aa";
    }
    if (gestureName) {
      gestureName.textContent = gestureLabels[gesture] || "Unknown";
    }
  } else {
    if (gestureIcon) {
      gestureIcon.className = "fas fa-hand-paper";
      gestureIcon.style.color = "#667eea";
    }
    if (gestureName) {
      gestureName.textContent = "No gesture detected";
    }
  }

  const confidencePercent = Math.round(confidence * 100);
  if (confidenceFill) confidenceFill.style.width = `${confidencePercent}%`;
  if (confidenceValue) confidenceValue.textContent = `${confidencePercent}%`;
}

// Execute gesture action
function executeGestureAction(gestureName) {
  console.log("[Gesture] Action:", gestureName);

  let message = "";
  let type = "info";

  switch (gestureName) {
    case "thumbsUp":
      // Lights ON
      const lightToggleOn = document.getElementById("lightToggle");
      const lightStatusOn = document.getElementById("lightStatus");
      if (lightToggleOn) lightToggleOn.checked = true;
      if (lightStatusOn) {
        lightStatusOn.textContent = "ON";
        lightStatusOn.classList.add("active");
      }
      updateLightCardActive(true);
      message = "Lights turned ON";
      type = "success";
      break;

    case "thumbsDown":
      // Lights OFF
      const lightToggleOff = document.getElementById("lightToggle");
      const lightStatusOff = document.getElementById("lightStatus");
      if (lightToggleOff) lightToggleOff.checked = false;
      if (lightStatusOff) {
        lightStatusOff.textContent = "OFF";
        lightStatusOff.classList.remove("active");
      }
      updateLightCardActive(false);
      message = "Lights turned OFF";
      type = "info";
      break;

    case "openPalm":
      // Toggle lights
      const lightToggle = document.getElementById("lightToggle");
      const lightStatus = document.getElementById("lightStatus");
      const isOn = lightToggle ? !lightToggle.checked : true;
      if (lightToggle) lightToggle.checked = isOn;
      if (lightStatus) {
        lightStatus.textContent = isOn ? "ON" : "OFF";
        lightStatus.classList.toggle("active", isOn);
      }
      updateLightCardActive(isOn);
      message = `Lights toggled ${isOn ? "ON" : "OFF"}`;
      type = "info";
      break;

    case "fourFingersUp":
      // Cycle fan speed
      const fanSpeedBtns = document.querySelectorAll(".speed-btn");
      const fanStatusEl = document.getElementById("fanStatus");
      const fanCardEl = document.getElementById("fanCard");
      let currentFanSpeed = 0;
      fanSpeedBtns.forEach((btn) => {
        if (btn.classList.contains("active"))
          currentFanSpeed = parseInt(btn.dataset.speed);
      });
      const nextSpeed = (currentFanSpeed + 1) % 4;
      fanSpeedBtns.forEach((btn) => {
        btn.classList.toggle(
          "active",
          parseInt(btn.dataset.speed) === nextSpeed,
        );
      });
      if (fanStatusEl) {
        fanStatusEl.textContent =
          nextSpeed === 0 ? "OFF" : `Level ${nextSpeed}`;
        fanStatusEl.classList.toggle("active", nextSpeed > 0);
      }
      if (fanCardEl) {
        fanCardEl.classList.toggle("active", nextSpeed > 0);
        const fanIconEl = fanCardEl.querySelector(".device-icon i");
        if (fanIconEl) {
          fanIconEl.style.animation =
            nextSpeed > 0 ? `spin ${2 / nextSpeed}s linear infinite` : "none";
        }
      }
      message = `Fan speed: ${nextSpeed === 0 ? "OFF" : "Level " + nextSpeed}`;
      type = "info";
      break;

    case "okSign":
      // Toggle door
      const doorStatus = document.getElementById("doorStatus");
      const doorToggle = document.getElementById("doorToggle");
      const doorIcon = document.querySelector("#doorCard .device-icon i");
      const doorCard = document.getElementById("doorCard");

      const isLocked = doorStatus && doorStatus.textContent === "LOCKED";
      const nowLocked = !isLocked;

      if (doorStatus)
        doorStatus.textContent = nowLocked ? "LOCKED" : "UNLOCKED";
      if (doorStatus) doorStatus.classList.toggle("locked", nowLocked);
      if (doorToggle)
        doorToggle.innerHTML = nowLocked
          ? '<i class="fas fa-lock-open"></i> Unlock'
          : '<i class="fas fa-lock"></i> Lock';
      if (doorToggle) doorToggle.classList.toggle("unlocked", !nowLocked);
      if (doorIcon)
        doorIcon.className = nowLocked ? "fas fa-lock" : "fas fa-lock-open";
      if (doorCard) doorCard.classList.toggle("active", !nowLocked);

      message = `Door ${nowLocked ? "LOCKED" : "UNLOCKED"}`;
      type = "warning";
      break;

    case "pointing":
      // Toggle AC
      const acToggle = document.getElementById("acToggle");
      const acStatus = document.getElementById("acStatus");
      const acCard = document.getElementById("acCard");

      const isACOn = acToggle ? acToggle.checked : false;
      const newACState = !isACOn;

      if (acToggle) acToggle.checked = newACState;
      if (acStatus) {
        acStatus.textContent = newACState ? "24°C" : "OFF";
        acStatus.classList.toggle("active", newACState);
      }
      if (acCard) acCard.classList.toggle("active", newACState);

      message = `AC turned ${newACState ? "ON" : "OFF"}`;
      type = "info";
      break;

    case "twoFingersUp":
      // Increase brightness +25%
      const brightSliderUp = document.getElementById("brightnessSlider");
      const brightValueUp = document.getElementById("brightnessValue");
      let currentBrightUp = brightSliderUp
        ? parseInt(brightSliderUp.value)
        : 75;
      currentBrightUp = Math.min(100, currentBrightUp + 25);
      if (brightSliderUp) brightSliderUp.value = currentBrightUp;
      if (brightValueUp) brightValueUp.textContent = currentBrightUp + "%";
      message = `Brightness: ${currentBrightUp}%`;
      type = "info";
      break;

    case "twoFingersDown":
      // Decrease brightness -25%
      const brightSliderDown = document.getElementById("brightnessSlider");
      const brightValueDown = document.getElementById("brightnessValue");
      let currentBrightDown = brightSliderDown
        ? parseInt(brightSliderDown.value)
        : 75;
      currentBrightDown = Math.max(0, currentBrightDown - 25);
      if (brightSliderDown) brightSliderDown.value = currentBrightDown;
      if (brightValueDown)
        brightValueDown.textContent = currentBrightDown + "%";
      message = `Brightness: ${currentBrightDown}%`;
      type = "info";
      break;

    case "threeFingersUp":
      // Temperature +1
      const tempValueUp = document.getElementById("tempValue");
      let currentTempUp = tempValueUp ? parseInt(tempValueUp.textContent) : 24;
      currentTempUp = Math.min(30, currentTempUp + 1);
      if (tempValueUp) tempValueUp.textContent = currentTempUp + "°C";
      message = `Temperature: ${currentTempUp}°C`;
      type = "info";
      break;

    case "threeFingersDown":
      // Temperature -1
      const tempValueDown = document.getElementById("tempValue");
      let currentTempDown = tempValueDown
        ? parseInt(tempValueDown.textContent)
        : 24;
      currentTempDown = Math.max(16, currentTempDown - 1);
      if (tempValueDown) tempValueDown.textContent = currentTempDown + "°C";
      message = `Temperature: ${currentTempDown}°C`;
      type = "info";
      break;

    case "fist":
      // Toggle notifications
      window.showNotifications = !window.showNotifications;
      message = window.showNotifications
        ? "Notifications ON"
        : "Notifications OFF";
      type = "info";
      break;

    default:
      return;
  }

  // Add activity log
  if (typeof addActivity === "function") {
    addActivity(`Gesture: ${gestureName} - ${message}`, type);
  }

  // Show toast for specific gestures
  if (
    gestureName === "pointing" ||
    gestureName === "okSign" ||
    gestureName === "fist" ||
    gestureName === "twoFingersUp" ||
    gestureName === "twoFingersDown" ||
    gestureName === "threeFingersUp" ||
    gestureName === "threeFingersDown" ||
    gestureName === "fourFingersUp" ||
    window.showNotifications
  ) {
    if (typeof showToast === "function") {
      showToast(message, type);
    }
  }
}

// Helper function
function updateLightCardActive(isActive) {
  const lightCard = document.getElementById("lightCard");
  const lightIcon = lightCard
    ? lightCard.querySelector(".device-icon i")
    : null;
  if (lightCard) lightCard.classList.toggle("active", isActive);
  if (lightIcon) lightIcon.style.color = isActive ? "#ffbe00" : "#ffa502";
}

// Initialize camera
async function initCamera() {
  cacheGestureElements();

  if (!videoElement || !canvasElement) return;

  await initGestureDetection();

  if (!GestureState.isInitialized) {
    updateCameraStatus(false, "Hand detection not ready");
    return;
  }

  try {
    updateCameraStatus(true, "Starting camera...");

    const container = videoElement.parentElement;
    if (container) {
      canvasElement.width = container.clientWidth || 640;
      canvasElement.height = container.clientHeight || 360;
    }

    if (typeof Camera === "undefined") {
      updateCameraStatus(false, "Camera utils not loaded");
      return;
    }

    camera = new Camera(videoElement, {
      onFrame: async () => {
        if (hands && GestureState.isRunning) {
          await hands.send({ image: videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    await camera.start();
    GestureState.isRunning = true;
    updateCameraStatus(true, "Active");
  } catch (error) {
    console.error("[Gesture] Camera error:", error);
    updateCameraStatus(false, "Camera error");
  }
}

function stopCamera() {
  if (camera) {
    camera.stop();
    camera = null;
  }
  GestureState.isRunning = false;
  updateCameraStatus(false, "Stopped");
}

function updateCameraStatus(isActive, text) {
  if (cameraStatus) cameraStatus.classList.toggle("active", isActive);
  if (cameraStatusText) cameraStatusText.textContent = text;
}

window.initCamera = initCamera;
window.stopCamera = stopCamera;
window.initGestureDetection = initGestureDetection;

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (
      document.getElementById("dashboardPage")?.classList.contains("active")
    ) {
      initCamera();
    }
  }, 1500);
});
