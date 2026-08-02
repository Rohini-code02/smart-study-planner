import React, { useState, useEffect } from 'react';
import './SubjectSetup.css';
import API_BASE_URL from '../config/api.js';

function Exams({ token }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, subjectRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (examRes.ok) setExams(await examRes.json());
        if (subjectRes.ok) setSubjects(await subjectRes.json());
      } catch (err) {
        console.error('Error fetching exam data:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!title || !date) {
      setMessage('Please provide an exam title and date.');
      return;
    }
    // Frontend date validation
    if (new Date(date) < new Date(new Date().setHours(0, 0, 0, 0))) {
      setMessage('❌ Exam date cannot be in the past. Please select today or a future date.');
      return;
    }

    const payload = { title, date, syllabus, subject: selectedSubjectId || null };
    try {
      let res, data;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/api/exams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setExams(exams.map(e => e._id === editingId ? data : e));
          setMessage('Exam updated successfully!');
          setEditingId(null);
        } else {
          setMessage(data.message || 'Failed to update exam.');
          return;
        }
      } else {
        res = await fetch(`${API_BASE_URL}/api/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setExams([...exams, data]);
          setMessage(`Exam "${title}" added successfully!`);
        } else {
          setMessage(data.message || 'Failed to add exam.');
          return;
        }
      }
      setTitle(''); setDate(''); setSyllabus(''); setSelectedSubjectId('');
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  const handleEdit = (exam) => {
    setEditingId(exam._id);
    setTitle(exam.title);
    setDate(exam.date ? exam.date.split('T')[0] : '');
    setSyllabus(exam.syllabus || '');
    setSelectedSubjectId(exam.subject?._id || '');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExams(exams.filter(e => e._id !== id));
        setMessage('Exam deleted.');
      }
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle(''); setDate(''); setSyllabus(''); setSelectedSubjectId('');
    setMessage('');
  };

  const getDaysLeft = (examDate) => {
    const diff = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '700px' }}>
        <h2>📅 Exams</h2>
        <p className="setup-subtitle">Track your upcoming exams.</p>

        {message && (
          <p style={{ color: message.includes('success') || message.includes('added') || message.includes('updated') ? 'green' : 'red', marginBottom: '12px', fontWeight: 500 }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="setup-form">
          <div className="input-group">
            <label>Exam Title *</label>
            <input type="text" placeholder="e.g., Calculus Midterm" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Exam Date * (must be today or future)</label>
            <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Related Subject (Optional)</label>
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
              <option value="">-- None --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Syllabus / Topics (Optional)</label>
            <input type="text" placeholder="e.g., Chapters 1-5, integration, derivatives" value={syllabus} onChange={e => setSyllabus(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-save">{editingId ? 'Update Exam' : 'Add Exam'}</button>
            {editingId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
          </div>
        </form>

        <div style={{ marginTop: '30px' }}>
          <h3>Your Exams ({exams.length})</h3>
          {exams.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '10px' }}>No exams added yet. Add your first exam above!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
              {exams
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(exam => {
                  const daysLeft = getDaysLeft(exam.date);
                  return (
                    <li key={exam._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '8px', marginBottom: '10px', background: 'var(--card-bg, #f8fafc)', border: '1px solid #e2e8f0' }}>
                      <div>
                        <strong>{exam.title}</strong>
                        {exam.subject && <span style={{ marginLeft: '8px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: '#ede9fe', color: '#7c3aed' }}>{exam.subject.name}</span>}
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          📅 {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {daysLeft >= 0 ? (
                            <span style={{ marginLeft: '8px', fontWeight: 600, color: daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#d97706' : '#16a34a' }}>
                              ({daysLeft === 0 ? 'Today!' : `${daysLeft} days left`})
                            </span>
                          ) : (
                            <span style={{ marginLeft: '8px', color: '#94a3b8' }}>(Completed)</span>
                          )}
                        </div>
                        {exam.syllabus && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>📝 {exam.syllabus}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(exam)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(exam._id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Exams;
