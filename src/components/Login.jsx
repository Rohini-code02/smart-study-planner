import React, { useState } from 'react';

// We import a separate CSS file specifically for this component to keep our styles organized.
import './Login.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// LOGIN COMPONENT
// ============================================================================
// Why this component is created:
// We need a dedicated page or section for users to enter their credentials 
// and securely access their personalized Smart Study Planner accounts.
function Login({ setCurrentPage, handleSetToken }) {
  // --------------------------------------------------------------------------
  // STATE VARIABLES
  // --------------------------------------------------------------------------
  
  // Here we use useState to create an 'email' state and a 'setEmail' function to update it.
  // The initial value is an empty string ('').
  //
  // Why useState is used:
  // useState allows our React component to "remember" data that changes over time. 
  // In a form, we need to constantly remember what the user is typing into the 
  // email and password fields so we can send that exact data when they click Login.
  const [email, setEmail] = useState('');
  
  // We do the same for the password.
  const [password, setPassword] = useState('');

  // State to store any error messages from the backend (like "invalid password")
  const [errorMessage, setErrorMessage] = useState('');

  // --------------------------------------------------------------------------
  // FORM SUBMISSION HANDLER
  // --------------------------------------------------------------------------
  // Why handleSubmit() is created:
  // When a user submits an HTML form, we need a custom JavaScript function to intercept 
  // the data (so we can validate it or send it to a server) instead of letting 
  // the browser do its default behavior.
  const handleSubmit = async (event) => {
    
    // Why preventDefault() is used:
    // By default, submitting an HTML form refreshes the entire web page.
    // In React (which builds Single Page Applications), a page reload would wipe out 
    // all our temporary data and state. preventDefault() stops the reload, 
    // allowing us to handle the login process smoothly in the background.
    event.preventDefault();

    // Clear any previous error messages before trying to log in again
    setErrorMessage('');

    try {
      // Send a POST request to our Node.js login API
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS! The server verified the password and sent back a JWT token.
        // Save the token so the user stays logged in
        handleSetToken(data.token);
        
        // Redirect them to the Dashboard!
        setCurrentPage('dashboard');
      } else {
        // FAILURE! (e.g., Invalid email or password)
        // Display the specific error message sent by the backend controller.
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Could not connect to the server.');
    }
  };

  return (
    // We wrap everything in a main container to easily center it on the screen
    <div className="login-container">
      
      {/* The actual box holding the form content */}
      <div className="login-box">
        <h2>Welcome Back!</h2>
        <p className="login-subtitle">Please log in to your account.</p>

        {/* Display error message if there is one */}
        {errorMessage && <p className="error-message" style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>{errorMessage}</p>}

        {/* 
          The <form> element groups our inputs together. 
          When the user presses Enter or clicks the submit button, 
          it triggers the "onSubmit" event, which calls our handleSubmit function.
        */}
        <form onSubmit={handleSubmit} className="login-form">
          
          {/* ===================== EMAIL FIELD ===================== */}
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            {/* 
              Why this input field exists: To let the user type their email.
              
              Why controlled components are used (value + onChange):
              Notice that value={email} and onChange={...} are linked.
              This makes React the "single source of truth". The input field only shows 
              what is stored in our React state variable 'email'. 
              When the user types, onChange triggers setEmail, which updates the state, 
              and React instantly re-renders the input field with the new letter. 
              This gives us total control over the form data at all times.
            */}
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          {/* ===================== PASSWORD FIELD ===================== */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            {/* Why this input field exists: To securely capture the user's secret password. */}
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {/* ===================== FORGOT PASSWORD ===================== */}
          {/* We use a # for the href because we don't have a real reset page created yet. */}
          <div className="forgot-password">
            <a href="#forgot">Forgot Password?</a>
          </div>

          {/* ===================== LOGIN BUTTON ===================== */}
          {/* 
            type="submit" is crucial here. It tells the browser that clicking 
            this button should trigger the form's onSubmit event.
          */}
          <button type="submit" className="btn-login-submit">
            Login
          </button>
        </form>

        {/* ===================== SIGN UP LINK ===================== */}
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
