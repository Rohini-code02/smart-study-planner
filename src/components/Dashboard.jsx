import React, { useState, useEffect } from 'react';

// ============================================================================
// CSS IMPORT
// ============================================================================
// We import our specific CSS file to style the Dashboard component.
import './Dashboard.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================
// Why Dashboard is created:
// The Dashboard is the main "home base" for a logged-in user. It provides a quick, 
// at-a-glance overview of their most important information (tasks, exams, progress) 
// without needing them to click through multiple different pages.
function Dashboard({ setCurrentPage, token }) {
  
  // State to hold the fetched data
  const [userName, setUserName] = useState("Loading...");
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);

  // ==========================================================================
  // USEEFFECT & FETCHING DATA
  // ==========================================================================
  // Why useEffect is used here:
  // We want to fetch data from the server EXACTLY ONCE when the Dashboard first loads.
  // The empty array [] at the end means "run this only on the first render".
  useEffect(() => {
    // We define an async function inside useEffect to handle our API calls
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch User Profile (to get the name)
        // We must include the JWT token in the Authorization header so the server knows who we are!
        const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userData = await userRes.json();
        if (userRes.ok) setUserName(userData.name);

        // 2. Fetch Progress Stats (for the cards and upcoming exams)
        const statsRes = await fetch(`${API_BASE_URL}/api/progress/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData);

        // 3. Fetch Pending Tasks (for the checklist)
        const tasksRes = await fetch(`${API_BASE_URL}/api/tasks/pending`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const tasksData = await tasksRes.json();
        if (tasksRes.ok) setTasks(tasksData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Helper function to handle clicking a task checkbox
  const handleToggleTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH', // PATCH is used for partial updates (just toggling one field)
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Remove the task from the list since it's now completed
        setTasks(tasks.filter(t => t._id !== taskId));
        
        // Also refresh the stats so the "Tasks Completed" card updates!
        // (In a production app, you might just update the local state manually to save a network request)
        const statsRes = await fetch(`${API_BASE_URL}/api/progress/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData);
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* =======================================================================
          WELCOME SECTION
          ======================================================================= */}
      {/* 
        Why this section exists: 
        A personalized welcome message makes the application feel friendly and 
        confirms to the user that they have successfully logged into their own account.
      */}
      <header className="dashboard-header">
        <h2>Welcome back, {userName}! 👋</h2>
        <p>Here is your study overview for today.</p>
      </header>

      {/* =======================================================================
          PROGRESS CARDS SECTION
          ======================================================================= */}
      {/* 
        Why this section exists:
        To show high-level metrics quickly at the very top of the screen.
        
        Why each Card is used:
        Cards break down complex numbers into bite-sized, visually distinct boxes.
        This makes it incredibly easy for the user's brain to process their progress instantly.
      */}
      <section className="dashboard-cards">
        
        {/* Card 1: Study Hours */}
        <div className="stat-card">
          <h3>Study Hours</h3>
          <p className="stat-value">{stats ? stats.studyHours.weeklyEstimate : 0} hrs</p>
          <p className="stat-subtitle">This week</p>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="stat-card">
          <h3>Tasks Completed</h3>
          <p className="stat-value">{stats ? stats.tasks.completedThisWeek : 0} / {stats ? stats.weeklyProgress.weeklyTarget : 0}</p>
          <p className="stat-subtitle">This week</p>
        </div>

        {/* Card 3: Upcoming Exams */}
        <div className="stat-card">
          <h3>Next Exam</h3>
          <p className="stat-value">
            {stats && stats.subjects.upcomingExams.length > 0 
              ? stats.subjects.upcomingExams[0].name 
              : "None"}
          </p>
          <p className="stat-subtitle">
            {stats && stats.subjects.upcomingExams.length > 0 
              ? `In ${stats.subjects.upcomingExams[0].daysLeft} days` 
              : "No upcoming exams"}
          </p>
        </div>

      </section>

      {/* 
        We use a specific div container below to apply CSS Grid layout.
        This allows the Tasks and Exams sections to sit side-by-side on wide screens.
      */}
      <div className="dashboard-main-grid">
        
        {/* =======================================================================
            TODAY'S TASKS SECTION
            ======================================================================= */}
        {/* 
          Why this section exists:
          To give the user a clear, actionable list of what they need to accomplish today.
          A checklist helps users stay organized and feel productive.
        */}
        <section className="dashboard-list-section">
          <h3>📝 Pending Tasks</h3>
          <ul className="task-list">
            {tasks.length === 0 ? (
              <p style={{color: '#64748b'}}>No pending tasks! Add some from the Subject Setup page.</p>
            ) : (
              tasks.map(task => (
                <li key={task._id}>
                  <input 
                    type="checkbox" 
                    id={`task-${task._id}`} 
                    checked={task.isCompleted}
                    onChange={() => handleToggleTask(task._id)}
                  />
                  <label htmlFor={`task-${task._id}`}>{task.title}</label>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* =======================================================================
            UPCOMING EXAMS SECTION
            ======================================================================= */}
        {/* 
          Why this section exists:
          To keep the user prepared for important deadlines so nothing sneaks up on them.
        */}
        <section className="dashboard-list-section">
          <h3>📅 Upcoming Exams</h3>
          <ul className="exam-list">
            {!stats || stats.subjects.upcomingExams.length === 0 ? (
              <p style={{color: '#64748b'}}>No upcoming exams in the next 14 days.</p>
            ) : (
              stats.subjects.upcomingExams.map((exam, index) => (
                <li key={index}>
                  <div className="exam-info">
                    <strong>{exam.name}</strong>
                    <span>{new Date(exam.examDate).toLocaleDateString()} ({exam.daysLeft} days left)</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

      </div>

      {/* =======================================================================
          QUICK ACTIONS SECTION
          ======================================================================= */}
      {/* 
        Why this section exists:
        To provide fast shortcuts to the most common actions a user might want to take 
        (like adding a new task), saving them time navigating through menus.
      */}
      <section className="dashboard-quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="actions-buttons">
          {/* Clicking this button navigates the user to our new Subject Setup page */}
          <button className="btn-action" onClick={() => setCurrentPage('setup')}>+ Add Subject</button>
          <button className="btn-action" onClick={() => setCurrentPage('timetable')}>✨ Generate Timetable</button>
          <button className="btn-action">+ Add Exam</button>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;
