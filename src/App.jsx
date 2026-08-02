import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Subjects from './components/Subjects';
import Exams from './components/Exams';
import Tasks from './components/Tasks';
import SubjectSetup from './components/SubjectSetup';
import TimetableGenerator from './components/TimetableGenerator';
import MyStudyPlan from './components/MyStudyPlan';
import ProgressDashboard from './components/ProgressDashboard';
import Profile from './components/Profile';

import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        {currentPage === 'subjects' && <Subjects setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'exams' && <Exams setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'tasks' && <Tasks setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'setup' && <Subjects setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'timetable' && <TimetableGenerator setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'plan' && <MyStudyPlan setCurrentPage={setCurrentPage} token={token} />}
        {currentPage === 'progress' && <ProgressDashboard token={token} />}
        {currentPage === 'profile' && <Profile setCurrentPage={setCurrentPage} token={token} handleSetToken={handleSetToken} />}

        {currentPage === 'home' && (
          <>
            <Hero setCurrentPage={setCurrentPage} />
            <Features />
            <About />
            <Footer />
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
