// Mock API layer for ESP32 gate system
// Replace these functions with actual fetch calls to ESP32 endpoints when ready

// Simulated state
let mockState = {
  gateStatus: 'closed', // 'open' | 'closed' | 'opening' | 'closing'
  sensorDistance: 150, // cm
  detectionState: 'clear', // 'clear' | 'detected'
  mistingStatus: 'idle', // 'idle' | 'running'
  batteryLevel: 87, // percentage
  mode: 'auto', // 'auto' | 'manual'
  emergencyLockout: false,
  lastUpdated: new Date().toISOString()
};

// Simulated event log
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

// Simulate real-time updates
let updateInterval = null;

export const api = {
  // Get current system status
  getStatus: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate sensor reading fluctuation
    mockState.sensorDistance = Math.max(20, Math.min(300, mockState.sensorDistance + (Math.random() - 0.5) * 10));
    mockState.detectionState = mockState.sensorDistance < 50 ? 'detected' : 'clear';
    mockState.lastUpdated = new Date().toISOString();
    
    return { ...mockState };
  },

  // Open gate
  openGate: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.gateStatus = 'opening';
    
    // Simulate gate opening time
    setTimeout(() => {
      mockState.gateStatus = 'open';
      addEvent('gate', 'Gate opened');
    }, 2000);
    
    return { success: true };
  },

  // Close gate
  closeGate: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.gateStatus = 'closing';
    
    // Simulate gate closing time
    setTimeout(() => {
      mockState.gateStatus = 'closed';
      addEvent('gate', 'Gate closed');
    }, 2000);
    
    return { success: true };
  },

  // Trigger misting cycle
  triggerMisting: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.mistingStatus = 'running';
    
    // Simulate misting duration
    const duration = Math.floor(Math.random() * 10) + 10; // 10-20 seconds
    setTimeout(() => {
      mockState.mistingStatus = 'idle';
      addEvent('misting', `Misting cycle completed (${duration}s)`);
    }, duration * 1000);
    
    return { success: true, duration };
  },

  // Set mode (auto/manual)
  setMode: async (mode) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.mode = mode;
    addEvent('mode_change', `Switched to ${mode === 'auto' ? 'Auto' : 'Manual'} mode`);
    return { success: true };
  },

  // Emergency stop/lockout
  emergencyStop: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.emergencyLockout = true;
    mockState.gateStatus = 'closed';
    mockState.mistingStatus = 'idle';
    addEvent('fault', 'Emergency stop activated - system locked');
    return { success: true };
  },

  // Clear emergency lockout
  clearEmergency: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    mockState.emergencyLockout = false;
    addEvent('mode_change', 'Emergency lockout cleared');
    return { success: true };
  },

  // Get event log
  getEvents: async (filters = {}) => {
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

  // Start real-time updates (simulated)
  startRealTimeUpdates: (callback) => {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
      // Simulate occasional detection
      if (Math.random() < 0.05) {
        mockState.sensorDistance = Math.random() * 40 + 10;
        mockState.detectionState = 'detected';
        addEvent('detection', 'Vehicle detected at entry');
        
        // Auto mode: trigger gate and misting
        if (mockState.mode === 'auto' && !mockState.emergencyLockout) {
          setTimeout(() => {
            mockState.gateStatus = 'opening';
            setTimeout(() => {
              mockState.gateStatus = 'open';
              addEvent('gate', 'Gate opened (auto)');
              
              setTimeout(() => {
                mockState.mistingStatus = 'running';
                const duration = Math.floor(Math.random() * 10) + 10;
                setTimeout(() => {
                  mockState.mistingStatus = 'idle';
                  addEvent('misting', `Misting cycle completed (${duration}s)`);
                  
                  setTimeout(() => {
                    mockState.gateStatus = 'closing';
                    setTimeout(() => {
                      mockState.gateStatus = 'closed';
                      addEvent('gate', 'Gate closed (auto)');
                    }, 2000);
                  }, 1000);
                }, duration * 1000);
              }, 1000);
            }, 2000);
          }, 500);
        }
      } else {
        mockState.sensorDistance = Math.max(50, Math.min(300, mockState.sensorDistance + (Math.random() - 0.5) * 5));
        mockState.detectionState = 'clear';
      }
      
      // Simulate battery drain
      mockState.batteryLevel = Math.max(0, mockState.batteryLevel - 0.01);
      mockState.lastUpdated = new Date().toISOString();
      
      callback({ ...mockState });
    }, 1000);
  },

  // Stop real-time updates
  stopRealTimeUpdates: () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
};

// Helper function to add events
function addEvent(type, detail) {
  mockEvents.unshift({
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    type,
    detail
  });
  
  // Keep only last 100 events
  if (mockEvents.length > 100) {
    mockEvents = mockEvents.slice(0, 100);
  }
}
