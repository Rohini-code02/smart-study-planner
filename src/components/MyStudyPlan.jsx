import React, { useState, useEffect } from 'react';
import './MyStudyPlan.css';
import API_BASE_URL from '../config/api.js';

function MyStudyPlan({ setCurrentPage, token }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestPlan = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlan({ ...data.planData, _id: data.savedPlanId });
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error("Error fetching study plan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLatestPlan();
  }, [token]);

  const handleToggleSlot = async (planId, slotId) => {
    // Optimistic UI Update
    const originalPlan = JSON.parse(JSON.stringify(plan)); // Deep copy for rollback
    
    // Update local state immediately
    const updatedPlan = { ...plan };
    let found = false;
    updatedPlan.timetable = updatedPlan.timetable.map(session => {
      return {
        ...session,
        subjects: session.subjects.map(slot => {
          if (slot._id === slotId) {
            found = true;
            return { ...slot, isCompleted: !slot.isCompleted };
          }
          return slot;
        })
      };
    });
    
    if (found) {
      setPlan(updatedPlan);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/${planId}/toggle-slot/${slotId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Rollback if the API fails
        setPlan(originalPlan);
        console.error("Failed to toggle slot on server");
      }
    } catch (error) {
      console.error("Error toggling slot:", error);
      // Rollback on network error
      setPlan(originalPlan);
    }
  };

  if (loading) {
    return <div className="plan-container"><h2>Loading your plan...</h2></div>;
  }

  if (!plan) {
    return (
      <div className="plan-container">
        <div className="plan-header">
          <h2>My Study Plan 🗓️</h2>
          <p>You haven't generated a study plan yet.</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            className="btn-primary"
            onClick={() => setCurrentPage('timetable')}
          >
            ✨ Generate Study Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-container">
      <div className="plan-header">
        <h2>My AI Study Plan 🗓️</h2>
        <p>Your generated timetable for today. Check off sessions as you complete them!</p>
      </div>

      <div className="plan-timeline-grid">
        {plan.timetable.map((session, sIdx) => (
          <div key={sIdx} className="plan-card">
            <h4>{session.session} <span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>({session.startTime})</span></h4>
            {session.subjects.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No subjects scheduled for this session.</p>
            ) : (
              <ul className="plan-list">
                {session.subjects.map((slot) => (
                  <li 
                    key={slot._id} 
                    className={`plan-slot ${slot.isCompleted ? 'completed-slot' : ''}`}
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px',
                      borderRadius: '8px',
                      background: slot.isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-bg)',
                      marginBottom: '8px',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={slot.isCompleted}
                      onChange={() => handleToggleSlot(plan._id, slot._id)}
                      style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                    />
                    <div style={{ flex: 1, textDecoration: slot.isCompleted ? 'line-through' : 'none', opacity: slot.isCompleted ? 0.6 : 1 }}>
                      <strong style={{ display: 'block', color: 'var(--accent-primary)' }}>
                        {slot.subjectName} {slot.isCompleted && <span style={{ color: '#22c55e', marginLeft: '5px' }}>✅</span>}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {slot.hoursAllocated} hrs • {slot.difficulty} • Priority: {slot.priority}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyStudyPlan;
