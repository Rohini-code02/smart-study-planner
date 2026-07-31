import React, { useState } from 'react';
import './TimetableGenerator.css';

// ============================================================================
// TIMETABLE GENERATOR COMPONENT
// ============================================================================
// Why this page exists:
// This page acts as the "Smart" brain of the Smart Study Planner. Instead of the 
// user manually struggling to figure out when to study, this page automatically 
// generates a structured daily timetable based on their subjects and priorities.
function TimetableGenerator({ setCurrentPage, token }) {
  
  // ==========================================================================
  // STATE MANAGEMENT (useState)
  // ==========================================================================
  const [isGenerated, setIsGenerated] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  // How many hours per day the user wants to study today (default: 6)
  const [availableHours, setAvailableHours] = useState(6);

  // ==========================================================================
  // EVENT HANDLER: handleGenerate
  // ==========================================================================
  // This function runs in TWO steps:
  // STEP 1 — Fetch the user's saved subjects FROM the database
  // STEP 2 — Send those subjects + available hours TO the plan generator API
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // -----------------------------------------------------------------------
      // STEP 1: Fetch subjects from MongoDB
      // We need the user's subjects (with exam dates, priorities, difficulty)
      // before we can build a meaningful plan.
      // -----------------------------------------------------------------------
      const subjectsRes = await fetch('http://localhost:5000/api/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!subjectsRes.ok) {
        setError('Could not load your subjects. Please make sure you are logged in.');
        setIsGenerating(false);
        return;
      }

      const subjects = await subjectsRes.json();

      // Guard: If no subjects have been added, stop and show a helpful message
      if (!subjects || subjects.length === 0) {
        setError('You have no subjects added yet! Please go to Subject Setup first and add your classes.');
        setIsGenerating(false);
        return;
      }

      // -----------------------------------------------------------------------
      // STEP 2: Send subjects to the plan generator API
      // The backend planController will rank by urgency and build the timetable
      // -----------------------------------------------------------------------
      const response = await fetch('http://localhost:5000/api/plan/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjects: subjects,                   // Array of user's subjects from MongoDB
          availableDailyHours: availableHours   // Number of hours user can study today
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Backend returns { planData: { timetable, tip, ... }, savedPlanId: "..." }
        // We store planData into state so the JSX below can render the sessions
        setTimetableData(data.planData || data);
        setIsGenerated(true);
      } else {
        setError(data.message || 'Failed to generate plan. Please try again.');
      }
    } catch (err) {
      console.error("Error generating plan:", err);
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="timetable-container">
      <div className="timetable-box">
        
        {/* ===================== HEADER ===================== */}
        <header className="timetable-header">
          <h2>Smart Timetable Generator 🤖</h2>
          <p>Let our algorithm build the perfect study schedule based on your subjects.</p>
        </header>

        {/* ===================== CONDITIONAL RENDERING ===================== */}
        {/* Show the input form BEFORE generation, show the result AFTER */}
        {!isGenerated ? (
          
          <div className="generate-section">

            {/* Hours input — lets the user tell the app how long they can study */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                ⏰ How many hours can you study today?
              </label>
              <input
                type="number"
                min="1"
                max="16"
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                style={{
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  width: '100px',
                  fontSize: '18px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
              <span style={{ marginLeft: '10px', color: '#6b7280' }}>hours</span>
            </div>

            {/* Show error message if something went wrong */}
            {error && (
              <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px', fontWeight: '500' }}>
                ⚠️ {error}
              </p>
            )}

            <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "✨ Generating your plan..." : "✨ Generate Study Plan"}
            </button>
            <p className="generate-hint">
              We will fetch your subjects, rank them by urgency, and build an optimized daily routine.
            </p>
          </div>

        ) : (

          /* ===================== TIMETABLE RESULTS ===================== */
          <div className="timetable-results">
            <h3>Your Optimized Daily Plan 🗓️</h3>
            
            {/* Smart tip from the algorithm */}
            {timetableData && timetableData.tip && (
              <div style={{ backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#0369a1' }}>
                <strong>💡 Smart Tip:</strong> {timetableData.tip}
              </div>
            )}

            {/* Render each session block (Morning, Afternoon, Evening) */}
            {timetableData && timetableData.timetable && timetableData.timetable.map((sessionData, index) => (
              <div key={index} className={`session-card ${sessionData.session.toLowerCase().split(' ')[0]}`}>
                <h4>
                  {sessionData.session === "Morning Session" ? "🌅" : 
                   sessionData.session === "Afternoon Session" ? "☀️" : "🌙"}
                  {" "}{sessionData.session} ({sessionData.startTime})
                </h4>
                <ul className="session-tasks">
                  {sessionData.subjects && sessionData.subjects.length > 0 ? (
                    sessionData.subjects.map((sub, idx) => (
                      <li key={idx}>
                        <strong>📖 {sub.subjectName}</strong> — {sub.hoursAllocated} hrs
                        &nbsp;| Priority: <strong>{sub.priority}</strong> 
                        &nbsp;| Difficulty: <strong>{sub.difficulty}</strong>
                        &nbsp;| Exam in: <strong>{sub.daysUntilExam} days</strong>
                      </li>
                    ))
                  ) : (
                    <li><em>No subjects scheduled for this session.</em></li>
                  )}
                </ul>
              </div>
            ))}
            
            {/* Action buttons */}
            <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-generate" onClick={() => setIsGenerated(false)}>
                🔄 Regenerate Plan
              </button>
              <button className="btn-back-dashboard" onClick={() => setCurrentPage('dashboard')}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TimetableGenerator;
