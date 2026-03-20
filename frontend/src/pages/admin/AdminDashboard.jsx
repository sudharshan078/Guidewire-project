import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get('/admin/analytics');
      setAnalytics(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  const a = analytics || {};

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>🏢 Admin Dashboard</h1>
        <p className="greeting">
          Insurance Command Center <span className="pulse" />
        </p>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-grid">
        <div className="stat-card blue" style={{ animationDelay: '0.1s' }}>
          <div className="icon">👥</div>
          <div className="label">Total Users</div>
          <div className="value">{a.total_users || 0}</div>
          <div className="sub">Registered gig workers</div>
        </div>
        <div className="stat-card green" style={{ animationDelay: '0.15s' }}>
          <div className="icon">🛡️</div>
          <div className="label">Active Policies</div>
          <div className="value">{a.active_policies || 0}</div>
          <div className="sub">Currently insured</div>
        </div>
        <div className="stat-card purple" style={{ animationDelay: '0.2s' }}>
          <div className="icon">📋</div>
          <div className="label">Total Claims</div>
          <div className="value">{a.total_claims || 0}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card amber" style={{ animationDelay: '0.25s' }}>
          <div className="icon">💰</div>
          <div className="label">Total Payout</div>
          <div className="value">₹{(a.total_payout || 0).toLocaleString()}</div>
          <div className="sub">Claims paid out</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="dashboard-grid">
        <div className="stat-card blue" style={{ animationDelay: '0.3s' }}>
          <div className="icon">💵</div>
          <div className="label">Premium Collected</div>
          <div className="value">₹{(a.total_premium_collected || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card green" style={{ animationDelay: '0.35s' }}>
          <div className="icon">⏳</div>
          <div className="label">Pending Claims</div>
          <div className="value">{a.pending_claims || 0}</div>
        </div>
        <div className="stat-card amber" style={{ animationDelay: '0.4s' }}>
          <div className="icon">🚨</div>
          <div className="label">Fraud Rate</div>
          <div className="value">{a.fraud_rate || 0}%</div>
          <div className="sub">{a.fraud_count || 0} flagged claims</div>
        </div>
        <div className="stat-card purple" style={{ animationDelay: '0.45s' }}>
          <div className="icon">🏦</div>
          <div className="label">Coverage Liability</div>
          <div className="value">₹{(a.total_coverage_liability || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="section-card">
        <h2>⚡ Quick Actions</h2>
        <div className="admin-quick-links">
          <Link to="/admin/users" className="quick-link-btn">👥 Manage Users</Link>
          <Link to="/admin/claims" className="quick-link-btn">📋 Review Claims</Link>
          <Link to="/admin/fraud" className="quick-link-btn">🚨 Fraud Alerts</Link>
          <Link to="/admin/analytics" className="quick-link-btn">📊 Analytics</Link>
          <Link to="/admin/events" className="quick-link-btn">⚡ Event Logs</Link>
          <Link to="/admin/system" className="quick-link-btn">⚙️ System Control</Link>
        </div>
      </div>

      {/* Claims Distribution */}
      {a.claims_by_event && Object.keys(a.claims_by_event).length > 0 && (
        <div className="section-card">
          <h2>🌧️ Claims by Event Type</h2>
          <div className="bar-chart">
            {Object.entries(a.claims_by_event).map(([type, count]) => (
              <div key={type} className="bar-row">
                <span className="bar-label">{type.replace('_', ' ')}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(count / Math.max(...Object.values(a.claims_by_event))) * 100}%`,
                    }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {a.claims_by_status && Object.keys(a.claims_by_status).length > 0 && (
        <div className="section-card">
          <h2>📊 Claims by Status</h2>
          <div className="status-pills">
            {Object.entries(a.claims_by_status).map(([status, count]) => (
              <div key={status} className={`status-pill ${status.toLowerCase()}`}>
                <span className="pill-count">{count}</span>
                <span className="pill-label">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
