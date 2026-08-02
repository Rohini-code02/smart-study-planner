import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './Signup.css';
import API_BASE_URL from '../config/api.js';

function Signup({ setCurrentPage, handleSetToken }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please try again.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        handleSetToken(data.token);
        setCurrentPage('dashboard');
      } else {
        setErrorMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage('Could not connect to the server.');
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
        setErrorMessage(data.message || 'Google sign-up failed.');
      }
    } catch (error) {
      setErrorMessage('Google sign-up failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Create an Account</h2>
        <p className="signup-subtitle">Join Smart Study Planner today.</p>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Type your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-signup-submit">
            Create Account
          </button>
        </form>

        {/* Google Sign Up Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>or sign up with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
          />
        </div>

        <div className="login-link">
          <p>
            Already have an account?{' '}
            <a href="#login" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}>
              Log in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
