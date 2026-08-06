import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ setCurrentPage, currentPage, token, handleSetToken, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigateTo = (page) => {
    setCurrentPage(page);
    setMobileOpen(false); // Close sidebar on mobile after clicking
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'exams', label: 'Exams', icon: '📅' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'timetable', label: 'AI Study Planner', icon: '✨' },
    { id: 'plan', label: 'My Plan', icon: '📝' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      <button 
        className="mobile-sidebar-toggle" 
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        ☰
      </button>

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" onClick={() => navigateTo('dashboard')}>
          <h1>Smart Study Planner</h1>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <a 
                  className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-theme" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          
          <button className="btn-sidebar-logout" onClick={() => {
            handleSetToken('');
            setCurrentPage('home');
          }}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
