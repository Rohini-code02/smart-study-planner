import React, { useState, useEffect } from 'react';
import './SubjectSetup.css';

import API_BASE_URL from '../config/api.js';

// ============================================================================
// SUBJECT & TASK SETUP COMPONENT
// ============================================================================
function SubjectSetup({ setCurrentPage, token }) {
  // --- Subject State ---
  const [subjectName, setSubjectName] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [subjectPriority, setSubjectPriority] = useState('Normal');
  const [examDate, setExamDate] = useState('');
  const [studyHours, setStudyHours] = useState('');
  
  // --- Task State ---
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // --- Data State ---
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [subjectMessage, setSubjectMessage] = useState('');
  const [taskMessage, setTaskMessage] = useState('');

  // Fetch both subjects and tasks on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, taskRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/tasks/pending`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (subRes.ok) setSubjects(await subRes.json());
        if (taskRes.ok) setTasks(await taskRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (token) fetchData();
  }, [token]);

  // ==========================================================================
  // SUBJECT HANDLERS
  // ==========================================================================
  const handleSaveSubject = async (event) => {
    event.preventDefault();
    if (!subjectName || !examDate || !studyHours) {
      setSubjectMessage("Please fill out all the required fields.");
      return;
    }
    try {
      const newSubject = { name: subjectName, difficulty, priority: subjectPriority, examDate, dailyStudyHours: Number(studyHours) };
      const response = await fetch(`${API_BASE_URL}/api/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newSubject)
      });
      if (response.ok) {
        const createdSubject = await response.json();
        setSubjects([...subjects, createdSubject]);
        setSubjectMessage(`Successfully saved ${subjectName}!`);
        setSubjectName(''); setExamDate(''); setStudyHours('');
      } else {
        const errorData = await response.json();
        setSubjectMessage(errorData.message || 'Failed to save subject.');
      }
    } catch (error) {
      setSubjectMessage('Could not connect to the server.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setSubjects(subjects.filter(sub => sub._id !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  // ==========================================================================
  // TASK HANDLERS
  // ==========================================================================
  const handleSaveTask = async (event) => {
    event.preventDefault();
    if (!taskTitle || !taskDueDate) {
      setTaskMessage("Please provide a task title and due date.");
      return;
    }
    try {
      const newTask = {
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate,
        priority: taskPriority,
        subject: selectedSubjectId || null
      };
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        const createdTask = await response.json();
        setTasks([...tasks, createdTask]);
        setTaskMessage(`Successfully saved task!`);
        setTaskTitle(''); setTaskDesc(''); setTaskDueDate('');
      } else {
        const errorData = await response.json();
        setTaskMessage(errorData.message || 'Failed to save task.');
      }
    } catch (error) {
      setTaskMessage('Could not connect to the server.');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '800px' }}>
        <button className="btn-cancel" style={{marginBottom: '20px'}} onClick={() => setCurrentPage('dashboard')}>
          ← Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* ===================== SUBJECT SETUP FORM ===================== */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2>Setup New Subject 📚</h2>
            <p className="setup-subtitle">Enter the details of your class or exam.</p>
            {subjectMessage && <p style={{color: subjectMessage.includes('Success') ? 'green' : 'red', marginBottom: '10px'}}>{subjectMessage}</p>}
            
            <form onSubmit={handleSaveSubject} className="setup-form">
              <div className="input-group">
                <label>Subject Name</label>
                <input type="text" placeholder="e.g., Calculus 101" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                </select>
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select value={subjectPriority} onChange={e => setSubjectPriority(e.target.value)}>
                  <option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option>
                </select>
              </div>
              <div className="input-group">
                <label>Exam Date</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Daily Study Hours</label>
                <input type="number" placeholder="Hours per day" min="1" value={studyHours} onChange={e => setStudyHours(e.target.value)} />
              </div>
              <button type="submit" className="btn-save">Save Subject</button>
            </form>
          </div>

          {/* ===================== TASK SETUP FORM ===================== */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2>Create New Task 📝</h2>
            <p className="setup-subtitle">Add homework, assignments, or reading.</p>
            {taskMessage && <p style={{color: taskMessage.includes('Success') ? 'green' : 'red', marginBottom: '10px'}}>{taskMessage}</p>}
            
            <form onSubmit={handleSaveTask} className="setup-form">
              <div className="input-group">
                <label>Task Title</label>
                <input type="text" placeholder="e.g., Read Chapter 5" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Related Subject (Optional)</label>
                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                  <option value="">-- None --</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Due Date</label>
                <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <input type="text" placeholder="Any extra notes" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
              </div>
              <button type="submit" className="btn-save" style={{backgroundColor: '#8b5cf6'}}>Save Task</button>
            </form>
          </div>
        </div>

        {/* ===================== LISTINGS ===================== */}
        <div style={{ marginTop: '40px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Subjects List */}
          <div style={{ flex: 1 }}>
            <h3>Your Subjects</h3>
            {subjects.length === 0 ? <p style={{ color: '#64748b' }}>No subjects added.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {subjects.map(sub => (
                  <li key={sub._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>{sub.name}</strong> - {sub.difficulty}
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Exam: {new Date(sub.examDate).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteSubject(sub._id)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tasks List */}
          <div style={{ flex: 1 }}>
            <h3>Pending Tasks</h3>
            {tasks.length === 0 ? <p style={{ color: '#64748b' }}>No pending tasks.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {tasks.map(task => (
                  <li key={task._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>{task.title}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteTask(task._id)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SubjectSetup;
