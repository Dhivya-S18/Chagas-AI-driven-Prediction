import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import About from './pages/About';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import LiveMonitor from './pages/LiveMonitor';
import Login from './pages/Login';
import Reports from './pages/Reports';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/monitor': 'Live Monitor',
  '/analysis': 'AI Analysis',
  '/history': 'History',
  '/reports': 'Reports',
  '/about': 'About',
};

function AppLayout({ user, onLogout }) {
  const location = useLocation();
  const currentTitle = useMemo(
    () => pageTitles[location.pathname] || 'Dashboard',
    [location.pathname],
  );

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="content-shell">
        <Header title={currentTitle} user={user} />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitor" element={<LiveMonitor />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('chagasToken') || '');
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('chagasUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogin = (authData) => {
    localStorage.setItem('chagasToken', authData.token);
    localStorage.setItem('chagasUser', JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('chagasToken');
    localStorage.removeItem('chagasUser');
    setToken('');
    setUser(null);
    navigate('/login');
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onAuthSuccess={handleLogin} />} />
        <Route path="/signup" element={<Login onAuthSuccess={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppLayout user={user} onLogout={handleLogout} />;
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
