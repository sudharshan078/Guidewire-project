import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function Dashboard({ user }) {
  const [risk, setRisk] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [riskRes, policyRes, claimsRes] = await Promise.all([
        API.get(`/ai/risk/${user.user_id}`).catch(() => ({ data: null })),
        API.get(`/policy/${user.user_id}`).catch(() => ({ data: [] })),
        API.get(`/claims/${user.user_id}`).catch(() => ({ data: [] })),
      ]);
      setRisk(riskRes.data);
      setPolicies(policyRes.data || []);
      setClaims(claimsRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activePolicy = policies.find((p) => p.status === 'ACTIVE');
  const totalPaid = claims
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingClaims = claims.filter((c) => c.status === 'PENDING').length;

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
        <h1>Dashboard</h1>
        <p className="greeting">
          Welcome back, <strong>{user?.username}</strong>{' '}
          <span className="pulse" title="Live updates active" />
        </p>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid">
        {/* Risk Score */}
        <div className="stat-card blue" style={{ animationDelay: '0.1s' }}>
          <div className="icon">🧠</div>
          <div className="label">AI Risk Score</div>
          {risk ? (
            <>
              <div className="value">{(risk.risk_score * 100).toFixed(0)}%</div>
              <div className="sub">{risk.risk_level} Risk — {risk.location}</div>
              <div className="risk-meter">
                <div
                  className={`fill ${risk.risk_level?.toLowerCase()}`}
                  style={{ width: `${risk.risk_score * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="value">—</div>
              <div className="sub">
                <Link to="/profile" style={{ color: 'var(--accent-blue)' }}>
                  Complete your profile
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Active Policy */}
        <div className="stat-card green" style={{ animationDelay: '0.2s' }}>
          <div className="icon">🛡️</div>
          <div className="label">Active Policy</div>
          {activePolicy ? (
            <>
              <div className="value">{activePolicy.plan_name.toUpperCase()}</div>
              <div className="sub">
                Coverage ₹{activePolicy.coverage.toLocaleString()} •
                ₹{activePolicy.premium}/week
              </div>
            </>
          ) : (
            <>
              <div className="value">None</div>
              <div className="sub">
                <Link to="/policy" style={{ color: 'var(--accent-emerald)' }}>
                  Buy a plan →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Total Paid */}
        <div className="stat-card purple" style={{ animationDelay: '0.3s' }}>
          <div className="icon">💰</div>
          <div className="label">Total Payouts</div>
          <div className="value">₹{totalPaid.toLocaleString()}</div>
          <div className="sub">{claims.filter((c) => c.status === 'PAID').length} claim(s) paid</div>
        </div>

        {/* Pending */}
        <div className="stat-card amber" style={{ animationDelay: '0.4s' }}>
          <div className="icon">⏳</div>
          <div className="label">Pending Claims</div>
          <div className="value">{pendingClaims}</div>
          <div className="sub">Being processed</div>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="section-card">
        <h2>📋 Recent Claims</h2>
        {claims.length > 0 ? (
          <table className="claims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.slice(0, 10).map((c) => (
                <tr key={c.claim_id}>
                  <td>#{c.claim_id}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {c.event_type.replace('_', ' ')}
                  </td>
                  <td>₹{c.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No claims yet. Claims are created automatically when weather events are detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
