import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, History, Shield, Menu, X, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { api } from '../api/esp32Api';

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  // Poll connection status
  useEffect(() => {
    const checkConnection = () => {
      const connStatus = api.getConnectionStatus();
      setConnectionStatus(connStatus.status);
    };

    // Check immediately
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/controls', label: 'Controls', icon: Settings },
    { path: '/events', label: 'Event Log', icon: History },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '1rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div style={{ backgroundColor: 'var(--green-bg)', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Shield className="w-6 h-6" style={{ color: 'var(--green-primary)' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">FarmGate Security</h1>
              <p className="text-sm text-gray-400">Biosecurity Gate Control System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4" style={{ color: 'var(--green-primary)' }} />
                  <span className="text-sm text-gray-400">ESP32 Connected</span>
                </>
              ) : connectionStatus === 'disconnected' ? (
                <>
                  <WifiOff className="w-4 h-4" style={{ color: 'var(--red-primary)' }} />
                  <span className="text-sm text-gray-400">ESP32 Offline</span>
                </>
              ) : (
                <>
                  <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: 'var(--amber-primary)', borderRadius: '50%' }} className="animate-pulse"></div>
                  <span className="text-sm text-gray-400">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container flex">
        {/* Sidebar Navigation */}
        <nav 
          className="sidebar"
          style={{ 
            width: '16rem', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRight: '1px solid var(--border-color)', 
            padding: '1rem', 
            position: 'sticky', 
            top: '73px', 
            height: 'calc(100vh - 73px)'
          }}
        >
          <ul className="space-y-4" style={{ listStyle: 'none' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      ...(isActive ? {
                        backgroundColor: 'var(--green-bg)',
                        color: 'var(--green-primary)',
                        border: '1px solid var(--green-border)'
                      } : {
                        color: 'var(--text-secondary)'
                      })
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="space-y-4" style={{ listStyle: 'none' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        ...(isActive ? {
                          backgroundColor: 'var(--green-bg)',
                          color: 'var(--green-primary)',
                          border: '1px solid var(--green-border)'
                        } : {
                          color: 'var(--text-secondary)'
                        })
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
