import React, { useState, useEffect } from 'react';
import './ProgressDashboard.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// PROGRESS DASHBOARD COMPONENT
// ============================================================================
// Why this page exists:
// Students need to know if their hard work is actually paying off. This page 
// visually summarizes their study data (like hours studied and tasks completed) 
// so they can track their long-term growth and stay highly motivated.
function ProgressDashboard({ token }) {
  
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [maxTasks, setMaxTasks] = useState(5);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const [statsRes, weeklyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/progress/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/progress/weekly`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (weeklyRes.ok) {
          const weeklyDataRaw = await weeklyRes.json();
          // Backend returns: { weekStartDate, totalCompletedThisWeek, dailyBreakdown: [{day, tasksCompleted}] }
          // We use dailyBreakdown for the chart
          const breakdown = weeklyDataRaw.dailyBreakdown || [];
          setWeeklyData(breakdown);
          
          // Dynamically adjust max tasks for chart height (minimum 5)
          const max = Math.max(...breakdown.map(d => d.tasksCompleted || 0), 5);
          setMaxTasks(max);
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };
    if (token) fetchProgress();
  }, [token]);
  
  // We calculate goal completion percentage safely
  const calculateGoalPercentage = () => {
    if (!stats) return 0;
    const completed = stats.tasks.completedThisWeek;
    const target = stats.weeklyProgress.weeklyTarget;
    if (target === 0) return 0;
    return Math.min(Math.round((completed / target) * 100), 100);
  };
  const goalPercentage = calculateGoalPercentage();

  return (
    <div className="progress-container">
      
      {/* ===================== PAGE HEADER ===================== */}
      <div className="progress-header">
        <h2>My Progress 📈</h2>
        <p>Track your study habits and visualize your success.</p>
      </div>

      {/* ===================== QUICK STATS CARDS ===================== */}
      <section className="progress-stats-grid">
        
        {/* CARD 1: Weekly Study Hours */}
        <div className="progress-card">
          <h3>Weekly Study Hours</h3>
          <p className="card-value blue">{stats ? stats.studyHours.weeklyEstimate : 0} hrs</p>
          <p className="card-subtitle">Estimated this week</p>
        </div>

        {/* CARD 2: Completed Tasks This Week */}
        <div className="progress-card">
          <h3>Tasks Completed</h3>
          <p className="card-value green">{stats ? stats.tasks.completedThisWeek : 0}</p>
          <p className="card-subtitle">Out of {stats ? stats.weeklyProgress.weeklyTarget : 0} weekly target</p>
        </div>

        {/* CARD 3: Weekly Goal Completion */}
        <div className="progress-card">
          <h3>Weekly Goal Completion</h3>
          <p className="card-value purple">{goalPercentage}%</p>
          
          {/* A custom CSS progress bar */}
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${goalPercentage}%` }}></div>
          </div>
          
          <p className="card-subtitle">{goalPercentage >= 100 ? "🎉 Goal Reached!" : "Keep it up!"}</p>
        </div>

      </section>

      {/* ===================== WEEKLY PROGRESS CHART ===================== */}
      <section className="chart-section">
        <h3>Weekly Tasks Completed Chart</h3>
        
        <div className="bar-chart-container">
          
          {weeklyData.length === 0 ? (
            <p style={{color: '#64748b'}}>No study data available for this week yet.</p>
          ) : weeklyData.map((data, index) => {
            // Calculate how tall the bar should be as a percentage
            const heightPercentage = maxTasks > 0 ? (data.tasksCompleted / maxTasks) * 100 : 0;

            return (
              <div className="chart-column" key={index}>
                
                {/* The tooltip showing the exact number at the top of the bar */}
                <span className="chart-tooltip">{data.tasksCompleted}</span>
                
                {/* The actual colored bar */}
                <div className="chart-bar" style={{ height: `${heightPercentage}%` }}></div>
                
                {/* The day label (e.g., Mon, Tue) at the bottom */}
                <span className="chart-label">{data.day}</span>
              </div>
            );
          })}

        </div>
      </section>

    </div>
  );
}

export default ProgressDashboard;
