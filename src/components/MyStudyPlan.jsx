import React, { useState, useEffect } from 'react';
import './MyStudyPlan.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// MY STUDY PLAN COMPONENT
// ============================================================================
// Why this page exists:
// While the Timetable Generator creates a daily schedule, the "My Study Plan"
// page serves as the user's master tracker. It gives them a bird's-eye 
// view of all their tasks and subjects with upcoming exams.
function MyStudyPlan({ setCurrentPage, token }) {
  
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ completed: 0, pending: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for speed
        const [pendingRes, completedRes, statsRes, subjectsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tasks/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/tasks/completed`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/progress/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (pendingRes.ok) setTasks(await pendingRes.json());
        if (completedRes.ok) setCompletedTasks(await completedRes.json());
        if (subjectsRes.ok) setSubjects(await subjectsRes.json());
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            completed: statsData.tasks.completed,
            pending: statsData.tasks.pending
          });
        }
      } catch (error) {
        console.error("Error fetching study plan data:", error);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Handle toggling a task as complete from this page
  const handleToggleTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Move it off the pending list
        const toggled = tasks.find(t => t._id === taskId);
        setTasks(tasks.filter(t => t._id !== taskId));
        if (toggled) setCompletedTasks([...completedTasks, { ...toggled, isCompleted: true }]);
        setStats(s => ({ completed: s.completed + 1, pending: Math.max(0, s.pending - 1) }));
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // Sort subjects by exam date (closest first)
  const sortedSubjects = [...subjects].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

  return (
    <div className="plan-container">
      
      {/* ===================== PAGE HEADER ===================== */}
      <div className="plan-header">
        <h2>My Study Plan 🗓️</h2>
        <p>Your master overview of all upcoming tasks and subjects.</p>
      </div>

      {/* ===================== SUMMARY CARDS ===================== */}
      <section className="plan-summary-cards">
        
        <div className="summary-card completed">
          <h3>✅ Completed Tasks</h3>
          <p className="summary-number">{stats.completed}</p>
          <p className="summary-text">Awesome job!</p>
        </div>

        <div className="summary-card pending">
          <h3>⏳ Pending Tasks</h3>
          <p className="summary-number">{stats.pending}</p>
          <p className="summary-text">Keep going!</p>
        </div>

        <div className="summary-card" style={{ backgroundColor: '#f0fdf4' }}>
          <h3>📚 Total Subjects</h3>
          <p className="summary-number">{subjects.length}</p>
          <p className="summary-text">Enrolled</p>
        </div>

      </section>

      {/* ===================== MAIN GRID ===================== */}
      <div className="plan-timeline-grid">
        
        {/* PENDING TASKS LIST */}
        <div className="plan-card today">
          <h4>📝 Pending Tasks</h4>
          <ul className="plan-list">
            {tasks.length === 0 ? (
              <p style={{color: '#64748b', fontSize: '0.9rem'}}>No pending tasks! Add some from Subject Setup.</p>
            ) : (
              tasks.map(task => (
                <li key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggleTask(task._id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span className="task">{task.title}</span>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '8px' }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* COMPLETED TASKS LIST */}
        <div className="plan-card tomorrow">
          <h4>✅ Completed Tasks</h4>
          <ul className="plan-list">
            {completedTasks.length === 0 ? (
              <p style={{color: '#64748b', fontSize: '0.9rem'}}>No completed tasks yet. Start checking them off!</p>
            ) : (
              completedTasks.slice(0, 5).map(task => (
                <li key={task._id} style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                  {task.title}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* UPCOMING EXAMS from real subjects */}
        <div className="plan-card weekly">
          <h4>📅 Upcoming Exams</h4>
          <ul className="plan-list">
            {sortedSubjects.length === 0 ? (
              <p style={{color: '#64748b', fontSize: '0.9rem'}}>No subjects added yet. Go to Subject Setup!</p>
            ) : (
              sortedSubjects.map(sub => {
                const daysLeft = Math.ceil((new Date(sub.examDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <li key={sub._id}>
                    <span className="time" style={{ fontWeight: '600', color: daysLeft <= 7 ? '#ef4444' : '#3b82f6' }}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Today!'}
                    </span>
                    <span className="task">{sub.name} — {sub.difficulty}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>

      </div>

      {/* Quick action to go add tasks */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setCurrentPage('setup')}
          style={{ padding: '10px 25px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          + Add Subjects / Tasks
        </button>
      </div>

    </div>
  );
}

export default MyStudyPlan;
