import React from 'react';
import '../App.css';

// ============================================================================
// NAVBAR COMPONENT
// ============================================================================
function Navbar({ setCurrentPage, currentPage, token, handleSetToken, theme, toggleTheme }) {
  
  // A helper variable to check if we are logged in.
  const isLoggedIn = !!token;

  return (
    <nav className="navbar">
      {/* Clicking the logo returns us to the home page or dashboard if logged in */}
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setCurrentPage(isLoggedIn ? 'dashboard' : 'home')}>
        <h1>Smart Study Planner</h1>
      </div>

      <ul className="nav-links">
        {isLoggedIn ? (
          <>
            <li><a href="#dashboard" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Dashboard</a></li>
            <li><a href="#plan" onClick={(e) => { e.preventDefault(); setCurrentPage('plan'); }}>Study Plan</a></li>
            <li><a href="#timetable" onClick={(e) => { e.preventDefault(); setCurrentPage('timetable'); }}>Timetable</a></li>
            <li><a href="#progress" onClick={(e) => { e.preventDefault(); setCurrentPage('progress'); }}>Progress</a></li>
            <li><a href="#profile" onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); }}>Profile</a></li>
          </>
        ) : (
          <>
            <li><a href="#home" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Home</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Features</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>About</a></li>
          </>
        )}
      </ul>

      <div className="nav-buttons">
        {/* THEME TOGGLE BUTTON */}
        <button className="btn-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isLoggedIn ? (
          <button className="btn-login" onClick={() => {
            handleSetToken(''); // Clear the token
            setCurrentPage('home'); // Go back to home
          }}>Logout</button>
        ) : (
          <>
            <button className="btn-login" onClick={() => setCurrentPage('login')}>Login</button>
            <button className="btn-signup" onClick={() => setCurrentPage('signup')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
