import React, { useState, useEffect } from 'react';
import './TimetableGenerator.css';
import API_BASE_URL from '../config/api.js';

function TimetableGenerator({ setCurrentPage, token }) {
  const [isGenerated, setIsGenerated] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableHours, setAvailableHours] = useState(6);
  const [savedAt, setSavedAt] = useState(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editableTimetable, setEditableTimetable] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSavedPlan = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/plan/latest`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTimetableData(data.planData);
          setEditableTimetable(data.planData.timetable);
          setSavedAt(data.planData.generatedAt);
          setIsGenerated(true);
        }
      } catch (err) {
        // No saved plan
      } finally {
        setIsLoading(false);
      }
    };
    if (token) loadSavedPlan();
    else setIsLoading(false);
  }, [token]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const subjectsRes = await fetch(`${API_BASE_URL}/api/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!subjectsRes.ok) {
        setError('Could not load your subjects. Please make sure you are logged in.');
        setIsGenerating(false);
        return;
      }

      const subjects = await subjectsRes.json();

      if (!subjects || subjects.length === 0) {
        setError('You have no subjects added yet! Go to Subjects first and add your classes.');
        setIsGenerating(false);
        return;
      }

      const examsRes = await fetch(`${API_BASE_URL}/api/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const exams = examsRes.ok ? await examsRes.json() : [];

      const subjectsWithExams = subjects.map(sub => {
        const linkedExam = exams
          .filter(e => e.subject && e.subject._id === sub._id && new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        return {
          ...sub,
          examDate: linkedExam ? linkedExam.date : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          dailyStudyHours: sub.dailyStudyHours || 2
        };
      });

      const response = await fetch(`${API_BASE_URL}/api/plan/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjects: subjectsWithExams,
          availableDailyHours: availableHours
        })
      });

      const data = await response.json();

      if (response.ok) {
        const plan = data.planData || data;
        setTimetableData(plan);
        setEditableTimetable(plan.timetable);
        setSavedAt(plan.generatedAt);
        setIsGenerated(true);
      } else {
        setError(data.message || 'Failed to generate plan. Please try again.');
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Could not connect to the server. Is the backend running?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditHour = (sessionIndex, subjectIndex, delta) => {
    const newTimetable = [...editableTimetable];
    const session = { ...newTimetable[sessionIndex] };
    const subjects = [...session.subjects];
    const subject = { ...subjects[subjectIndex] };
    
    subject.hoursAllocated = Math.max(0, subject.hoursAllocated + delta);
    
    subjects[subjectIndex] = subject;
    session.subjects = subjects;
    newTimetable[sessionIndex] = session;
    
    setEditableTimetable(newTimetable);
  };

  const handleSaveCustomPlan = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plan/custom`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timetable: editableTimetable })
      });
      
      if (res.ok) {
        const updatedData = { ...timetableData, timetable: editableTimetable };
        setTimetableData(updatedData);
        setIsEditing(false);
      } else {
        alert('Failed to save custom plan.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving custom plan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="timetable-container">
        <div className="timetable-box" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>⏳ Loading your study plan...</p>
        </div>
      </div>
    );
  }

  const currentTimetable = isEditing ? editableTimetable : (timetableData ? timetableData.timetable : []);

  return (
    <div className="timetable-container">
      <div className="timetable-box">

        <header className="timetable-header">
          <h2>Smart Timetable Generator 🤖</h2>
          <p>Let our algorithm build the perfect study schedule based on your subjects.</p>
        </header>

        {!isGenerated ? (
          <div className="generate-section">
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                ⏰ How many hours can you study today?
              </label>
              <input
                type="number" min="1" max="16" value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                style={{ padding: '10px 15px', borderRadius: '8px', border: '2px solid #d1d5db', width: '100px', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
              />
              <span style={{ marginLeft: '10px', color: '#6b7280' }}>hours</span>
            </div>

            {error && (
              <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px', fontWeight: '500' }}>
                ⚠️ {error}
              </p>
            )}

            <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? '✨ Generating your plan...' : '✨ Generate Study Plan'}
            </button>
          </div>

        ) : (

          <div className="timetable-results">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3>Your Optimized Daily Plan 🗓️</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {savedAt && !isEditing && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                    ✅ Saved {new Date(savedAt).toLocaleDateString('en-IN')}
                  </span>
                )}
                {!isEditing ? (
                  <button className="btn-edit-plan" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Plan
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-cancel-edit" onClick={() => { setEditableTimetable(timetableData.timetable); setIsEditing(false); }}>
                      Cancel
                    </button>
                    <button className="btn-save-edit" onClick={handleSaveCustomPlan} disabled={isSaving}>
                      {isSaving ? 'Saving...' : '💾 Save Custom Plan'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {currentTimetable && currentTimetable.map((sessionData, sessionIndex) => (
              <div key={sessionIndex} className={`session-card ${sessionData.session.toLowerCase().split(' ')[0]}`}>
                <h4>
                  {sessionData.session === 'Morning Session' ? '🌅' :
                   sessionData.session === 'Afternoon Session' ? '☀️' : '🌙'}
                  {' '}{sessionData.session} ({sessionData.startTime})
                </h4>
                <ul className="session-tasks">
                  {sessionData.subjects && sessionData.subjects.length > 0 ? (
                    sessionData.subjects.map((sub, subjectIndex) => (
                      <li key={subjectIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <strong>📖 {sub.subjectName}</strong> 
                          {!isEditing && <span> — {sub.hoursAllocated} hrs</span>}
                          &nbsp;| Priority: <strong>{sub.priority}</strong>
                          &nbsp;| Difficulty: <strong>{sub.difficulty}</strong>
                        </div>
                        
                        {isEditing && (
                          <div className="edit-controls">
                            <button onClick={() => handleEditHour(sessionIndex, subjectIndex, -0.5)} disabled={sub.hoursAllocated <= 0}>-</button>
                            <span className="hour-display">{sub.hoursAllocated} hrs</span>
                            <button onClick={() => handleEditHour(sessionIndex, subjectIndex, 0.5)}>+</button>
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <li><em>No subjects scheduled for this session.</em></li>
                  )}
                </ul>
              </div>
            ))}

            {!isEditing && (
              <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-generate" onClick={() => { setIsGenerated(false); setTimetableData(null); }}>
                  🔄 Generate New Plan
                </button>
                <button className="btn-back-dashboard" onClick={() => setCurrentPage('dashboard')}>
                  ← Back to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimetableGenerator;
