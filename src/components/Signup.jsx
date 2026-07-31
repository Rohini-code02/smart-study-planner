import React, { useState } from 'react';

// ============================================================================
// CSS IMPORT
// ============================================================================
// We import our specific CSS file to style the Signup component.
import './Signup.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// SIGNUP COMPONENT
// ============================================================================
// Why this component is created:
// The Signup component provides a form for new users to register an account 
// by providing their name, email, and a secure password.
function Signup({ setCurrentPage, handleSetToken }) {
  
  // ==========================================================================
  // USESTATE (STATE MANAGEMENT)
  // ==========================================================================
  // Why useState is used:
  // We use the useState hook to store the data the user types into the input fields.
  // When the user types, the state updates, and React immediately re-renders the 
  // input field to show the new text. 
  
  // State for the user's Full Name
  const [name, setName] = useState('');
  
  // State for the user's Email Address
  const [email, setEmail] = useState('');
  
  // State for the user's Password
  const [password, setPassword] = useState('');
  
  // State to confirm the password matches the first one
  const [confirmPassword, setConfirmPassword] = useState('');

  // State to store any error messages from form validation
  const [errorMessage, setErrorMessage] = useState('');

  // ==========================================================================
  // EVENT HANDLING & FORM VALIDATION
  // ==========================================================================
  // Why Event Handling is used:
  // When the user clicks "Create Account", the browser triggers a "submit" event.
  // We need this custom function to catch that event and process our data manually.
  const handleSubmit = async (event) => {
    
    // preventDefault() stops the browser from refreshing the page.
    // If the page reloads, we would lose all the data the user just typed!
    event.preventDefault();

    // Why Form Validation is used:
    // We must check if the data the user entered is correct BEFORE sending it to a server.
    // Here, we check if the two password fields match exactly.
    if (password !== confirmPassword) {
      // If they don't match, we set an error message and stop the function.
      setErrorMessage("Passwords do not match. Please try again.");
      return; 
    }

    // Another simple validation: ensure the password is long enough
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    // If validation passes, we clear any previous error messages
    setErrorMessage('');

    try {
      // ======================================================================
      // THE FETCH API EXPLAINED
      // ======================================================================
      // fetch() is how our React frontend talks to our Node.js backend over the network.
      // - The first argument is the URL of our API.
      // - The second argument is a configuration object.
      // 
      // method: 'POST' -> Tells the server we are SENDING new data to be created.
      // headers: { 'Content-Type': 'application/json' } -> Tells the server to expect JSON.
      // body: JSON.stringify(...) -> Converts our JavaScript object into a JSON string.
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      // The server sends back a JSON response. We parse it back into a JavaScript object.
      const data = await response.json();

      // response.ok is true if the server returned a 2xx status code (e.g., 201 Created).
      if (response.ok) {
        // SUCCESS! The server created the user and sent back a JWT token.
        // We use our helper function to save the token to App state and localStorage.
        handleSetToken(data.token);
        
        // Finally, we redirect the user to the Dashboard.
        setCurrentPage('dashboard');
      } else {
        // FAILURE! (e.g., Email already exists, validation error on backend)
        // We display the specific error message sent by our backend controller.
        setErrorMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      // This catches network errors (e.g., the Node server isn't running)
      console.error('Signup error:', error);
      setErrorMessage('Could not connect to the server. Is the backend running?');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Create an Account</h2>
        <p className="signup-subtitle">Join Smart Study Planner today.</p>

        {/* 
          If there is an error message, we display it here.
          This uses conditional rendering: if errorMessage is not empty, show the <p> tag.
        */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="signup-form">
          
          {/* =======================================================================
              INPUT FIELDS
              ======================================================================= */}
          {/* 
            Why Input Fields exist: 
            Input fields are HTML elements that allow the user to type in their data.
            We link them to React state using value={...} and onChange={...}.
          */}
          
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Enter your full name"
              value={name} 
              // onChange is an Event Handler that triggers every time a key is pressed.
              // e.target.value grabs the text currently in the input box.
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Create a password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              placeholder="Type your password again"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          {/* =======================================================================
              BUTTON
              ======================================================================= */}
          {/* 
            Why this Button exists: 
            The type="submit" button triggers the form's onSubmit event when clicked, 
            which in turn runs our handleSubmit function above.
          */}
          <button type="submit" className="btn-signup-submit">
            Create Account
          </button>
        </form>

        <div className="login-link">
          {/* 
            Why Event Handling is used here: 
            e.preventDefault() stops the link from jumping the page.
            setCurrentPage('login') updates App.jsx to show the Login page instead. 
          */}
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
