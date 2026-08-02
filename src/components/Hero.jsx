import React from 'react';
import '../App.css';

function Hero({ setCurrentPage }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <h2>Organize Your Study, Achieve Your Goals</h2>
        <p>Smart Study Planner helps you manage your time, track your progress, and get better grades with ease.</p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => setCurrentPage('signup')}>Get Started for Free</button>
          <button className="btn-secondary" onClick={() => scrollToSection('features')}>Learn More</button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
