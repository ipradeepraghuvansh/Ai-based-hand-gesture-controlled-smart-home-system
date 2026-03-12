const API_BASE = "http://localhost:3000/api";

const DeviceStates = {
  lights: { on: false, brightness: 75, selectedRoom: "living" },
  fan: { on: false, speed: 0 },
  ac: { on: false, temperature: 24 },
  door: { locked: true },
};

// DOM Elements Cache
let deviceElements = {};

// Initialize device controls
async function initDevices() {
  cacheElements();
  setupEventListeners();

  // Try to fetch devices from backend
  await loadDevicesFromBackend();
  updateAllDisplays();
}

// Load devices from backend
async function loadDevicesFromBackend() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const devices = await response.json();
      updateLocalStatesFromDevices(devices);
    }
  } catch (error) {
    console.log("Using local device states (offline mode)");
  }
}

// Update local states from backend devices
function updateLocalStatesFromDevices(devices) {
  devices.forEach((device) => {
    if (device.type === "light") {
      DeviceStates.lights.on = device.state;
      DeviceStates.lights.brightness = device.settings?.brightness || 75;
      DeviceStates.lights.selectedRoom = device.room || "living";
    } else if (device.type === "fan") {
      DeviceStates.fan.on = device.state;
      DeviceStates.fan.speed = device.settings?.speed || 0;
    } else if (device.type === "ac") {
      DeviceStates.ac.on = device.state;
      DeviceStates.ac.temperature = device.settings?.temperature || 24;
    } else if (device.type === "door") {
      DeviceStates.door.locked = device.state;
    }
  });
}

// Cache DOM elements - call this when dashboard becomes active
function cacheElements() {
  console.log("[Devices] Caching elements...");

  // Don't re-cache if already cached
  if (deviceElements.lightCard) {
    console.log("[Devices] Elements already cached");
    return;
  }

  deviceElements = {
    lightCard: document.getElementById("lightCard"),
    lightStatus: document.getElementById("lightStatus"),
    lightToggle: document.getElementById("lightToggle"),
    brightnessSlider: document.getElementById("brightnessSlider"),
    brightnessValue: document.getElementById("brightnessValue"),
    roomBtns: document.querySelectorAll(".room-btn"),
    fanCard: document.getElementById("fanCard"),
    fanStatus: document.getElementById("fanStatus"),
    speedBtns: document.querySelectorAll(".speed-btn"),
    acCard: document.getElementById("acCard"),
    acStatus: document.getElementById("acStatus"),
    acToggle: document.getElementById("acToggle"),
    tempValue: document.getElementById("tempValue"),
    tempDown: document.getElementById("tempDown"),
    tempUp: document.getElementById("tempUp"),
    doorCard: document.getElementById("doorCard"),
    doorStatus: document.getElementById("doorStatus"),
    doorToggle: document.getElementById("doorToggle"),
    doorIcon: document.querySelector("#doorCard .device-icon"),
    activityList: document.getElementById("activityList"),
  };

  console.log("[Devices] Elements found:", {
    lightCard: !!deviceElements.lightCard,
    lightToggle: !!deviceElements.lightToggle,
    fanCard: !!deviceElements.fanCard,
    activityList: !!deviceElements.activityList,
  });

  // Setup event listeners after caching
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  if (deviceElements.lightToggle) {
    deviceElements.lightToggle.addEventListener("change", (e) =>
      setLightState(e.target.checked),
    );
  }
  if (deviceElements.brightnessSlider) {
    deviceElements.brightnessSlider.addEventListener("input", (e) =>
      setLightBrightness(parseInt(e.target.value)),
    );
  }
  if (deviceElements.roomBtns) {
    deviceElements.roomBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => selectRoom(e.target.dataset.room));
    });
  }
  if (deviceElements.speedBtns) {
    deviceElements.speedBtns.forEach((btn) => {
      btn.addEventListener("click", (e) =>
        setFanSpeed(parseInt(e.target.closest(".speed-btn").dataset.speed)),
      );
    });
  }
  if (deviceElements.acToggle) {
    deviceElements.acToggle.addEventListener("change", (e) =>
      setACState(e.target.checked),
    );
  }
  if (deviceElements.tempDown) {
    deviceElements.tempDown.addEventListener("click", () =>
      adjustTemperature(-1),
    );
  }
  if (deviceElements.tempUp) {
    deviceElements.tempUp.addEventListener("click", () => adjustTemperature(1));
  }
  if (deviceElements.doorToggle) {
    deviceElements.doorToggle.addEventListener("click", () => toggleDoorLock());
  }
}

// LIGHT CONTROLS
async function setLightState(isOn) {
  // Ensure elements are cached
  if (!deviceElements.lightCard) {
    cacheElements();
  }

  DeviceStates.lights.on = isOn;
  updateLightDisplay();
  await sendDeviceUpdate("light", isOn, {
    brightness: DeviceStates.lights.brightness,
  });
  addActivity(
    `Lights turned ${isOn ? "ON" : "OFF"} in ${DeviceStates.lights.selectedRoom}`,
    isOn ? "success" : "info",
  );
}

