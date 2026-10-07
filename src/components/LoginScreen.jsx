import { useState } from 'react';

const VALID_USERNAME = 'Bernard';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().toLowerCase() !== VALID_USERNAME.toLowerCase()) {
      setError('Invalid username.');
      return;
    }

    onLogin();
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-icon">🔒</div>
        <h2 className="login-title">Financial Tracker</h2>
        <p className="login-subtitle">Secure Access Required</p>

        <form className="login-form" onSubmit={handleUsernameSubmit}>
          <label className="login-label">Username</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoFocus
          />
          <button className="login-btn" type="submit">
            Continue
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default LoginScreen;
