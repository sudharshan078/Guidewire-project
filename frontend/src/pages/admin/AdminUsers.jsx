import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlock = async (userId) => {
    try {
      await API.post(`/admin/block-user/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to block user');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await API.post(`/admin/unblock-user/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unblock user');
    }
  };

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>👥 User Management</h1>
        <p className="greeting">{users.length} registered users</p>
      </div>

      <div className="section-card">
        <table className="claims-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Location</th>
              <th>Platform</th>
              <th>Role</th>
              <th>Policies</th>
              <th>Claims</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.location || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.work_type || '—'}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'paid' : 'approved'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{u.policy_count}</td>
                <td>{u.claim_count}</td>
                <td>
                  <span className={`badge ${u.is_blocked ? 'rejected' : 'active'}`}>
                    {u.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                  </span>
                </td>
                <td>
                  {u.role !== 'admin' && (
                    u.is_blocked ? (
                      <button className="btn-sm btn-success" onClick={() => handleUnblock(u.id)}>
                        Unblock
                      </button>
                    ) : (
                      <button className="btn-sm btn-danger" onClick={() => handleBlock(u.id)}>
                        Block
                      </button>
                    )
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
