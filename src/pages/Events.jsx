import { useState, useEffect } from 'react';
import { api } from '../api/esp32Api';
import { 
  History, 
  Download, 
  Filter, 
  Calendar,
  ChevronDown,
  Activity,
  Droplets,
  DoorOpen,
  AlertTriangle,
  Settings
} from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: History },
    { value: 'detection', label: 'Detections', icon: Activity },
    { value: 'misting', label: 'Misting', icon: Droplets },
    { value: 'gate', label: 'Gate Operations', icon: DoorOpen },
    { value: 'mode_change', label: 'Mode Changes', icon: Settings },
    { value: 'fault', label: 'Faults/Alerts', icon: AlertTriangle },
  ];

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    setLoading(true);
    const apiFilters = {};
    if (filters.type !== 'all') apiFilters.type = filters.type;
    if (filters.startDate) apiFilters.startDate = filters.startDate;
    if (filters.endDate) apiFilters.endDate = filters.endDate;
    
    const data = await api.getEvents(apiFilters);
    setEvents(data);
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Event Type', 'Detail'];
    const rows = events.map(event => [
      event.timestamp,
      event.type,
      event.detail
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gate_events_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type) => {
    const typeConfig = eventTypes.find(t => t.value === type);
    if (!typeConfig) return History;
    return typeConfig.icon;
  };

  const getEventColor = (type) => {
    const colors = {
      detection: 'badge-blue',
      misting: 'badge-cyan',
      gate: 'badge-green',
      mode_change: 'badge-purple',
      fault: 'badge-red',
    };
    return colors[type] || 'badge-gray';
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const activeFilterCount = [filters.type, filters.startDate, filters.endDate].filter(
    v => v && v !== 'all'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Event Log</h2>
          <p className="text-gray-400" style={{ marginTop: '0.25rem' }}>System event history and activity log</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn btn-secondary"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between"
          style={{ 
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            borderRadius: '1rem'
          }}
        >
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-white">Filters</span>
            {activeFilterCount > 0 && (
              <span className="badge badge-green text-xs">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <ChevronDown 
            className="w-5 h-5 text-gray-400"
            style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </button>

        {showFilters && (
          <div style={{ 
            padding: '1rem 1.5rem 1.5rem', 
            borderTop: '1px solid var(--border-color)',
            borderBottomLeftRadius: '1rem',
            borderBottomRightRadius: '1rem'
          }}>
            {/* Event Type Filter */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400" style={{ marginBottom: '0.5rem' }}>Event Type</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleFilterChange('type', type.value)}
                        className="btn"
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: filters.type === type.value ? 'var(--green-bg)' : 'var(--bg-tertiary)',
                          color: filters.type === type.value ? 'var(--green-primary)' : 'var(--text-secondary)',
                          borderColor: filters.type === type.value ? 'var(--green-border)' : 'var(--border-color)'
                        }}
                        onMouseEnter={(e) => {
                          if (filters.type !== type.value) {
                            e.currentTarget.style.backgroundColor = '#374151';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (filters.type !== type.value) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div>
                  <label className="block text-sm text-gray-400" style={{ marginBottom: '0.5rem' }}>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400" style={{ marginBottom: '0.5rem' }}>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400"
                  style={{ 
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: '16rem' }}>
            <div className="animate-spin" style={{ width: '3rem', height: '3rem', borderRadius: '50%', borderBottom: '2px solid var(--green-primary)' }}></div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400" style={{ height: '16rem' }}>
            <History className="w-12 h-12 mb-4" style={{ opacity: 0.5 }} />
            <p>No events found</p>
            <p className="text-sm" style={{ marginTop: '0.25rem' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const Icon = getEventIcon(event.type);
                  const { date, time } = formatTimestamp(event.timestamp);
                  
                  return (
                    <tr key={event.id}>
                      <td data-label="Type">
                        <div className={`badge ${getEventColor(event.type)}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium" style={{ textTransform: 'capitalize' }}>{event.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-300" data-label="Date">{date}</td>
                      <td className="text-sm text-gray-400" data-label="Time">{time}</td>
                      <td className="text-sm text-gray-300" data-label="Detail">{event.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Count */}
      {!loading && events.length > 0 && (
        <div className="text-sm text-gray-400">
          Showing {events.length} event{events.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 && ' (filtered)'}
        </div>
      )}
    </div>
  );
};

export default Events;
