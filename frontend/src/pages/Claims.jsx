import { useState, useEffect, useCallback } from 'react';
import API from '../api';

export default function Claims({ user }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get(`/claims/${user.user_id}`);
      setClaims(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClaims();
    const interval = setInterval(fetchClaims, 10000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  const totalPaid = claims.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
  const totalPending = claims.filter((c) => c.status === 'PENDING').length;
  const totalRejected = claims.filter((c) => c.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="app-container dashboard">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>📋 Claims</h1>
        <p className="greeting">
          All your insurance claims in one place{' '}
          <span className="pulse" title="Auto-refreshing" />
        </p>
      </div>

      {/* Summary cards */}
      <div className="dashboard-grid">
        <div className="stat-card green" style={{ animationDelay: '0.1s' }}>
          <div className="icon">✅</div>
          <div className="label">Paid Out</div>
          <div className="value">₹{totalPaid.toLocaleString()}</div>
          <div className="sub">{claims.filter((c) => c.status === 'PAID').length} claims</div>
        </div>
        <div className="stat-card amber" style={{ animationDelay: '0.2s' }}>
          <div className="icon">⏳</div>
          <div className="label">Pending</div>
          <div className="value">{totalPending}</div>
          <div className="sub">Awaiting processing</div>
        </div>
        <div className="stat-card purple" style={{ animationDelay: '0.3s' }}>
          <div className="icon">🚫</div>
          <div className="label">Rejected</div>
          <div className="value">{totalRejected}</div>
          <div className="sub">Fraud flagged</div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="section-card">
        <h2>🗂️ All Claims</h2>
        {claims.length > 0 ? (
          <table className="claims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Fraud</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.claim_id}>
                  <td>#{c.claim_id}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {c.event_type.replace('_', ' ')}
                  </td>
                  <td>{c.event_details || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    ₹{c.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.fraud_flag ? (
                      <span className="badge rejected">⚠ Yes</span>
                    ) : (
                      <span className="badge paid">✓ Clear</span>
                    )}
                  </td>
                  <td>
                    {c.created_at
                      ? new Date(c.created_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>
              No claims yet. Claims are auto-created when the trigger engine
              detects weather events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
