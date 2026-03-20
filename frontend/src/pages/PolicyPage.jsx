import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const PLANS = [
  {
    name: 'basic',
    label: 'Basic',
    multiplier: 1.0,
    coverage: 5000,
    features: [
      'Weather event coverage',
      'Auto claim creation',
      'Basic fraud protection',
      '₹5,000 max coverage',
    ],
  },
  {
    name: 'standard',
    label: 'Standard',
    multiplier: 1.5,
    coverage: 15000,
    recommended: true,
    features: [
      'All Basic features',
      'Priority claim processing',
      'Advanced fraud AI',
      '₹15,000 max coverage',
      'Instant payouts',
    ],
  },
  {
    name: 'premium',
    label: 'Premium',
    multiplier: 2.0,
    coverage: 30000,
    features: [
      'All Standard features',
      'Highest coverage limit',
      'Dedicated support',
      '₹30,000 max coverage',
      'Instant payouts',
      'Multi-event protection',
    ],
  },
];

export default function PolicyPage({ user }) {
  const [risk, setRisk] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [buying, setBuying] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    API.get(`/ai/risk/${user.user_id}`)
      .then((res) => setRisk(res.data))
      .catch(() => {});
    API.get(`/policy/${user.user_id}`)
      .then((res) => {
        const active = res.data?.find((p) => p.status === 'ACTIVE');
        setActivePolicy(active || null);
      })
      .catch(() => {});
  }, [user]);

  const handleBuy = async (planName) => {
    setError('');
    setSuccess('');
    setBuying(planName);
    try {
      const res = await API.post('/policy/buy', {
        user_id: user.user_id,
        plan_name: planName,
      });
      setSuccess(`🎉 ${res.data.plan_name.toUpperCase()} plan purchased! Premium: ₹${res.data.premium}/week`);
      setActivePolicy(res.data);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Purchase failed');
    } finally {
      setBuying('');
    }
  };

  const basePremium = risk?.weekly_premium || 99;

  return (
    <div className="app-container dashboard">
      <div className="dashboard-header">
        <h1>🛡️ Choose Your Plan</h1>
        <p className="greeting">
          Select a weekly insurance plan. Prices based on your AI risk score.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {activePolicy && (
        <div className="section-card" style={{ marginBottom: 24 }}>
          <h2>
            ✅ Active Policy: {activePolicy.plan_name?.toUpperCase()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Coverage ₹{activePolicy.coverage?.toLocaleString()} •
            Valid until {new Date(activePolicy.end_date).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="plans-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`plan-card ${plan.recommended ? 'recommended' : ''}`}
          >
            <div className="plan-name">{plan.label}</div>
            <div className="plan-price">
              ₹{Math.round(basePremium * plan.multiplier)}
              <span>/week</span>
            </div>
            <div className="plan-coverage">
              Coverage up to ₹{plan.coverage.toLocaleString()}
            </div>
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              className="btn-buy"
              disabled={!!activePolicy || buying === plan.name}
              onClick={() => handleBuy(plan.name)}
            >
              {buying === plan.name
                ? 'Processing...'
                : activePolicy
                ? 'Already Active'
                : 'Buy Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
