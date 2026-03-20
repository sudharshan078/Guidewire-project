import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await API.get('/admin/events');
      setEvents(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  // Event type stats
  const eventStats = {};
  events.forEach((e) => {
    if (!eventStats[e.event_type]) {
      eventStats[e.event_type] = { count: 0, claims: 0 };
    }
    eventStats[e.event_type].count++;
    eventStats[e.event_type].claims += e.claims_triggered;
  });

  const eventIcons = {
    heavy_rain: '🌧️',
    flood: '🌊',
    heatwave: '🔥',
    storm: '⛈️',
    cyclone: '🌀',
  };

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>⚡ Event Monitoring</h1>
        <p className="greeting">
          Live trigger engine activity <span className="pulse" />
        </p>
      </div>

      {/* Event Type Summary */}
      <div className="dashboard-grid">
        {Object.entries(eventStats).map(([type, stat], i) => (
          <div key={type} className="stat-card blue" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
            <div className="icon">{eventIcons[type] || '⚡'}</div>
            <div className="label">{type.replace('_', ' ')}</div>
            <div className="value">{stat.count}</div>
            <div className="sub">{stat.claims} claims triggered</div>
          </div>
        ))}
      </div>

      {/* Event Log */}
      <div className="section-card">
        <h2>📜 Event Log (Last 100)</h2>
        {events.length > 0 ? (
          <table className="claims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Claims Created</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>#{e.id}</td>
                  <td>
                    <span style={{ marginRight: 6 }}>{eventIcons[e.event_type] || '⚡'}</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {e.event_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{e.description}</td>
                  <td>
                    <div className="severity-bar">
                      <div
                        className="severity-fill"
                        style={{
                          width: `${e.severity * 100}%`,
                          background: e.severity >= 0.8
                            ? 'var(--accent-red)'
                            : e.severity >= 0.6
                            ? 'var(--accent-amber)'
                            : 'var(--accent-emerald)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(e.severity * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.claims_triggered}</td>
                  <td>{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">☀️</div>
            <p>No events logged yet. The trigger engine will detect events automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
