import { useState, useEffect } from 'react';
import { api } from '../api/mockApi';
import { 
  ToggleLeft, 
  ToggleRight, 
  DoorOpen, 
  DoorClosed, 
  Droplets, 
  AlertTriangle,
  Power,
  Lock,
  Unlock
} from 'lucide-react';

const Controls = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  useEffect(() => {
    api.getStatus().then(data => {
      setStatus(data);
      setLoading(false);
    });

    const interval = setInterval(async () => {
      const data = await api.getStatus();
      setStatus(data);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleModeToggle = async () => {
    if (status.emergencyLockout) return;
    
    setActionInProgress('mode');
    const newMode = status.mode === 'auto' ? 'manual' : 'auto';
    await api.setMode(newMode);
    const updated = await api.getStatus();
    setStatus(updated);
    setActionInProgress(null);
  };

  const handleGateToggle = async () => {
    if (status.mode === 'auto' || status.emergencyLockout) return;
    
    setActionInProgress('gate');
    if (status.gateStatus === 'closed' || status.gateStatus === 'closing') {
      await api.openGate();
    } else {
      await api.closeGate();
    }
    setActionInProgress(null);
  };

  const handleMistingTrigger = async () => {
    if (status.mode === 'auto' || status.emergencyLockout) return;
    
    setActionInProgress('misting');
    await api.triggerMisting();
    setActionInProgress(null);
  };

  const handleEmergencyStop = async () => {
    setActionInProgress('emergency');
    await api.emergencyStop();
    const updated = await api.getStatus();
    setStatus(updated);
    setShowEmergencyConfirm(false);
    setActionInProgress(null);
  };

  const handleClearEmergency = async () => {
    setActionInProgress('clearEmergency');
    await api.clearEmergency();
    const updated = await api.getStatus();
    setStatus(updated);
    setActionInProgress(null);
  };

  const isGateOpen = status?.gateStatus === 'open' || status?.gateStatus === 'opening';
  const isGateInMotion = status?.gateStatus === 'opening' || status?.gateStatus === 'closing';
  const isMistingRunning = status?.mistingStatus === 'running';

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '16rem' }}>
        <div className="animate-spin" style={{ width: '3rem', height: '3rem', borderRadius: '50%', borderBottom: '2px solid var(--green-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Manual Override Controls</h2>
        <p className="text-gray-400" style={{ marginTop: '0.25rem' }}>Manual gate operation and emergency controls</p>
      </div>

      {/* Mode Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: status.mode === 'auto' ? 'var(--green-bg)' : 'var(--blue-bg)' }}>
              {status.mode === 'auto' ? (
                <Power className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
              ) : (
                <Unlock className="w-6 h-6" style={{ color: 'var(--blue-primary)' }} />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Operation Mode</p>
              <p className="text-xl font-semibold" style={{ color: status.mode === 'auto' ? 'var(--green-primary)' : 'var(--blue-primary)' }}>
                {status.mode === 'auto' ? 'Automatic' : 'Manual'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModeToggle}
            disabled={status.emergencyLockout || actionInProgress === 'mode'}
            className={`toggle ${status.mode === 'auto' ? 'toggle-on' : 'toggle-off'} ${status.emergencyLockout ? 'toggle-disabled' : ''}`}
            style={{ cursor: status.emergencyLockout ? 'not-allowed' : 'pointer' }}
          >
            <div
              className="toggle-knob"
              style={{ transform: status.mode === 'auto' ? 'translateX(2rem)' : 'translateX(0.25rem)' }}
            ></div>
          </button>
        </div>
        <p className="text-sm text-gray-500" style={{ marginTop: '0.75rem' }}>
          {status.mode === 'auto' 
            ? 'Gate operates automatically based on sensor detection' 
            : 'Manual control enabled - use buttons below to operate gate'}
        </p>
      </div>

      {/* Manual Controls */}
      <div className={`grid grid-cols-2 ${status.mode === 'auto' ? 'opacity-50 pointer-events-none' : ''}`} style={{ gap: '1rem' }}>
        {/* Gate Control */}
        <div className="card">
          <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
            {isGateOpen ? (
              <DoorOpen className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
            ) : (
              <DoorClosed className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
            )}
            <h3 className="text-lg font-semibold text-white">Gate Control</h3>
          </div>
          <button
            onClick={handleGateToggle}
            disabled={isGateInMotion || actionInProgress === 'gate'}
            className="btn w-full"
            style={{
              backgroundColor: isGateInMotion
                ? 'var(--amber-bg)'
                : isGateOpen
                ? 'var(--bg-tertiary)'
                : 'var(--green-primary)',
              color: isGateInMotion
                ? 'var(--amber-primary)'
                : isGateOpen
                ? 'var(--text-secondary)'
                : 'white',
              borderColor: isGateInMotion
                ? 'var(--amber-border)'
                : isGateOpen
                ? 'var(--border-color)'
                : 'var(--green-border)',
              cursor: isGateInMotion ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isGateInMotion && !isGateOpen) {
                e.currentTarget.style.backgroundColor = '#16a34a';
              } else if (!isGateInMotion && isGateOpen) {
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGateInMotion && !isGateOpen) {
                e.currentTarget.style.backgroundColor = 'var(--green-primary)';
              } else if (!isGateInMotion && isGateOpen) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }
            }}
          >
            {isGateInMotion ? (
              <>
                <div className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', borderBottom: '2px solid var(--amber-primary)' }}></div>
                <span>{status.gateStatus === 'opening' ? 'Opening...' : 'Closing...'}</span>
              </>
            ) : isGateOpen ? (
              <>
                <DoorClosed className="w-5 h-5" />
                <span>Close Gate</span>
              </>
            ) : (
              <>
                <DoorOpen className="w-5 h-5" />
                <span>Open Gate</span>
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 text-center" style={{ marginTop: '0.75rem' }}>
            Current: <span style={{ color: isGateOpen ? 'var(--green-primary)' : 'var(--text-secondary)' }}>{status.gateStatus}</span>
          </p>
        </div>

        {/* Misting Control */}
        <div className="card">
          <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
            <Droplets className={`w-6 h-6 ${isMistingRunning ? 'animate-pulse' : ''}`} style={{ color: isMistingRunning ? 'var(--blue-primary)' : 'var(--text-secondary)' }} />
            <h3 className="text-lg font-semibold text-white">Misting System</h3>
          </div>
          <button
            onClick={handleMistingTrigger}
            disabled={isMistingRunning || actionInProgress === 'misting'}
            className="btn w-full"
            style={{
              backgroundColor: isMistingRunning ? 'var(--blue-bg)' : 'var(--blue-primary)',
              color: isMistingRunning ? 'var(--blue-primary)' : 'white',
              borderColor: isMistingRunning ? 'var(--blue-border)' : '#2563eb',
              cursor: isMistingRunning ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isMistingRunning) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMistingRunning) {
                e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
              }
            }}
          >
            {isMistingRunning ? (
              <>
                <Droplets className="w-5 h-5 animate-pulse" />
                <span>Misting Active...</span>
              </>
            ) : (
              <>
                <Droplets className="w-5 h-5" />
                <span>Trigger Misting</span>
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 text-center" style={{ marginTop: '0.75rem' }}>
            Status: <span style={{ color: isMistingRunning ? 'var(--blue-primary)' : 'var(--text-secondary)' }}>{status.mistingStatus}</span>
          </p>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="card">
        <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
          <AlertTriangle className="w-6 h-6" style={{ color: 'var(--red-primary)' }} />
          <h3 className="text-lg font-semibold text-white">Emergency Controls</h3>
        </div>
        
        {status.emergencyLockout ? (
          <div className="space-y-4">
            <div style={{ backgroundColor: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '0.5rem', padding: '1rem' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--red-primary)', marginBottom: '0.5rem' }}>
                <Lock className="w-5 h-5" />
                <span className="font-semibold">System Locked Out</span>
              </div>
              <p className="text-sm text-gray-400">
                Emergency stop has been activated. All manual controls are disabled until the lockout is cleared.
              </p>
            </div>
            <button
              onClick={handleClearEmergency}
              disabled={actionInProgress === 'clearEmergency'}
              className="btn btn-secondary w-full"
            >
              {actionInProgress === 'clearEmergency' ? (
                <>
                  <div className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', borderBottom: '2px solid var(--text-secondary)' }}></div>
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  <span>Clear Emergency Lockout</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Emergency stop will immediately close the gate, stop misting, and disable all controls until cleared.
            </p>
            {!showEmergencyConfirm ? (
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="btn btn-danger w-full"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Emergency Stop</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div style={{ backgroundColor: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: '0.5rem', padding: '1rem' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--red-primary)', marginBottom: '0.25rem' }}>
                    Confirm Emergency Stop
                  </p>
                  <p className="text-xs text-gray-400">
                    This action cannot be undone. The system will lock out until manually cleared.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmergencyConfirm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmergencyStop}
                    disabled={actionInProgress === 'emergency'}
                    className="btn btn-danger-solid flex-1"
                  >
                    {actionInProgress === 'emergency' ? (
                      <>
                        <div className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', borderBottom: '2px solid white' }}></div>
                        <span>Stopping...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        <span>Confirm Stop</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Notice */}
      {status.mode === 'auto' && (
        <div className="flex items-center gap-3" style={{ backgroundColor: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: '0.5rem', padding: '1rem' }}>
          <ToggleLeft className="w-5 h-5" style={{ color: 'var(--amber-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--amber-primary)' }}>
            Manual controls are disabled in Automatic mode. Toggle to Manual mode to use manual controls.
          </p>
        </div>
      )}
    </div>
  );
};

export default Controls;
