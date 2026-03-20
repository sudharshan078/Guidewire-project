import { useState, useEffect } from 'react';
import API from '../../api';

export default function AdminSystem() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get('/admin/system-config')
      .then((res) => setConfig(res.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = async (key, value) => {
    setSaving(key);
    setSuccess('');
    try {
      await API.post('/admin/system-config', { key, value: String(value) });
      setConfig((prev) => ({ ...prev, [key]: String(value) }));
      setSuccess(`✅ ${key} updated to ${value}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed');
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return <div className="app-container dashboard"><div className="spinner" /></div>;
  }

  const isEnabled = config.trigger_enabled === 'true';

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>⚙️ System Control</h1>
        <p className="greeting">Configure trigger engine and system parameters</p>
      </div>

      {success && <div className="success-message">{success}</div>}

      {/* Trigger Engine Control */}
      <div className="section-card">
        <h2>🔄 Trigger Engine</h2>
        <div className="control-grid">
          <div className="control-item">
            <div className="control-label">
              <strong>Engine Status</strong>
              <span className={`badge ${isEnabled ? 'active' : 'rejected'}`}>
                {isEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="control-desc">Enable or disable the automatic weather trigger engine</p>
            <button
              className={`btn-sm ${isEnabled ? 'btn-danger' : 'btn-success'}`}
              disabled={saving === 'trigger_enabled'}
              onClick={() => updateConfig('trigger_enabled', isEnabled ? 'false' : 'true')}
            >
              {saving === 'trigger_enabled' ? 'Saving...' : isEnabled ? 'Disable Engine' : 'Enable Engine'}
            </button>
          </div>

          <div className="control-item">
            <div className="control-label">
              <strong>Event Probability</strong>
              <span className="control-value">{(parseFloat(config.event_probability || 0.25) * 100).toFixed(0)}%</span>
            </div>
            <p className="control-desc">Chance of weather event each cycle (0–100%)</p>
            <input
              type="range"
              min="0"
              max="100"
              value={parseFloat(config.event_probability || 0.25) * 100}
              className="range-input"
              onChange={(e) => {
                const val = (parseInt(e.target.value) / 100).toFixed(2);
                setConfig((prev) => ({ ...prev, event_probability: val }));
              }}
              onMouseUp={(e) => {
                const val = (parseInt(e.target.value) / 100).toFixed(2);
                updateConfig('event_probability', val);
              }}
            />
          </div>

          <div className="control-item">
            <div className="control-label">
              <strong>Trigger Interval</strong>
              <span className="control-value">{config.trigger_interval || 30}s</span>
            </div>
            <p className="control-desc">Seconds between each trigger cycle</p>
            <div className="btn-group">
              {[10, 15, 30, 60, 120].map((sec) => (
                <button
                  key={sec}
                  className={`btn-sm ${String(config.trigger_interval) === String(sec) ? 'btn-primary' : 'btn-default'}`}
                  disabled={saving === 'trigger_interval'}
                  onClick={() => updateConfig('trigger_interval', sec)}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="control-item">
            <div className="control-label">
              <strong>Rain Threshold</strong>
              <span className="control-value">{config.rain_threshold || 50}mm</span>
            </div>
            <p className="control-desc">Minimum rainfall level to trigger claims</p>
            <input
              type="range"
              min="10"
              max="100"
              value={config.rain_threshold || 50}
              className="range-input"
              onChange={(e) => {
                setConfig((prev) => ({ ...prev, rain_threshold: e.target.value }));
              }}
              onMouseUp={(e) => {
                updateConfig('rain_threshold', e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="section-card">
        <h2>ℹ️ System Info</h2>
        <table className="claims-table">
          <tbody>
            {Object.entries(config).map(([key, value]) => (
              <tr key={key}>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
