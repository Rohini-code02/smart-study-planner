import React from 'react';
import '../App.css';

function Navbar({ setCurrentPage, currentPage, token, handleSetToken, theme, toggleTheme }) {
  const isLoggedIn = !!token;

  const scrollToSection = (id) => {
    // If not on home page, go there first then scroll
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setCurrentPage(isLoggedIn ? 'dashboard' : 'home')}>
        <h1>Smart Study Planner</h1>
      </div>

      <ul className="nav-links">
        {isLoggedIn ? (
          <>
            <li><a href="#dashboard" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Dashboard</a></li>
            <li><a href="#subjects" onClick={(e) => { e.preventDefault(); setCurrentPage('subjects'); }}>Subjects</a></li>
            <li><a href="#exams" onClick={(e) => { e.preventDefault(); setCurrentPage('exams'); }}>Exams</a></li>
            <li><a href="#tasks" onClick={(e) => { e.preventDefault(); setCurrentPage('tasks'); }}>Tasks</a></li>
            <li><a href="#plan" onClick={(e) => { e.preventDefault(); setCurrentPage('plan'); }}>Study Plan</a></li>
            <li><a href="#progress" onClick={(e) => { e.preventDefault(); setCurrentPage('progress'); }}>Progress</a></li>
            <li><a href="#profile" onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); }}>Profile</a></li>
          </>
        ) : (
          <>
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          </>
        )}
      </ul>

      <div className="nav-buttons">
        <button className="btn-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isLoggedIn ? (
          <button className="btn-login" onClick={() => {
            handleSetToken('');
            setCurrentPage('home');
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
