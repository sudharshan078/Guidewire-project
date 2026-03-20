import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const LOCATIONS = [
  'Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

const WORK_TYPES = [
  'Zomato', 'Swiggy', 'Amazon', 'Flipkart', 'Uber',
  'Ola', 'Dunzo', 'Blinkit', 'Rapido', 'Porter',
];

export default function Profile({ user }) {
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    API.get(`/user/profile/${user.user_id}`)
      .then((res) => {
        setLocation(res.data.location || '');
        setWorkType(res.data.work_type || '');
      })
      .catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.put(`/user/profile/${user.user_id}`, {
        location: location.toLowerCase(),
        work_type: workType.toLowerCase(),
      });
      setSuccess('Profile saved! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="profile-container">
        <h1>⚙️ Setup Profile</h1>
        <p className="subtitle">
          Tell us about yourself so our AI can calculate your personalized risk score
        </p>

        <div className="section-card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profile-location">Your City</label>
              <select
                id="profile-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              >
                <option value="">Select your city</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc.toLowerCase()}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profile-worktype">Work Platform</label>
              <select
                id="profile-worktype"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                required
              >
                <option value="">Select your platform</option>
                {WORK_TYPES.map((wt) => (
                  <option key={wt} value={wt.toLowerCase()}>
                    {wt}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