async function toggleLight() {
  // Ensure elements are cached
  if (!deviceElements.lightCard) {
    cacheElements();
  }

  DeviceStates.lights.on = !DeviceStates.lights.on;
  updateLightDisplay();
  await sendDeviceUpdate("light", DeviceStates.lights.on, {
    brightness: DeviceStates.lights.brightness,
  });
  addActivity(
    `Lights toggled ${DeviceStates.lights.on ? "ON" : "OFF"}`,
    "info",
  );
}

async function setLightBrightness(brightness) {
  DeviceStates.lights.brightness = brightness;
  if (deviceElements.brightnessValue) {
    deviceElements.brightnessValue.textContent = `${brightness}%`;
  }
  await sendDeviceUpdate("light", DeviceStates.lights.on, { brightness });
}

function selectRoom(room) {
  DeviceStates.lights.selectedRoom = room;
  if (deviceElements.roomBtns) {
    deviceElements.roomBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.room === room);
    });
  }
  addActivity(
    `Selected ${room.charAt(0).toUpperCase() + room.slice(1)} room`,
    "info",
  );
}

function updateLightDisplay() {
  if (
    !deviceElements.lightStatus ||
    !deviceElements.lightToggle ||
    !deviceElements.lightCard
  )
    return;
  const isOn = DeviceStates.lights.on;
  deviceElements.lightStatus.textContent = isOn ? "ON" : "OFF";
  deviceElements.lightStatus.classList.toggle("active", isOn);
  deviceElements.lightToggle.checked = isOn;
  deviceElements.lightCard.classList.toggle("active", isOn);
  const lightIcon = deviceElements.lightCard.querySelector(".device-icon i");
  if (lightIcon) lightIcon.style.color = isOn ? "#ffbe00" : "#ffa502";
}

// FAN CONTROLS
async function setFanSpeed(speed) {
  // Ensure elements are cached
  if (!deviceElements.fanCard) {
    cacheElements();
  }

  DeviceStates.fan.speed = speed;
  DeviceStates.fan.on = speed > 0;
  updateFanDisplay();
  await sendDeviceUpdate("fan", speed > 0, { speed });
  addActivity(
    `Fan speed set to ${speed === 0 ? "OFF" : "Level " + speed}`,
    "info",
  );
}

async function cycleFanSpeed() {
  // Ensure elements are cached
  if (!deviceElements.fanCard) {
    cacheElements();
  }

  const newSpeed = (DeviceStates.fan.speed + 1) % 4;
  await setFanSpeed(newSpeed);
}

function updateFanDisplay() {
  if (
    !deviceElements.fanStatus ||
    !deviceElements.fanCard ||
    !deviceElements.speedBtns
  )
    return;
  const speed = DeviceStates.fan.speed;
  deviceElements.fanStatus.textContent = speed === 0 ? "OFF" : `Level ${speed}`;
  deviceElements.fanStatus.classList.toggle("active", speed > 0);
  deviceElements.fanCard.classList.toggle("active", speed > 0);
  deviceElements.speedBtns.forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.dataset.speed) === speed);
  });
  const fanIcon = deviceElements.fanCard.querySelector(".device-icon i");
  if (fanIcon) {
    fanIcon.style.animation =
      speed > 0 ? `spin ${2 / speed}s linear infinite` : "none";
  }
}

// AC CONTROLS
async function setACState(isOn) {
  DeviceStates.ac.on = isOn;
  updateACDisplay();
  await sendDeviceUpdate("ac", isOn, {
    temperature: DeviceStates.ac.temperature,
  });
  addActivity(
    `Air Conditioner turned ${isOn ? "ON" : "OFF"}`,
    isOn ? "success" : "info",
  );
}

async function adjustTemperature(delta) {
  if (!DeviceStates.ac.on) {
    addActivity("Turn on AC first to adjust temperature", "warning");
    return;
  }
  const newTemp = DeviceStates.ac.temperature + delta;
  if (newTemp >= 16 && newTemp <= 30) {
    DeviceStates.ac.temperature = newTemp;
    updateACDisplay();
    await sendDeviceUpdate("ac", true, { temperature: newTemp });
    addActivity(`AC temperature set to ${newTemp}°C`, "info");
  }
}

