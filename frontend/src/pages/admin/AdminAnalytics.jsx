import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get('/admin/analytics');
      setData(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  const maxEvent = Math.max(...Object.values(data.claims_by_event || { _: 1 }), 1);
  const maxLocation = Math.max(...Object.values(data.users_by_location || { _: 1 }), 1);
  const maxPlatform = Math.max(...Object.values(data.users_by_platform || { _: 1 }), 1);

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>📊 Analytics Dashboard</h1>
        <p className="greeting">Deep insights into your insurance operations</p>
      </div>

      {/* KPI Row */}
      <div className="dashboard-grid">
        <div className="stat-card blue" style={{ animationDelay: '0.1s' }}>
          <div className="icon">👥</div>
          <div className="label">Users</div>
          <div className="value">{data.total_users}</div>
        </div>
        <div className="stat-card green" style={{ animationDelay: '0.15s' }}>
          <div className="icon">🛡️</div>
          <div className="label">Active Policies</div>
          <div className="value">{data.active_policies}</div>
        </div>
        <div className="stat-card purple" style={{ animationDelay: '0.2s' }}>
          <div className="icon">📋</div>
          <div className="label">Total Claims</div>
          <div className="value">{data.total_claims}</div>
        </div>
        <div className="stat-card amber" style={{ animationDelay: '0.25s' }}>
          <div className="icon">🚨</div>
          <div className="label">Fraud Rate</div>
          <div className="value">{data.fraud_rate}%</div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="section-card">
        <h2>💰 Financial Summary</h2>
        <div className="financial-grid">
          <div className="financial-item">
            <div className="fin-label">Premium Collected</div>
            <div className="fin-value positive">₹{data.total_premium_collected?.toLocaleString()}</div>
          </div>
          <div className="financial-item">
            <div className="fin-label">Total Payouts</div>
            <div className="fin-value negative">₹{data.total_payout?.toLocaleString()}</div>
          </div>
          <div className="financial-item">
            <div className="fin-label">Net Position</div>
            <div className={`fin-value ${(data.total_premium_collected - data.total_payout) >= 0 ? 'positive' : 'negative'}`}>
              ₹{(data.total_premium_collected - data.total_payout).toLocaleString()}
            </div>
          </div>
          <div className="financial-item">
            <div className="fin-label">Coverage Liability</div>
            <div className="fin-value">₹{data.total_coverage_liability?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Claims by Event Type */}
      <div className="section-card">
        <h2>🌧️ Event Frequency</h2>
        {Object.keys(data.claims_by_event || {}).length > 0 ? (
          <div className="bar-chart">
            {Object.entries(data.claims_by_event).map(([type, count]) => (
              <div key={type} className="bar-row">
                <span className="bar-label">{type.replace('_', ' ')}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill gradient-blue"
                    style={{ width: `${(count / maxEvent) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No event data yet</p>
        )}
      </div>

      {/* Claims Status Breakdown */}
      <div className="section-card">
        <h2>📈 Status Breakdown</h2>
        <div className="status-pills">
          {Object.entries(data.claims_by_status || {}).map(([status, count]) => (
            <div key={status} className={`status-pill ${status.toLowerCase()}`}>
              <span className="pill-count">{count}</span>
              <span className="pill-label">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Location Distribution */}
      <div className="section-card">
        <h2>📍 Risk Distribution (by Location)</h2>
        {Object.keys(data.users_by_location || {}).length > 0 ? (
          <div className="bar-chart">
            {Object.entries(data.users_by_location).map(([loc, count]) => (
              <div key={loc} className="bar-row">
                <span className="bar-label" style={{ textTransform: 'capitalize' }}>{loc}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill gradient-green"
                    style={{ width: `${(count / maxLocation) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No location data yet</p>
        )}
      </div>

      {/* Platform Distribution */}
      <div className="section-card">
        <h2>🏢 Platform Distribution</h2>
        {Object.keys(data.users_by_platform || {}).length > 0 ? (
          <div className="bar-chart">
            {Object.entries(data.users_by_platform).map(([platform, count]) => (
              <div key={platform} className="bar-row">
                <span className="bar-label" style={{ textTransform: 'capitalize' }}>{platform}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill gradient-purple"
                    style={{ width: `${(count / maxPlatform) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No platform data yet</p>
        )}
      </div>
    </div>
  );
}
