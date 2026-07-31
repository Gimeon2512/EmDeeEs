import { useState, useEffect } from 'react';
import { api } from '../api/esp32Api';
import { 
  Activity, 
  DoorOpen, 
  Droplets, 
  Battery, 
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  WifiOff
} from 'lucide-react';

const Dashboard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    // Start real-time updates with polling
    const stopUpdates = api.startRealTimeUpdates((newStatus) => {
      setStatus(newStatus);
      setLoading(false);
      
      if (newStatus.connectionError) {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('connected');
      }
    });

    return () => {
      stopUpdates();
    };
  }, []);

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString();
  };

  const getStatusColor = (type, value) => {
    const colors = {
      gate: {
        open: 'var(--green-primary)',
        closed: 'var(--text-secondary)',
        opening: 'var(--amber-primary)',
        closing: 'var(--amber-primary)'
      },
      detection: {
        clear: 'var(--green-primary)',
        detected: 'var(--red-primary)'
      },
      misting: {
        idle: 'var(--text-secondary)',
        running: 'var(--blue-primary)'
      },
      battery: {
        high: 'var(--green-primary)',
        medium: 'var(--amber-primary)',
        low: 'var(--red-primary)'
      }
    };

    if (type === 'battery') {
      if (value > 50) return colors.battery.high;
      if (value > 20) return colors.battery.medium;
      return colors.battery.low;
    }

    return colors[type]?.[value] || 'var(--text-secondary)';
  };

  const getGateIcon = (gateStatus) => {
    switch (gateStatus) {
      case 'open':
        return <DoorOpen className="w-12 h-12" />;
      case 'closed':
        return <Shield className="w-12 h-12" />;
      case 'opening':
      case 'closing':
        return <Activity className="w-12 h-12 animate-pulse" />;
      default:
        return <Shield className="w-12 h-12" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '16rem' }}>
        <div className="animate-spin" style={{ width: '3rem', height: '3rem', borderRadius: '50%', borderBottom: '2px solid var(--green-primary)' }}></div>
      </div>
    );
  }

  // Show connection error state
  if (connectionStatus === 'disconnected' || status?.connectionError) {
    return (
      <div className="card" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center justify-center text-center">
          <WifiOff className="w-16 h-16 mb-4" style={{ color: 'var(--red-primary)' }} />
          <h2 className="text-2xl font-semibold text-white mb-2">Device Unreachable</h2>
          <p className="text-gray-400 mb-4">
            {status?.lastConnectionError || 'Unable to connect to ESP32 gate controller'}
          </p>
          <p className="text-sm text-gray-500">
            ESP32 URL: {api.getConnectionStatus().baseUrl}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure this device's WiFi is connected to the 'BiosecurityGate' network (not your regular WiFi or mobile hotspot).
          </p>
          <p className="text-sm text-gray-500 mt-1">
            You can find and join it in your device's WiFi settings — password: gate12345.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            You can update the ESP32 URL using the settings button in the header.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Live Dashboard</h2>
          <p className="text-gray-400" style={{ marginTop: '0.25rem' }}>Real-time gate system status</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last updated: {formatTime(status.lastUpdated)}</span>
          <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: 'var(--green-primary)', borderRadius: '50%', marginLeft: '0.5rem' }} className="animate-pulse"></div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
        {/* Ultrasonic Sensor */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400" style={{ marginBottom: '0.25rem' }}>Sensor Distance</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(status.sensorDistance)} cm
              </p>
            </div>
            <Activity className="w-6 h-6" style={{ color: getStatusColor('detection', status.detectionState) }} />
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: '0.75rem' }}>
            {status.detectionState === 'detected' ? (
              <>
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--red-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--red-primary)' }}>Vehicle Detected</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--green-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--green-primary)' }}>Clear</span>
              </>
            )}
          </div>
        </div>

        {/* Gate Status */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400" style={{ marginBottom: '0.25rem' }}>Gate Status</p>
              <p className="text-2xl font-bold text-white" style={{ textTransform: 'capitalize', color: getStatusColor('gate', status.gateStatus) }}>
                {status.gateStatus}
              </p>
            </div>
            <div style={{ color: getStatusColor('gate', status.gateStatus) }}>
              {getGateIcon(status.gateStatus)}
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span className={`badge ${
              status.gateStatus === 'open' 
                ? 'badge-green' 
                : status.gateStatus === 'closed'
                ? 'badge-gray'
                : 'badge-amber'
            }`}>
              {status.gateStatus === 'open' ? 'Accessible' : status.gateStatus === 'closed' ? 'Secured' : 'In Motion'}
            </span>
          </div>
        </div>

        {/* Misting Status */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400" style={{ marginBottom: '0.25rem' }}>Misting System</p>
              <p className="text-2xl font-bold text-white" style={{ textTransform: 'capitalize', color: getStatusColor('misting', status.mistingStatus) }}>
                {status.mistingStatus}
              </p>
            </div>
            <Droplets className={`w-6 h-6 ${status.mistingStatus === 'running' ? 'animate-pulse' : ''}`} style={{ color: getStatusColor('misting', status.mistingStatus) }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span className={`badge ${
              status.mistingStatus === 'running'
                ? 'badge-blue'
                : 'badge-gray'
            }`}>
              {status.mistingStatus === 'running' ? 'Active Cycle' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Battery Level */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400" style={{ marginBottom: '0.25rem' }}>Battery Level</p>
              <p className="text-2xl font-bold text-white" style={{ color: getStatusColor('battery', status.batteryLevel) }}>
                {Math.round(status.batteryLevel)}%
              </p>
            </div>
            <Battery className="w-6 h-6" style={{ color: getStatusColor('battery', status.batteryLevel) }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ 
                  width: `${status.batteryLevel}%`,
                  backgroundColor: status.batteryLevel > 50 
                    ? 'var(--green-primary)' 
                    : status.batteryLevel > 20 
                    ? 'var(--amber-primary)' 
                    : 'var(--red-primary)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gate Visualization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white" style={{ marginBottom: '1rem' }}>Gate Visualization</h3>
        <div className="relative" style={{ height: '12rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {/* Ground */}
          <div className="absolute" style={{ bottom: 0, left: 0, right: 0, height: '2rem', backgroundColor: '#4b5563' }}></div>
          
          {/* Gate Post */}
          <div className="absolute" style={{ bottom: '2rem', left: '25%', width: '1rem', height: '8rem', backgroundColor: '#4b5563', borderRadius: '0.25rem 0.25rem 0 0' }}></div>
          <div className="absolute" style={{ bottom: '2rem', right: '25%', width: '1rem', height: '8rem', backgroundColor: '#4b5563', borderRadius: '0.25rem 0.25rem 0 0' }}></div>
          
          {/* Gate Arm */}
          <div 
            className="absolute transition-all"
            style={{
              bottom: '9rem',
              left: '25%',
              right: '25%',
              height: '0.75rem',
              borderRadius: '0.25rem',
              backgroundColor: status.gateStatus === 'open' 
                ? 'rgba(34, 197, 94, 0.5)' 
                : status.gateStatus === 'opening' || status.gateStatus === 'closing'
                ? 'rgba(245, 158, 11, 0.5)'
                : '#6b7280',
              transform: status.gateStatus === 'open' ? 'rotate(90deg)' : 'rotate(0deg)',
              transformOrigin: 'left center',
              transition: 'transform 1s'
            }}
          ></div>
          
          {/* Detection Zone */}
          <div className="absolute transition-colors" style={{
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8rem',
            height: '6rem',
            border: '2px dashed',
            borderRadius: '0.5rem',
            borderColor: status.detectionState === 'detected' ? 'var(--red-primary)' : '#4b5563',
            backgroundColor: status.detectionState === 'detected' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
          }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {status.detectionState === 'detected' && (
                <div className="animate-ping" style={{ width: '2rem', height: '2rem', backgroundColor: 'var(--red-primary)', borderRadius: '50%' }}></div>
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="absolute" style={{ top: '1rem', left: '1rem' }}>
            <span className={`badge ${
              status.emergencyLockout
                ? 'badge-red'
                : status.mode === 'auto'
                ? 'badge-green'
                : 'badge-blue'
            }`}>
              {status.emergencyLockout ? 'EMERGENCY LOCKOUT' : status.mode.toUpperCase() + ' MODE'}
            </span>
          </div>

          {/* Misting Indicator */}
          {status.mistingStatus === 'running' && (
            <div className="absolute flex items-center gap-2" style={{ top: '1rem', right: '1rem' }}>
              <Droplets className="w-5 h-5 animate-pulse" style={{ color: 'var(--blue-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--blue-primary)' }}>Misting Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: status.mode === 'auto' ? 'var(--green-primary)' : 'var(--blue-primary)' }} />
            <div>
              <p className="text-sm text-gray-400">Current Mode</p>
              <p className="font-semibold" style={{ color: status.mode === 'auto' ? 'var(--green-primary)' : 'var(--blue-primary)' }}>
                {status.mode === 'auto' ? 'Automatic' : 'Manual Override'}
              </p>
            </div>
          </div>
          {status.emergencyLockout && (
            <div className="flex items-center gap-2" style={{ color: 'var(--red-primary)' }}>
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Emergency Lockout Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
