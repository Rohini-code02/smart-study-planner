import React, { useState, useEffect } from 'react';
import './SubjectSetup.css';
import API_BASE_URL from '../config/api.js';

function Subjects({ setCurrentPage, token }) {
  const [subjectName, setSubjectName] = useState('');
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
    if (!subjectName.trim()) {
      setMessage('Please enter a subject name.');
      return;
    }
    const payload = { name: subjectName };
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
        } else {
          setMessage(data.message || 'Failed to update subject.');
          return;
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
          setMessage(`"${subjectName}" added successfully!`);
        } else {
          setMessage(data.message || 'Failed to add subject.');
          return;
        }
      }
      setSubjectName('');
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub._id);
    setSubjectName(sub.name);
    setMessage('');
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
    setMessage('');
  };

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '700px' }}>
        <h2>📚 Subjects</h2>
        <p className="setup-subtitle">Add and manage your study subjects.</p>

        {message && (
          <p style={{
            color: message.includes('added') || message.includes('updated') ? 'green' : message.includes('deleted') ? '#64748b' : 'red',
            marginBottom: '12px', fontWeight: 500
          }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="setup-form">
          <div className="input-group">
            <label>Subject Name *</label>
            <input
              type="text"
              placeholder="e.g., Calculus, Physics, History"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-save">
              {editingId ? 'Update Subject' : 'Add Subject'}
            </button>
            {editingId && (
              <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
            )}
          </div>
        </form>

        <div style={{ marginTop: '30px' }}>
          <h3>Your Subjects ({subjects.length})</h3>
          {subjects.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '10px' }}>
              No subjects added yet. Add your first subject above!
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              {subjects.map(sub => (
                <li key={sub._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px', borderRadius: '8px', marginBottom: '10px',
                  background: 'var(--card-bg, #f8fafc)', border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <strong>{sub.name}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(sub)} style={{
                      padding: '6px 12px', background: '#3b82f6', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}>Edit</button>
                    <button onClick={() => handleDelete(sub._id)} style={{
                      padding: '6px 12px', background: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer'
                    }}>Delete</button>
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
