import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchClaims = useCallback(async () => {
    try {
      const res = await API.get('/admin/claims');
      setClaims(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
    const interval = setInterval(fetchClaims, 10000);
    return () => clearInterval(interval);
  }, [fetchClaims]);

  const handleApprove = async (claimId) => {
    try {
      await API.post(`/admin/approve/${claimId}`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handleReject = async (claimId) => {
    try {
      await API.post(`/admin/reject/${claimId}`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const handlePay = async (claimId) => {
    try {
      await API.post(`/admin/pay/${claimId}`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const filtered = filter === 'ALL' ? claims : claims.filter((c) => c.status === filter);

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>📋 Claim Management</h1>
        <p className="greeting">
          {claims.length} total claims <span className="pulse" />
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} ({f === 'ALL' ? claims.length : claims.filter((c) => c.status === f).length})
          </button>
        ))}
      </div>

      <div className="section-card">
        {filtered.length > 0 ? (
          <table className="claims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Event</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Fraud</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.username}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {c.event_type.replace('_', ' ')}
                  </td>
                  <td>{c.event_details || '—'}</td>
                  <td style={{ fontWeight: 600 }}>₹{c.amount?.toLocaleString()}</td>
                  <td>
                    {c.fraud_flag ? (
                      <span className="badge rejected">⚠ FLAG</span>
                    ) : (
                      <span className="badge paid">✓ Clear</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</td>
                  <td>
                    <div className="action-btns">
                      {(c.status === 'PENDING' || c.status === 'REJECTED') && (
                        <button className="btn-sm btn-success" onClick={() => handleApprove(c.id)}>
                          ✓
                        </button>
                      )}
                      {(c.status === 'PENDING' || c.status === 'APPROVED') && (
                        <button className="btn-sm btn-danger" onClick={() => handleReject(c.id)}>
                          ✗
                        </button>
                      )}
                      {c.status === 'APPROVED' && (
                        <button className="btn-sm btn-primary" onClick={() => handlePay(c.id)}>
                          💰
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
            <div className="icon">📭</div>
            <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} claims found</p>
          </div>
        )}
      </div>
    </div>
  );
}
