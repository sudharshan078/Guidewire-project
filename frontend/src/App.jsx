import { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import PolicyPage from './pages/PolicyPage';
import Claims from './pages/Claims';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPolicies from './pages/admin/AdminPolicies';
import AdminClaims from './pages/admin/AdminClaims';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFraud from './pages/admin/AdminFraud';
import AdminEvents from './pages/admin/AdminEvents';
import AdminSystem from './pages/admin/AdminSystem';

function UserNavbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo-icon">🛡️</span>
        Guidewares
      </div>
      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/policy" className={isActive('/policy')}>Policy</Link>
        <Link to="/claims" className={isActive('/claims')}>Claims</Link>
        <Link to="/profile" className={isActive('/profile')}>Profile</Link>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

function AdminNavbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar admin-navbar">
      <div className="navbar-brand">
        <span className="logo-icon">🏢</span>
        Guidewares <span className="admin-badge-nav">ADMIN</span>
      </div>
      <div className="navbar-links">
        <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>Dashboard</Link>
        <Link to="/admin/users" className={isActive('/admin/users')}>Users</Link>
        <Link to="/admin/policies" className={isActive('/admin/policies')}>Policies</Link>
        <Link to="/admin/claims" className={isActive('/admin/claims')}>Claims</Link>
        <Link to="/admin/analytics" className={isActive('/admin/analytics')}>Analytics</Link>
        <Link to="/admin/fraud" className={isActive('/admin/fraud')}>Fraud</Link>
        <Link to="/admin/events" className={isActive('/admin/events')}>Events</Link>
        <Link to="/admin/system" className={isActive('/admin/system')}>System</Link>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Not logged in
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Admin user
  if (user.role === 'admin') {
    return (
      <Router>
        <AdminNavbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/policies" element={<AdminPolicies />} />
          <Route path="/admin/claims" element={<AdminClaims />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/fraud" element={<AdminFraud />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/system" element={<AdminSystem />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  // Regular user
  return (
    <Router>
      <UserNavbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/policy" element={<PolicyPage user={user} />} />
        <Route path="/claims" element={<Claims user={user} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