function updateACDisplay() {
  if (
    !deviceElements.acStatus ||
    !deviceElements.acToggle ||
    !deviceElements.acCard ||
    !deviceElements.tempValue
  )
    return;
  const isOn = DeviceStates.ac.on;
  deviceElements.acStatus.textContent = isOn
    ? `${DeviceStates.ac.temperature}°C`
    : "OFF";
  deviceElements.acStatus.classList.toggle("active", isOn);
  deviceElements.acToggle.checked = isOn;
  deviceElements.acCard.classList.toggle("active", isOn);
  deviceElements.tempValue.textContent = `${DeviceStates.ac.temperature}°C`;
  if (deviceElements.tempDown && deviceElements.tempUp) {
    deviceElements.tempDown.disabled = !isOn;
    deviceElements.tempUp.disabled = !isOn;
  }
}

// DOOR CONTROLS
async function toggleDoorLock() {
  DeviceStates.door.locked = !DeviceStates.door.locked;
  updateDoorDisplay();
  await sendDeviceUpdate("door", !DeviceStates.door.locked, {});
  addActivity(
    `Door ${DeviceStates.door.locked ? "LOCKED" : "UNLOCKED"}`,
    DeviceStates.door.locked ? "warning" : "success",
  );
}

function updateDoorDisplay() {
  if (
    !deviceElements.doorStatus ||
    !deviceElements.doorToggle ||
    !deviceElements.doorCard ||
    !deviceElements.doorIcon
  )
    return;
  const isLocked = DeviceStates.door.locked;
  deviceElements.doorStatus.textContent = isLocked ? "LOCKED" : "UNLOCKED";
  deviceElements.doorStatus.classList.toggle("locked", isLocked);
  deviceElements.doorToggle.classList.toggle("unlocked", !isLocked);
  deviceElements.doorCard.classList.toggle("active", !isLocked);
  const icon = isLocked ? "fa-lock" : "fa-lock-open";
  const text = isLocked ? "Unlock" : "Lock";
  deviceElements.doorToggle.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
  const doorIconEl = deviceElements.doorIcon.querySelector("i");
  if (doorIconEl) doorIconEl.className = `fas ${icon}`;
}

// BACKEND INTEGRATION
async function sendDeviceUpdate(type, state, settings = {}) {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  try {
    await fetch(`${API_BASE}/devices/toggle/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        state,
        settings,
        gesture: DeviceStates.lastGesture || "manual",
      }),
    });
    await logActivityToBackend(
      "device",
      state ? "Turned ON" : "Turned OFF",
      type,
    );
  } catch (error) {
    console.log("Device update saved locally (offline mode)");
  }
}

async function logActivityToBackend(
  type,
  action,
  device = null,
  gesture = null,
) {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  try {
    await fetch(`${API_BASE}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, action, device, gesture }),
    });
  } catch (error) {
    console.log("Activity saved locally (offline mode)");
  }
}

// ACTIVITY LOG
function addActivity(message, type = "info") {
  if (!deviceElements.activityList) return;
  const time = new Date().toLocaleTimeString();
  const icon =
    type === "success"
      ? "fa-check-circle"
      : type === "warning"
        ? "fa-exclamation-circle"
        : type === "error"
          ? "fa-times-circle"
          : "fa-info-circle";
  const activityItem = document.createElement("div");
  activityItem.className = "activity-item";
  activityItem.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span><span class="activity-time">${time}</span>`;
  deviceElements.activityList.insertBefore(
    activityItem,
    deviceElements.activityList.firstChild,
  );
  const items = deviceElements.activityList.querySelectorAll(".activity-item");
  if (items.length > 20) items[items.length - 1].remove();
}

function updateDeviceFromServer(data) {
  if (data.deviceId) {
  }
}
function addActivityFromServer(activity) {
  addActivity(
    activity.action,
    activity.type === "gesture" ? "info" : "success",
  );
}

function getDeviceStates() {
  return {
    lightsOn: DeviceStates.lights.on,
    lightBrightness: DeviceStates.lights.brightness,
    selectedRoom: DeviceStates.lights.selectedRoom,
    fanSpeed: DeviceStates.fan.speed,
    fanOn: DeviceStates.fan.on,
    acOn: DeviceStates.ac.on,
    acTemperature: DeviceStates.ac.temperature,
    doorLocked: DeviceStates.door.locked,
  };
}

function updateAllDisplays() {
  updateLightDisplay();
  updateFanDisplay();
  updateACDisplay();
  updateDoorDisplay();
}

// Add CSS animation for fan
const style = document.createElement("style");
style.textContent =
  "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
document.head.appendChild(style);

// Make functions globally available
window.setLightState = setLightState;
window.toggleLight = toggleLight;
window.setLightBrightness = setLightBrightness;
window.selectRoom = selectRoom;
window.setFanSpeed = setFanSpeed;
window.cycleFanSpeed = cycleFanSpeed;
window.setACState = setACState;
window.adjustTemperature = adjustTemperature;
window.toggleDoorLock = toggleDoorLock;
window.getDeviceStates = getDeviceStates;
window.addActivity = addActivity;
window.updateDeviceFromServer = updateDeviceFromServer;
window.addActivityFromServer = addActivityFromServer;
window.initDevices = initDevices;
