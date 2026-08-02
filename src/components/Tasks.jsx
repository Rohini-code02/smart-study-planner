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
  const [filter, setFilter] = useState('pending'); // 'pending' | 'completed' | 'all'
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskRes, subjectRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() =>
            fetch(`${API_BASE_URL}/api/tasks/pending`, { headers: { 'Authorization': `Bearer ${token}` } })
          ),
          fetch(`${API_BASE_URL}/api/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (taskRes.ok) setTasks(await taskRes.json());
        if (subjectRes.ok) setSubjects(await subjectRes.json());
      } catch (err) {
        console.error('Error fetching task data:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!taskTitle || !taskDueDate) {
      setMessage('Please provide a title and due date.');
      return;
    }

    const payload = { title: taskTitle, description: taskDesc, dueDate: taskDueDate, priority: taskPriority, subject: selectedSubjectId || null };
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
          setTasks(tasks.map(t => t._id === editingId ? data : t));
          setMessage('Task updated!');
          setEditingId(null);
        }
      } else {
        res = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        data = await res.json();
        if (res.ok) {
          setTasks([...tasks, data]);
          setMessage('Task added successfully!');
        }
      }
      if (!res.ok) setMessage(data.message || 'Failed to save task.');
      else { setTaskTitle(''); setTaskDesc(''); setTaskDueDate(''); setTaskPriority('Medium'); setSelectedSubjectId(''); }
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  const handleToggle = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTasks(tasks.map(t => t._id === taskId ? data : t));
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
    setTaskTitle(''); setTaskDesc(''); setTaskDueDate(''); setTaskPriority('Medium'); setSelectedSubjectId('');
    setMessage('');
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  const priorityColor = (p) => p === 'High' ? '#dc2626' : p === 'Medium' ? '#d97706' : '#16a34a';
  const priorityBg = (p) => p === 'High' ? '#fee2e2' : p === 'Medium' ? '#fef3c7' : '#dcfce7';

  return (
    <div className="setup-container">
      <div className="setup-box" style={{ maxWidth: '700px' }}>
        <h2>✅ Tasks</h2>
        <p className="setup-subtitle">Create and manage your personal study tasks.</p>

        {message && (
          <p style={{ color: message.includes('success') || message.includes('added') || message.includes('updated') ? 'green' : 'red', marginBottom: '12px', fontWeight: 500 }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSave} className="setup-form">
          <div className="input-group">
            <label>Task Title *</label>
            <input type="text" placeholder="e.g., Read Chapter 5" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Description (Optional)</label>
            <input type="text" placeholder="Extra notes or details" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Due Date *</label>
            <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
          </div>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-save" style={{ background: '#8b5cf6' }}>{editingId ? 'Update Task' : 'Add Task'}</button>
            {editingId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
          </div>
        </form>

        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Your Tasks ({filteredTasks.length})</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'completed'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filter === f ? '#8b5cf6' : '#e2e8f0', color: filter === f ? 'white' : '#64748b', fontWeight: filter === f ? 600 : 400 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '10px' }}>No tasks found. Add your first task above!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {filteredTasks.map(task => (
                <li key={task._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '8px', marginBottom: '10px', background: task.isCompleted ? '#f0fdf4' : 'var(--card-bg, #f8fafc)', border: `1px solid ${task.isCompleted ? '#86efac' : '#e2e8f0'}`, opacity: task.isCompleted ? 0.8 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggle(task._id)} style={{ marginTop: '4px', accentColor: '#8b5cf6', width: '16px', height: '16px', cursor: 'pointer' }} />
                    <div>
                      <strong style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', color: task.isCompleted ? '#94a3b8' : 'inherit' }}>{task.title}</strong>
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: priorityBg(task.priority), color: priorityColor(task.priority) }}>{task.priority}</span>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                        📅 Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}
                        {task.subject && <span style={{ marginLeft: '8px' }}>📚 {task.subject.name || 'Subject'}</span>}
                      </div>
                      {task.description && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{task.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
                    {!task.isCompleted && <button onClick={() => handleEdit(task)} style={{ padding: '5px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>}
                    <button onClick={() => handleDelete(task._id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
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

export default Tasks;
