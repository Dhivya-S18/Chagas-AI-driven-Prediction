import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginUser, signupUser } from '../services/api';

function Login({ onAuthSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname === '/signup' ? 'signup' : 'login';
  const [formData, setFormData] = useState({ name: '', email: '', password: '', age: '', gender: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = mode === 'login'
        ? await loginUser(formData.email, formData.password)
        : await signupUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: Number(formData.age),
          gender: formData.gender,
        });

      onAuthSuccess(response);
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Authentication failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand-block login-brand">
          <div className="brand-badge">AI</div>
          <div>
            <p className="brand-title">Chagas AI</p>
          </div>
        </div>

        <h2>Personal ECG Monitoring</h2>
        <p className="login-subtitle">DEMO ECG is available in Live Monitor. No hardware ECG sensor is currently connected.</p>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <label>
                Full name
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </label>
              <label>
                Age
                <input type="number" name="age" min="0" max="120" value={formData.age} onChange={handleChange} required />
              </label>
              <label>
                Gender
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select an option</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-button login-button" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in to dashboard' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
