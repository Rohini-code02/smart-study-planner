import React, { useState, useEffect } from 'react';
import './SubjectSetup.css';
import API_BASE_URL from '../config/api.js';

function Subjects({ setCurrentPage, token }) {
  const [subjectName, setSubjectName] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [subjectPriority, setSubjectPriority] = useState('Normal');
  const [studyHours, setStudyHours] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setSubjects(await res.json());
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    if (token) fetchSubjects();
  }, [token]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!subjectName || !studyHours) {
      setMessage('Please fill out all required fields.');
      return;
    }
    const payload = { name: subjectName, difficulty, priority: subjectPriority, dailyStudyHours: Number(studyHours) };
    try {
      let res, data;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/api/subjects/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setSubjects(subjects.map(s => s._id === editingId ? data : s));
          setMessage('Subject updated!');
          setEditingId(null);
        }
      } else {
        res = await fetch(`${API_BASE_URL}/api/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setSubjects([...subjects, data]);
          setMessage(`Saved "${subjectName}" successfully!`);
        }
      }
      if (!res.ok) setMessage(data.message || 'Failed to save subject.');
      else { setSubjectName(''); setStudyHours(''); setDifficulty('Medium'); setSubjectPriority('Normal'); }
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub._id);
    setSubjectName(sub.name);
    setDifficulty(sub.difficulty);
    setSubjectPriority(sub.priority);
    setStudyHours(sub.dailyStudyHours);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSubjects(subjects.filter(s => s._id !== id));
        setMessage('Subject deleted.');
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setSubjectName('');
    setStudyHours('');
    setDifficulty('Medium');
    setSubjectPriority('Normal');
    setMessage('');
  };

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '700px' }}>
        <h2>📚 Subjects</h2>
        <p className="setup-subtitle">Add and manage your study subjects.</p>

        {message && (
          <p style={{ color: message.includes('success') || message.includes('Saved') || message.includes('updated') ? 'green' : 'red', marginBottom: '12px' }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="setup-form">
          <div className="input-group">
            <label>Subject Name *</label>
            <input type="text" placeholder="e.g., Calculus 101" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="input-group">
            <label>Priority</label>
            <select value={subjectPriority} onChange={e => setSubjectPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="input-group">
            <label>Daily Study Hours *</label>
            <input type="number" placeholder="e.g., 2" min="0.5" max="12" step="0.5" value={studyHours} onChange={e => setStudyHours(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-save">{editingId ? 'Update Subject' : 'Add Subject'}</button>
            {editingId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
          </div>
        </form>

        <div style={{ marginTop: '30px' }}>
          <h3>Your Subjects ({subjects.length})</h3>
          {subjects.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '10px' }}>No subjects added yet. Add your first subject above!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              {subjects.map(sub => (
                <li key={sub._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '8px', marginBottom: '10px', background: 'var(--card-bg, #f8fafc)', border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong>{sub.name}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: sub.difficulty === 'Hard' ? '#fee2e2' : sub.difficulty === 'Easy' ? '#dcfce7' : '#fef3c7', color: sub.difficulty === 'Hard' ? '#dc2626' : sub.difficulty === 'Easy' ? '#16a34a' : '#d97706' }}>{sub.difficulty}</span>
                    <span style={{ marginLeft: '6px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: '#ede9fe', color: '#7c3aed' }}>{sub.priority} Priority</span>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>📖 {sub.dailyStudyHours} hrs/day</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(sub)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(sub._id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Subjects;
