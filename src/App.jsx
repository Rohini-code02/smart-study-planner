import React, { useState, useEffect } from 'react';
// Importing our custom components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import SubjectSetup from './components/SubjectSetup';
import TimetableGenerator from './components/TimetableGenerator';
import MyStudyPlan from './components/MyStudyPlan';
import ProgressDashboard from './components/ProgressDashboard';
import Profile from './components/Profile';

// Importing the global CSS file which contains all our styles
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // STATE MANAGEMENT: JWT Token
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // STATE MANAGEMENT: Theme
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Effect to apply the theme to the root HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSetToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        setCurrentPage={setCurrentPage} 
        currentPage={currentPage} 
        token={token} 
        handleSetToken={handleSetToken} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      {currentPage === 'login' && <Login setCurrentPage={setCurrentPage} handleSetToken={handleSetToken} />}
      
      {currentPage === 'signup' && <Signup setCurrentPage={setCurrentPage} handleSetToken={handleSetToken} />}
      
      {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} token={token} />}

      {currentPage === 'setup' && <SubjectSetup setCurrentPage={setCurrentPage} token={token} />}

      {currentPage === 'timetable' && <TimetableGenerator setCurrentPage={setCurrentPage} token={token} />}
      
      {currentPage === 'plan' && <MyStudyPlan setCurrentPage={setCurrentPage} token={token} />}

      {currentPage === 'progress' && <ProgressDashboard token={token} />}

      {currentPage === 'profile' && <Profile setCurrentPage={setCurrentPage} token={token} handleSetToken={handleSetToken} />}
      
      {currentPage === 'home' && (
        <>
          <Hero />
          <Features />
          <About />
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
