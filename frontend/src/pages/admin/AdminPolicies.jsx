import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await API.get('/admin/policies');
      setPolicies(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleStatusChange = async (policyId, status) => {
    try {
      await API.post(`/admin/update-policy/${policyId}`, { status });
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  const active = policies.filter((p) => p.status === 'ACTIVE').length;
  const expired = policies.filter((p) => p.status !== 'ACTIVE').length;

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>🛡️ Policy Management</h1>
        <p className="greeting">{policies.length} total policies</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card green" style={{ animationDelay: '0.1s' }}>
          <div className="icon">✅</div>
          <div className="label">Active</div>
          <div className="value">{active}</div>
        </div>
        <div className="stat-card amber" style={{ animationDelay: '0.2s' }}>
          <div className="icon">📁</div>
          <div className="label">Expired / Cancelled</div>
          <div className="value">{expired}</div>
        </div>
      </div>

      <div className="section-card">
        <h2>📄 All Policies</h2>
        <table className="claims-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Plan</th>
              <th>Premium</th>
              <th>Coverage</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td style={{ fontWeight: 600 }}>{p.username}</td>
                <td style={{ textTransform: 'uppercase' }}>{p.plan_name}</td>
                <td>₹{p.premium}</td>
                <td>₹{p.coverage?.toLocaleString()}</td>
                <td>{new Date(p.start_date).toLocaleDateString()}</td>
                <td>{new Date(p.end_date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'active' : 'expired'}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.status === 'ACTIVE' ? (
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleStatusChange(p.id, 'CANCELLED')}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="btn-sm btn-success"
                      onClick={() => handleStatusChange(p.id, 'ACTIVE')}
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
