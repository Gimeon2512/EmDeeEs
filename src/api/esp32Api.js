// Real ESP32 API layer for gate system
// Connects to ESP32 REST API over WiFi

// Get ESP32 base URL from localStorage or env variable
const getESP32BaseUrl = () => {
  const savedUrl = localStorage.getItem('esp32BaseUrl');
  if (savedUrl) return savedUrl;
  return import.meta.env.VITE_ESP32_BASE_URL || 'http://biogate.local';
};

const ESP32_BASE_URL = getESP32BaseUrl();

// Connection state
let connectionStatus = 'unknown'; // 'unknown' | 'connected' | 'disconnected'
let lastConnectionError = null;
let pendingStatusRequest = null;

// Allow dynamic URL updates
export const setESP32BaseUrl = (url) => {
  localStorage.setItem('esp32BaseUrl', url);
  // Force reload to apply new URL
  window.location.reload();
};

// Simulated event log (ESP32 doesn't have historical events endpoint yet)
let mockEvents = [
  { id: 1, timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'detection', detail: 'Vehicle detected at entry' },
  { id: 2, timestamp: new Date(Date.now() - 3500000).toISOString(), type: 'misting', detail: 'Misting cycle completed (15s)' },
  { id: 3, timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'gate', detail: 'Gate opened' },
  { id: 4, timestamp: new Date(Date.now() - 7300000).toISOString(), type: 'mode_change', detail: 'Switched to Auto mode' },
  { id: 5, timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'detection', detail: 'Vehicle detected at entry' },
  { id: 6, timestamp: new Date(Date.now() - 86500000).toISOString(), type: 'misting', detail: 'Misting cycle completed (12s)' },
  { id: 7, timestamp: new Date(Date.now() - 172800000).toISOString(), type: 'fault', detail: 'Low battery warning' },
];

let eventIdCounter = 8;

// Helper function to add events (local only for now)
function addEvent(type, detail) {
  mockEvents.unshift({
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    type,
    detail
  });
  
  if (mockEvents.length > 100) {
    mockEvents = mockEvents.slice(0, 100);
  }
}

// Helper for fetch with error handling
async function fetchESP32(endpoint, options = {}) {
  try {
    const url = `${ESP32_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    connectionStatus = 'connected';
    lastConnectionError = null;
    return data;
  } catch (error) {
    connectionStatus = 'disconnected';
    lastConnectionError = error.message;
    throw error;
  }
}

export const api = {
  // Get current system status
  getStatus: async () => {
    // Prevent overlapping requests
    if (pendingStatusRequest) {
      return pendingStatusRequest;
    }

    pendingStatusRequest = fetchESP32('/status')
      .then(data => {
        // Transform ESP32 response to match our state format
        return {
          gateStatus: data.gateOpen ? 'open' : 'closed',
          sensorDistance: 150, // ESP32 doesn't provide this in status endpoint
          detectionState: data.state === 'approaching' ? 'detected' : 'clear',
          mistingStatus: data.misting ? 'running' : 'idle',
          batteryLevel: 87, // ESP32 doesn't provide this in status endpoint
          mode: data.mode,
          emergencyLockout: false, // ESP32 doesn't provide this in status endpoint
          lastUpdated: new Date().toISOString(),
          // Include raw ESP32 data for reference
          esp32State: data.state,
          esp32GateOpen: data.gateOpen,
          esp32Misting: data.misting,
        };
      })
      .finally(() => {
        pendingStatusRequest = null;
      });

    return pendingStatusRequest;
  },

  // Open gate
  openGate: async () => {
    try {
      await fetchESP32('/gate/open', { method: 'POST' });
      addEvent('gate', 'Gate opened');
      return { success: true };
    } catch (error) {
      console.error('Failed to open gate:', error);
      return { success: false, error: error.message };
    }
  },

  // Close gate
  closeGate: async () => {
    try {
      await fetchESP32('/gate/close', { method: 'POST' });
      addEvent('gate', 'Gate closed');
      return { success: true };
    } catch (error) {
      console.error('Failed to close gate:', error);
      return { success: false, error: error.message };
    }
  },

  // Trigger misting cycle
  triggerMisting: async () => {
    try {
      await fetchESP32('/mist/trigger', { method: 'POST' });
      addEvent('misting', 'Misting cycle triggered');
      return { success: true };
    } catch (error) {
      console.error('Failed to trigger misting:', error);
      return { success: false, error: error.message };
    }
  },

  // Set mode (auto/manual)
  setMode: async (mode) => {
    try {
      await fetchESP32('/mode', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      addEvent('mode_change', `Switched to ${mode === 'auto' ? 'Auto' : 'Manual'} mode`);
      return { success: true };
    } catch (error) {
      console.error('Failed to set mode:', error);
      return { success: false, error: error.message };
    }
  },

  // Emergency stop/lockout (not available on ESP32 yet)
  emergencyStop: async () => {
    // ESP32 doesn't have this endpoint yet, but keep interface consistent
    addEvent('fault', 'Emergency stop activated - system locked');
    return { success: true, note: 'Not implemented on ESP32 yet' };
  },

  // Clear emergency lockout (not available on ESP32 yet)
  clearEmergency: async () => {
    // ESP32 doesn't have this endpoint yet, but keep interface consistent
    addEvent('mode_change', 'Emergency lockout cleared');
    return { success: true, note: 'Not implemented on ESP32 yet' };
  },

  // Get event log (local mock data for now)
  getEvents: async (filters = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filtered = [...mockEvents];
    
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return filtered;
  },

  // Start real-time updates (polling)
  startRealTimeUpdates: (callback) => {
    const pollInterval = 2000; // Poll every 2 seconds
    
    const poll = async () => {
      try {
        const status = await api.getStatus();
        callback(status);
      } catch (error) {
        // Still call callback with error state
        callback({
          gateStatus: 'unknown',
          sensorDistance: 0,
          detectionState: 'unknown',
          mistingStatus: 'unknown',
          batteryLevel: 0,
          mode: 'unknown',
          emergencyLockout: false,
          lastUpdated: new Date().toISOString(),
          connectionError: true,
          connectionStatus,
          lastConnectionError,
        });
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    const intervalId = setInterval(poll, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  },

  // Stop real-time updates
  stopRealTimeUpdates: () => {
    // Cleanup is handled by the function returned from startRealTimeUpdates
  },

  // Get connection status
  getConnectionStatus: () => ({
    status: connectionStatus,
    lastError: lastConnectionError,
    baseUrl: ESP32_BASE_URL,
  }),
};
