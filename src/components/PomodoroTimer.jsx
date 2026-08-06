import React, { useState, useEffect } from 'react';
import './PomodoroTimer.css';
import API_BASE_URL from '../config/api.js';

function PomodoroTimer({ token, onSessionComplete }) {
  // 25 minutes in seconds
  const POMODORO_TIME = 25 * 60;
  
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to focus?');

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished!
      setIsActive(false);
      clearInterval(interval);
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    setStatusMessage('Session complete! Logging time...');
    try {
      // Log 25 minutes to the backend
      const res = await fetch(`${API_BASE_URL}/api/progress/pomodoro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ duration: 25 })
      });

      if (res.ok) {
        setStatusMessage('Great job! 25 mins logged. Take a break.');
        // Call the parent to refresh the dashboard stats
        if (onSessionComplete) onSessionComplete();
      } else {
        setStatusMessage('Error logging session.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error logging session.');
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    setStatusMessage(isActive ? 'Paused' : 'Focusing...');
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(POMODORO_TIME);
    setStatusMessage('Ready to focus?');
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-header">
        <h3>Pomodoro Timer</h3>
        <p>25 mins focus, 5 mins break</p>
      </div>
      
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>

      <div className="timer-controls">
        <button 
          className={`btn-timer ${isActive ? 'btn-pause' : 'btn-start'}`}
          onClick={toggleTimer}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="btn-timer btn-reset" onClick={resetTimer}>
          Reset
        </button>
      </div>

      <p className="pomodoro-status">{statusMessage}</p>
    </div>
  );
}

export default PomodoroTimer;
