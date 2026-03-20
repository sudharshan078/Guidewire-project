import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminFraud() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await API.get('/admin/fraud-alerts');
      setAlerts(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleApprove = async (claimId) => {
    try {
      await API.post(`/admin/approve/${claimId}`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handleReject = async (claimId) => {
    try {
      await API.post(`/admin/reject/${claimId}`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>🚨 Fraud Monitoring</h1>
        <p className="greeting">
          {alerts.length} flagged claims <span className="pulse" />
        </p>
      </div>

      {/* Alert Summary */}
      <div className="dashboard-grid">
        <div className="stat-card amber" style={{ animationDelay: '0.1s' }}>
          <div className="icon">⚠️</div>
          <div className="label">Total Flagged</div>
          <div className="value">{alerts.length}</div>
        </div>
        <div className="stat-card purple" style={{ animationDelay: '0.2s' }}>
          <div className="icon">💰</div>
          <div className="label">Flagged Amount</div>
          <div className="value">
            ₹{alerts.reduce((s, a) => s + a.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="stat-card blue" style={{ animationDelay: '0.3s' }}>
          <div className="icon">🔍</div>
          <div className="label">Pending Review</div>
          <div className="value">{alerts.filter((a) => a.status === 'REJECTED').length}</div>
        </div>
      </div>

      <div className="section-card">
        <h2>⚠️ Fraud Alerts</h2>
        {alerts.length > 0 ? (
          <table className="claims-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>User</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Override</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} style={{ background: 'rgba(239, 68, 68, 0.03)' }}>
                  <td>#{a.id}</td>
                  <td style={{ fontWeight: 600 }}>{a.username}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {a.event_type.replace('_', ' ')}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                    ₹{a.amount?.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span>
                  </td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-success" onClick={() => handleApprove(a.id)}>
                        Override ✓
                      </button>
                      {a.status !== 'REJECTED' && (
                        <button className="btn-sm btn-danger" onClick={() => handleReject(a.id)}>
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>No fraud alerts. All claims look clean!</p>
          </div>
        )}
      </div>
    </div>
  );
}
