import React, { useState, useEffect } from 'react';
import './SubjectSetup.css';
import API_BASE_URL from '../config/api.js';

function Tasks({ token }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      // Fetch both and combine for now
      const [pendingRes, completedRes, subjectRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/tasks/completed`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const pendingTasks = pendingRes.ok ? await pendingRes.json() : [];
      const completedTasks = completedRes.ok ? await completedRes.json() : [];
      
      // Calculate overdue on the frontend dynamically
      let combined = [...pendingTasks, ...completedTasks].map(t => {
        if (!t.isCompleted && new Date(t.dueDate) < new Date(today)) {
          return { ...t, status: 'Overdue' }; // Force Overdue if it's past due and not completed
        }
        return t;
      });

      setTasks(combined);
      if (subjectRes.ok) setSubjects(await subjectRes.json());
    } catch (err) {
      console.error('Error fetching task data:', err);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!taskTitle || !taskDueDate) {
      setMessage('Please provide a title and due date.');
      return;
    }
    const payload = {
      title: taskTitle,
      description: taskDesc,
      dueDate: taskDueDate,
      priority: taskPriority,
      subject: selectedSubjectId || null,
      status: 'Pending',
      isCompleted: false
    };
    try {
      let res, data;
      if (editingId) {
        res = await fetch(`${API_BASE_URL}/api/tasks/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setMessage('Task updated!');
          setEditingId(null);
          fetchData();
        } else {
          setMessage(data.message || 'Failed to update task.');
          return;
        }
      } else {
        res = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setMessage('Task added successfully!');
          fetchData();
        } else {
          setMessage(data.message || 'Failed to add task.');
          return;
        }
      }
      setTaskTitle(''); setTaskDesc(''); setTaskDueDate('');
      setTaskPriority('Medium'); setSelectedSubjectId('');
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const isCompleted = newStatus === 'Completed';
      const payload = { status: newStatus, isCompleted };
      
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error changing task status:', err);
    }
  };

  const handleToggle = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskPriority(task.priority);
    setSelectedSubjectId(task.subject?._id || '');
    setMessage('');
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== id));
        setMessage('Task deleted.');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTaskTitle(''); setTaskDesc(''); setTaskDueDate('');
    setTaskPriority('Medium'); setSelectedSubjectId('');
    setMessage('');
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return t.status === 'Pending';
    if (filter === 'in-progress') return t.status === 'In Progress';
    if (filter === 'completed') return t.isCompleted;
    if (filter === 'overdue') return t.status === 'Overdue';
    return true;
  }).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const priorityColor = (p) => p === 'High' ? '#dc2626' : p === 'Medium' ? '#d97706' : '#16a34a';
  const priorityBg = (p) => p === 'High' ? '#fee2e2' : p === 'Medium' ? '#fef3c7' : '#dcfce7';
  
  const statusColors = {
    'Pending': { bg: '#e2e8f0', text: '#475569', border: '#cbd5e1' },
    'In Progress': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    'Completed': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
    'Overdue': { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' }
  };

  // Progress calculations
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '850px' }}>
        <h2>✅ Task Management</h2>
        <p className="setup-subtitle">Manage everything you need to do, track progress, and stay on top of deadlines.</p>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong>Overall Progress</strong>
            <strong>{progressPercent}% ({completedCount}/{totalTasks})</strong>
          </div>
          <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        {message && (
          <p style={{
            color: message.includes('success') || message.includes('added') || message.includes('updated') ? 'green' : '#64748b',
            marginBottom: '12px', fontWeight: 500
          }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="setup-form" style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label>Task Title *</label>
              <input type="text" placeholder="e.g., Read Chapter 5" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Due Date *</label>
              <input type="date" value={taskDueDate} min={today} onChange={e => setTaskDueDate(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>Description (Optional)</label>
            <input type="text" placeholder="Extra notes or details" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label>Priority</label>
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="input-group">
              <label>Related Subject (Optional)</label>
              <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                <option value="">-- None --</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn-save" style={{ background: 'var(--accent-primary)', flex: 1 }}>
              {editingId ? 'Update Task' : 'Add New Task'}
            </button>
            {editingId && <button type="button" className="btn-cancel" onClick={handleCancel} style={{ flex: 1 }}>Cancel Edit</button>}
          </div>
        </form>

        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3>Your Tasks ({filteredTasks.length})</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'in-progress', 'completed', 'overdue'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--glass-border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? 'var(--accent-primary)' : 'var(--glass-bg)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  fontWeight: filter === f ? 600 : 500
                }}>
                  {f.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No tasks found for this filter. 🎉</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTasks.map(task => {
                const sColor = statusColors[task.status] || statusColors['Pending'];
                return (
                  <li key={task._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', borderRadius: '12px',
                    background: 'var(--glass-bg)',
                    border: `2px solid ${sColor.border}`,
                    borderLeft: `6px solid ${sColor.text}`,
                    opacity: task.isCompleted ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => handleToggle(task._id)}
                        style={{ marginTop: '5px', width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <strong style={{
                            fontSize: '1.1rem',
                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                            color: 'var(--text-primary)'
                          }}>
                            {task.title}
                          </strong>
                          <span style={{
                            fontSize: '0.75rem', padding: '3px 10px',
                            borderRadius: '12px', background: priorityBg(task.priority),
                            color: priorityColor(task.priority), fontWeight: 'bold'
                          }}>
                            {task.priority}
                          </span>
                          
                          <select 
                            value={task.status} 
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px',
                              borderRadius: '12px', background: sColor.bg,
                              color: sColor.text, border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </div>
                        
                        <div style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                          📅 Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {task.subject && <span style={{ marginLeft: '12px', color: 'var(--accent-primary)', fontWeight: '500' }}>📚 {task.subject.name}</span>}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>{task.description}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, marginLeft: '15px' }}>
                      {!task.isCompleted && (
                        <button onClick={() => handleEdit(task)} style={{
                          padding: '6px 14px', background: 'var(--glass-bg)', color: 'var(--accent-primary)',
                          border: '1px solid var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                        }}>Edit</button>
                      )}
                      <button onClick={() => handleDelete(task._id)} style={{
                        padding: '6px 14px', background: '#fee2e2', color: '#b91c1c',
                        border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                      }}>Delete</button>
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

export default Tasks;
