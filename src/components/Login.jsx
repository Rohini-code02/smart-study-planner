import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token }),
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
    },
    onError: () => setErrorMessage('Google sign-in was cancelled or failed.')
  });

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
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button type="button" onClick={() => loginWithGoogle()} className="custom-google-btn">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Continue with Google
          </button>
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
