import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Calendar as CalendarIcon, FileText, Shield, LogOut, User } from 'lucide-react';
import Calendar from './components/Calendar';
import Logs from './components/Logs';
import Home from './components/Home';
import News from './components/News';
import Login from './components/Login';
import StaffRequest from './components/StaffRequest';
import AdminPanel from './components/AdminPanel';
import { logSession } from './services/api';

const SERVER_ID = '617702007188488205';
const ADMIN_IDS = ['817515739711406140']; // IDs de administradores iniciales

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [serverIcon, setServerIcon] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const iconUrl = `https://cdn.discordapp.com/icons/${SERVER_ID}/a_dbd5a6f43cc5a2deaff32fa14ebbde0e.gif?size=128`;
    setServerIcon(iconUrl);

    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/gif';
    link.rel = 'icon';
    link.href = iconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);

    logSession();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = user && (user.role === 'admin' || ADMIN_IDS.includes(user.discordId));
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/logs' || location.pathname === '/admin';

  // Páginas públicas sin header
  if (!isDashboard) {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/novedades" element={<News />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/solicitar-staff" element={<StaffRequest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  // Verificar si el usuario está autenticado para el dashboard
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <header className="main-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              {serverIcon ? (
                <img src={serverIcon} alt="Server Icon" className="logo-icon-img" />
              ) : (
                <span className="logo-icon">🥭</span>
              )}
              <div>
                <h1>Mango Army Eventos</h1>
                <p className="subtitle">Panel de Staff</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={() => navigate('/dashboard')}
                className={`nav-btn ${isActive('/dashboard') ? 'active' : ''}`}
                title="Calendario"
              >
                <CalendarIcon size={20} />
              </button>
              <button
                onClick={() => navigate('/logs')}
                className={`nav-btn ${isActive('/logs') ? 'active' : ''}`}
                title="Logs"
              >
                <FileText size={20} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className={`nav-btn ${isActive('/admin') ? 'active' : ''}`}
                  title="Admin"
                >
                  <Shield size={20} />
                </button>
              )}
              <div className="user-menu">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder"><User size={16} /></div>
                )}
                <span className="username">{user.username}</span>
                <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                  <LogOut size={18} />
                </button>
              </div>
              <button onClick={toggleTheme} className="theme-toggle" title="Cambiar tema">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/dashboard" element={<Calendar />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel user={user} /> : <Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="main-footer">
        <span className="footer-text">
          Desarrollado con 💜 por <strong>Mango Army</strong>
        </span>
        <span className="footer-divider">•</span>
        <a href="https://github.com/MangoArmy" target="_blank" rel="noopener noreferrer" className="footer-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </footer>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow-x: hidden;
        }
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .app::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        .main-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }
        .container {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 0 1.5rem;
          position: relative;
          z-index: 1;
        }
        main.container {
          flex: 1;
          padding-top: 1.5rem;
          padding-bottom: 5rem;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          height: auto;
          padding: 0;
        }
        .logo-icon {
          font-size: 2.5rem;
        }
        .logo-icon-img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          flex-shrink: 0;
        }
        .logo h1 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          white-space: nowrap;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .nav-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .nav-btn.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-left: 0.5rem;
        }
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-avatar-placeholder {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .username {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .logout-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .logout-btn:hover {
          color: #ef4444;
        }
        .theme-toggle {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .theme-toggle:hover {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }
        main.container {
          flex: 1;
          padding: 1.5rem;
          padding-bottom: 4rem;
          display: flex;
          flex-direction: column;
          overflow: visible;
        }
        .main-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, var(--bg-primary) 0%, transparent 100%);
          padding: 1rem 0 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          z-index: 50;
          pointer-events: none;
        }
        .footer-text {
          opacity: 0.7;
        }
        .main-footer strong {
          color: #f97316;
          font-weight: 600;
        }
        .footer-divider {
          opacity: 0.4;
        }
        .footer-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: var(--text-secondary);
          text-decoration: none;
          opacity: 0.7;
          transition: all 0.2s;
          pointer-events: auto;
        }
        .footer-link:hover {
          color: var(--accent-primary);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
