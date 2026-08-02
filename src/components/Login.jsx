import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';
import API_BASE_URL from '../config/api.js';

function Login({ setCurrentPage, handleSetToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        handleSetToken(data.token);
        setCurrentPage('dashboard');
      } else {
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      setErrorMessage('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        handleSetToken(data.token);
        setCurrentPage('dashboard');
      } else {
        setErrorMessage(data.message || 'Google sign-in failed.');
      }
    } catch (error) {
      setErrorMessage('Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome Back!</h2>
        <p className="login-subtitle">Please log in to your account.</p>

        {errorMessage && (
          <p className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="forgot-password">
            <a href="#forgot">Forgot Password?</a>
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Google Sign In Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Google Login Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            text="signin_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="signup-link">
          <p>
            Don't have an account?{' '}
            <a href="#signup" onClick={(e) => { e.preventDefault(); setCurrentPage('signup'); }}>
              Sign Up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
